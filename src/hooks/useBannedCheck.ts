import { useEffect, useState } from 'react'
import { checkJobText } from '@services/catalogService'

/** Dò cụm từ cấm tuyệt đối khi đang gõ: chờ ~600ms sau lần gõ cuối rồi hỏi máy chủ (giới hạn 60 lần/phút).
 *  Bỏ kết quả của lượt cũ nếu văn bản đã đổi; văn bản rỗng hoặc `enabled=false` → danh sách rỗng. */
export function useBannedCheck(text: string, enabled = true): string[] {
  const [banned, setBanned] = useState<string[]>([])
  const value = text.trim()
  const active = enabled && value.length > 0

  useEffect(() => {
    if (!active) { setBanned((b) => (b.length ? [] : b)); return }
    let stale = false
    const timer = window.setTimeout(() => {
      void checkJobText(value).then((r) => { if (!stale) setBanned(r.banned) })
    }, 600)
    return () => { stale = true; window.clearTimeout(timer) }
  }, [value, active])

  return active ? banned : []
}
