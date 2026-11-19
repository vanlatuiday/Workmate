import type { MatchJob } from '@pages/public/match/data'

/** Ba buổi của một ngày; chỉ số buổi khớp khóa ca `${ngày}-${buổi}` (0 Sáng, 1 Chiều, 2 Tối) */
export type SessionIndex = 0 | 1 | 2

/** Giờ ước lượng cho buổi (dữ liệu chỉ có Sáng/Chiều/Tối, chưa có giờ cụ thể) */
export const SESSION_HOURS: Record<SessionIndex, { name: string; start: number; end: number }> = {
  0: { name: 'Sáng', start: 7, end: 12 },
  1: { name: 'Chiều', start: 13, end: 17 },
  2: { name: 'Tối', start: 18, end: 22 },
}

/** Một lần xuất hiện của ca: (việc, ngày, buổi) */
export interface ShiftRow {
  key: string
  job: MatchJob
  slot: string
  session: SessionIndex
  start: Date
  end: Date
  /** Nhãn ngày, vd. "T7 22/11" */
  dayLabel: string
}

/** Chỉ số thứ trong tuần theo dữ liệu: 0 = Thứ Hai … 6 = Chủ nhật */
const dayIndexOf = (d: Date) => (d.getDay() + 6) % 7
const DAY_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

const pad = (n: number) => String(n).padStart(2, '0')
export const timeRange = (s: SessionIndex) => `${pad(SESSION_HOURS[s].start)}:00–${pad(SESSION_HOURS[s].end)}:00`

/** Số ngày bảng ca nhìn tới: hôm nay (phần còn lại) + 6 ngày sau */
const WEEK_DAYS = 7

/**
 * Các ca còn đang cần người trong 7 ngày tới (hôm nay + 6 ngày sau): mỗi ca (việc, ngày, buổi) là một dòng, buổi đã kết thúc thì bỏ.
 * Xếp theo giờ bắt đầu rồi tới khoảng cách; `allowed` (nếu có) giới hạn trong các ca rảnh của người tìm việc.
 */
export function shiftsOf(jobs: MatchJob[], now: Date, allowed?: ReadonlySet<string>, limit = Infinity): ShiftRow[] {
  const todayIdx = dayIndexOf(now)
  const rows: ShiftRow[] = []
  for (let offset = 0; offset < WEEK_DAYS; offset++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset)
    const day = (todayIdx + offset) % 7
    for (const job of jobs) {
      for (const slot of job.slots) {
        const [d, s] = slot.split('-').map(Number)
        if (d !== day || !(s in SESSION_HOURS) || (allowed && !allowed.has(slot))) continue
        const session = s as SessionIndex
        const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), SESSION_HOURS[session].start)
        const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), SESSION_HOURS[session].end)
        if (end <= now) continue
        rows.push({ key: `${job.id}|${slot}`, job, slot, session, start, end, dayLabel: `${DAY_SHORT[day]} ${pad(date.getDate())}/${pad(date.getMonth() + 1)}` })
      }
    }
  }
  return rows.sort((a, b) => a.start.getTime() - b.start.getTime() || a.job.distanceKm - b.job.distanceKm).slice(0, limit)
}
