import type { SalaryRange } from '@/types'

export function formatSalary(salary: SalaryRange): string {
  const unitLabel: Record<string, string> = {
    hour:        '/giờ',
    day:         '/ngày',
    month:       '/tháng',
    commission:  '(hoa hồng)',
    negotiable:  '',
  }

  if (salary.unit === 'negotiable') return 'Thỏa thuận'

  const unit = unitLabel[salary.unit] ?? ''

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
