import { Injectable } from '@nestjs/common'
import type { Company, Job, Prisma } from '@prisma/client'
import type { AuthUser } from '../auth/current-user.decorator'
import { DANANG_CENTER, haversineKm } from '../common/geo'
import { PrismaService } from '../prisma/prisma.service'
import type { CatalogCompany, CatalogJob, CatalogPhoto, CatalogResponse, JobTypeLabel } from './catalog.types'

/** Enum Prisma → chuỗi frontend (full_time → 'full-time') */
export const JOB_TYPE_LABEL: Record<Job['jobType'], JobTypeLabel> = {
  full_time: 'full-time', part_time: 'part-time', shift: 'shift', seasonal: 'seasonal',
  flexible: 'flexible', event: 'event', freelance: 'freelance',
}
/** Chuỗi frontend → enum Prisma */
export const JOB_TYPE_ENUM: Record<JobTypeLabel, Job['jobType']> = {
  'full-time': 'full_time', 'part-time': 'part_time', shift: 'shift', seasonal: 'seasonal',
  flexible: 'flexible', event: 'event', freelance: 'freelance',
}
const SIZE_LABEL: Record<Company['size'], string> = { s1_10: '1-10', s11_50: '11-50', s51_200: '51-200', s201_500: '201-500', s500p: '500+' }

type JobWithCompany = Job & { company: { locked: boolean } }
type Point = { lat: number; lng: number }

export const JOB_INCLUDE = { company: { select: { locked: true } } } satisfies Prisma.JobInclude

/** Tin hiện công khai: đã duyệt + đang mở + công ty không bị khóa */
export const VISIBLE_WHERE: Prisma.JobWhereInput = { moderation: 'approved', status: 'open', company: { locked: false } }

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  toCompany(c: Company): CatalogCompany {
    return {
      id: c.id, name: c.name, industry: c.industry, district: c.district, size: SIZE_LABEL[c.size],
      cover: (c.coverPhoto as unknown as CatalogPhoto | null) ?? { alt: c.name },
      tagline: c.tagline, why: '', about: c.about, environment: c.environment,
      verified: c.verified, locked: c.locked,
    }
  }

  toJob(j: JobWithCompany, origin: Point): CatalogJob {
    const km = j.lat != null && j.lng != null ? haversineKm(origin, { lat: j.lat, lng: j.lng }) : 5
    return {
      id: j.id, companyId: j.companyId, title: j.title, district: j.district, distanceKm: Math.round(km * 10) / 10,
      salaryLabel: j.salaryLabel, shiftLabel: j.shiftLabel, photo: j.photo as unknown as CatalogPhoto,
      skills: j.skills, slots: j.slots, salaryMinK: j.salaryMinK, salaryMaxK: j.salaryMaxK, jobType: JOB_TYPE_LABEL[j.jobType],
      description: j.description, quantity: j.quantity, radiusKm: j.radiusKm, postedAt: j.postedAt.toISOString(),
      status: j.status, moderation: j.moderation, ...(j.moderationReason ? { moderationReason: j.moderationReason } : {}),
      visible: j.moderation === 'approved' && j.status === 'open' && !j.company.locked,
    }
  }

  /** Điểm gốc tính khoảng cách: nhà người tìm việc (nếu có tọa độ), còn lại là trung tâm Hải Châu */
  async originOf(user: AuthUser | null): Promise<Point> {
    if (user?.role === 'jobseeker') {
      const p = await this.prisma.seekerProfile.findUnique({ where: { userId: user.id }, select: { lat: true, lng: true } })
      if (p?.lat != null && p.lng != null) return { lat: p.lat, lng: p.lng }
    }
    return DANANG_CENTER
  }

  /** Công ty của nhà tuyển dụng (null nếu chưa thuộc công ty nào) */
  async companyIdOf(userId: string): Promise<string | null> {
    const m = await this.prisma.companyMember.findFirst({ where: { userId }, select: { companyId: true } })
    return m?.companyId ?? null
  }

  /** Tin + công ty mà người xem được thấy — xem quy tắc theo vai trò ở comment từng nhánh */
  async catalogFor(user: AuthUser | null): Promise<CatalogResponse> {
    let where: Prisma.JobWhereInput
    if (user?.role === 'admin') {
      where = {}
    } else {
      const or: Prisma.JobWhereInput[] = [VISIBLE_WHERE]
      if (user?.role === 'jobseeker') {
        // Tin đã có quan hệ với mình (quan tâm, kết nối, phỏng vấn, nhận việc, đánh giá, lưu, nhắn tin) dù đã ẩn → cuộc trò chuyện cũ vẫn có tên tin
        const mine = { some: { seekerId: user.id } }
        or.push({ interests: mine }, { connections: mine }, { interviews: mine }, { hires: mine }, { reviews: mine }, { savedBy: mine }, { messages: mine })
      } else if (user?.role === 'recruiter') {
        const companyId = await this.companyIdOf(user.id)
        if (companyId) or.push({ companyId })
      }
      where = { OR: or }
    }
    const [jobs, origin] = await Promise.all([
      this.prisma.job.findMany({ where, include: JOB_INCLUDE, orderBy: { postedAt: 'desc' } }),
      this.originOf(user),
    ])
    const jobCompanyIds = [...new Set(jobs.map((j) => j.companyId))]
    const companies = await this.prisma.company.findMany({
      where: user?.role === 'admin' ? {} : { OR: [{ locked: false }, { id: { in: jobCompanyIds } }] },
      include: { members: { select: { user: { select: { settings: { select: { visibility: true } } } } } } },
      orderBy: { createdAt: 'asc' },
    })
    return {
      companies: companies.map((c) => ({ ...this.toCompany(c), hidden: c.members.some((m) => m.user.settings?.visibility === 'hidden') })),
      jobs: jobs.map((j) => this.toJob(j, origin)),
    }
  }
}
