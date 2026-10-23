// Dữ liệu mẫu — thay bằng API. Tên, email, mã số thuế đều là giả.
import type { CompanySize, UserRole } from '@/types'

// ─── Người dùng ──────────────────────────────────────────────────────────────
export type UserStatus = 'active' | 'unverified' | 'locked'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: UserRole
  joinedAt: string // hiển thị trực tiếp (dd/MM/yyyy)
  status: UserStatus
  /** Trạng thái trước khi bị khóa, để mở khóa trả về đúng (vd chưa xác minh email) */
  prevStatus?: Exclude<UserStatus, 'locked'>
  lastActive: string
}

export const ROLE_LABELS: Record<UserRole, string> = {
  jobseeker: 'Người tìm việc',
  recruiter: 'Nhà tuyển dụng',
  admin: 'Quản trị viên',
}

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  active: 'Hoạt động',
  unverified: 'Chưa xác minh email',
  locked: 'Đã khóa',
}

export const mockUsers: AdminUser[] = [
  { id: 'u1', name: 'Nguyễn Minh Anh', email: 'minhanh.mau@example.com', role: 'jobseeker', joinedAt: '21/10/2026', status: 'active', lastActive: '2 giờ trước' },
  { id: 'u2', name: 'Trần Quốc Bảo', email: 'quocbao.mau@example.com', role: 'jobseeker', joinedAt: '20/10/2026', status: 'unverified', lastActive: '1 ngày trước' },
  { id: 'u3', name: 'Quán Cà Phê Mẫu Hải Châu', email: 'tuyendung@cafemau.example.com', role: 'recruiter', joinedAt: '19/10/2026', status: 'active', lastActive: '30 phút trước' },
  { id: 'u4', name: 'Lê Thu Hà', email: 'thuha.mau@example.com', role: 'jobseeker', joinedAt: '18/10/2026', status: 'active', lastActive: 'Hôm qua' },
  { id: 'u5', name: 'Phạm Gia Huy', email: 'giahuy.mau@example.com', role: 'jobseeker', joinedAt: '15/10/2026', status: 'locked', lastActive: '6 ngày trước' },
  { id: 'u6', name: 'Công ty Sự Kiện Mẫu Sơn Trà', email: 'hr@sukienmau.example.com', role: 'recruiter', joinedAt: '12/10/2026', status: 'active', lastActive: '3 giờ trước' },
  { id: 'u7', name: 'Võ Khánh Linh', email: 'khanhlinh.mau@example.com', role: 'jobseeker', joinedAt: '09/10/2026', status: 'active', lastActive: '4 ngày trước' },
  { id: 'u8', name: 'Đặng Thanh Tùng', email: 'thanhtung.mau@example.com', role: 'jobseeker', joinedAt: '03/10/2026', status: 'unverified', lastActive: '3 tuần trước' },
  { id: 'u9', name: 'Siêu Thị Mini Mẫu Liên Chiểu', email: 'nhansu@minimau.example.com', role: 'recruiter', joinedAt: '28/09/2026', status: 'unverified', lastActive: '2 ngày trước' },
  { id: 'u10', name: 'Hoàng Mỹ Duyên', email: 'myduyen.mau@example.com', role: 'jobseeker', joinedAt: '22/09/2026', status: 'active', lastActive: '5 giờ trước' },
  { id: 'u11', name: 'Admin Mẫu 1', email: 'admin1@example.com', role: 'admin', joinedAt: '01/06/2026', status: 'active', lastActive: 'Đang hoạt động' },
  { id: 'u12', name: 'Bùi Anh Khoa', email: 'anhkhoa.mau@example.com', role: 'jobseeker', joinedAt: '14/08/2026', status: 'locked', lastActive: '2 tháng trước' },
]

// ─── Xác minh doanh nghiệp ───────────────────────────────────────────────────
export type VerificationStatus = 'pending' | 'approved' | 'rejected'

export interface VerificationRequest {
  id: string
  companyName: string
  industry: string
  size: CompanySize
  address: string
  taxCode: string
  contactPerson: string
  contactEmail: string
  submittedAt: string
  documents: string[] // tên file đã nộp
  status: VerificationStatus
  rejectReason?: string
}

