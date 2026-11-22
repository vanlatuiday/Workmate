/** Bỏ dấu tiếng Việt (kể cả đ/Đ → d) và hạ chữ thường — để gõ "pha che" vẫn khớp "Pha chế". */
export const foldVi = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/đ/g, 'd')

/** Chữ cái đầu của hai từ đầu tiên trong tên, vd. "Nguyễn Minh Anh" -> "NM" */
export const initialsOf = (name: string): string =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')
