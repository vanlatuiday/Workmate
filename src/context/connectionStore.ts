import { create } from 'zustand'

// KHO KẾT NỐI (không lưu localStorage) — bản sao dữ liệu của tài khoản đang đăng nhập, nạp từ máy chủ và
// cập nhật qua socket. Máy chủ đã lọc đúng phạm vi nên mọi thứ ở đây đều "của tôi" (admin: toàn hệ thống).
// Đọc/ghi qua `@services/connectionService`; chỉ các trang số liệu đọc thẳng để lấy danh sách thô.

/** Phía bày tỏ quan tâm */
export type Side = 'seeker' | 'recruiter'

/**
 * Bí danh của người tìm việc đang đăng nhập. Giao diện luôn dùng ME thay cho id thật;
 * `connectionService` dịch qua lại khi nói chuyện với máy chủ.
 */
export const ME = 'me'

export interface Interest {
  /** Phía bày tỏ */
  from: Side
  /** Vị trí: m1…m13 (công ty mẫu) hoặc j1…j4 (tin của doanh nghiệp demo) */
  jobId: string
  /** Người tìm việc: 'me' hoặc u1…u20 (ứng viên mẫu) */
  seekerId: string
  at: string
  /** Chỉ đơn của người tìm việc: doanh nghiệp đã mở xem */
  viewedAt?: string
  /** Chỉ đơn của người tìm việc: doanh nghiệp báo đang cân nhắc */
  consideringAt?: string
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
  /**
   * interest = phía kia vừa quan tâm · considering = doanh nghiệp đang cân nhắc đơn · connected = hai bên vừa kết nối ·
   * interview_invited = doanh nghiệp mời phỏng vấn · interview_confirmed / interview_declined =
   * người tìm việc chọn giờ / từ chối · interview_cancelled = doanh nghiệp hủy ·
   * offer = doanh nghiệp mời nhận việc · offer_accepted / offer_declined = người tìm việc xác nhận đi làm / từ chối ·
   * offer_withdrawn = doanh nghiệp rút lời mời · rejected = doanh nghiệp không nhận ·
   * review = phía kia vừa gửi đánh giá sau khi đi làm
   */
  kind:
    | 'interest' | 'considering' | 'connected' | 'interview_invited' | 'interview_confirmed' | 'interview_declined' | 'interview_cancelled'
    | 'offer' | 'offer_accepted' | 'offer_declined' | 'offer_withdrawn' | 'rejected' | 'review'
  jobId: string
  seekerId: string
  at: string
  read: boolean
}

export type InterviewMode = 'onsite' | 'online'
export type InterviewStatus = 'pending' | 'confirmed' | 'declined' | 'cancelled'

export interface Interview {
  id: string
  jobId: string
  seekerId: string
  /** Các khung giờ doanh nghiệp đề xuất (ISO), 1–3 lựa chọn */
  slots: string[]
  /** Khung giờ người tìm việc đã chọn (khi confirmed) */
  chosen?: string
  mode: InterviewMode
  /** Địa chỉ (trực tiếp) hoặc ghi chú cuộc gọi (online) */
  place: string
  note?: string
  status: InterviewStatus
  createdAt: string
}

/**
 * Nhận việc: offered (chờ ứng viên) → accepted (đã đi làm) | declined (ứng viên từ chối) | withdrawn (doanh nghiệp rút);
 * rejected = doanh nghiệp "Không nhận". Mỗi cặp tối đa một bản ghi; đã sang trạng thái cuối thì không đổi nữa.
 */
export type HireStatus = 'offered' | 'accepted' | 'declined' | 'withdrawn' | 'rejected'

export interface Hire {
  jobId: string
  seekerId: string
  status: HireStatus
  /** Ngày bắt đầu làm (YYYY-MM-DD) — có khi đã mời nhận việc */
  startDate?: string
  /** Lời nhắn của doanh nghiệp kèm lời mời */
  note?: string
  /** Lý do (doanh nghiệp không nhận / ứng viên từ chối), không bắt buộc */
  reason?: string
  /** Lúc tạo bản ghi */
  at: string
  /** Lúc đổi trạng thái gần nhất */
  updatedAt: string
}

/**
 * Đánh giá hai chiều sau khi đi làm. `from` = phía viết: seeker → đánh giá công ty (của tin `jobId`),
 * recruiter → đánh giá người tìm việc. Mỗi (jobId, seekerId, from) chỉ một đánh giá, gửi rồi không sửa.
 */
export interface Review {
  jobId: string
  seekerId: string
  from: Side
  /** 1–5 sao */
  stars: number
  /** Thẻ nhanh (tối đa 3) */
  tags: string[]
  comment?: string
  at: string
}

export const REVIEW_MAX_TAGS = 3
export const REVIEW_MAX_COMMENT = 300

export interface Message {
  id: string
  jobId: string
  seekerId: string
  /** Phía gửi */
  from: Side
  text: string
  at: string
  /** Dòng thông báo trong cuộc trò chuyện (vd. "Đã gửi lời mời phỏng vấn") — hiện giữa khung, không phải bong bóng */
  system?: boolean
}

/** Khóa một cuộc trò chuyện = một kết nối (vị trí + người tìm việc) */
export const convKey = (jobId: string, seekerId: string) => `${jobId}|${seekerId}`

export interface ConversationSummary extends Connection {
  key: string
  jobTitle: string
  /** Phía kia của cuộc trò chuyện */
  peer: { name: string; avatarUrl?: string | null; companyId?: string }
  last?: Message
  unread: number
}

interface ConnectionState {
  /** Đã nạp xong lần đầu — trước đó danh sách trống chưa có nghĩa là "không có gì" */
  hydrated: boolean
  interests: Interest[]
  connections: Connection[]
  notifications: DemoNotification[]
  conversations: ConversationSummary[]
  /** Tin nhắn đã tải, theo convKey */
  messages: Record<string, Message[]>
  interviews: Interview[]
  hires: Hire[]
  reviews: Review[]
  /** Phía kia đang gõ — convKey → phía đang gõ */
  typing: Record<string, Side | undefined>
  clear: () => void
}

const EMPTY = {
  hydrated: false,
  interests: [] as Interest[],
  connections: [] as Connection[],
  notifications: [] as DemoNotification[],
  conversations: [] as ConversationSummary[],
  messages: {} as Record<string, Message[]>,
  interviews: [] as Interview[],
  hires: [] as Hire[],
  reviews: [] as Review[],
  typing: {} as Record<string, Side | undefined>,
}

export const useConnectionStore = create<ConnectionState>()((set) => ({
  ...EMPTY,
  clear: () => set(EMPTY),
}))
