import toast from 'react-hot-toast'
import { Bookmark, Check } from 'lucide-react'
import { useMatchStore } from '@context/matchStore'
import { expressInterest, ME, useOnNewConnection, usePairStatuses, withdrawInterest } from '@services/connectionService'
import type { MatchJob } from '@pages/public/jobs/catalog'
import { BTN_PRIMARY, BTN_SECONDARY } from '@pages/public/match/parts'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import MessageLink from '@components/messenger/MessageLink'

/** Hàng nút của người tìm việc: ứng tuyển / chờ phản hồi / nhắn tin + lưu tin. */
export default function SeekerJobActions({ job }: { job: MatchJob }) {
  const { savedJobs, toggleSavedJob } = useMatchStore()
  const status = usePairStatuses('seeker')(job.id, ME)
  const saved = savedJobs.includes(job.id)
  const toastId = `ung-tuyen-${job.id}`

  // Kết nối mới (kể cả do doanh nghiệp đáp lại sau vài giây) → báo thành công
  useOnNewConnection((c) => {
    if (c.jobId === job.id && c.seekerId === ME) toast.success('Kết nối thành công')
  })

  const apply = () => {
    const waiting = status === 'none'
    expressInterest('seeker', job.id, ME)
    if (waiting) toast.success('Đã ứng tuyển — chờ doanh nghiệp phản hồi', { id: toastId })
  }

  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
      {status === 'none' && (
        <button type="button" onClick={apply} className={BTN_PRIMARY}>
          Ứng tuyển
        </button>
      )}
      {status === 'received' && (
        <button type="button" onClick={apply} className={BTN_PRIMARY}>
          Đồng ý kết nối
        </button>
      )}
      {status === 'sent' && (
        <>
          <button type="button" disabled className={BTN_SECONDARY}>
            <Check className="h-4 w-4" aria-hidden="true" />
            Đã ứng tuyển · chờ phản hồi
          </button>
          <button
            type="button"
            onClick={() => {
              withdrawInterest('seeker', job.id, ME)
              toast.dismiss(toastId)
            }}
            className={`inline-flex min-h-11 items-center rounded-control px-3 text-sm text-page-muted underline underline-offset-4 hover:text-page-fg ${FOCUS}`}
          >
            Rút<span className="sr-only"> đơn ứng tuyển</span>
          </button>
        </>
      )}
      {status === 'connected' && (
        <MessageLink convKey={`${job.id}|${ME}`} className={BTN_PRIMARY}>
          Nhắn tin
        </MessageLink>
      )}
      <button type="button" aria-pressed={saved} onClick={() => toggleSavedJob(job.id)} className={BTN_SECONDARY}>
        <Bookmark className={cn('h-4 w-4', saved && 'fill-current')} aria-hidden="true" />
        {saved ? 'Đã lưu' : 'Lưu'}
      </button>
    </div>
  )
}
