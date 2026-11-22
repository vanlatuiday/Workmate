import type { MatchJob } from '@pages/public/match/data'
import { pad } from '@utils/format'

/** Bốn buổi của một ngày; chỉ số buổi khớp khóa ca `${ngày}-${buổi}` (0 Sáng, 1 Chiều, 2 Tối, 3 Khuya — Khuya thuộc ngày bắt đầu ca) */
export type SessionIndex = 0 | 1 | 2 | 3

/** Giờ ước lượng cho buổi (dữ liệu chỉ có Sáng/Chiều/Tối/Khuya, chưa có giờ cụ thể) */
export const SESSION_HOURS: Record<SessionIndex, { name: string; start: number; end: number }> = {
  0: { name: 'Sáng', start: 7, end: 12 },
  1: { name: 'Chiều', start: 13, end: 17 },
  2: { name: 'Tối', start: 17, end: 22 },
  /** Khuya 22:00–06:00: end > 24 nghĩa là sang hôm sau (Date tự cuộn ngày) */
  3: { name: 'Khuya', start: 22, end: 30 },
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
export const DAY_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

export const timeRange = (s: SessionIndex) => `${pad(SESSION_HOURS[s].start)}:00–${pad(SESSION_HOURS[s].end % 24)}:00`

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

/** Thứ trong tuần của ca: 0 = T2 … 6 = CN (khớp chip ngày ở bộ lọc) */
const dayOfRow = (r: ShiftRow) => Number(r.slot.split('-')[0])
/** Nhãn thứ ngắn của ca, vd. "T7" */
export const dayShort = (r: ShiftRow) => DAY_SHORT[dayOfRow(r)]

/** Lọc ca theo buổi (null = mọi buổi) và thứ (null = cả tuần); giữ nguyên thứ tự */
export function filterShifts(rows: ShiftRow[], session: SessionIndex | null, day: number | null): ShiftRow[] {
  if (session === null && day === null) return rows
  return rows.filter((r) => (session === null || r.session === session) && (day === null || dayOfRow(r) === day))
}
