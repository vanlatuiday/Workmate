import { Link } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { EmptyState, MockNotice, PageHeader, Panel, StatusBadge } from '@components/dashboard'
import { HireAction } from '@components/hire'
import InterviewAction from '@components/interview/InterviewAction'
import { describeConversation } from '@pages/public/messages/describe'
import { useConversations, useMyPairs } from '@services/connectionService'
import { FOCUS } from '@utils/focus'
import { formatRelativeTime } from '@utils/format'

const BTN = `inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-300 ${FOCUS}`
const BTN_SOLID = `${BTN} border-page-fg bg-page-fg text-page-bg hover:bg-page-bg hover:text-page-fg`
const BTN_LINE = `${BTN} border-page-line text-page-fg hover:border-page-fg`

/** Kết nối (doanh nghiệp): ứng viên đã kết nối theo từng tin, kèm tin nhắn cuối và mời phỏng vấn. */
export default function RecruiterMatch() {
  const connected = useMyPairs('recruiter').filter((p) => p.status === 'connected')
  const conversations = useConversations('recruiter')

  return (
    <div>
      <PageHeader
        title="Kết nối"
        description="Những ứng viên đã đồng ý kết nối. Nhắn tin, mời phỏng vấn và nhận vào làm tại đây."
        actions={<Link to="/lich-phong-van" className={BTN_LINE}>Lịch phỏng vấn</Link>}
      />

      {connected.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="Chưa có kết nối nào"
          description="Quan tâm ứng viên để bắt đầu; khi họ đồng ý, kết nối sẽ hiện tại đây."
          action={<Link to="/tuyen-dung/tim-ung-vien" className={BTN_SOLID}>Tìm ứng viên</Link>}
        />
      ) : (
        <Panel>
          <ul className="divide-y divide-page-line">
            {connected.map((p) => {
              const info = describeConversation('recruiter', p.jobId, p.seekerId)
              const conv = conversations.find((c) => c.jobId === p.jobId && c.seekerId === p.seekerId)
              return (
                <li key={`${p.jobId}|${p.seekerId}`} className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <span className="font-medium text-page-fg">{info.name}</span>
                      {!!conv?.unread && <StatusBadge tone="strong">{conv.unread} tin chưa đọc</StatusBadge>}
                    </div>
                    <p className="mt-1 text-sm text-page-muted">{info.subtitle} · kết nối {formatRelativeTime(p.at)}</p>
                    <p className="mt-2 max-w-xl truncate text-sm text-page-fg">
                      {conv?.last ? (
                        <>
                          <span className="text-page-muted">{conv.last.from === 'recruiter' ? 'Bạn: ' : ''}</span>
                          {conv.last.text}
                        </>
                      ) : (
                        <span className="text-page-muted">Chưa có tin nhắn.</span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 lg:flex-shrink-0">
                    <InterviewAction viewer="recruiter" jobId={p.jobId} seekerId={p.seekerId} compact />
                    <HireAction viewer="recruiter" jobId={p.jobId} seekerId={p.seekerId} compact />
                    <Link to={`/tin-nhan?c=${p.jobId}|${p.seekerId}`} className={BTN_SOLID}>Nhắn tin</Link>
                  </div>
                </li>
              )
            })}
          </ul>
        </Panel>
      )}

      <div className="mt-6"><MockNotice /></div>
    </div>
  )
}
