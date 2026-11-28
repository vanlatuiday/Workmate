/** Bỏ dấu tiếng Việt (kể cả đ/Đ → d) và hạ chữ thường — để gõ "pha che" vẫn khớp "Pha chế". */
export const foldVi = (s: string): string =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/đ/g, 'd')

/** Chữ cái đầu của hai từ đầu tiên trong tên, vd. "Nguyễn Minh Anh" -> "NM" */
export const initialsOf = (name: string): string =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')

/** Đối chiếu tên hiển thị. Từ viết tắt có dấu chấm chỉ so chữ cái đầu. */
export function matchesCandidateName(displayName: string, query: string): boolean {
  const search = foldVi(query).match(/[\p{L}\p{N}]+/gu) ?? []
  if (!search.length) return false

  const words = foldVi(displayName).match(/[\p{L}\p{N}]+\.?/gu) ?? []
  return words.some((_, start) =>
    search.every((term, offset) => {
      const word = words[start + offset]
      if (!word) return false
      return /^[a-z]\.$/.test(word) ? term[0] === word[0] : word.startsWith(term)
    }),
  )
}
