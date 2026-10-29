import { useState } from 'react'
import toast from 'react-hot-toast'
import { BriefcaseBusiness } from 'lucide-react'
import { StatusBadge } from '@components/dashboard'
import { acceptOffer, declineOffer, rejectCandidate, useActiveInterview, useHire, withdrawOffer, type Side } from '@services/connectionService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import ConfirmDialog from './ConfirmDialog'
import { hireLabel } from './format'
import OfferDialog from './OfferDialog'

type Props = { viewer: Side; jobId: string; seekerId: string; compact?: boolean }
type Open = 'offer' | 'reject' | 'withdraw' | 'decline' | null

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
