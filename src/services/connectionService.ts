// Lớp dịch vụ cho quan tâm / kết nối / tin nhắn / phỏng vấn / nhận việc / đánh giá / thông báo.
// Giao diện chỉ dùng các hàm ở đây. Đọc từ `connectionStore`; thao tác ghi gọi máy chủ rồi cập nhật kho,
// máy chủ từ chối thì báo lỗi bằng toast. Sự kiện socket giữ kho khớp khi phía kia thay đổi.
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import api from './api'
import { apiErrorMessage } from './authService'
import { connectRealtime, disconnectRealtime, emitTyping } from './realtime'
import { loadCandidates } from './candidateService'
import { useAuthStore } from '@context/authStore'
import { useCatalogStore } from '@context/catalogStore'
import { useCandidateStore } from '@context/candidateStore'
import { isNotifyOn, useSettingsStore, type NotificationKind } from '@context/settingsStore'
import {
  convKey, ME, REVIEW_MAX_COMMENT, REVIEW_MAX_TAGS, useConnectionStore,
  type Connection, type ConversationSummary, type DemoNotification, type Hire, type Interest, type Interview, type Message, type Review, type Side,
} from '@context/connectionStore'

export { ME, convKey, REVIEW_MAX_COMMENT, REVIEW_MAX_TAGS }
export type { Side, Interest, Connection, ConversationSummary, DemoNotification, Message, Interview, InterviewMode, InterviewStatus, Hire, HireStatus, Review } from '@context/connectionStore'

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

const store = () => useConnectionStore.getState()
const setStore = useConnectionStore.setState
const pairKey = convKey

// ─── Dịch id: giao diện dùng ME cho người tìm việc đang đăng nhập ────────────

const currentUser = () => useAuthStore.getState().user
const isSeeker = () => currentUser()?.role === 'jobseeker'
const mySide = (): Side => (isSeeker() ? 'seeker' : 'recruiter')
/** Id thật → id dùng trong giao diện */
const toLocal = (seekerId: string) => (isSeeker() && seekerId === currentUser()?.id ? ME : seekerId)
/** Id trong giao diện → id thật gửi máy chủ */
const toServer = (seekerId: string) => (isSeeker() ? currentUser()?.id ?? seekerId : seekerId)
const localize = <T extends { seekerId: string }>(r: T): T => ({ ...r, seekerId: toLocal(r.seekerId) })
const pairPath = (jobId: string, seekerId: string) => `${encodeURIComponent(jobId)}/${encodeURIComponent(toServer(seekerId))}`

/** Bọc thao tác ghi: lỗi thì toast; luôn nạp lại trạng thái các cặp để kho khớp máy chủ */
async function write(run: () => Promise<unknown>, fallback: string): Promise<boolean> {
  try {
    await run()
    return true
  } catch (err) {
    toast.error(apiErrorMessage(err, fallback))
    return false
  } finally {
    await refreshPairs().catch(() => undefined)
  }
}

// ─── Nạp dữ liệu ────────────────────────────────────────────────────────────

export async function refreshPairs() {
  const [state, interviews, hires, reviews] = await Promise.all([
    api.get<{ interests: Interest[]; connections: Connection[] }>('/connections'),
    api.get<Interview[]>('/interviews'),
    api.get<Hire[]>('/hires'),
    api.get<Review[]>('/reviews/mine'),
  ])
  setStore({
    hydrated: true,
    interests: state.data.interests.map(localize),
    connections: state.data.connections.map(localize),
    interviews: interviews.data.map(localize),
    hires: hires.data.map(localize),
    reviews: reviews.data.map(localize),
  })
}

export async function refreshConversations() {
  const { data } = await api.get<ConversationSummary[]>('/conversations')
  setStore({
    conversations: data.map((c) => {
      const seekerId = toLocal(c.seekerId)
      return { ...c, seekerId, key: convKey(c.jobId, seekerId), last: c.last && localize(c.last) }
    }),
  })
}

export async function refreshNotifications() {
  const { data } = await api.get<{ items: DemoNotification[] }>('/notifications')
  setStore({ notifications: data.items.map(localize) })
}

