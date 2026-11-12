import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common'
import { Prisma, type NotificationKind } from '@prisma/client'
import { VISIBLE_WHERE } from '../catalog/catalog.service'
import { RealtimeGateway } from '../connections/realtime.gateway'
import { PrismaService } from '../prisma/prisma.service'
import { JOB_SCORE_SELECT, MatchingService, OPEN_SEEKER_WHERE, SEEKER_SCORE_SELECT, scorePair, type JobScoreRow, type SeekerScoreRow } from './matching.service'
import { STRONG_MATCH, type Weights } from './score'

const TICK_MS = 60_000
/** Mỗi lượt xét tối đa ngần này tin / hồ sơ; còn lại để phút sau */
const BATCH = 25
/** Mỗi người nhận tối đa ngần này thông báo "việc/ứng viên mới phù hợp" mỗi ngày (giờ Việt Nam) — chủ dự án chọn 3 */
export const DAILY_CAP = 3
const MATCH_KINDS: NotificationKind[] = ['job_match', 'candidate_match']

export type Candidate = { userId: string; kind: NotificationKind; jobId: string; seekerId: string; score: number }

/** 0:00 giờ Việt Nam (UTC+7, không đổi giờ theo mùa) của ngày chứa `now` */
export function vnDayStart(now: Date): Date {
  const shifted = new Date(now.getTime() + 7 * 3_600_000)
  shifted.setUTCHours(0, 0, 0, 0)
  return new Date(shifted.getTime() - 7 * 3_600_000)
}

/**
 * Chọn thông báo được gửi: bỏ cặp đã báo rồi, mỗi người tối đa (DAILY_CAP − số đã nhận hôm nay), điểm cao trước.
 * Tách thành hàm thuần để kiểm thử.
 */
export function pickWithinCap(cands: Candidate[], sentToday: Map<string, number>, already: Set<string>): Candidate[] {
  const keyOf = (c: Candidate) => `${c.userId}|${c.kind}|${c.jobId}|${c.seekerId}`
  const byUser = new Map<string, Candidate[]>()
  const seen = new Set<string>()
  for (const c of cands) {
    const k = keyOf(c)
    if (already.has(k) || seen.has(k)) continue
    seen.add(k)
    byUser.set(c.userId, [...(byUser.get(c.userId) ?? []), c])
  }
  const out: Candidate[] = []
  for (const [userId, list] of byUser) {
    const room = Math.max(0, DAILY_CAP - (sentToday.get(userId) ?? 0))
    out.push(...list.sort((a, b) => b.score - a.score).slice(0, room))
  }
  return out
}

/**
 * Báo "việc mới rất phù hợp" (người tìm việc) khi một tin vừa được duyệt và đang mở, và "ứng viên mới rất phù hợp"
 * (mọi thành viên công ty) khi một hồ sơ công khai vừa đăng hoặc vừa sửa. Ngưỡng 80%, tối đa 3 thông báo/người/ngày.
 * Chạy nền mỗi phút; email đi theo đường NotificationMailService (gửi ngay / tóm tắt 8:00 / tắt) như mọi thông báo khác.
 * Không báo cặp đã có quan hệ (ứng tuyển, quan tâm, kết nối) hoặc doanh nghiệp đã đánh dấu ứng viên.
 */
