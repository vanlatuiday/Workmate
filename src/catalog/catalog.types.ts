// Kiểu dữ liệu trả về / nhận vào cho tin tuyển dụng & doanh nghiệp.
// Tên trường giữ y hệt frontend (DiscoverCompany, MatchJob, PostedJob ở adminStore).

/** Ảnh minh họa: id Unsplash (như frontend) hoặc URL đã tải lên */
export interface CatalogPhoto {
  id?: string
  url?: string
  alt: string
}

/** Kiểu loại việc dùng ở frontend (trong DB là enum JobType) */
export type JobTypeLabel = 'full-time' | 'part-time' | 'shift' | 'seasonal' | 'flexible' | 'event' | 'freelance'
export type JobOpenStatus = 'open' | 'paused' | 'closed'
export type ModerationLabel = 'pending' | 'approved' | 'rejected' | 'hidden'

/** = DiscoverCompany (frontend) + trạng thái xác minh / khóa */
export interface CatalogCompany {
  id: string
  name: string
  industry: string
  district: string
  /** '1-10' | '11-50' | '51-200' | '201-500' | '500+' */
  size: string
  cover: CatalogPhoto
  more?: CatalogPhoto
  tagline: string
  /** Chưa có cột trong DB → luôn '' */
  why: string
  about: string
  environment: string[]
  verified: boolean
  locked: boolean
  /** Logo đã tải lên; null → frontend hiện chữ cái đầu */
  logoUrl: string | null
  /** Doanh nghiệp đã tắt "Công khai trang công ty"; các tin vẫn hiện bình thường */
  hidden?: boolean
}

/** = MatchJob (frontend) + phần của PostedJob + trạng thái */
export interface CatalogJob {
  id: string
  companyId: string
  title: string
  district: string
  /** km tới người xem (người tìm việc có tọa độ) hoặc tới trung tâm Hải Châu */
  distanceKm: number
  salaryLabel: string
  shiftLabel: string
  photo: CatalogPhoto
  skills: string[]
  /** Kỹ năng bắt buộc (tập con của skills) */
  requiredSkills: string[]
  /** Ứng viên phải rảnh đủ mọi ca */
  requireAllSlots: boolean
  slots: string[]
  salaryMinK: number
  salaryMaxK: number
  jobType: JobTypeLabel
  description: string
  quantity: number
  radiusKm: number
  /** ISO */
  postedAt: string
  /** ISO; quá hạn thì tin tự đóng. Không có = không hết hạn (tin cũ) */
  expiresAt?: string
  status: JobOpenStatus
  moderation: ModerationLabel
  moderationReason?: string
  /** Đã duyệt + đang mở + công ty không bị khóa (giống `visible()` ở frontend) */
  visible: boolean
  /** Lượt xem — chỉ có khi người xem là công ty đăng tin hoặc admin */
  views?: number
}

export interface CatalogResponse {
  companies: CatalogCompany[]
  jobs: CatalogJob[]
}

/** Một dòng ở trang quản trị: tin + cờ tự động + công ty có bị khóa không */
export interface AdminJobRow {
  job: CatalogJob
  flags: string[]
  companyLocked: boolean
}

export interface SystemConfigDto {
  weights: { skills: number; schedule: number; salary: number; distance: number; jobType: number }
  bannedWords: string[]
  minWageK: number
  defaultRadiusKm: number
  registrationOpen: boolean
}

/** Phần cấu hình công khai (frontend chấm điểm + trang đăng ký cần) */
export type PublicConfig = Pick<SystemConfigDto, 'weights' | 'minWageK' | 'defaultRadiusKm' | 'registrationOpen'>
