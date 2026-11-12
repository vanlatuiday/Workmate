import { useEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@utils/cn'
import { POP, recentlyInteracted } from '@utils/feedback'

/**
 * Icon lưu / thích: khi NGƯỜI DÙNG vừa bật thì nảy nhẹ một lần (POP). Bật sẵn lúc mở trang, hoặc bật do dữ liệu
 * tải về / đồng bộ realtime thì đứng yên. `fill` (mặc định true): khi bật thì tô đặc. Luôn kèm chữ / aria-pressed của nút chứa nó.
 */
export default function PopIcon({ icon: Icon, on, className, fill = true }: { icon: LucideIcon; on: boolean; className?: string; fill?: boolean }) {
  const prev = useRef(on)
  // Mốc icon xuất hiện: cú bấm trước mốc này (vd. bấm link mở trang) không tính
  const mountedAt = useRef(Date.now())
  const [pop, setPop] = useState(false)
  useEffect(() => {
    if (on && !prev.current && recentlyInteracted(mountedAt.current)) setPop(true)
    if (!on) setPop(false)
    prev.current = on
  }, [on])
  return <Icon className={cn('h-4 w-4', className, on && fill && 'fill-current', pop && POP)} aria-hidden="true" />
}
