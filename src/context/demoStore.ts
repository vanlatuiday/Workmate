import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// KHO DỮ LIỆU DEMO DÙNG CHUNG — đóng vai backend tạm, lưu localStorage (key `workmate-demo`).
// Mọi trang đọc/ghi qua đây (thông qua `@services/connectionService`) để hai phía thấy cùng một dữ liệu:
// người tìm việc ứng tuyển → doanh nghiệp thấy; hai bên cùng quan tâm → thành kết nối + thông báo.
// Khi có backend, thay ruột `connectionService` bằng API thật, giao diện giữ nguyên.

/** Phía bày tỏ quan tâm */
export type Side = 'seeker' | 'recruiter'

/** Người tìm việc của tài khoản demo admin1 (hồ sơ PROFILE_DEFAULT) */
export const ME = 'me'

export interface Interest {
  /** Phía bày tỏ */
  from: Side
  /** Vị trí: m1…m13 (công ty mẫu) hoặc j1…j4 (tin của doanh nghiệp demo) */
  jobId: string
  /** Người tìm việc: 'me' hoặc u1…u20 (ứng viên mẫu) */
  seekerId: string
  at: string
}

export interface Connection {
  jobId: string
  seekerId: string
  at: string
}

export interface DemoNotification {
  id: string
  /** Gửi tới phía nào */
  to: Side
  /** interest = phía kia vừa quan tâm; connected = hai bên vừa kết nối */
  kind: 'interest' | 'connected'
  jobId: string
  seekerId: string
  at: string
  read: boolean
}

export interface Message {
  id: string
  jobId: string
  seekerId: string
  /** Phía gửi */
  from: Side
  text: string
  at: string
}

/** Khóa một cuộc trò chuyện = một kết nối (vị trí + người tìm việc) */
export const convKey = (jobId: string, seekerId: string) => `${jobId}|${seekerId}`

/** Câu trả lời mẫu khi giả lập phía bên kia nhắn lại (lần lượt theo số tin đã có) */
const CANNED: Record<Side, string[]> = {
  // doanh nghiệp trả lời người tìm việc
  recruiter: [
    'Chào bạn, cảm ơn đã kết nối với bên mình! Bạn có thể đi làm thử vào tuần sau không?',
    'Ca bên mình bắt đầu lúc 17:00, mỗi ca khoảng 5 tiếng. Bạn thấy ổn chứ?',
    'Tuyệt quá. Mình sẽ gửi lịch phỏng vấn cho bạn sớm nhé.',
    'Bạn cứ hỏi thêm nếu cần, mình trả lời trong ngày.',
  ],
  // người tìm việc trả lời doanh nghiệp
  seeker: [
    'Dạ em chào anh/chị, em cảm ơn đã quan tâm hồ sơ của em ạ.',
    'Dạ em rảnh các buổi tối trong tuần và cả ngày cuối tuần ạ.',
    'Dạ được ạ, em có thể đến phỏng vấn vào chiều thứ 7.',
    'Em cảm ơn anh/chị nhiều ạ!',
  ],
}
const REPLY_MS = 2600

/** Tin của doanh nghiệp demo (admin2) — chỉ những tin này doanh nghiệp đáp lại được */
export const RECRUITER_JOBS = ['j1', 'j2', 'j3', 'j4']

/**
 * Giả lập phía bên kia (chỉ có một trình duyệt nên không có người thật đáp lại):
 * - người tìm việc ứng tuyển các vị trí này → vài giây sau doanh nghiệp quan tâm lại;
 * - doanh nghiệp quan tâm các ứng viên mẫu này → vài giây sau ứng viên đáp lại.
 */
const AUTO_REPLY_JOBS = new Set(['m3', 'm8', 'm11', 'j2', 'j4'])
const AUTO_REPLY_SEEKERS = new Set(['u2', 'u7', 'u11', 'u17'])
const AUTO_REPLY_MS = 3500

const now = () => new Date().toISOString()
let seq = 0
const nid = () => `n${Date.now().toString(36)}${(seq++).toString(36)}`

const key = (jobId: string, seekerId: string) => `${jobId}|${seekerId}`