/** Phía kia vừa đổi gì đó: tin/ứng viên chưa có trong danh mục (vd. tin vừa được quan tâm) thì nạp thêm */
function fillMissing(jobId: string, seekerId: string) {
  if (!useCatalogStore.getState().jobs.some((j) => j.id === jobId)) void useCatalogStore.getState().load()
  if (!isSeeker() && !useCandidateStore.getState().list.some((c) => c.id === seekerId)) void loadCandidates()
}

let pairTimer: ReturnType<typeof setTimeout> | null = null
const typingTimers = new Map<string, ReturnType<typeof setTimeout>>()

function setTyping(key: string, who: Side | undefined) {
  setStore((s) => ({ typing: { ...s.typing, [key]: who } }))
}

function onMessage(raw: Message) {
  const m = localize(raw)
  const key = convKey(m.jobId, m.seekerId)
  if (m.from !== mySide()) setTyping(key, undefined)
  const known = store().conversations.some((c) => c.key === key)
  setStore((s) => {
    const loaded = s.messages[key]
    const dup = loaded?.some((x) => x.id === m.id)
    return {
      messages: loaded && !dup ? { ...s.messages, [key]: [...loaded, m] } : s.messages,
      conversations: dup ? s.conversations : s.conversations
        .map((c) => (c.key === key ? { ...c, last: m, unread: c.unread + (m.from !== mySide() ? 1 : 0) } : c))
        .sort((a, b) => (b.last?.at ?? b.at).localeCompare(a.last?.at ?? a.at)),
    }
  })
  if (!known) void refreshConversations().catch(() => undefined)
}

const reloadAll = () =>
  Promise.all([refreshPairs(), refreshConversations(), refreshNotifications()]).catch(() => undefined)

/** Gọi khi đăng nhập (người tìm việc / nhà tuyển dụng): nạp dữ liệu và mở socket */
export async function startConnections() {
  const token = useAuthStore.getState().token
  if (token) {
    connectRealtime(token, {
      onReconnect: () => void reloadAll(),
      on: {
        'message:new': onMessage,
        'notification:new': (n: DemoNotification) => {
          setStore((s) => (s.notifications.some((x) => x.id === n.id) ? s : { notifications: [localize(n), ...s.notifications] }))
        },
        'pair:changed': (p: { jobId: string; seekerId: string }) => {
          fillMissing(p.jobId, p.seekerId)
          // Một thao tác có thể kéo theo nhiều sự kiện: gom lại rồi nạp một lần
          if (pairTimer) clearTimeout(pairTimer)
          pairTimer = setTimeout(() => {
            void refreshPairs().catch(() => undefined)
            void refreshConversations().catch(() => undefined)
            // Vừa kết nối thì danh sách ứng viên mở họ tên đầy đủ
            if (!isSeeker()) void loadCandidates().catch(() => undefined)
          }, 150)
        },
        typing: (p: { jobId: string; seekerId: string; from: Side }) => {
          const key = convKey(p.jobId, toLocal(p.seekerId))
          setTyping(key, p.from)
          const old = typingTimers.get(key)
          if (old) clearTimeout(old)
          typingTimers.set(key, setTimeout(() => setTyping(key, undefined), 3000))
        },
      },
    })
  }
  await reloadAll()
}

/** Quản trị viên: toàn bộ cặp, chỉ để tính số liệu */
export async function loadAdminPairs() {
  const { data } = await api.get<{ interests: Interest[]; connections: Connection[]; interviews: Interview[]; hires: Hire[] }>('/admin/pairs')
  setStore({ ...data, hydrated: true })
}

/** Đăng xuất / đổi tài khoản */
export function stopConnections() {
  disconnectRealtime()
  viewedSent.clear()
  store().clear()
}

// ─── Quan tâm → kết nối ─────────────────────────────────────────────────────

/** Hook: trạng thái của mọi cặp (jobId|seekerId → PairStatus) nhìn từ `viewer` — dùng cho danh sách */
export function usePairStatuses(viewer: Side): (jobId: string, seekerId: string) => PairStatus {
  const interests = useConnectionStore((s) => s.interests)
  const connections = useConnectionStore((s) => s.connections)
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
  const { interests, connections } = store()
  const k = pairKey(jobId, seekerId)
  if (connections.some((c) => pairKey(c.jobId, c.seekerId) === k)) return 'connected'
  if (interests.some((i) => i.from === viewer && pairKey(i.jobId, i.seekerId) === k)) return 'sent'
  if (interests.some((i) => i.from !== viewer && pairKey(i.jobId, i.seekerId) === k)) return 'received'
  return 'none'
}

