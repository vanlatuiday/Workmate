export const JOB_TYPES = [
  { value: 'full-time',  label: 'Toàn thời gian' },
  { value: 'part-time',  label: 'Bán thời gian' },
  { value: 'shift',      label: 'Theo ca' },
  { value: 'seasonal',   label: 'Thời vụ' },
  { value: 'flexible',   label: 'Linh hoạt' },
  { value: 'event',      label: 'Sự kiện' },
  { value: 'freelance',  label: 'Cộng tác viên' },
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

export * from './demoAccounts'
export * from './roles'
/** Khu vực đang dùng chung trong hồ sơ công ty và bộ lọc việc làm. */
export const DANANG_DISTRICTS = ['Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn', 'Liên Chiểu', 'Cẩm Lệ', 'Hòa Vang']
