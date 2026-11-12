import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import type { Prisma } from '@prisma/client'
import type { AuthUser } from '../auth/current-user.decorator'
import { VISIBLE_WHERE } from '../catalog/catalog.service'
import { DANANG_CENTER, haversineKm } from '../common/geo'
import { SystemConfigService } from '../common/system-config.service'
import { PrismaService } from '../prisma/prisma.service'
import { scoreMatch, type JobRequirement, type MatchOutcome, type SeekerCriteria, type Weights } from './score'

type Point = { lat: number; lng: number }

export const SEEKER_SCORE_SELECT = {
  userId: true, skills: true, availability: true, salaryMinK: true, maxDistanceKm: true, jobTypes: true, lat: true, lng: true,
} satisfies Prisma.SeekerProfileSelect
export type SeekerScoreRow = Prisma.SeekerProfileGetPayload<{ select: typeof SEEKER_SCORE_SELECT }>

export const JOB_SCORE_SELECT = {
  id: true, companyId: true, skills: true, slots: true, salaryMinK: true, salaryMaxK: true, jobType: true,
  requiredSkills: true, requireAllSlots: true, lat: true, lng: true,
  company: { select: { lat: true, lng: true } },
} satisfies Prisma.JobSelect
export type JobScoreRow = Prisma.JobGetPayload<{ select: typeof JOB_SCORE_SELECT }>

/** Hồ sơ doanh nghiệp được tiếp cận chủ động: đã công khai, tài khoản hoạt động, chế độ hiển thị "mọi doanh nghiệp" */
export const OPEN_SEEKER_WHERE: Prisma.SeekerProfileWhereInput = {
  published: true,
  user: { status: 'active', OR: [{ settings: null }, { settings: { visibility: 'public' } }] },
}

const seekerCriteria = (s: SeekerScoreRow): SeekerCriteria => ({
  skills: s.skills, slots: s.availability, salaryMinK: s.salaryMinK, maxDistanceKm: s.maxDistanceKm, jobTypes: s.jobTypes,
})
const jobRequirement = (j: JobScoreRow): JobRequirement => ({
  skills: j.skills, slots: j.slots, salaryMinK: j.salaryMinK, salaryMaxK: j.salaryMaxK, jobType: j.jobType,
  requiredSkills: j.requiredSkills, requireAllSlots: j.requireAllSlots,
})
/** Chỗ làm: tọa độ tin → tọa độ công ty → trung tâm Đà Nẵng */
const jobPoint = (j: JobScoreRow): Point =>
  j.lat != null && j.lng != null ? { lat: j.lat, lng: j.lng } : j.company.lat != null && j.company.lng != null ? { lat: j.company.lat, lng: j.company.lng } : DANANG_CENTER
/** Chưa có tọa độ nhà → coi như cách 5 km (giống danh mục việc làm) */
const distanceOf = (s: SeekerScoreRow, j: JobScoreRow) =>
  s.lat != null && s.lng != null ? Math.round(haversineKm({ lat: s.lat, lng: s.lng }, jobPoint(j)) * 10) / 10 : 5

export type PairScore = MatchOutcome & { distanceKm: number }

/** Chấm một cặp đã nạp sẵn dữ liệu */
export function scorePair(s: SeekerScoreRow, j: JobScoreRow, w: Weights): PairScore {
  const distanceKm = distanceOf(s, j)
  return { ...scoreMatch(seekerCriteria(s), jobRequirement(j), distanceKm, w), distanceKm }
}

/**
 * Điểm phù hợp tính trên máy chủ. Trả cả điểm từng tiêu chí (0–1) để giao diện tự nhân lại trọng số
 * khi người dùng đổi thứ tự ưu tiên mà không phải gọi lại máy chủ.
 */
@Injectable()
export class MatchingService {
  constructor(private prisma: PrismaService, private config: SystemConfigService) {}

  weights = async (): Promise<Weights> => (await this.config.get()).weights

  /** Mọi tin đang hiển thị, chấm cho người tìm việc đang đăng nhập, điểm cao trước */
  async jobsForSeeker(user: AuthUser) {
    const [seeker, jobs, w] = await Promise.all([
      this.prisma.seekerProfile.findUnique({ where: { userId: user.id }, select: SEEKER_SCORE_SELECT }),
      this.prisma.job.findMany({ where: VISIBLE_WHERE, select: JOB_SCORE_SELECT }),
      this.weights(),
    ])
    if (!seeker) throw new NotFoundException('Chưa có hồ sơ người tìm việc')
    return { weights: w, items: jobs.map((j) => ({ jobId: j.id, ...scorePair(seeker, j, w) })).sort((a, b) => b.score - a.score) }
  }

  /**
   * Ứng viên chấm theo một tin của công ty mình. Cùng phạm vi với danh sách ứng viên (CandidatesService.forRecruiter):
   * hồ sơ tiếp cận được + người đã tự ứng tuyển hoặc đã kết nối với công ty.
   */
  async candidatesForJob(user: AuthUser, jobId: string) {
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, company: { members: { some: { userId: user.id } } } },
      select: JOB_SCORE_SELECT,
    })
    if (!job) throw new ForbiddenException('Tin không thuộc công ty của bạn')
    const [seekers, w] = await Promise.all([this.reachableSeekers(job.companyId), this.weights()])
    return { weights: w, items: this.rank(seekers, job, w) }
  }

  /** Mọi tin của công ty tôi trong một lần gọi (dashboard, danh sách tin) — thay cho N lần gọi theo từng tin */
  async candidatesForCompany(user: AuthUser) {
    const company = await this.prisma.company.findFirst({ where: { members: { some: { userId: user.id } } }, select: { id: true } })
    if (!company) throw new ForbiddenException('Tài khoản chưa thuộc doanh nghiệp nào')
    const [jobs, seekers, w] = await Promise.all([
      this.prisma.job.findMany({ where: { companyId: company.id }, select: JOB_SCORE_SELECT }),
      this.reachableSeekers(company.id),
      this.weights(),
    ])
    return { weights: w, jobs: Object.fromEntries(jobs.map((j) => [j.id, this.rank(seekers, j, w)])) }
  }

  private rank(seekers: SeekerScoreRow[], job: JobScoreRow, w: Weights) {
    return seekers.map((s) => ({ seekerId: s.userId, ...scorePair(s, job, w) })).sort((a, b) => b.score - a.score)
  }

  /** Cùng phạm vi với danh sách ứng viên: hồ sơ tiếp cận được + người đã tự ứng tuyển / đã kết nối với công ty */
  private reachableSeekers(companyId: string) {
    return this.prisma.seekerProfile.findMany({
      where: { OR: [OPEN_SEEKER_WHERE, { interests: { some: { from: 'seeker', job: { companyId } } } }, { connections: { some: { job: { companyId } } } }] },
      select: SEEKER_SCORE_SELECT,
    })
  }
}
