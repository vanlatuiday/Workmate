// Lớp dịch vụ cho quan tâm / kết nối / thông báo. Giao diện chỉ dùng các hàm ở đây.
// Hiện đọc/ghi kho demo (`@context/demoStore`); khi có backend, đổi ruột các hàm này sang
// gọi API (`./api`, `./matchService`) — chữ ký giữ nguyên nên giao diện không phải sửa.
import { isNotifyOn, useSettingsStore } from '@context/settingsStore'
import { useDemoStore, convKey, ME, RECRUITER_JOBS, type Connection, type Hire, type Interview, type Message, type Side } from '@context/demoStore'

export { ME, RECRUITER_JOBS }
export type { Side, Interest, Connection, DemoNotification, Message, Interview, InterviewMode, InterviewStatus, Hire, HireStatus } from '@context/demoStore'
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

/** Hook: thông báo của tài khoản demo ở phía `to`, mới nhất trước (bỏ thông báo gửi cho ứng viên/tin mẫu khác và loại đã tắt trong Cài đặt) */
export function useNotifications(to: Side) {
  const all = useDemoStore((s) => s.notifications)
  const prefs = useSettingsStore((s) => s.bySide[to])
  return all.filter((n) => n.to === to && isMine(to, n) && isNotifyOn(prefs, n.kind)).sort((a, b) => b.at.localeCompare(a.at))
}

/** Hook: số thông báo chưa đọc của tài khoản demo ở phía `to` */
export function useUnreadCount(to: Side) {
  const prefs = useSettingsStore((s) => s.bySide[to])
  return useDemoStore((s) => s.notifications.filter((n) => n.to === to && !n.read && isMine(to, n) && isNotifyOn(prefs, n.kind)).length)
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

// ─── Lịch phỏng vấn ─────────────────────────────────────────────────────────

/** Hook: các buổi phỏng vấn của phía `viewer` (mọi trạng thái), sớm nhất trước */
export function useInterviews(viewer: Side): Interview[] {
  const all = useDemoStore((s) => s.interviews)
  return all
    .filter((iv) => isMine(viewer, iv))
    .sort((a, b) => (a.chosen ?? a.slots[0]).localeCompare(b.chosen ?? b.slots[0]))
}

/** Hook: buổi phỏng vấn đang hiệu lực (chờ xác nhận / đã xác nhận) của một cặp, nếu có */
export function useActiveInterview(jobId: string, seekerId: string): Interview | undefined {
  return useDemoStore((s) =>
    s.interviews.find((iv) => iv.jobId === jobId && iv.seekerId === seekerId && (iv.status === 'pending' || iv.status === 'confirmed')),
  )
}

/** Doanh nghiệp mời phỏng vấn — chỉ khi đã kết nối; 1–3 khung giờ (ISO) */
export const inviteInterview = (input: Pick<Interview, 'jobId' | 'seekerId' | 'slots' | 'mode' | 'place' | 'note'>) =>
  useDemoStore.getState().inviteInterview(input)
/** Người tìm việc chọn một khung giờ trong lời mời */
export const confirmInterview = (id: string, slot: string) => useDemoStore.getState().confirmInterview(id, slot)
export const declineInterview = (id: string) => useDemoStore.getState().declineInterview(id)
export const cancelInterview = (id: string) => useDemoStore.getState().cancelInterview(id)

// ─── Nhận việc → xác nhận đi làm ────────────────────────────────────────────

/** Hook: bản ghi nhận việc của một cặp (jobId + seekerId), nếu có */
export function useHire(jobId: string, seekerId: string): Hire | undefined {
  return useDemoStore((s) => s.hires.find((h) => h.jobId === jobId && h.seekerId === seekerId))
}

/** Hook: mọi bản ghi nhận việc của phía `viewer`, mới cập nhật trước */
export function useHires(viewer: Side): Hire[] {
  const all = useDemoStore((s) => s.hires)
  return all.filter((h) => isMine(viewer, h)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

/** Doanh nghiệp mời nhận việc — chỉ khi đã kết nối và cặp chưa có bản ghi nhận việc */
export const offerJob = (input: { jobId: string; seekerId: string; startDate: string; note?: string }) => useDemoStore.getState().offerJob(input)
/** Doanh nghiệp không nhận (kèm lý do không bắt buộc) */
export const rejectCandidate = (jobId: string, seekerId: string, reason?: string) => useDemoStore.getState().rejectCandidate(jobId, seekerId, reason)
/** Doanh nghiệp rút lời mời khi còn chờ */
export const withdrawOffer = (jobId: string, seekerId: string) => useDemoStore.getState().withdrawOffer(jobId, seekerId)
/** Người tìm việc xác nhận đi làm — lúc này cặp mới tính là "đã đi làm" */
export const acceptOffer = (jobId: string, seekerId: string) => useDemoStore.getState().acceptOffer(jobId, seekerId)
export const declineOffer = (jobId: string, seekerId: string, reason?: string) => useDemoStore.getState().declineOffer(jobId, seekerId, reason)

// ─── Danh sách cho dashboard ────────────────────────────────────────────────

export interface PairItem {
  jobId: string
  seekerId: string
  /** Lúc mình bày tỏ quan tâm (hoặc lúc kết nối nếu phía kia quan tâm trước) */
  at: string
  status: Exclude<PairStatus, 'none'>
}

/**
 * Hook: mọi cặp liên quan tới tài khoản demo của phía `viewer` mà mình đã quan tâm, phía kia đã
 * quan tâm mình, hoặc đã kết nối — mới nhất trước. Dùng cho "Đã ứng tuyển", "Kết nối"…
 */
export function useMyPairs(viewer: Side): PairItem[] {
  const interests = useDemoStore((s) => s.interests)
  const connections = useDemoStore((s) => s.connections)
  const status = usePairStatuses(viewer)
  const seen = new Map<string, PairItem>()
  for (const i of interests) {
    if (!isMine(viewer, i)) continue
    const k = convKey(i.jobId, i.seekerId)
    const st = status(i.jobId, i.seekerId)
    if (st === 'none') continue
    const prev = seen.get(k)
    // Giữ thời điểm của chính mình nếu có, không thì thời điểm sớm nhất
    const at = i.from === viewer || !prev ? i.at : prev.at
    seen.set(k, { jobId: i.jobId, seekerId: i.seekerId, at, status: st })
  }
  for (const c of connections) {
    if (!isMine(viewer, c)) continue
    const k = convKey(c.jobId, c.seekerId)
    if (!seen.has(k)) seen.set(k, { jobId: c.jobId, seekerId: c.seekerId, at: c.at, status: 'connected' })
  }
  return [...seen.values()].sort((a, b) => b.at.localeCompare(a.at))
}
