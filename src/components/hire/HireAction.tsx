import { useState } from 'react'
import toast from 'react-hot-toast'
import { BriefcaseBusiness, Star } from 'lucide-react'
import { StatusBadge } from '@components/dashboard'
import { describeConversation } from '@pages/public/messages/describe'
import { acceptOffer, declineOffer, rejectCandidate, useActiveInterview, useHire, useReview, withdrawOffer, type Side } from '@services/connectionService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import ConfirmDialog from './ConfirmDialog'
import { hireLabel, todayStr } from './format'
import OfferDialog from './OfferDialog'
import ReviewDialog from './ReviewDialog'

type Props = { viewer: Side; jobId: string; seekerId: string; compact?: boolean }
type Open = 'offer' | 'reject' | 'withdraw' | 'decline' | 'review' | null

const BTN = 'inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border font-medium transition-colors duration-300'
const SOLID = `${BTN} border-page-fg bg-page-fg text-page-bg hover:bg-page-bg hover:text-page-fg`
const LINE = `${BTN} border-page-line text-page-fg hover:border-page-fg`

/**
 * Nút nhận việc theo vai trò và trạng thái, dùng ở Kết nối, lịch phỏng vấn và khung chat:
 * doanh nghiệp: Nhận vào làm / Không nhận → "Chờ xác nhận đi làm" + Rút lời mời → nhãn trạng thái cuối;
 * người tìm việc: Xác nhận đi làm / Từ chối khi có lời mời → nhãn trạng thái cuối.
 * Nút "Nhận vào làm" nổi bật (nền đặc) khi buổi phỏng vấn đã xác nhận và đã diễn ra.
 */
export default function HireAction({ viewer, jobId, seekerId, compact }: Props) {
  const hire = useHire(jobId, seekerId)
  const iv = useActiveInterview(jobId, seekerId)
  const myReview = useReview(jobId, seekerId, viewer)
  const [open, setOpen] = useState<Open>(null)
  const size = compact ? 'px-3.5 py-1.5 text-xs' : 'px-5 py-2.5 text-sm'
  const close = () => setOpen(null)

  // Phỏng vấn đã xác nhận và đã qua giờ → đây là lúc nên quyết định
  const interviewDone = iv?.status === 'confirmed' && new Date(iv.chosen ?? iv.slots[0]).getTime() < Date.now()

  if (!hire) {
    if (viewer !== 'recruiter') return null
    return (
      <>
        <button type="button" onClick={() => setOpen('offer')} className={cn(interviewDone ? SOLID : LINE, size, FOCUS)}>
          <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
          Nhận vào làm
        </button>
        <button type="button" onClick={() => setOpen('reject')} className={cn(LINE, size, FOCUS)}>Không nhận</button>
        {open === 'offer' && <OfferDialog jobId={jobId} seekerId={seekerId} onClose={close} />}
        {open === 'reject' && (
          <ConfirmDialog
            titleId="reject-title"
            title="Không nhận ứng viên này?"
            description="Ứng viên sẽ nhận được lời cảm ơn nhẹ nhàng và biết lần này chưa phù hợp. Bạn không thể đổi lại sau khi xác nhận."
            askReason
            confirmLabel="Không nhận"
            cancelLabel="Quay lại"
            onConfirm={(reason) => {
              rejectCandidate(jobId, seekerId, reason)
              toast('Đã gửi lời cảm ơn tới ứng viên')
            }}
            onClose={close}
          />
        )}
      </>
    )
  }

  const tone = hire.status === 'accepted' ? 'strong' : hire.status === 'offered' ? 'default' : 'muted'
  const chip = (
    <StatusBadge tone={tone}>
      {hireLabel(viewer, hire)}
    </StatusBadge>
  )

  // Đã xác nhận đi làm: đánh giá hai chiều mở từ ngày bắt đầu, mỗi phía một lần
  if (hire.status === 'accepted') {
    const started = !hire.startDate || hire.startDate <= todayStr()
    return (
      <>
        {chip}
        {!started && hire.startDate && (
          <span className={cn('text-page-muted', compact ? 'text-xs' : 'text-sm')}>Đánh giá được từ ngày bắt đầu làm</span>
        )}
        {started && myReview && (
          <span className="inline-flex items-center gap-1 text-xs text-page-muted">
            Đã đánh giá <Star className="h-3.5 w-3.5 fill-current text-page-fg" aria-hidden="true" /><span className="font-medium text-page-fg">{myReview.stars}</span>
          </span>
        )}
        {started && !myReview && (
          <button type="button" onClick={() => setOpen('review')} className={cn(LINE, size, FOCUS)}>
            <Star className="h-4 w-4" aria-hidden="true" />
            Đánh giá
          </button>
        )}
        {open === 'review' && (
          <ReviewDialog viewer={viewer} jobId={jobId} seekerId={seekerId} targetName={describeConversation(viewer, jobId, seekerId).name} onClose={close} />
        )}
      </>
    )
  }

  if (hire.status !== 'offered') return chip

  if (viewer === 'recruiter') {
    return (
      <>
        {chip}
        <button type="button" onClick={() => setOpen('withdraw')} className={cn(LINE, size, FOCUS)}>Rút lời mời</button>
        {open === 'withdraw' && (
          <ConfirmDialog
            titleId="withdraw-title"
            title="Rút lời mời nhận việc?"
            description="Ứng viên sẽ được báo là lời mời đã được rút. Bạn không thể mời lại sau khi rút."
            confirmLabel="Rút lời mời"
            cancelLabel="Giữ lời mời"
            onConfirm={() => {
              withdrawOffer(jobId, seekerId)
              toast('Đã rút lời mời')
            }}
            onClose={close}
          />
        )}
      </>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          acceptOffer(jobId, seekerId)
          toast.success('Đã xác nhận đi làm. Chúc bạn một khởi đầu thuận lợi!')
        }}
        className={cn(SOLID, size, FOCUS)}
      >
        Xác nhận đi làm
      </button>
      <button type="button" onClick={() => setOpen('decline')} className={cn(LINE, size, FOCUS)}>Từ chối</button>
      {open === 'decline' && (
        <ConfirmDialog
          titleId="decline-title"
          title="Từ chối lời mời nhận việc?"
          description="Doanh nghiệp sẽ được báo là bạn không nhận việc lần này. Bạn không thể đổi lại sau khi từ chối."
          askReason
          confirmLabel="Từ chối"
          cancelLabel="Quay lại"
          onConfirm={(reason) => {
            declineOffer(jobId, seekerId, reason)
            toast('Đã từ chối lời mời')
          }}
          onClose={close}
        />
      )}
    </>
  )
}
