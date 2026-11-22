import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { ChevronDown, Star } from 'lucide-react'
import { useAuthStore } from '@context/authStore'
import {
  deleteCompanyReview, deleteSeekerReview, reviewStats, saveCompanyReview, saveSeekerReview,
  useMyCompanyReview, useMySeekerReview, type MyReview, type ReviewItem,
} from '@services/connectionService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { formatRelativeTime } from '@utils/format'
import { BTN_ACCENT, BTN_DANGER, BTN_PRIMARY, BTN_SECONDARY, BTN_SM } from '@utils/ui'
import { Stars } from './ReviewList'

const MAX_COMMENT = 300
const score = (value: number) => value.toFixed(1).replace('.', ',')

/** Dòng tóm tắt gọn: điểm trung bình + sao + số đánh giá (dùng ở đầu trang và trong khối đánh giá) */
export function RatingSummary({ reviews, className, size = 'lg' }: { reviews: ReviewItem[]; className?: string; size?: 'sm' | 'lg' }) {
  const { average, count } = reviewStats(reviews)
  if (count === 0) return <p className={cn('text-sm text-page-muted', className)}>Chưa có đánh giá</p>
  return (
    <p className={cn('flex flex-wrap items-center gap-x-3 gap-y-1', className)}>
      <span className={cn('tnum font-display font-semibold text-page-fg', size === 'lg' ? 'text-3xl' : 'text-lg')}>{score(average)}</span>
      <Stars value={average} />
      <span className="tnum text-sm text-page-muted">{count} đánh giá</span>
    </p>
  )
}

