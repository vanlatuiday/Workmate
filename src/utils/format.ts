import type { SalaryRange } from '@/types'

const SALARY_UNIT_LABEL: Record<string, string> = {
  hour:        '/giờ',
  day:         '/ngày',
  month:       '/tháng',
  commission:  '(hoa hồng)',
  negotiable:  '',
}

/** Số thứ tự 2 chữ số: 1 → "01". */
export const pad = (n: number) => String(n).padStart(2, '0')

export function formatSalary(salary: SalaryRange): string {
  if (salary.unit === 'negotiable') return 'Thỏa thuận'

  const unit = SALARY_UNIT_LABEL[salary.unit] ?? ''

  if (salary.min && salary.max) {
    return `${formatVND(salary.min)} – ${formatVND(salary.max)}${unit}`
  }
  if (salary.min) return `Từ ${formatVND(salary.min)}${unit}`
  if (salary.max) return `Đến ${formatVND(salary.max)}${unit}`
  return 'Thỏa thuận'
}

export function formatVND(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1)}tr`
  }
  return `${(amount / 1_000).toFixed(0)}k`
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return 'Vừa xong'
  if (diffMin < 60) return `${diffMin} phút trước`
  if (diffHour < 24) return `${diffHour} giờ trước`
  if (diffDay < 7) return `${diffDay} ngày trước`
  return date.toLocaleDateString('vi-VN')
}

/** Hôm nay dạng YYYY-MM-DD theo giờ máy (dùng cho `min` của input ngày) */
export const todayIso = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Ngày mai (YYYY-MM-DD, giờ máy) — ngày sớm nhất chọn được cho "Từ ngày…"; hôm nay = "Bắt đầu ngay" */
export const tomorrowIso = (): string => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Ngày bắt đầu còn ở tương lai (YYYY-MM-DD)? Ngày đã qua / rỗng coi như bắt đầu ngay */
export const isFutureStart = (iso: string | null | undefined): iso is string => !!iso && iso > todayIso()

/** "YYYY-MM-DD" -> "dd/mm/yyyy" */
export const formatDateVi = (iso: string): string => {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

/** "ngay" hoặc "từ dd/mm/yyyy" — ngày đã qua tính là ngay */
export const startLabel = (iso: string | null | undefined, short = false): string => {
  if (!isFutureStart(iso)) return 'ngay'
  const [y, m, d] = iso.split('-')
  return `từ ${short ? `${d}/${m}` : `${d}/${m}/${y}`}`
}