@Injectable()
export class MatchAlertService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout
  private running = false

  constructor(private prisma: PrismaService, private matching: MatchingService, private realtime: RealtimeGateway) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.tick(), TICK_MS)
    this.timer.unref()
  }

  onModuleDestroy() {
    clearInterval(this.timer)
  }

  async tick(now = new Date()): Promise<number> {
    if (this.running) return 0
    this.running = true
    try {
      const w = await this.matching.weights()
      const cands = [...(await this.newJobs(w)), ...(await this.changedSeekers(w))]
      return await this.deliver(cands, now)
    } catch (e) {
      console.warn('Không xử lý được thông báo việc/ứng viên phù hợp:', (e as Error).message)
      return 0
    } finally {
      this.running = false
    }
  }

  /** Tin vừa hiển thị → người tìm việc rất phù hợp. Giữ chỗ bằng UPDATE … RETURNING để nhiều máy chủ không xử lý trùng */
  private async newJobs(w: Weights): Promise<Candidate[]> {
    const pending = await this.prisma.job.findMany({ where: { ...VISIBLE_WHERE, matchAlertedAt: null }, select: { id: true }, take: BATCH })
    if (!pending.length) return []
    const claimed = await this.prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      UPDATE "Job" SET "matchAlertedAt" = "updatedAt" WHERE "id" IN (${Prisma.join(pending.map((j) => j.id))}) AND "matchAlertedAt" IS NULL RETURNING "id"`)
    if (!claimed.length) return []
    const jobs = await this.prisma.job.findMany({ where: { id: { in: claimed.map((r) => r.id) } }, select: JOB_SCORE_SELECT })
    // Người tìm việc nhận gợi ý cả khi hồ sơ chưa công khai, miễn đã điền lịch rảnh (không thì điểm vô nghĩa)
    const seekers = await this.prisma.seekerProfile.findMany({
      where: { user: { status: 'active' }, availability: { isEmpty: false } },
      select: SEEKER_SCORE_SELECT,
    })
    const related = await this.relatedPairs(jobs.map((j) => j.id), seekers.map((s) => s.userId))
    const out: Candidate[] = []
    for (const j of jobs) for (const s of seekers) {
      if (related.has(`${j.id}|${s.userId}`)) continue
      const { score } = scorePair(s, j, w)
      if (score >= STRONG_MATCH) out.push({ userId: s.userId, kind: 'job_match', jobId: j.id, seekerId: s.userId, score })
    }
    return out
  }

  /** Hồ sơ công khai vừa đăng/sửa (matchAlertedAt < updatedAt) → mọi thành viên công ty có tin rất phù hợp */
  private async changedSeekers(w: Weights): Promise<Candidate[]> {
    const pending = await this.prisma.$queryRaw<{ userId: string }[]>(Prisma.sql`
      SELECT "userId" FROM "SeekerProfile"
      WHERE "published" = true AND ("matchAlertedAt" IS NULL OR "matchAlertedAt" < "updatedAt") LIMIT ${BATCH}`)
    if (!pending.length) return []
    // SQL thô để không chạm @updatedAt (Prisma tự đổi updatedAt khi update). Gán bằng chính updatedAt của dòng:
    // không truyền mốc giờ từ Node vào SQL thô (CSDL đặt múi giờ VN, cột không có múi giờ → dễ lệch 7 tiếng)
    const claimed = await this.prisma.$queryRaw<{ userId: string }[]>(Prisma.sql`
      UPDATE "SeekerProfile" SET "matchAlertedAt" = "updatedAt"
      WHERE "userId" IN (${Prisma.join(pending.map((s) => s.userId))}) AND ("matchAlertedAt" IS NULL OR "matchAlertedAt" < "updatedAt")
      RETURNING "userId"`)
    if (!claimed.length) return []
    const [seekers, jobs] = await Promise.all([
      this.prisma.seekerProfile.findMany({ where: { AND: [OPEN_SEEKER_WHERE, { userId: { in: claimed.map((r) => r.userId) } }] }, select: SEEKER_SCORE_SELECT }),
      this.prisma.job.findMany({ where: VISIBLE_WHERE, select: { ...JOB_SCORE_SELECT, company: { select: { lat: true, lng: true, members: { select: { userId: true } } } } } }),
    ])
    if (!seekers.length || !jobs.length) return []
    const related = await this.relatedPairs(jobs.map((j) => j.id), seekers.map((s) => s.userId))
    const out: Candidate[] = []
    for (const s of seekers as SeekerScoreRow[]) for (const j of jobs) {
      if (related.has(`${j.id}|${s.userId}`)) continue
      const { score } = scorePair(s, j as JobScoreRow, w)
      if (score < STRONG_MATCH) continue
      for (const m of j.company.members) out.push({ userId: m.userId, kind: 'candidate_match', jobId: j.id, seekerId: s.userId, score })
    }
    return out
  }

  /** Cặp đã có quan hệ: ứng tuyển/quan tâm, kết nối, hoặc doanh nghiệp đã lưu/ẩn ứng viên cho tin đó */
  private async relatedPairs(jobIds: string[], seekerIds: string[]): Promise<Set<string>> {
    if (!jobIds.length || !seekerIds.length) return new Set()
    const where = { jobId: { in: jobIds }, seekerId: { in: seekerIds } }
    const [a, b, c] = await Promise.all([
      this.prisma.interest.findMany({ where, select: { jobId: true, seekerId: true } }),
      this.prisma.connection.findMany({ where, select: { jobId: true, seekerId: true } }),
      this.prisma.candidateMark.findMany({ where, select: { jobId: true, seekerId: true } }),
    ])
    return new Set([...a, ...b, ...c].map((r) => `${r.jobId}|${r.seekerId}`))
  }

  /** Lọc theo Cài đặt (loại đã tắt thì không tạo), bỏ trùng, áp giới hạn ngày, ghi và đẩy realtime */
  private async deliver(cands: Candidate[], now: Date): Promise<number> {
    if (!cands.length) return 0
    const userIds = [...new Set(cands.map((c) => c.userId))]
    const [settings, today, existing] = await Promise.all([
      this.prisma.userSettings.findMany({ where: { userId: { in: userIds } }, select: { userId: true, notify: true } }),
      this.prisma.notification.groupBy({ by: ['userId'], where: { userId: { in: userIds }, kind: { in: MATCH_KINDS }, at: { gte: vnDayStart(now) } }, _count: true }),
      this.prisma.notification.findMany({
        where: { userId: { in: userIds }, kind: { in: MATCH_KINDS }, jobId: { in: [...new Set(cands.map((c) => c.jobId))] } },
        select: { userId: true, kind: true, jobId: true, seekerId: true },
      }),
    ])
    const prefs = new Map(settings.map((s) => [s.userId, s.notify as Record<string, boolean>]))
    const allowed = cands.filter((c) => prefs.get(c.userId)?.[c.kind] !== false)
    const sentToday = new Map(today.map((r) => [r.userId, r._count]))
    const already = new Set(existing.map((n) => `${n.userId}|${n.kind}|${n.jobId}|${n.seekerId}`))
    const picked = pickWithinCap(allowed, sentToday, already)
    if (!picked.length) return 0

    const rows = await this.prisma.notification.createManyAndReturn({
      data: picked.map(({ userId, kind, jobId, seekerId }) => ({ userId, kind, jobId, seekerId, at: now })),
    })
    for (const n of rows) {
      this.realtime.toUsers([n.userId], 'notification:new', {
        id: n.id, to: n.userId === n.seekerId ? 'seeker' : 'recruiter', kind: n.kind, jobId: n.jobId, seekerId: n.seekerId, at: n.at.toISOString(), read: n.read,
      })
    }
    return rows.length
  }
}
