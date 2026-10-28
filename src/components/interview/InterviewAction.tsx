import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, CalendarPlus, Hourglass } from 'lucide-react'
import { useActiveInterview, type Side } from '@services/connectionService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import ChooseSlotDialog from './ChooseSlotDialog'
import InviteInterviewDialog from './InviteInterviewDialog'
import { fmtShort } from './format'

type Props = { viewer: Side; jobId: string; seekerId: string; compact?: boolean }

const BTN = 'inline-flex items-center justify-center gap-1.5 rounded-full border border-page-fg bg-page-fg font-medium text-page-bg transition-colors duration-300 hover:bg-page-bg hover:text-page-fg'
const CHIP = 'inline-flex items-center gap-1.5 rounded-full border border-page-line text-page-fg'

/**
 * Nút / chip phỏng vấn theo vai trò và trạng thái, dùng ở trang Kết nối và khung chat:
 * doanh nghiệp: Mời phỏng vấn → "Đã mời · chờ xác nhận" → "Phỏng vấn {giờ}" + Xem lịch;
 * người tìm việc: Chọn giờ phỏng vấn (khi có lời mời) → "Phỏng vấn {giờ}".
 */
export default function InterviewAction({ viewer, jobId, seekerId, compact }: Props) {
  const iv = useActiveInterview(jobId, seekerId)
  const [open, setOpen] = useState(false)
  const size = compact ? 'px-3.5 py-1.5 text-xs' : 'px-5 py-2.5 text-sm'
  const chipSize = compact ? 'px-3 py-1 text-xs' : 'px-3 py-1 text-xs'
  const icon = compact ? 'h-3.5 w-3.5' : 'h-4 w-4'

  if (iv?.status === 'confirmed') {
    return (
      <>
        <span className={cn(CHIP, chipSize)}>
          <CalendarCheck className={icon} aria-hidden="true" />
          Phỏng vấn {fmtShort(iv.chosen ?? iv.slots[0])}
        </span>
        {viewer === 'recruiter' && (
          <Link to="/lich-phong-van" className={cn('rounded-control text-xs text-page-muted underline underline-offset-4 hover:text-page-fg', FOCUS)}>
            Xem lịch
          </Link>
        )}
      </>
    )
  }

  if (iv?.status === 'pending') {
    if (viewer === 'recruiter') {
      return (
        <span className={cn(CHIP, chipSize)}>
          <Hourglass className={icon} aria-hidden="true" />
          Đã mời · chờ xác nhận
        </span>
      )
    }
    return (
      <>
        <button type="button" onClick={() => setOpen(true)} className={cn(BTN, size, FOCUS)}>
          <CalendarPlus className={icon} aria-hidden="true" />
          Chọn giờ phỏng vấn
        </button>
        {open && <ChooseSlotDialog interview={iv} onClose={() => setOpen(false)} />}
      </>
    )
  }

  if (viewer !== 'recruiter') return null
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn(BTN, size, FOCUS)}>
        <CalendarPlus className={icon} aria-hidden="true" />
        Mời phỏng vấn
      </button>
      {open && <InviteInterviewDialog jobId={jobId} seekerId={seekerId} onClose={() => setOpen(false)} />}
    </>
  )
}