/** Bày tỏ quan tâm (người tìm việc: ứng tuyển; doanh nghiệp: quan tâm ứng viên). Hiện ngay, máy chủ từ chối thì hoàn lại */
export function expressInterest(from: Side, jobId: string, seekerId: string) {
  if (getPairStatus(from, jobId, seekerId) === 'sent' || getPairStatus(from, jobId, seekerId) === 'connected') return
  setStore((s) => ({ interests: [...s.interests, { from, jobId, seekerId, at: new Date().toISOString() }] }))
  void write(() => api.post(`/connections/${pairPath(jobId, seekerId)}/interest`), 'Chưa gửi được quan tâm, vui lòng thử lại.')
}

/** Rút quan tâm — không rút được khi đã kết nối */
export function withdrawInterest(from: Side, jobId: string, seekerId: string) {
  setStore((s) => ({ interests: s.interests.filter((i) => !(i.from === from && i.jobId === jobId && i.seekerId === seekerId)) }))
  void write(() => api.delete(`/connections/${pairPath(jobId, seekerId)}/interest`), 'Chưa rút được quan tâm, vui lòng thử lại.')
}

// ─── Tiến độ đơn ứng tuyển: chờ phản hồi → đã xem → đang cân nhắc ───────────

export type ApplicationStage = 'applied' | 'viewed' | 'considering'
export const APPLICATION_STAGE_LABEL: Record<ApplicationStage, string> = {
  applied: 'chờ phản hồi',
  viewed: 'doanh nghiệp đã xem',
  considering: 'đang được cân nhắc',
}

const stageOf = (i: Interest): ApplicationStage => (i.consideringAt ? 'considering' : i.viewedAt ? 'viewed' : 'applied')

/** Hook: đơn của người tìm việc cho cặp này đang ở bước nào; chưa ứng tuyển → undefined */
export function useApplicationStage(jobId: string, seekerId: string): ApplicationStage | undefined {
  return useConnectionStore((s) => {
    const app = s.interests.find((i) => i.from === 'seeker' && i.jobId === jobId && i.seekerId === seekerId)
    return app && stageOf(app)
  })
}

/** Hook: như useApplicationStage nhưng tra được nhiều cặp — dùng trong danh sách */
export function useApplicationStages(): (jobId: string, seekerId: string) => ApplicationStage | undefined {
  const interests = useConnectionStore((s) => s.interests)
  const apps = useMemo(
    () => new Map(interests.filter((i) => i.from === 'seeker').map((i) => [pairKey(i.jobId, i.seekerId), stageOf(i)])),
    [interests],
  )
  return (jobId, seekerId) => apps.get(pairKey(jobId, seekerId))
}

// Mỗi phiên chỉ báo "đã xem" một lần cho mỗi cặp
const viewedSent = new Set<string>()

/** Doanh nghiệp mở xem đơn: báo máy chủ một lần. Không có đơn hoặc đã xem rồi thì bỏ qua; lỗi thì im lặng */
export function markApplicationViewed(jobId: string, seekerId: string) {
  const k = pairKey(jobId, seekerId)
  const app = store().interests.find((i) => i.from === 'seeker' && pairKey(i.jobId, i.seekerId) === k)
  if (isSeeker() || !app || app.viewedAt || viewedSent.has(k)) return
  viewedSent.add(k)
  const at = new Date().toISOString()
  setStore((st) => ({ interests: st.interests.map((i) => (i === app ? { ...i, viewedAt: at } : i)) }))
  api.post(`/connections/${pairPath(jobId, seekerId)}/viewed`).catch(() => {
    viewedSent.delete(k)
    // Hoàn tác viewedAt lạc quan bằng dữ liệu máy chủ
    refreshPairs().catch(() => undefined)
  })
}