/** Dữ liệu ban đầu: đủ để các tab không trống và thấy được cả hai chiều */
function seed() {
  const t = (minutesAgo: number) => new Date(Date.now() - minutesAgo * 60_000).toISOString()
  const interests: Interest[] = [
    // Ứng viên mẫu đã ứng tuyển tin của doanh nghiệp demo
    { from: 'seeker', jobId: 'j1', seekerId: 'u1', at: t(300) },
    { from: 'seeker', jobId: 'j2', seekerId: 'u6', at: t(240) },
    { from: 'seeker', jobId: 'j4', seekerId: 'u16', at: t(180) },
    // Doanh nghiệp quan tâm hồ sơ của người tìm việc demo (chờ bạn đáp lại)
    { from: 'recruiter', jobId: 'j1', seekerId: ME, at: t(120) },
    { from: 'recruiter', jobId: 'm6', seekerId: ME, at: t(90) },
    // Một kết nối có sẵn
    { from: 'seeker', jobId: 'm1', seekerId: ME, at: t(1500) },
    { from: 'recruiter', jobId: 'm1', seekerId: ME, at: t(1440) },
  ]
  const connections: Connection[] = [{ jobId: 'm1', seekerId: ME, at: t(1440) }]
  const notifications: DemoNotification[] = [
    { id: 'n-seed-1', to: 'seeker', kind: 'interest', jobId: 'j1', seekerId: ME, at: t(120), read: false },
    { id: 'n-seed-2', to: 'seeker', kind: 'interest', jobId: 'm6', seekerId: ME, at: t(90), read: false },
    { id: 'n-seed-3', to: 'seeker', kind: 'connected', jobId: 'm1', seekerId: ME, at: t(1440), read: true },
    { id: 'n-seed-4', to: 'recruiter', kind: 'interest', jobId: 'j1', seekerId: 'u1', at: t(300), read: false },
    { id: 'n-seed-5', to: 'recruiter', kind: 'interest', jobId: 'j2', seekerId: 'u6', at: t(240), read: false },
    { id: 'n-seed-6', to: 'recruiter', kind: 'interest', jobId: 'j4', seekerId: 'u16', at: t(180), read: true },
  ]
  const messages: Message[] = [
    { id: 'msg-seed-1', jobId: 'm1', seekerId: ME, from: 'recruiter', text: CANNED.recruiter[0], at: t(1430) },
    { id: 'msg-seed-2', jobId: 'm1', seekerId: ME, from: 'seeker', text: 'Dạ em đi được ạ. Em nên đến lúc mấy giờ ạ?', at: t(1420) },
    { id: 'msg-seed-3', jobId: 'm1', seekerId: ME, from: 'recruiter', text: CANNED.recruiter[1], at: t(60) },
  ]
  return { interests, connections, notifications, messages, lastRead: { [`seeker|${convKey('m1', ME)}`]: t(1420) } }
}

