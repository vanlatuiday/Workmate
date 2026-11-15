import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

const VN_OFFSET_MS = 7 * 3_600_000
const DAY_MS = 86_400_000
/** Số tuần gần nhất hiện trên biểu đồ */
export const STATS_WEEKS = 8

/** 0:00 thứ Hai (giờ Việt Nam) của tuần chứa `t` */
export function vnWeekStart(t: Date): Date {
  const local = new Date(t.getTime() + VN_OFFSET_MS)
  local.setUTCHours(0, 0, 0, 0)
  const dow = (local.getUTCDay() + 6) % 7 // 0 = thứ Hai
  return new Date(local.getTime() - dow * DAY_MS - VN_OFFSET_MS)
}

/** Ngày (giờ VN) dạng YYYY-MM-DD của mốc UTC */
const vnDate = (t: Date) => new Date(t.getTime() + VN_OFFSET_MS).toISOString().slice(0, 10)

export interface WeekBucket {
  /** Thứ Hai đầu tuần, giờ VN */
  weekStart: string
  applied: number
  invited: number
  connected: number
}

/** Chia các mốc thời gian vào STATS_WEEKS tuần gần nhất (tuần cũ trước). Hàm thuần để kiểm thử */
export function bucketWeeks(now: Date, series: { applied: Date[]; invited: Date[]; connected: Date[] }): WeekBucket[] {
  const current = vnWeekStart(now).getTime()
  const weeks: WeekBucket[] = Array.from({ length: STATS_WEEKS }, (_, i) => ({
    weekStart: vnDate(new Date(current - (STATS_WEEKS - 1 - i) * 7 * DAY_MS)),
    applied: 0,
    invited: 0,
    connected: 0,
  }))
  const first = current - (STATS_WEEKS - 1) * 7 * DAY_MS
  for (const key of ['applied', 'invited', 'connected'] as const) {
    for (const t of series[key]) {
      const idx = Math.floor((vnWeekStart(t).getTime() - first) / (7 * DAY_MS))
      if (idx >= 0 && idx < STATS_WEEKS) weeks[idx][key]++
    }
  }
  return weeks
}

const pct = (part: number, whole: number) => (whole ? Math.round((part / whole) * 100) : null)

/**
 * Thống kê của người tìm việc (trang /tim-viec/thong-ke): hành trình ứng tuyển, lời mời từ doanh nghiệp,
 * tỉ lệ được xem / kết nối, hoạt động theo tuần, đánh giá nhận được.
 */
@Injectable()
export class SeekerStatsService {
  constructor(private prisma: PrismaService) {}

  async get(seekerId: string, now = new Date()) {
    const since = new Date(vnWeekStart(now).getTime() - (STATS_WEEKS - 1) * 7 * DAY_MS)
    const [applied, invited, connections, interviews, hires, saved, reviews] = await Promise.all([
      this.prisma.interest.findMany({ where: { seekerId, from: 'seeker' }, select: { at: true, viewedAt: true, consideringAt: true } }),
      this.prisma.interest.findMany({ where: { seekerId, from: 'recruiter' }, select: { at: true } }),
      this.prisma.connection.findMany({ where: { seekerId }, select: { at: true } }),
      this.prisma.interview.findMany({ where: { seekerId }, select: { status: true, chosen: true } }),
      this.prisma.hire.findMany({ where: { seekerId }, select: { status: true } }),
      this.prisma.savedJob.count({ where: { seekerId } }),
      this.prisma.review.aggregate({ where: { seekerId, from: 'recruiter' }, _avg: { stars: true }, _count: true }),
    ])

    const viewed = applied.filter((a) => a.viewedAt).length
    const considering = applied.filter((a) => a.consideringAt).length
    const confirmed = interviews.filter((i) => i.status === 'confirmed')
    const inWindow = (d: Date) => d >= since

    return {
      totals: {
        applied: applied.length,
        viewed,
        considering,
        invited: invited.length,
        connected: connections.length,
        interviews: confirmed.length,
        upcomingInterviews: confirmed.filter((i) => i.chosen && i.chosen > now).length,
        pendingInterviews: interviews.filter((i) => i.status === 'pending').length,
        hired: hires.filter((h) => h.status === 'accepted').length,
        offers: hires.filter((h) => h.status === 'offered').length,
        saved,
      },
      rates: {
        /** % đơn được doanh nghiệp mở xem */
        viewed: pct(viewed, applied.length),
        /** % (đơn gửi + lời mời nhận) thành kết nối */
        connected: pct(connections.length, applied.length + invited.length),
      },
      weekly: bucketWeeks(now, {
        applied: applied.map((a) => a.at).filter(inWindow),
        invited: invited.map((a) => a.at).filter(inWindow),
        connected: connections.map((c) => c.at).filter(inWindow),
      }),
      rating: reviews._count ? { average: Math.round((reviews._avg.stars ?? 0) * 10) / 10, count: reviews._count } : null,
    }
  }
}
