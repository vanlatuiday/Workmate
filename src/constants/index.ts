export const JOB_TYPES = [
  { value: 'full-time',  label: 'Toàn thời gian' },
  { value: 'part-time',  label: 'Bán thời gian' },
  { value: 'shift',      label: 'Theo ca' },
  { value: 'seasonal',   label: 'Thời vụ' },
  { value: 'flexible',   label: 'Linh hoạt' },
  { value: 'event',      label: 'Sự kiện' },
  { value: 'freelance',  label: 'Cộng tác viên' },
] as const

export const SALARY_UNITS = [
  { value: 'hour',       label: 'Theo giờ' },
  { value: 'day',        label: 'Theo ngày' },
  { value: 'month',      label: 'Theo tháng' },
  { value: 'commission', label: 'Hoa hồng' },
  { value: 'negotiable', label: 'Thỏa thuận' },
] as const

export const INDUSTRIES = [
  'Bán hàng / Bán lẻ',
  'Nhà hàng / Cà phê / F&B',
  'Marketing / Truyền thông',
  'Công nghệ thông tin',
  'Giáo dục / Gia sư',
  'Vận chuyển / Giao hàng',
  'Chăm sóc khách hàng',
  'Tổ chức sự kiện',
  'Thiết kế / Sáng tạo',
  'Tài chính / Kế toán',
  'Y tế / Làm đẹp',
  'Khác',
] as const

export const COMPANY_SIZES = [
  { value: '1-10',    label: '1 – 10 nhân viên' },
  { value: '11-50',   label: '11 – 50 nhân viên' },
  { value: '51-200',  label: '51 – 200 nhân viên' },
  { value: '201-500', label: '201 – 500 nhân viên' },
  { value: '500+',    label: 'Trên 500 nhân viên' },
] as const

export const DAYS_OF_WEEK = [
  { value: 'mon', label: 'Thứ 2' },
  { value: 'tue', label: 'Thứ 3' },
  { value: 'wed', label: 'Thứ 4' },
  { value: 'thu', label: 'Thứ 5' },
  { value: 'fri', label: 'Thứ 6' },
  { value: 'sat', label: 'Thứ 7' },
  { value: 'sun', label: 'Chủ nhật' },
] as const

export const MATCH_WEIGHTS = {
  skills:     0.25,
  schedule:   0.20,
  location:   0.20,
  salary:     0.15,
  experience: 0.10,
  jobType:    0.05,
  aspiration: 0.05,
} as const

export const APPLICATION_STATUS_LABELS: Record<string, string> = {
  applied:          'Đã ứng tuyển',
  viewed:           'Nhà tuyển dụng đã xem',
  considering:      'Đang xem xét',
  interview_invited:'Mời phỏng vấn',
  hired:            'Đã nhận việc',
  rejected:         'Không phù hợp',
}
export * from './demoAccounts'
export * from './roles'