/** Doanh nghiệp báo "đang cân nhắc" đơn ứng tuyển; người tìm việc nhận thông báo */
/** Trả true khi máy chủ nhận; lỗi thì write() đã báo toast và nạp lại */
export function considerApplication(jobId: string, seekerId: string): Promise<boolean> {
  const at = new Date().toISOString()
  setStore((st) => ({
    interests: st.interests.map((i) => (i.from === 'seeker' && i.jobId === jobId && i.seekerId === seekerId
      ? { ...i, consideringAt: i.consideringAt ?? at, viewedAt: i.viewedAt ?? at } : i)),
  }))
  return write(() => api.post(`/connections/${pairPath(jobId, seekerId)}/considering`), 'Chưa cập nhật được, vui lòng thử lại.')
}

export { useOnNewConnection } from './connectionEvents'

// ─── Thông báo ──────────────────────────────────────────────────────────────

/** Hook: thông báo của phía `to`, mới nhất trước (bỏ loại đã tắt trong Cài đặt) */
export function useNotifications(to: Side) {
  const all = useConnectionStore((s) => s.notifications)
  const prefs = useSettingsStore((s) => s.bySide[to])
  return all.filter((n) => n.to === to && isNotifyOn(prefs, n.kind)).sort((a, b) => b.at.localeCompare(a.at))
}

/** Hook: số thông báo chưa đọc của phía `to` */
export function useUnreadCount(to: Side) {
  const prefs = useSettingsStore((s) => s.bySide[to])
  return useConnectionStore((s) => s.notifications.filter((n) => n.to === to && !n.read && isNotifyOn(prefs, n.kind)).length)
}

export function markNotificationRead(id: string) {
  setStore((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) }))
  void api.patch(`/notifications/${encodeURIComponent(id)}/read`).catch(() => undefined)
}

export function markAllNotificationsRead(to: Side) {
  setStore((s) => ({ notifications: s.notifications.map((n) => (n.to === to ? { ...n, read: true } : n)) }))
  void api.patch('/notifications/read-all').catch(() => undefined)
}

/** Bật/tắt một loại thông báo. Máy chủ chỉ trả loại đang bật nên bật lại phải nạp lại danh sách */
export async function setNotifyPref(side: Side, kind: NotificationKind, on: boolean) {
  await useSettingsStore.getState().setNotify(side, kind, on)
  await refreshNotifications().catch(() => undefined)
}

// ─── Tin nhắn (chỉ giữa hai bên đã kết nối) ──────────────────────────────────

/** Hook: các cuộc trò chuyện, mới hoạt động nhất trước */
export function useConversations(): ConversationSummary[] {
  return useConnectionStore((s) => s.conversations)
}

const NO_MESSAGES: Message[] = []

/** Hook: tin nhắn của một cuộc trò chuyện, cũ trước mới sau; tải về lần đầu mở */
export function useMessages(jobId: string, seekerId: string): Message[] {
  const key = convKey(jobId, seekerId)
  const list = useConnectionStore((s) => s.messages[key])
  useEffect(() => {
    if (store().messages[key]) return
    api.get<Message[]>(`/conversations/${pairPath(jobId, seekerId)}/messages`, { params: { limit: 100 } })
      .then(({ data }) => setStore((s) => ({ messages: { ...s.messages, [key]: data.map(localize) } })))
      .catch((err) => toast.error(apiErrorMessage(err, 'Chưa tải được tin nhắn.')))
  }, [key, jobId, seekerId])
  return list ?? NO_MESSAGES
}

/** Hook: phía kia đang gõ trong cuộc trò chuyện này? */
export function useIsTyping(viewer: Side, jobId: string, seekerId: string) {
  return useConnectionStore((s) => {
    const who = s.typing[convKey(jobId, seekerId)]
    return !!who && who !== viewer
  })
}

/** Báo cho phía kia là mình đang gõ */
export const notifyTyping = (jobId: string, seekerId: string) => emitTyping(jobId, toServer(seekerId))

/** Hook: tổng số tin chưa đọc (cho nút tài khoản ở header) */
export function useUnreadMessages() {
  return useConnectionStore((s) => s.conversations.reduce((n, c) => n + c.unread, 0))
}

/** Gửi tin; trả về false nếu chưa gửi được để ô soạn giữ lại nội dung */
export async function sendMessage(_from: Side, jobId: string, seekerId: string, text: string): Promise<boolean> {
  try {
    const { data } = await api.post<Message>(`/conversations/${pairPath(jobId, seekerId)}/messages`, { text })
    onMessage(data)
    return true
  } catch (err) {
    toast.error(apiErrorMessage(err, 'Chưa gửi được tin nhắn, vui lòng thử lại.'))
    return false
  }
}

