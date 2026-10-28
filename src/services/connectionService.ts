// Lớp dịch vụ cho quan tâm / kết nối / thông báo. Giao diện chỉ dùng các hàm ở đây.
// Hiện đọc/ghi kho demo (`@context/demoStore`); khi có backend, đổi ruột các hàm này sang
// gọi API (`./api`, `./matchService`) — chữ ký giữ nguyên nên giao diện không phải sửa.
import { useDemoStore, convKey, ME, RECRUITER_JOBS, type Connection, type Message, type Side } from '@context/demoStore'

export { ME, RECRUITER_JOBS }
export type { Side, Interest, Connection, DemoNotification, Message } from '@context/demoStore'
export { convKey }

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

// ─── Tin nhắn (chỉ giữa hai bên đã kết nối) ──────────────────────────────────

/** Kết nối thuộc về tài khoản demo của phía `viewer` (người tìm việc 'me' / tin j1–j4 hoặc tin nháp) */
const isMine = (viewer: Side, c: Pick<Connection, 'jobId' | 'seekerId'>) =>
  viewer === 'seeker' ? c.seekerId === ME : RECRUITER_JOBS.includes(c.jobId) || c.jobId === 'draft'

export interface ConversationSummary extends Connection {
  key: string
  last?: Message
  unread: number
}

/** Hook: các cuộc trò chuyện của phía `viewer`, mới hoạt động nhất trước */
export function useConversations(viewer: Side): ConversationSummary[] {
  const connections = useDemoStore((s) => s.connections)
  const messages = useDemoStore((s) => s.messages)
  const lastRead = useDemoStore((s) => s.lastRead)
  return connections
    .filter((c) => isMine(viewer, c))
    .map((c) => {
      const key = convKey(c.jobId, c.seekerId)
      const list = messages.filter((m) => convKey(m.jobId, m.seekerId) === key)
      const read = lastRead[`${viewer}|${key}`] ?? ''
      return { ...c, key, last: list[list.length - 1], unread: list.filter((m) => m.from !== viewer && m.at > read).length }
    })
    .sort((a, b) => (b.last?.at ?? b.at).localeCompare(a.last?.at ?? a.at))
}

/** Hook: tin nhắn của một cuộc trò chuyện, cũ trước mới sau */
export function useMessages(jobId: string, seekerId: string): Message[] {
  const messages = useDemoStore((s) => s.messages)
  const key = convKey(jobId, seekerId)
  return messages.filter((m) => convKey(m.jobId, m.seekerId) === key)
}

/** Hook: phía kia đang gõ trong cuộc trò chuyện này? */
export function useIsTyping(viewer: Side, jobId: string, seekerId: string) {
  return useDemoStore((s) => {
    const who = s.typing[convKey(jobId, seekerId)]
    return !!who && who !== viewer
  })
}

/** Hook: tổng số tin chưa đọc của phía `viewer` (cho nút tài khoản ở header) */
export function useUnreadMessages(viewer: Side) {
  return useConversations(viewer).reduce((n, c) => n + c.unread, 0)
}

/** Gửi tin — chỉ được khi hai bên đã kết nối (kho tự bỏ qua nếu chưa) */
export const sendMessage = (from: Side, jobId: string, seekerId: string, text: string) =>
  useDemoStore.getState().sendMessage(from, jobId, seekerId, text)

export const markConversationRead = (viewer: Side, jobId: string, seekerId: string) =>
  useDemoStore.getState().markConversationRead(viewer, jobId, seekerId)
