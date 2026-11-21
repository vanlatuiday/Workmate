// Dựng nhãn hiển thị cho tin — giống cách PostJobPage (frontend) tự tính.
const DAY_SHORT = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
// 0 sáng · 1 chiều · 2 tối (17:00–22:00) · 3 khuya (22:00–06:00, tính vào ngày bắt đầu ca)
const SESSIONS = ['sáng', 'chiều', 'tối', 'khuya']

/** 28 + 32 → "28.000–32.000đ/giờ"; bằng nhau → "28.000đ/giờ" */
export const salaryLabelOf = (minK: number, maxK: number) =>
  minK === maxK ? `${minK}.000đ/giờ` : `${minK}.000–${maxK}.000đ/giờ`

/** ['0-2','1-2'] → "T2 tối, T3 tối"; '4-3' → "T6 khuya"; không có ca → '' */
export function shiftLabelOf(slots: string[]): string {
  return DAY_SHORT.map((d, di) => {
    const ss = SESSIONS.filter((_, si) => slots.includes(`${di}-${si}`))
    return ss.length ? `${d} ${ss.join('+')}` : ''
  })
    .filter(Boolean)
    .join(', ')
}
