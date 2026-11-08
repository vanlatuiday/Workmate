/** Hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD (máy chủ có thể chạy múi giờ khác) */
export const todayVN = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' })

/** Cột DATE → YYYY-MM-DD */
export const dayOf = (d: Date) => d.toISOString().slice(0, 10)

/** YYYY-MM-DD → dd/mm/yyyy */
export const fmtDay = (day: string) => day.split('-').reverse().join('/')

/** Có phải ngày có thật không (loại 2026-02-31) */
export const isRealDay = (day: string) => {
  const d = new Date(`${day}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && dayOf(d) === day
}
