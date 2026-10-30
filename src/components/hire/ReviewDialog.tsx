import { useRef, useState, type KeyboardEvent } from 'react'
import toast from 'react-hot-toast'
import { Star } from 'lucide-react'
import DialogShell from '@components/interview/DialogShell'
import { REVIEW_MAX_COMMENT, REVIEW_MAX_TAGS, submitReview, type Side } from '@services/connectionService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { REVIEW_TAGS } from './format'

type Props = {
  /** Phía đang viết đánh giá */
  viewer: Side
  jobId: string
  seekerId: string
  /** Tên bên được đánh giá, hiện ở phụ đề */
  targetName: string
  onClose: () => void
}

const STAR_WORDS = ['Chưa hợp', 'Tạm được', 'Bình thường', 'Tốt', 'Rất tốt']

/** Hộp thoại đánh giá sau khi đi làm: 1–5 sao, tối đa 3 thẻ nhanh, nhận xét tùy chọn. Gửi rồi không sửa được. */
export default function ReviewDialog({ viewer, jobId, seekerId, targetName, onClose }: Props) {
  const [stars, setStars] = useState(0)
  const [tags, setTags] = useState<string[]>([])
  const [comment, setComment] = useState('')
  const starRefs = useRef<(HTMLButtonElement | null)[]>([])

  const toggleTag = (t: string) =>
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : cur.length < REVIEW_MAX_TAGS ? [...cur, t] : cur))

  // Nhóm radio: mũi tên đổi sao, Tab chỉ dừng ở sao đang chọn (hoặc sao đầu khi chưa chọn)
  const onStarKey = (e: KeyboardEvent, n: number) => {
    const next = e.key === 'ArrowRight' || e.key === 'ArrowUp' ? Math.min(5, n + 1) : e.key === 'ArrowLeft' || e.key === 'ArrowDown' ? Math.max(1, n - 1) : 0
    if (!next) return
    e.preventDefault()
    setStars(next)
    starRefs.current[next - 1]?.focus()
  }

  return (
    <DialogShell titleId="review-title" title="Đánh giá sau khi làm việc" subtitle={targetName} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!stars) return
          submitReview({ jobId, seekerId, from: viewer, stars, tags, comment })
          toast.success('Đã gửi đánh giá. Cảm ơn bạn!')
          onClose()
        }}
        className="space-y-5"
      >
        <div>
          <p id="review-stars-label" className="text-sm font-medium text-page-fg">Bạn thấy lần làm việc này thế nào?</p>
          <div role="radiogroup" aria-labelledby="review-stars-label" className="mt-2 flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                ref={(el) => { starRefs.current[n - 1] = el }}
                type="button"
                role="radio"
                aria-checked={stars === n}
                aria-label={`${n} sao — ${STAR_WORDS[n - 1]}`}
                tabIndex={stars === n || (!stars && n === 1) ? 0 : -1}
                onClick={() => setStars(n)}
                onKeyDown={(e) => onStarKey(e, n)}
                className={cn('flex h-10 w-10 items-center justify-center rounded-control', n <= stars ? 'text-page-fg' : 'text-page-edge hover:text-page-muted', FOCUS)}
              >
                <Star className={cn('h-7 w-7', n <= stars && 'fill-current')} aria-hidden="true" />
              </button>
            ))}
            <span aria-live="polite" className="ml-2 text-sm text-page-muted">{stars ? STAR_WORDS[stars - 1] : ''}</span>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-page-fg">
            Điểm nổi bật <span className="font-normal text-page-muted">(chọn tối đa {REVIEW_MAX_TAGS})</span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {REVIEW_TAGS[viewer].map((t) => {
              const on = tags.includes(t)
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleTag(t)}
                  className={cn(
                    'min-h-10 rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-300',
                    on ? 'border-page-fg bg-page-fg text-page-bg' : 'border-page-line text-page-fg hover:border-page-fg',
                    FOCUS,
                  )}
                >
                  {t}
                </button>
              )
            })}
          </div>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-page-fg">Nhận xét <span className="font-normal text-page-muted">(không bắt buộc)</span></span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={REVIEW_MAX_COMMENT}
            rows={3}
            className={cn('mt-2 block w-full resize-none rounded-control border border-page-edge bg-page-bg px-3 py-2 text-sm text-page-fg', FOCUS)}
          />
          <span className="mt-1 block text-right text-xs text-page-muted" aria-live="off">{comment.length}/{REVIEW_MAX_COMMENT}</span>
        </label>

        <p className="text-xs leading-relaxed text-page-muted">Đánh giá gửi đi không sửa được và hiện công khai trên trang của bên kia.</p>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={cn('min-h-10 rounded-full border border-page-line px-5 py-2.5 text-sm font-medium text-page-fg hover:border-page-fg', FOCUS)}>
            Để sau
          </button>
          <button
            type="submit"
            disabled={!stars}
            className={cn('min-h-10 rounded-full border border-page-fg bg-page-fg px-5 py-2.5 text-sm font-medium text-page-bg transition-colors duration-300 hover:bg-page-bg hover:text-page-fg disabled:cursor-default disabled:border-page-line disabled:bg-page-bg disabled:text-page-muted', FOCUS)}
          >
            Gửi đánh giá
          </button>
        </div>
      </form>
    </DialogShell>
  )
}
