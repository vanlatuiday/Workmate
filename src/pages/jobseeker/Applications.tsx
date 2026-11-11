import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ClipboardList } from 'lucide-react'
import { EmptyState, PageHeader, Panel, StatusBadge } from '@components/dashboard'
import { HireStatusChip, OfferCard } from '@components/hire'
import InterviewAction from '@components/interview/InterviewAction'
import { describeConversation } from '@pages/public/messages/describe'
import { useConnectionStore } from '@context/connectionStore'
import { APPLICATION_STAGE_LABEL, expressInterest, ME, useApplicationStage, useHires, useMyPairs, useOnNewConnection, withdrawInterest, type PairItem } from '@services/connectionService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { BTN_ACCENT, BTN_DANGER, BTN_PRIMARY, BTN_SM, CHIP, CHIP_OFF, CHIP_ON } from '@utils/ui'
import { formatRelativeTime } from '@utils/format'
import MessageLink from '@components/messenger/MessageLink'


type Tab = 'all' | 'sent' | 'connected'
const TABS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'sent', label: 'Chờ phản hồi' },
  { id: 'connected', label: 'Đã kết nối' },
]

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Một dòng đơn: việc + công ty, ngày, trạng thái, hành động theo trạng thái cặp. */
function Row({ item }: { item: PairItem }) {
  const info = describeConversation('seeker', item.jobId, item.seekerId)
  // Kết nối do doanh nghiệp quan tâm trước (mình chưa từng ứng tuyển) thì không nói "ứng tuyển"
  const applied = useConnectionStore((s) => s.interests.some((i) => i.jobId === item.jobId && i.seekerId === item.seekerId && i.from === 'seeker'))
  const stage = useApplicationStage(item.jobId, item.seekerId)
  const verb = item.status === 'received' ? 'quan tâm' : applied ? 'ứng tuyển' : 'cập nhật'
  return (
    <li className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Link to={`/viec-lam/${item.jobId}`} className={cn('rounded-control font-medium text-page-fg underline-offset-4 hover:underline', FOCUS)}>
            {info.subtitle}
          </Link>
          {item.status === 'sent' && (
            <StatusBadge tone={stage === 'considering' ? 'soft' : 'neutral'}>{capitalize(APPLICATION_STAGE_LABEL[stage ?? 'applied'])}</StatusBadge>
          )}
          {item.status === 'connected' && <StatusBadge tone="accent">Đã kết nối</StatusBadge>}
          {item.status === 'connected' && <HireStatusChip viewer="seeker" jobId={item.jobId} seekerId={item.seekerId} />}
          {item.status === 'received' && <StatusBadge tone="soft">Doanh nghiệp quan tâm bạn</StatusBadge>}
        </div>
        <p className="mt-1 text-sm text-page-muted">
          {info.name} · {verb} {formatRelativeTime(item.at)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:flex-shrink-0">
        {item.status === 'connected' && <InterviewAction viewer="seeker" jobId={item.jobId} seekerId={item.seekerId} compact />}
        {item.status === 'connected' && (
          <MessageLink convKey={`${item.jobId}|${item.seekerId}`} className={cn(BTN_PRIMARY, BTN_SM)}>Nhắn tin</MessageLink>
        )}
        {item.status === 'received' && (
          <button type="button" className={cn(BTN_PRIMARY, BTN_SM)} onClick={() => expressInterest('seeker', item.jobId, item.seekerId)}>
            Đồng ý kết nối
          </button>
        )}
        {item.status === 'sent' && (
          <button
            type="button"
            className={cn(BTN_DANGER, BTN_SM)}
            onClick={() => {
              withdrawInterest('seeker', item.jobId, item.seekerId)
              toast('Đã rút đơn ứng tuyển')
            }}
          >
            Rút đơn
          </button>
        )}
      </div>
    </li>
  )
}

/** Đã ứng tuyển: các việc mình đã ứng tuyển (chờ phản hồi / đã kết nối) và nhóm doanh nghiệp đang chờ mình. */
export default function Applications() {
  const pairs = useMyPairs('seeker')
  // Lời mời nhận việc còn chờ mình xác nhận
  const offers = useHires().filter((h) => h.status === 'offered')
  const [tab, setTab] = useState<Tab>('all')

  useOnNewConnection((c) => {
    if (c.seekerId === ME) toast.success('Kết nối thành công')
  })

  const mine = pairs.filter((p) => p.status === 'sent' || p.status === 'connected')
  const waiting = pairs.filter((p) => p.status === 'received')
  const shown = tab === 'all' ? mine : mine.filter((p) => p.status === tab)

  return (
    <div>
      <PageHeader title="Đã ứng tuyển" description="Theo dõi các đơn bạn đã gửi và doanh nghiệp đang chờ bạn đáp lại." />

      {offers.length > 0 && (
        <Panel title="Lời mời nhận việc" className="mb-6">
          <ul className="divide-y divide-page-line">
            {offers.map((h) => <OfferCard key={`${h.jobId}|${h.seekerId}`} hire={h} />)}
          </ul>
        </Panel>
      )}

      {waiting.length > 0 && (
        <Panel title="Doanh nghiệp đang chờ bạn" className="mb-6">
          <ul className="divide-y divide-page-line">
            {waiting.map((p) => <Row key={`${p.jobId}|${p.seekerId}`} item={p} />)}
          </ul>
        </Panel>
      )}

      <div role="group" aria-label="Lọc đơn ứng tuyển" className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(CHIP, tab === t.id ? CHIP_ON : CHIP_OFF)}
          >
            {t.label}
            <span className={cn('tnum ml-1.5', tab === t.id ? 'text-accent-fg' : 'text-page-muted')}>
              {t.id === 'all' ? mine.length : mine.filter((p) => p.status === t.id).length}
            </span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title={tab === 'all' ? 'Chưa ứng tuyển việc nào' : 'Chưa có đơn ở mục này'}
          description="Ứng tuyển ở trang Kết nối, đơn sẽ hiện tại đây."
          action={<Link to="/match" className={BTN_ACCENT}>Tới trang Kết nối</Link>}
        />
      ) : (
        <Panel>
          <ul className="divide-y divide-page-line">
            {shown.map((p) => <Row key={`${p.jobId}|${p.seekerId}`} item={p} />)}
          </ul>
        </Panel>
      )}

    </div>
  )
}
