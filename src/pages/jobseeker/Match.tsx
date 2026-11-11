import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { EmptyState, PageHeader, Panel, StatusBadge } from '@components/dashboard'
import { HireAction } from '@components/hire'
import InterviewAction from '@components/interview/InterviewAction'
import { describeConversation } from '@pages/public/messages/describe'
import { useConversations, useMyPairs } from '@services/connectionService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { BTN_ACCENT, BTN_PRIMARY, BTN_SECONDARY, BTN_SM } from '@utils/ui'
import { formatRelativeTime } from '@utils/format'
import MessageLink from '@components/messenger/MessageLink'


/** Kết nối (người tìm việc): các việc đã được hai bên đồng ý, kèm tin nhắn cuối và phỏng vấn. */
export default function JobseekerMatch() {
  const connected = useMyPairs('seeker').filter((p) => p.status === 'connected')
  const conversations = useConversations()

  return (
    <div>
      <PageHeader
        title="Kết nối"
        description="Những doanh nghiệp đã đồng ý kết nối với bạn. Nhắn tin và hẹn phỏng vấn tại đây."
        actions={<Link to="/lich-phong-van" className={cn(BTN_SECONDARY, BTN_SM)}>Lịch phỏng vấn</Link>}
      />

      {connected.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="Chưa có kết nối nào"
          description="Ứng tuyển hoặc đồng ý lời quan tâm ở trang Kết nối để bắt đầu trò chuyện."
          action={<Link to="/match" className={BTN_ACCENT}>Tới trang Kết nối</Link>}
        />
      ) : (
        <Panel>
          <ul className="divide-y divide-page-line">
            {connected.map((p) => {
              const info = describeConversation('seeker', p.jobId, p.seekerId)
              const conv = conversations.find((c) => c.jobId === p.jobId && c.seekerId === p.seekerId)
              return (
                <li key={`${p.jobId}|${p.seekerId}`} className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <Link to={`/viec-lam/${p.jobId}`} className={cn('rounded-control font-medium text-page-fg underline-offset-4 hover:underline', FOCUS)}>
                        {info.subtitle}
                      </Link>
                      {!!conv?.unread && <StatusBadge tone="strong">{conv.unread} tin chưa đọc</StatusBadge>}
                    </div>
                    <p className="mt-1 text-sm text-page-muted">{info.name} · kết nối {formatRelativeTime(p.at)}</p>
                    <p className="mt-2 max-w-xl truncate text-sm text-page-fg">
                      {conv?.last ? (
                        <>
                          <span className="text-page-muted">{conv.last.from === 'seeker' ? 'Bạn: ' : ''}</span>
                          {conv.last.text}
                        </>
                      ) : (
                        <span className="text-page-muted">Chưa có tin nhắn.</span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:flex-shrink-0">
                    <InterviewAction viewer="seeker" jobId={p.jobId} seekerId={p.seekerId} compact />
                    <HireAction viewer="seeker" jobId={p.jobId} seekerId={p.seekerId} compact />
                    <MessageLink convKey={`${p.jobId}|${p.seekerId}`} className={cn(BTN_PRIMARY, BTN_SM)}>Nhắn tin</MessageLink>
                    <Link to="/lich-phong-van" className={cn(BTN_SECONDARY, BTN_SM)}>Lịch phỏng vấn</Link>
                  </div>
                </li>
              )
            })}
          </ul>
        </Panel>
      )}

    </div>
  )
}
