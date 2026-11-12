import { useState } from 'react'
import { BriefcaseBusiness, Star } from 'lucide-react'
import { describeConversation } from '@pages/public/messages/describe'
import { acceptOffer, declineOffer, rejectCandidate, useActiveInterview, useHire, useReview, withdrawOffer, type Side } from '@services/connectionService'
import { cn } from '@utils/cn'
import { BTN_DANGER, BTN_PRIMARY, BTN_SECONDARY, BTN_SM } from '@utils/ui'
import ConfirmDialog from './ConfirmDialog'
import { hireLabel, todayStr } from './format'
import HireChip from './HireChip'
import OfferDialog from './OfferDialog'
import ReviewDialog from './ReviewDialog'

type Props = { viewer: Side; jobId: string; seekerId: string; compact?: boolean }
type Open = 'offer' | 'reject' | 'withdraw' | 'decline' | 'review' | null

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
  // compact (khung chat, thẻ chật) dùng cỡ nhỏ của bộ nút chung
  const size = compact ? BTN_SM : ''
  const close = () => setOpen(null)

  // Phỏng vấn đã xác nhận và đã qua giờ → đây là lúc nên quyết định
  const interviewDone = iv?.status === 'confirmed' && new Date(iv.chosen ?? iv.slots[0]).getTime() < Date.now()

  if (!hire) {
    if (viewer !== 'recruiter') return null
    return (
      <>
        <button type="button" onClick={() => setOpen('offer')} className={cn(interviewDone ? BTN_PRIMARY : BTN_SECONDARY, size)}>
          <BriefcaseBusiness className="h-4 w-4" aria-hidden="true" />
          Nhận vào làm
        </button>
        <button type="button" onClick={() => setOpen('reject')} className={cn(BTN_DANGER, size)}>Không nhận</button>
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
            }}
            onClose={close}
          />
        )}
      </>
    )
  }

  const chip = <HireChip status={hire.status}>{hireLabel(viewer, hire)}</HireChip>

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
          <button type="button" onClick={() => setOpen('review')} className={cn(BTN_SECONDARY, size)}>
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
        <button type="button" onClick={() => setOpen('withdraw')} className={cn(BTN_DANGER, size)}>Rút lời mời</button>
        {open === 'withdraw' && (
          <ConfirmDialog
            titleId="withdraw-title"
            title="Rút lời mời nhận việc?"
            description="Ứng viên sẽ được báo là lời mời đã được rút. Bạn không thể mời lại sau khi rút."
            confirmLabel="Rút lời mời"
            cancelLabel="Giữ lời mời"
            onConfirm={() => {
              withdrawOffer(jobId, seekerId)
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
        }}
        className={cn(BTN_PRIMARY, size)}
      >
        Xác nhận đi làm
      </button>
      <button type="button" onClick={() => setOpen('decline')} className={cn(BTN_DANGER, size)}>Từ chối</button>
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
          }}
          onClose={close}
        />
      )}
    </>
  )
}