/** Chọn 1-5 sao: nhóm radio, phím mũi tên đổi điểm, rê chuột xem trước */
function StarInput({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  const [hover, setHover] = useState(0)
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const shown = hover || value
  const move = (e: KeyboardEvent, n: number) => {
    let next = n
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = Math.min(5, n + 1)
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = Math.max(1, n - 1)
    else if (e.key === 'Home') next = 1
    else if (e.key === 'End') next = 5
    else return
    e.preventDefault()
    onChange(next)
    refs.current[next - 1]?.focus()
  }
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          ref={(el) => { refs.current[n - 1] = el }}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} sao`}
          tabIndex={value === n || (value === 0 && n === 1) ? 0 : -1}
          onClick={() => onChange(n)}
          onKeyDown={(e) => move(e, n)}
          onMouseEnter={() => setHover(n)}
          className={cn('rounded-control p-1 text-page-fg transition-transform duration-fast motion-reduce:transition-none hover:scale-110', FOCUS)}
        >
          <Star className={cn('h-7 w-7', n <= shown ? 'fill-current' : 'text-page-edge')} aria-hidden="true" />
        </button>
      ))}
      <span aria-live="polite" className="tnum ml-2 text-sm text-page-muted">{value ? `${value}/5` : 'Chọn số sao'}</span>
    </div>
  )
}

/** Biểu mẫu viết / sửa đánh giá (tại chỗ) */
function ReviewForm({ initial, subject, onSubmit, onCancel }: {
  initial?: MyReview
  subject: string
  onSubmit: (body: { stars: number; comment?: string; tags: string[] }) => Promise<boolean>
  onCancel: () => void
}) {
  const [stars, setStars] = useState(initial?.stars ?? 0)
  const [comment, setComment] = useState(initial?.comment ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const id = useId()
  const submit = async () => {
    if (!stars) { setError('Vui lòng chọn số sao.'); return }
    setBusy(true)
    const ok = await onSubmit({ stars, comment: comment.trim() || undefined, tags: initial?.tags ?? [] })
    setBusy(false)
    if (!ok) setError('Chưa lưu được. Kiểm tra lại nội dung rồi thử lại.')
  }
  return (
    <form className="mt-4 space-y-4 rounded-card border border-page-line p-4" onSubmit={(e) => { e.preventDefault(); void submit() }}>
      <div>
        <p id={`${id}-l`} className="mb-1 text-sm font-medium text-page-fg">Bạn chấm {subject} mấy sao?</p>
        <StarInput value={stars} onChange={(n) => { setStars(n); setError('') }} label={`Chấm sao cho ${subject}`} />
      </div>
      <div>
        <label htmlFor={`${id}-c`} className="text-sm font-medium text-page-fg">Nhận xét <span className="font-normal text-page-muted">(không bắt buộc)</span></label>
        <textarea
          id={`${id}-c`}
          value={comment}
          maxLength={MAX_COMMENT}
          rows={4}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Chia sẻ trải nghiệm thật của bạn, giữ lời lẽ lịch sự."
          className={cn('mt-1.5 w-full resize-y rounded-control border border-page-line bg-transparent px-3 py-2 text-sm text-page-fg placeholder:text-page-muted', FOCUS)}
        />
        <p className="tnum mt-1 text-right text-xs text-page-muted">{comment.length}/{MAX_COMMENT}</p>
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap items-center gap-2">
        <button type="submit" disabled={busy} className={cn(initial ? BTN_PRIMARY : BTN_ACCENT, BTN_SM)}>{busy ? 'Đang gửi…' : initial ? 'Lưu đánh giá' : 'Gửi đánh giá'}</button>
        <button type="button" onClick={onCancel} disabled={busy} className={cn(BTN_SECONDARY, BTN_SM)}>Hủy</button>
      </div>
    </form>
  )
}

/**
 * Khối đánh giá dùng chung: tóm tắt điểm, nút "Xem nhận xét" mở danh sách, và vùng viết/sửa/xóa
 * đánh giá của chính mình khi hai bên đã quan tâm nhau. `reviews` do trang tải (cùng nguồn với phần tóm tắt đầu trang).
 */
export default function ReviewsPanel({ kind, targetId, targetName, reviews, className }: {
  /** company: người tìm việc đánh giá công ty; seeker: nhà tuyển dụng đánh giá người tìm việc */
  kind: 'company' | 'seeker'
  targetId: string
  targetName: string
  reviews: ReviewItem[]
  className?: string
}) {
  const role = useAuthStore((s) => s.user?.role)
  const writerRole = kind === 'company' ? 'jobseeker' : 'recruiter'
  const myCompany = useMyCompanyReview(kind === 'company' ? targetId : '')
  const mySeeker = useMySeekerReview(kind === 'seeker' ? targetId : '')
  const { canReview, mine, ready } = kind === 'company' ? myCompany : mySeeker
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'idle' | 'write' | 'edit' | 'confirm'>('idle')
  const listId = useId()
  const wrap = useRef<HTMLDivElement>(null)
  const { count } = reviewStats(reviews)
  const sorted = [...reviews].sort((a, b) => b.at.localeCompare(a.at))
  const save = kind === 'company' ? saveCompanyReview : saveSeekerReview
  const remove = kind === 'company' ? deleteCompanyReview : deleteSeekerReview

  // Đóng form khi đánh giá đã lưu xong (mine đổi)
  useEffect(() => { setMode('idle') }, [mine?.at, mine?.editedAt, mine?.stars, mine?.comment])

  const hasInline = role === writerRole && ready
  return (
    <div ref={wrap} className={className}>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <RatingSummary reviews={reviews} />
        {count > 0 && (
          <button type="button" aria-expanded={open} aria-controls={listId} onClick={() => setOpen(!open)} className={cn(BTN_SECONDARY, BTN_SM)}>
            Xem nhận xét ({count})
            <ChevronDown aria-hidden className={cn('h-4 w-4 transition-transform duration-base motion-reduce:transition-none', open && 'rotate-180')} />
          </button>
        )}
      </div>

      {/* Mở/đóng mượt bằng grid-rows; khi đóng thì inert để phím Tab không lọt vào */}
      <div id={listId} className={cn('grid transition-[grid-template-rows,opacity] duration-base ease-out motion-reduce:transition-none', open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')} {...(open ? {} : ({ inert: '' } as object))}>
        <div className="min-h-0 overflow-hidden">
          <ul className={cn("mt-4 divide-y divide-page-line border-page-line", count > 0 && "border-y")}>
            {sorted.map((r) => (
              <li key={`${r.jobId}|${r.at}`} className="py-4 break-words">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <span className="flex items-center gap-2.5">
                    <Stars value={r.stars} />
                    <span className="text-sm font-medium text-page-fg">{r.authorName}</span>
                  </span>
                  <span className="text-xs text-page-muted">{formatRelativeTime(r.at)}{r.editedAt && ' · đã sửa'}</span>
                </div>
                {r.tags.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {r.tags.map((t) => <li key={t} className="rounded-full border border-page-line px-2.5 py-0.5 text-xs text-page-muted">{t}</li>)}
                  </ul>
                )}
                {r.comment && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-page-fg">{r.comment}</p>}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {hasInline && (
        <div className="mt-5">
          {mine ? (
            <div className="rounded-card border border-page-line p-4" aria-label="Đánh giá của bạn">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-page-fg">Đánh giá của bạn</h3>
                <span className="text-xs text-page-muted">{formatRelativeTime(mine.editedAt ?? mine.at)}{mine.editedAt && ' · đã sửa'}</span>
              </div>
              {mode !== 'edit' && (
                <>
                  <p className="mt-2 flex items-center gap-2"><Stars value={mine.stars} /><span className="tnum text-xs text-page-muted">{mine.stars}/5</span></p>
                  {mine.comment && <p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-page-fg">{mine.comment}</p>}
                  {mode === 'confirm' ? (
                    <div role="alert" className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-sm text-page-fg">Xóa đánh giá này?</span>
                      <button type="button" className={cn(BTN_DANGER, BTN_SM)} onClick={() => void remove(targetId)}>Xóa</button>
                      <button type="button" className={cn(BTN_SECONDARY, BTN_SM)} onClick={() => setMode('idle')}>Giữ lại</button>
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" className={cn(BTN_SECONDARY, BTN_SM)} onClick={() => setMode('edit')}>Sửa<span className="sr-only"> đánh giá</span></button>
                      <button type="button" className={cn(BTN_SECONDARY, BTN_SM)} onClick={() => setMode('confirm')}>Xóa<span className="sr-only"> đánh giá</span></button>
                    </div>
                  )}
                </>
              )}
              {mode === 'edit' && <ReviewForm initial={mine} subject={targetName} onSubmit={(b) => save(targetId, b, true)} onCancel={() => setMode('idle')} />}
            </div>
          ) : canReview ? (
            mode === 'write'
              ? <ReviewForm subject={targetName} onSubmit={(b) => save(targetId, b)} onCancel={() => setMode('idle')} />
              : <button type="button" className={cn(BTN_PRIMARY, BTN_SM)} onClick={() => setMode('write')}>Viết đánh giá</button>
          ) : (
            <p className="text-sm text-page-muted">Bạn có thể đánh giá sau khi hai bên cùng quan tâm nhau.</p>
          )}
        </div>
      )}
    </div>
  )
}
