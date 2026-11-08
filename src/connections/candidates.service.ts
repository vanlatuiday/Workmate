import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import type { Prisma } from '@prisma/client'
import type { AuthUser } from '../auth/current-user.decorator'
import { JOB_TYPE_LABEL } from '../catalog/catalog.service'
import { DANANG_CENTER, haversineKm } from '../common/geo'
import { PrismaService } from '../prisma/prisma.service'
import { hireView } from './hires.service'
import { interviewView } from './interviews.service'
import { PairService } from './pair.service'
import { RealtimeGateway } from './realtime.gateway'

/** "Nguyễn Minh Anh" → "Nguyễn M. A." — tên đầy đủ chỉ mở sau khi hai bên kết nối */
const abbreviate = (full: string) => {
  const parts = full.trim().split(/\s+/).filter(Boolean)
  if (parts.length < 2) return parts[0] ?? ''
  return [parts[0], ...parts.slice(1).map((w) => (w.endsWith('.') ? w : `${w[0].toUpperCase()}.`))].join(' ')
}

const SEEKER_INCLUDE = {
  user: { select: { status: true } },
  hires: { where: { status: 'accepted' as const }, select: { jobId: true }, take: 1 },
} satisfies Prisma.SeekerProfileInclude
type SeekerRow = Prisma.SeekerProfileGetPayload<{ include: typeof SEEKER_INCLUDE }>

type Point = { lat: number; lng: number }
const toCandidate = (s: SeekerRow, origin: Point, name: string) => ({
  id: s.userId,
  name,
  area: s.area.split(',')[0].trim(),
  distanceKm: s.lat != null && s.lng != null ? Math.round(haversineKm(origin, { lat: s.lat, lng: s.lng }) * 10) / 10 : 5,
  summary: s.intro,
  working: s.hires.length > 0,
  avatarUrl: s.showAvatar ? s.avatarUrl : null,
  criteria: {
    skills: s.skills, slots: s.availability, salaryMinK: s.salaryMinK, maxDistanceKm: s.maxDistanceKm,
    jobTypes: s.jobTypes.map((t) => JOB_TYPE_LABEL[t]),
  },
})

/** Danh sách ứng viên cho doanh nghiệp, và các số liệu toàn hệ thống cho quản trị viên */
@Injectable()
export class CandidatesService {
  constructor(private prisma: PrismaService, private realtime: RealtimeGateway, private pairs: PairService) {}

  /** Hồ sơ cho phép tiếp cận + mọi người đã có quan hệ với tin của công ty (để cuộc trò chuyện cũ vẫn có tên) */
  async forRecruiter(user: AuthUser) {
    const company = await this.prisma.company.findFirst({ where: { members: { some: { userId: user.id } } }, select: { id: true, lat: true, lng: true } })
    if (!company) throw new ForbiddenException('Tài khoản chưa thuộc doanh nghiệp nào')
    const mine = { some: { job: { companyId: company.id } } }
    const rows = await this.prisma.seekerProfile.findMany({
      where: {
        OR: [
          { published: true, user: { status: 'active', OR: [{ settings: null }, { settings: { visibility: 'public' } }] } },
          // Chỉ tính khi ứng viên tự ứng tuyển: doanh nghiệp bấm quan tâm không mở được hồ sơ đã ẩn
          { interests: { some: { from: 'seeker', job: { companyId: company.id } } } },
          { connections: mine },
        ],
      },
      include: { ...SEEKER_INCLUDE, connections: { where: { job: { companyId: company.id } }, select: { jobId: true }, take: 1 } },
      orderBy: { updatedAt: 'desc' },
    })
    const origin = company.lat != null && company.lng != null ? { lat: company.lat, lng: company.lng } : DANANG_CENTER
    return rows.map((s) => toCandidate(s, origin, s.connections.length ? s.fullName : abbreviate(s.fullName)))
  }

  /** Hồ sơ một ứng viên. Họ tên đầy đủ, khu vực chi tiết, số điện thoại và CV chỉ gửi về khi đã kết nối */
  async profile(user: AuthUser, seekerId: string) {
    const { connected } = await this.pairs.assertRecruiterCanView(user.id, seekerId)
    const [s, company] = await Promise.all([
      this.prisma.seekerProfile.findUnique({
        where: { userId: seekerId },
        include: { ...SEEKER_INCLUDE, experiences: { orderBy: { order: 'asc' } }, _count: { select: { cvs: true } } },
      }),
      this.prisma.company.findFirst({ where: { members: { some: { userId: user.id } } }, select: { lat: true, lng: true } }),
    ])
    if (!s) throw new NotFoundException('Không tìm thấy ứng viên')
    const origin = company?.lat != null && company.lng != null ? { lat: company.lat, lng: company.lng } : DANANG_CENTER
    return {
      ...toCandidate(s, origin, connected ? s.fullName : abbreviate(s.fullName)),
      connected,
      about: s.about,
      experience: s.experiences.map((e) => ({ id: e.id, title: e.title, company: e.company, period: e.period })),
      ...(connected ? { fullArea: s.area, phone: s.phone, hasCv: s._count.cvs > 0 } : {}),
    }
  }

  async forAdmin() {
    const rows = await this.prisma.seekerProfile.findMany({
      include: { ...SEEKER_INCLUDE, _count: { select: { connections: true } } },
      orderBy: { updatedAt: 'desc' },
    })
    return rows.map((s) => ({ ...toCandidate(s, DANANG_CENTER, s.fullName), locked: s.user.status === 'locked', connectionCount: s._count.connections }))
  }

  /** Khóa thì ngắt luôn socket đang mở: token cũ bị chặn ở HTTP nhưng socket không tự biết. Không khóa được quản trị viên */
  async setLocked(userId: string, locked: boolean) {
    const { count } = await this.prisma.user.updateMany({ where: { id: userId, role: { not: 'admin' } }, data: { status: locked ? 'locked' : 'active' } })
    if (!count) throw new NotFoundException('Không tìm thấy tài khoản')
    if (locked) this.realtime.disconnectUser(userId)
    return { id: userId, locked }
  }

  /** Mọi tài khoản, mới đăng ký trước */
  async allUsers() {
    const rows = await this.prisma.user.findMany({
      select: {
        id: true, email: true, role: true, status: true, createdAt: true,
        seeker: { select: { fullName: true } },
        memberships: { take: 1, select: { company: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return rows.map((u) => ({
      id: u.id, email: u.email, role: u.role, status: u.status, createdAt: u.createdAt.toISOString(),
      name: u.seeker?.fullName || u.memberships[0]?.company.name || (u.role === 'admin' ? 'Quản trị viên' : u.email.split('@')[0]),
    }))
  }

  /** Toàn bộ cặp trong hệ thống — cho trang Tổng quan và Thống kê */
  async allPairs() {
    const [interests, connections, interviews, hires] = await Promise.all([
      this.prisma.interest.findMany(), this.prisma.connection.findMany(), this.prisma.interview.findMany(), this.prisma.hire.findMany(),
    ])
    return {
      interests: interests.map((i) => ({ from: i.from, jobId: i.jobId, seekerId: i.seekerId, at: i.at.toISOString() })),
      connections: connections.map((c) => ({ jobId: c.jobId, seekerId: c.seekerId, at: c.at.toISOString() })),
      interviews: interviews.map(interviewView),
      hires: hires.map(hireView),
    }
  }
}
