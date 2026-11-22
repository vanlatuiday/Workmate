import type { Interview } from '@services/connectionService'

export type ScheduleTabKey = 'upcoming' | 'pending' | 'past'
const dayFormatter = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' })
export const dayKey = (iso: string | Date) => dayFormatter.format(new Date(iso))
export const whenOf = (iv: Interview) => iv.chosen ?? iv.slots[0] ?? iv.createdAt

/** Giữ trạng thái từ máy chủ; lịch gần nhất và nhóm ngày luôn theo thứ tự thời gian. */
export function getScheduleData(all: readonly Interview[], now = Date.now()) {
  const upcoming = all.filter((iv) => iv.status === 'confirmed' && Date.parse(whenOf(iv)) >= now)
    .sort((a, b) => Date.parse(whenOf(a)) - Date.parse(whenOf(b)))
  const pending = all.filter((iv) => iv.status === 'pending')
  const past = all.filter((iv) => !upcoming.includes(iv) && iv.status !== 'pending')
    .sort((a, b) => Date.parse(whenOf(b)) - Date.parse(whenOf(a)))
  const groups: { key: string; iso: string; list: Interview[] }[] = []
  for (const iv of upcoming) {
    const key = dayKey(whenOf(iv))
    const group = groups.find((item) => item.key === key)
    if (group) group.list.push(iv)
    else groups.push({ key, iso: whenOf(iv), list: [iv] })
  }
  return { upcoming, pending, past, groups }
}