export function markConversationRead(_viewer: Side, jobId: string, seekerId: string) {
  const key = convKey(jobId, seekerId)
  if (!store().conversations.find((c) => c.key === key)?.unread) return
  setStore((s) => ({ conversations: s.conversations.map((c) => (c.key === key ? { ...c, unread: 0 } : c)) }))
  void api.post(`/conversations/${pairPath(jobId, seekerId)}/read`).catch(() => undefined)
}

// ─── Lịch phỏng vấn ─────────────────────────────────────────────────────────

/** Hook: các buổi phỏng vấn (mọi trạng thái), sớm nhất trước */
export function useInterviews(): Interview[] {
  return useConnectionStore((s) => s.interviews)
}

/** Hook: buổi phỏng vấn đang hiệu lực (chờ xác nhận / đã xác nhận) của một cặp, nếu có */
export function useActiveInterview(jobId: string, seekerId: string): Interview | undefined {
  return useConnectionStore((s) =>
    s.interviews.find((iv) => iv.jobId === jobId && iv.seekerId === seekerId && (iv.status === 'pending' || iv.status === 'confirmed')),
  )
}

const IV_ERROR = 'Chưa cập nhật được lịch phỏng vấn, vui lòng thử lại.'

/** Doanh nghiệp mời phỏng vấn — chỉ khi đã kết nối; 1–3 khung giờ (ISO) */
export const inviteInterview = (input: Pick<Interview, 'jobId' | 'seekerId' | 'slots' | 'mode' | 'place' | 'note'>) =>
  void write(() => api.post('/interviews', { ...input, seekerId: toServer(input.seekerId) }), IV_ERROR)
/** Người tìm việc chọn một khung giờ trong lời mời */
export const confirmInterview = (id: string, slot: string) => void write(() => api.post(`/interviews/${id}/confirm`, { slot }), IV_ERROR)
export const declineInterview = (id: string) => void write(() => api.post(`/interviews/${id}/decline`), IV_ERROR)
export const cancelInterview = (id: string) => void write(() => api.post(`/interviews/${id}/cancel`), IV_ERROR)

// ─── Nhận việc → xác nhận đi làm ────────────────────────────────────────────

/** Hook: bản ghi nhận việc của một cặp (jobId + seekerId), nếu có */
export function useHire(jobId: string, seekerId: string): Hire | undefined {
  return useConnectionStore((s) => s.hires.find((h) => h.jobId === jobId && h.seekerId === seekerId))
}

/** Hook: mọi bản ghi nhận việc, mới cập nhật trước */
export function useHires(): Hire[] {
  return useConnectionStore((s) => s.hires)
}

const HIRE_ERROR = 'Chưa cập nhật được quyết định nhận việc, vui lòng thử lại.'

/** Doanh nghiệp mời nhận việc — chỉ khi đã kết nối và cặp chưa có bản ghi nhận việc */
export const offerJob = (input: { jobId: string; seekerId: string; startDate: string; note?: string }) =>
  void write(() => api.post('/hires/offer', { ...input, seekerId: toServer(input.seekerId) }), HIRE_ERROR)
/** Doanh nghiệp không nhận (kèm lý do không bắt buộc) */
export const rejectCandidate = (jobId: string, seekerId: string, reason?: string) =>
  void write(() => api.post(`/hires/${pairPath(jobId, seekerId)}/reject`, { reason }), HIRE_ERROR)
/** Doanh nghiệp rút lời mời khi còn chờ */
export const withdrawOffer = (jobId: string, seekerId: string) => void write(() => api.post(`/hires/${pairPath(jobId, seekerId)}/withdraw`), HIRE_ERROR)
/** Người tìm việc xác nhận đi làm — lúc này cặp mới tính là "đã đi làm" */
export const acceptOffer = (jobId: string, seekerId: string) => void write(() => api.post(`/hires/${pairPath(jobId, seekerId)}/accept`), HIRE_ERROR)
export const declineOffer = (jobId: string, seekerId: string, reason?: string) =>
  void write(() => api.post(`/hires/${pairPath(jobId, seekerId)}/decline`, { reason }), HIRE_ERROR)