interface DemoState {
  interests: Interest[]
  connections: Connection[]
  notifications: DemoNotification[]
  messages: Message[]
  /** Lần cuối mỗi phía mở cuộc trò chuyện: `${side}|${convKey}` → thời điểm (đếm tin chưa đọc) */
  lastRead: Record<string, string>
  /** Phía kia đang gõ (không lưu) — convKey → phía đang gõ */
  typing: Record<string, Side | undefined>
  /** Gửi tin; chỉ gửi được khi hai bên đã kết nối. Giả lập phía kia gõ rồi trả lời. */
  sendMessage: (from: Side, jobId: string, seekerId: string, text: string) => void
  /** Đánh dấu đã đọc tới hiện tại */
  markConversationRead: (viewer: Side, jobId: string, seekerId: string) => void
  /** Bày tỏ quan tâm; hai bên cùng quan tâm → tạo kết nối + thông báo cả hai phía */
  expressInterest: (from: Side, jobId: string, seekerId: string) => void
  /** Rút quan tâm (chỉ khi chưa kết nối) */
  withdrawInterest: (from: Side, jobId: string, seekerId: string) => void
  markRead: (id: string) => void
  markAllRead: (to: Side) => void
  /** Đưa dữ liệu demo về ban đầu */
  reset: () => void
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set, get) => ({
      ...seed(),
      typing: {},

      expressInterest: (from, jobId, seekerId) => {
        const s = get()
        if (s.interests.some((i) => i.from === from && key(i.jobId, i.seekerId) === key(jobId, seekerId))) return
        const other: Side = from === 'seeker' ? 'recruiter' : 'seeker'
        const mutual = s.interests.some((i) => i.from === other && key(i.jobId, i.seekerId) === key(jobId, seekerId))
        const at = now()
        const notifications = [...s.notifications]
        if (mutual) {
          notifications.push(
            { id: nid(), to: 'seeker', kind: 'connected', jobId, seekerId, at, read: false },
            { id: nid(), to: 'recruiter', kind: 'connected', jobId, seekerId, at, read: false },
          )
        } else {
          // Phía kia chỉ nhận thông báo khi đó là phía của tài khoản demo (người tìm việc 'me' / tin j1–j4)
          const reachesDemoUser = other === 'seeker' ? seekerId === ME : RECRUITER_JOBS.includes(jobId)
          if (reachesDemoUser) notifications.push({ id: nid(), to: other, kind: 'interest', jobId, seekerId, at, read: false })
        }
        set({
          interests: [...s.interests, { from, jobId, seekerId, at }],
          connections: mutual ? [...s.connections, { jobId, seekerId, at }] : s.connections,
          notifications,
        })

        // Giả lập phía bên kia đáp lại sau vài giây
        if (!mutual) {
          const replies =
            (from === 'seeker' && seekerId === ME && AUTO_REPLY_JOBS.has(jobId)) ||
            (from === 'recruiter' && AUTO_REPLY_SEEKERS.has(seekerId))
          if (replies) window.setTimeout(() => get().expressInterest(other, jobId, seekerId), AUTO_REPLY_MS)
        }
      },

      withdrawInterest: (from, jobId, seekerId) => {
        const s = get()
        if (s.connections.some((c) => key(c.jobId, c.seekerId) === key(jobId, seekerId))) return
        set({ interests: s.interests.filter((i) => !(i.from === from && key(i.jobId, i.seekerId) === key(jobId, seekerId))) })
      },

      sendMessage: (from, jobId, seekerId, text) => {
        const body = text.trim()
        const k = convKey(jobId, seekerId)
        const s = get()
        if (!body || !s.connections.some((c) => convKey(c.jobId, c.seekerId) === k)) return
        const at = now()
        set({
          messages: [...s.messages, { id: nid(), jobId, seekerId, from, text: body, at }],
          lastRead: { ...s.lastRead, [`${from}|${k}`]: at },
        })
        // Giả lập phía kia: hiện "đang gõ" rồi trả lời một câu mẫu
        const other: Side = from === 'seeker' ? 'recruiter' : 'seeker'
        window.setTimeout(() => set((st) => ({ typing: { ...st.typing, [k]: other } })), 700)
        window.setTimeout(() => {
          const st = get()
          const sentByOther = st.messages.filter((m) => convKey(m.jobId, m.seekerId) === k && m.from === other).length
          const pool = CANNED[other]
          set({
            typing: { ...st.typing, [k]: undefined },
            messages: [...st.messages, { id: nid(), jobId, seekerId, from: other, text: pool[sentByOther % pool.length], at: now() }],
          })
        }, REPLY_MS)
      },

      markConversationRead: (viewer, jobId, seekerId) =>
        set((s) => ({ lastRead: { ...s.lastRead, [`${viewer}|${convKey(jobId, seekerId)}`]: now() } })),

      markRead: (id) => set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
      markAllRead: (to) => set((s) => ({ notifications: s.notifications.map((n) => (n.to === to ? { ...n, read: true } : n)) })),
      reset: () => set({ ...seed(), typing: {} }),
    }),
    { name: 'workmate-demo', version: 2,
      // v1 chưa có tin nhắn → bổ sung dữ liệu mẫu của tin nhắn
      migrate: (persisted, version) => {
        const p = persisted as Partial<DemoState>
        if (version < 2) {
          const fresh = seed()
          return { ...p, messages: fresh.messages, lastRead: fresh.lastRead } as DemoState
        }
        return p as DemoState
      },
      partialize: (s) => ({
        interests: s.interests,
        connections: s.connections,
        notifications: s.notifications,
        messages: s.messages,
        lastRead: s.lastRead,
      }) },
  ),
)
