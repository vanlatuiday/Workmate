// Lớp dịch vụ cho quan tâm / kết nối / thông báo. Giao diện chỉ dùng các hàm ở đây.
// Hiện đọc/ghi kho demo (`@context/demoStore`); khi có backend, đổi ruột các hàm này sang
// gọi API (`./api`, `./matchService`) — chữ ký giữ nguyên nên giao diện không phải sửa.
import { useDemoStore, ME, RECRUITER_JOBS, type Side } from '@context/demoStore'

export { ME, RECRUITER_JOBS }
export type { Side, Interest, Connection, DemoNotification } from '@context/demoStore'

/** Trạng thái giữa một vị trí và một người tìm việc, nhìn từ phía `viewer` */
export type PairStatus =
  /** Chưa ai quan tâm */
  | 'none'
  /** Mình đã quan tâm, chờ phía kia */
  | 'sent'
  /** Phía kia đã quan tâm mình, chờ mình đáp lại */
  | 'received'
  /** Hai bên cùng quan tâm */
  | 'connected'

const pairKey = (jobId: string, seekerId: string) => `${jobId}|${seekerId}`

/** Hook: trạng thái của mọi cặp (jobId|seekerId → PairStatus) nhìn từ `viewer` — dùng cho danh sách */
export function usePairStatuses(viewer: Side): (jobId: string, seekerId: string) => PairStatus {
  const interests = useDemoStore((s) => s.interests)
  const connections = useDemoStore((s) => s.connections)
  const connected = new Set(connections.map((c) => pairKey(c.jobId, c.seekerId)))
  const mine = new Set(interests.filter((i) => i.from === viewer).map((i) => pairKey(i.jobId, i.seekerId)))
  const theirs = new Set(interests.filter((i) => i.from !== viewer).map((i) => pairKey(i.jobId, i.seekerId)))
  return (jobId, seekerId) => {
    const k = pairKey(jobId, seekerId)
    if (connected.has(k)) return 'connected'
    if (mine.has(k)) return 'sent'
    if (theirs.has(k)) return 'received'
    return 'none'
  }
}

/** Trạng thái hiện tại của một cặp (đọc tức thời, không theo dõi) — vd. để biết bấm xong có thành kết nối ngay không */
export function getPairStatus(viewer: Side, jobId: string, seekerId: string): PairStatus {
  const { interests, connections } = useDemoStore.getState()
  const k = pairKey(jobId, seekerId)
  if (connections.some((c) => pairKey(c.jobId, c.seekerId) === k)) return 'connected'
  if (interests.some((i) => i.from === viewer && pairKey(i.jobId, i.seekerId) === k)) return 'sent'
  if (interests.some((i) => i.from !== viewer && pairKey(i.jobId, i.seekerId) === k)) return 'received'
  return 'none'
}

/** Bày tỏ quan tâm (người tìm việc: ứng tuyển; doanh nghiệp: quan tâm ứng viên) */
export function expressInterest(from: Side, jobId: string, seekerId: string) {
  useDemoStore.getState().expressInterest(from, jobId, seekerId)
}

/** Rút quan tâm — không rút được khi đã kết nối */
export function withdrawInterest(from: Side, jobId: string, seekerId: string) {
  useDemoStore.getState().withdrawInterest(from, jobId, seekerId)
}

/** Hook: thông báo của một phía, mới nhất trước */
export function useNotifications(to: Side) {
  const all = useDemoStore((s) => s.notifications)
  return all.filter((n) => n.to === to).sort((a, b) => b.at.localeCompare(a.at))
}

/** Hook: số thông báo chưa đọc của một phía */
export function useUnreadCount(to: Side) {
  return useDemoStore((s) => s.notifications.filter((n) => n.to === to && !n.read).length)
}

/**
 * Hook: gọi `onConnect(jobId, seekerId)` mỗi khi có kết nối MỚI xuất hiện (kể cả do phía kia
 * giả lập đáp lại sau vài giây) — để trang hiện thông báo "Kết nối thành công".
 */
export { useOnNewConnection } from './connectionEvents'

export const markNotificationRead = (id: string) => useDemoStore.getState().markRead(id)
export const markAllNotificationsRead = (to: Side) => useDemoStore.getState().markAllRead(to)
/** Đưa dữ liệu demo về ban đầu */
export const resetDemoData = () => useDemoStore.getState().reset()
