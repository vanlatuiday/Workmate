import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import PageCover from '@components/common/PageCover'
import { gsap, ScrollTrigger } from '@utils/gsap'
import { scrollToY } from '@hooks/useSmoothScroll'
import { useReducedMotion } from '@hooks/useReducedMotion'

type Props = {
  title: string
  /** Dòng số liệu thật hiện dưới tiêu đề */
  fact: ReactNode
  /** Số liệu theo bộ lọc hiện tại: [số, nhãn] — chỉ đọc cho trình đọc màn hình */
  stats: [number, string][]
  /** Ô tìm kiếm (JobSearchBar inCover) */
  children?: ReactNode
  /** true = chưa chọn nhóm: bìa cao, tiêu đề + số liệu nằm giữa màn hình, chưa có ô tìm kiếm */
  picker?: boolean
  /** Nhóm đang chọn (query `nhom`) — đổi thì cuộn lên đầu và đo lại ScrollTrigger sau khi bộ sưu tập dựng xong */
  category?: string
  /** Có thì hiện liên kết "← Chọn ngành khác" (về bộ chọn nhóm) dưới tiêu đề */
  back?: () => void
}

/**
 * Đầu trang /viec-lam: bìa cấp md (PageCover) chứa tiêu đề, số liệu và ô tìm kiếm kính tối.
 * Chưa chọn nhóm (`picker`) thì bìa cao và tiêu đề ở GIỮA màn hình; chọn nhóm xong tiêu đề trượt lên vị trí bìa
 * thường (FLIP bằng GSAP: đo vị trí trước/sau, tween `y`; giảm chuyển động → tức thì).
 * Vùng `role="status"` ẩn đọc số kết quả khi bộ lọc đổi.
 */
export default function JobsHero({ title, fact, stats, children, picker = false, category = '', back }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const prev = useRef({ picker, category })
  // Vị trí (theo tài liệu) của tiêu đề lúc đang ở bộ chọn nhóm
  const pickerTop = useRef<number | null>(null)

  useLayoutEffect(() => {
    const h1 = root.current?.querySelector('h1')
    if (!h1) return
    const was = prev.current
    prev.current = { picker, category }
    const top = h1.getBoundingClientRect().top + window.scrollY
    if (picker) pickerTop.current = top
    if (was.picker === picker && was.category === category) return

    // Vị trí tiêu đề trên màn hình ngay trước khi đổi (còn giữ vị trí cuộn cũ), rồi cuộn lên đầu
    const startY = was.picker && !picker && pickerTop.current !== null ? pickerTop.current - window.scrollY : null
    scrollToY(0)
    if (startY !== null && !reduced) {
      const delta = startY - top
      const box = h1.parentElement
      if (box && Math.abs(delta) > 4) gsap.fromTo(box, { y: delta }, { y: 0, duration: 0.7, ease: 'power3.out', clearProps: 'transform' })
    }
    // Bộ sưu tập vừa dựng lại (key đổi): đo lại điểm kích hoạt khi bố cục đã ổn định
    const id = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => cancelAnimationFrame(id)
  }, [picker, category, reduced])

  return (
    <div ref={root} className="contents">
      <PageCover
        level="md"
        centered
        title={title}
        fact={fact}
        className={picker ? 'min-h-[46svh] justify-center' : undefined}
      >
        {(back || children) && (
          <>
            {back && (
              <button type="button" onClick={back} className="mb-4 inline-flex min-h-9 items-center gap-1.5 rounded-control text-sm text-page-muted underline-offset-4 hover:text-page-fg hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-page-fg">
                <ArrowLeft className="h-4 w-4" aria-hidden />
                Chọn ngành khác
              </button>
            )}
            {children}
          </>
        )}
      </PageCover>
      <p className="sr-only" role="status" aria-live="polite">
        {stats.map(([value, label]) => `${value} ${label}`).join(', ')}
      </p>
    </div>
  )
}