// ─── Đánh giá hai chiều sau khi đi làm ──────────────────────────────────────

/** Một đánh giá hiển thị công khai: tên người viết do máy chủ đã rút gọn */
export interface ReviewItem {
  jobId: string
  stars: number
  tags: string[]
  comment?: string
  at: string
  authorName: string
}

/** Hook: đánh giá `from` đã gửi cho một cặp, nếu có */
export function useReview(jobId: string, seekerId: string, from: Side): Review | undefined {
  return useConnectionStore((s) => s.reviews.find((r) => r.jobId === jobId && r.seekerId === seekerId && r.from === from))
}

/** Tải danh sách đánh giá; `count` đổi (vừa có đánh giá mới) thì tải lại. `path` rỗng = không tải */
function useReviewList(path: string | null): ReviewItem[] {
  const [items, setItems] = useState<ReviewItem[]>([])
  const count = useConnectionStore((s) => s.reviews.length)
  useEffect(() => {
    if (!path) { setItems([]); return }
    let alive = true
    api.get<ReviewItem[]>(path)
      .then(({ data }) => { if (alive) setItems(data) })
      .catch(() => { if (alive) setItems([]) })
    return () => { alive = false }
  }, [path, count])
  return items
}

/** Hook: đánh giá từ người đã làm về một công ty (ai cũng xem được) */
export const useCompanyReviews = (companyId: string) => useReviewList(companyId ? `/reviews/companies/${encodeURIComponent(companyId)}` : null)

/** Hook: đánh giá từ doanh nghiệp về một người tìm việc (khách không có quyền xem) */
export function useSeekerReviews(seekerId: string) {
  const loggedIn = useAuthStore((s) => !!s.token)
  return useReviewList(loggedIn ? `/reviews/seekers/${encodeURIComponent(toServer(seekerId))}` : null)
}

/** Điểm trung bình (1 số lẻ) và số lượng của một nhóm đánh giá */
export function reviewStats(list: { stars: number }[]): { average: number; count: number } {
  const count = list.length
  return { average: count ? Math.round((list.reduce((n, r) => n + r.stars, 0) / count) * 10) / 10 : 0, count }
}

/** Gửi đánh giá — máy chủ kiểm tra đã tới ngày đi làm và chưa đánh giá */
export const submitReview = (input: { jobId: string; seekerId: string; from: Side; stars: number; tags: string[]; comment?: string }) => {
  const { jobId, seekerId, stars, tags, comment } = input
  void write(() => api.post('/reviews', { jobId, seekerId: toServer(seekerId), stars, tags, comment: comment?.trim() || undefined }), 'Chưa gửi được đánh giá, vui lòng thử lại.')
}

// ─── Danh sách cho dashboard ────────────────────────────────────────────────

export interface PairItem {
  jobId: string
  seekerId: string
  /** Lúc mình bày tỏ quan tâm (hoặc lúc kết nối nếu phía kia quan tâm trước) */
  at: string
  status: Exclude<PairStatus, 'none'>
}

/** Hook: mọi cặp mà mình đã quan tâm, phía kia đã quan tâm mình, hoặc đã kết nối — mới nhất trước */
export function useMyPairs(viewer: Side): PairItem[] {
  const interests = useConnectionStore((s) => s.interests)
  const connections = useConnectionStore((s) => s.connections)
  const status = usePairStatuses(viewer)
  const seen = new Map<string, PairItem>()
  for (const i of interests) {
    const k = convKey(i.jobId, i.seekerId)
    const st = status(i.jobId, i.seekerId)
    if (st === 'none') continue
    const prev = seen.get(k)
    // Giữ thời điểm của chính mình nếu có, không thì thời điểm sớm nhất
    const at = i.from === viewer || !prev ? i.at : prev.at
    seen.set(k, { jobId: i.jobId, seekerId: i.seekerId, at, status: st })
  }
  for (const c of connections) {
    const k = convKey(c.jobId, c.seekerId)
    if (!seen.has(k)) seen.set(k, { jobId: c.jobId, seekerId: c.seekerId, at: c.at, status: 'connected' })
  }
  return [...seen.values()].sort((a, b) => b.at.localeCompare(a.at))
}
