// Kiểu dữ liệu trang cá nhân (ứng viên + doanh nghiệp). Khi có API, giữ nguyên các kiểu này làm hợp đồng dữ liệu.

export type WorkMode = 'onsite' | 'remote' | 'hybrid'

export const WORK_MODE_LABELS: Record<WorkMode, string> = {
  onsite: 'Tại văn phòng',
  remote: 'Từ xa',
  hybrid: 'Kết hợp',
}

/** Mức thành thạo 1–5 */
export type Level = 1 | 2 | 3 | 4 | 5

export const LEVEL_LABELS: Record<Level, string> = {
  1: 'Mới làm quen',
  2: 'Cơ bản',
  3: 'Thành thạo',
  4: 'Vững',
  5: 'Chuyên sâu',
}

export interface SeekerSkill {
  id: string
  name: string
  level: Level
}

export interface SeekerExperience {
  id: string
  company: string
  role: string
  /** "YYYY-MM" */
  start: string
  /** "YYYY-MM"; bỏ trống = hiện tại */
  end?: string
  summary: string
}

export interface SeekerProject {
  id: string
  name: string
  summary: string
  tech: string[]
}

export interface SeekerEducation {
  id: string
  school: string
  degree: string
  year: number
}

export interface SeekerCertificate {
  id: string
  name: string
  issuer: string
  year: number
}

/** Mục nhạy cảm có thể ẩn với người xem */
export type PrivateField = 'email' | 'phone' | 'salary' | 'currentCompany'

export const PRIVATE_FIELD_LABELS: Record<PrivateField, string> = {
  email: 'Email',
  phone: 'Số điện thoại',
  salary: 'Mức lương mong muốn',
  currentCompany: 'Công ty hiện tại',
}

export interface SeekerProfile {
  name: string
  /** Chữ viết tắt trong ảnh đại diện (không dùng ảnh mặt thật trong dữ liệu mẫu) */
  initials: string
  title: string
  years: number
  bio: string
  /** "YYYY-MM-DD" */
  availableFrom: string
  currentCompany: string
  skills: SeekerSkill[]
  experience: SeekerExperience[]
  wishes: {
    /** triệu đồng / tháng */
    salaryMin: number
    salaryMax: number
    locations: string[]
    modes: WorkMode[]
  }
  projects: SeekerProject[]
  education: SeekerEducation[]
  certificates: SeekerCertificate[]
  contact: { email: string; phone: string }
  /** true = hiện với người xem */
  visibility: Record<PrivateField, boolean>
}

export interface CompanyPosition {
  id: string
  title: string
  skills: string[]
  /** triệu đồng / tháng */
  salaryMin: number
  salaryMax: number
  mode: WorkMode
  location: string
}

export type BenefitIcon =
  | 'health'
  | 'laptop'
  | 'learning'
  | 'bonus'
  | 'vacation'
  | 'remote'
  | 'meal'
  | 'team'

export const BENEFIT_ICON_LABELS: Record<BenefitIcon, string> = {
  health: 'Sức khỏe',
  laptop: 'Thiết bị',
  learning: 'Học tập',
  bonus: 'Thưởng',
  vacation: 'Nghỉ phép',
  remote: 'Làm từ xa',
  meal: 'Ăn uống',
  team: 'Hoạt động nhóm',
}

export interface CompanyBenefit {
  id: string
  icon: BenefitIcon
  label: string
}

export interface CompanyProfile {
  name: string
  /** Chữ trong logo */
  logoText: string
  industry: string
  size: string
  founded: number
  mission: string
  /** Thường phản hồi trong N ngày */
  responseDays: number
  positions: CompanyPosition[]
  culture: { id: string; title: string; text: string }[]
  benefits: CompanyBenefit[]
  day: { id: string; time: string; text: string }[]
  address: string
  contact: { email: string; phone: string; website: string }
}

export type ProfileKind = 'seeker' | 'company'