export const mockVerifications: VerificationRequest[] = [
  {
    id: 'v1', companyName: 'Nhà Hàng Hải Sản Mẫu Mỹ Khê', industry: 'Nhà hàng / Khách sạn', size: '51-200',
    address: '12 Đường Mẫu, P. Phước Mỹ, Q. Sơn Trà, Đà Nẵng', taxCode: '0400000001 (giả)',
    contactPerson: 'Nguyễn Văn Mẫu', contactEmail: 'lienhe@haisanmau.example.com', submittedAt: '23/10/2026',
    documents: ['giay-phep-kinh-doanh.pdf', 'cccd-nguoi-dai-dien.jpg'], status: 'pending',
  },
  {
    id: 'v2', companyName: 'Cà Phê Mẫu Hải Châu', industry: 'Nhà hàng / Khách sạn', size: '11-50',
    address: '45 Đường Thử Nghiệm, P. Hải Châu 1, Q. Hải Châu, Đà Nẵng', taxCode: '0400000002 (giả)',
    contactPerson: 'Trần Thị Thử', contactEmail: 'cafemau@example.com', submittedAt: '23/10/2026',
    documents: ['giay-phep-kinh-doanh.pdf', 'hop-dong-thue-mat-bang.pdf', 'cccd-chu-quan.jpg'], status: 'pending',
  },
  {
    id: 'v3', companyName: 'Công Ty Công Nghệ Mẫu Thanh Khê', industry: 'Công nghệ thông tin', size: '1-10',
    address: '88 Đường Giả Lập, P. Thanh Khê Đông, Q. Thanh Khê, Đà Nẵng', taxCode: '0400000003 (giả)',
    contactPerson: 'Lê Hoàng Giả', contactEmail: 'hello@congnghemau.example.com', submittedAt: '22/10/2026',
    documents: ['dang-ky-doanh-nghiep.pdf'], status: 'pending',
  },
  {
    id: 'v4', companyName: 'Siêu Thị Mini Mẫu Liên Chiểu', industry: 'Bán lẻ', size: '11-50',
    address: '5 Đường Mô Phỏng, P. Hòa Khánh Bắc, Q. Liên Chiểu, Đà Nẵng', taxCode: '0400000004 (giả)',
    contactPerson: 'Phạm Thị Mô Phỏng', contactEmail: 'nhansu@minimau.example.com', submittedAt: '21/10/2026',
    documents: ['giay-phep-kinh-doanh.pdf', 'cccd-nguoi-dai-dien.jpg'], status: 'pending',
  },
  {
    id: 'v5', companyName: 'Công Ty Sự Kiện Mẫu Sơn Trà', industry: 'Tổ chức sự kiện', size: '51-200',
    address: '70 Đường Ví Dụ, P. An Hải Bắc, Q. Sơn Trà, Đà Nẵng', taxCode: '0400000005 (giả)',
    contactPerson: 'Võ Minh Ví Dụ', contactEmail: 'hr@sukienmau.example.com', submittedAt: '12/10/2026',
    documents: ['giay-phep-kinh-doanh.pdf', 'cccd-nguoi-dai-dien.jpg'], status: 'approved',
  },
  {
    id: 'v6', companyName: 'Kho Vận Mẫu Cẩm Lệ', industry: 'Vận chuyển / Giao hàng', size: '201-500',
    address: '300 Đường Tạm, P. Hòa Thọ Tây, Q. Cẩm Lệ, Đà Nẵng', taxCode: '0400000006 (giả)',
    contactPerson: 'Đặng Văn Tạm', contactEmail: 'vanhanh@khovanmau.example.com', submittedAt: '10/10/2026',
    documents: ['giay-phep-kinh-doanh.pdf'], status: 'approved',
  },
  {
    id: 'v7', companyName: 'Cửa Hàng Mẫu Ngũ Hành Sơn', industry: 'Bán lẻ', size: '1-10',
    address: '19 Đường Nháp, P. Mỹ An, Q. Ngũ Hành Sơn, Đà Nẵng', taxCode: '0400000007 (giả)',
    contactPerson: 'Bùi Thị Nháp', contactEmail: 'cuahangmau@example.com', submittedAt: '08/10/2026',
    documents: ['anh-chup-bang-hieu.jpg'], status: 'rejected',
    rejectReason: 'Giấy tờ nộp không phải giấy phép kinh doanh, vui lòng bổ sung.',
  },
]

// ─── Tổng quan ───────────────────────────────────────────────────────────────
export const overviewStats = {
  totalUsers: 14230,
  usersHint: '+12% so với tuần trước',
  pendingVerifications: 4,
  verificationHint: '+1 so với tuần trước',
  pendingModeration: 9,
  moderationHint: '-3 so với tuần trước',
  weeklyMatches: 612,
  matchHint: '+8% so với tuần trước',
}

export interface TodoItem {
  id: string
  label: string
  detail: string
  href: string
}

export const todoItems: TodoItem[] = [
  { id: 't1', label: '4 hồ sơ doanh nghiệp chờ xác minh', detail: 'Cũ nhất gửi 21/10/2026', href: '/admin/xac-minh' },
  { id: 't2', label: '3 tin tuyển dụng bị báo cáo', detail: 'Nghi ngờ tin giả, cần xem trong ngày', href: '/admin/kiem-duyet' },
  { id: 't3', label: '6 tin mới chờ kiểm duyệt', detail: 'Từ nhà tuyển dụng chưa xác minh', href: '/admin/kiem-duyet' },
  { id: 't4', label: '2 tài khoản bị người dùng báo cáo', detail: 'Cần xem lại nội dung tin nhắn', href: '/admin/nguoi-dung' },
]

/** Số người dùng mới theo ngày, từ 17/10 đến 23/10/2026. */
export const newUsersPerDay = [
  { day: 'T7', date: '17/10', count: 54 },
  { day: 'CN', date: '18/10', count: 38 },
  { day: 'T2', date: '19/10', count: 91 },
  { day: 'T3', date: '20/10', count: 87 },
  { day: 'T4', date: '21/10', count: 103 },
  { day: 'T5', date: '22/10', count: 96 },
  { day: 'T6', date: '23/10', count: 71 },
]
