
/** Số thứ tự 2 chữ số: 1 → "01". */
export const pad = (n: number) => String(n).padStart(2, '0')

/** Một mốc lương tối thiểu theo giờ: "từ 25.000đ/giờ" */
export const formatHourlyFromK = (k: number): string => `từ ${(k * 1000).toLocaleString('vi-VN')}đ/giờ`

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
const todayIso = (): string => {
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

/** "ngay" hoặc "từ dd/mm/yyyy" — ngày đã qua tính là ngay */
export const startLabel = (iso: string | null | undefined, short = false): string => {
  if (!isFutureStart(iso)) return 'ngay'
  const [y, m, d] = iso.split('-')
  return `từ ${short ? `${d}/${m}` : `${d}/${m}/${y}`}`
}
