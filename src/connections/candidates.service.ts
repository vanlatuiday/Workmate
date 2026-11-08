import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import type { Prisma } from '@prisma/client'
import type { AuthUser } from '../auth/current-user.decorator'
import { JOB_TYPE_LABEL } from '../catalog/catalog.service'
import { DANANG_CENTER, haversineKm } from '../common/geo'
import { PrismaService } from '../prisma/prisma.service'
import { hireView } from './hires.service'
import { interviewView } from './interviews.service'
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
  constructor(private prisma: PrismaService, private realtime: RealtimeGateway) {}

  /** Hồ sơ cho phép tiếp cận + mọi người đã có quan hệ với tin của công ty (để cuộc trò chuyện cũ vẫn có tên) */
  async forRecruiter(user: AuthUser) {
    const company = await this.prisma.company.findFirst({ where: { members: { some: { userId: user.id } } }, select: { id: true, lat: true, lng: true } })
    if (!company) throw new ForbiddenException('Tài khoản chưa thuộc doanh nghiệp nào')
    const mine = { some: { job: { companyId: company.id } } }
    const rows = await this.prisma.seekerProfile.findMany({
      where: {
        OR: [
          { published: true, user: { status: 'active', OR: [{ settings: null }, { settings: { visibility: 'public' } }] } },
          { interests: mine },
          { connections: mine },
        ],
      },
      include: { ...SEEKER_INCLUDE, connections: { where: { job: { companyId: company.id } }, select: { jobId: true }, take: 1 } },
      orderBy: { updatedAt: 'desc' },
    })
    const origin = company.lat != null && company.lng != null ? { lat: company.lat, lng: company.lng } : DANANG_CENTER
    return rows.map((s) => toCandidate(s, origin, s.connections.length ? s.fullName : abbreviate(s.fullName)))
  }

  async forAdmin() {
    const rows = await this.prisma.seekerProfile.findMany({
      include: { ...SEEKER_INCLUDE, _count: { select: { connections: true } } },
      orderBy: { updatedAt: 'desc' },
    })
    return rows.map((s) => ({ ...toCandidate(s, DANANG_CENTER, s.fullName), locked: s.user.status === 'locked', connectionCount: s._count.connections }))
  }

  /** Khóa thì ngắt luôn socket đang mở: token cũ bị chặn ở HTTP nhưng socket không tự biết */
  async setLocked(seekerId: string, locked: boolean) {
    const { count } = await this.prisma.user.updateMany({ where: { id: seekerId, role: 'jobseeker' }, data: { status: locked ? 'locked' : 'active' } })
    if (!count) throw new NotFoundException('Không tìm thấy người tìm việc')
    if (locked) this.realtime.disconnectUser(seekerId)
    return { id: seekerId, locked }
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
