import { useEffect } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import { useAuthStore } from '@context/authStore'
import { useConversations, type ConversationSummary, type Side } from '@services/connectionService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import ChatPane from './messages/ChatPane'
import ConversationList from './messages/ConversationList'

/**
 * /tin-nhan — nhắn tin giữa hai bên đã kết nối (dữ liệu mẫu trong kho demo).
 *   chưa đăng nhập → về /dang-nhap; admin → một lời nhắn; còn lại → khung chat theo vai trò.
 * Hội thoại đang mở nằm trong query `?c=<jobId>|<seekerId>` (liên kết sâu từ trang Kết nối).
 * Desktop: hai cột, tự chọn hội thoại đầu. Mobile: danh sách, chọn rồi mới vào khung chat.
 */
export default function MessagesPage() {
  const role = useAuthStore((s) => s.user?.role)
  if (!role) return <Navigate to="/dang-nhap" state={{ from: '/tin-nhan' }} />
  if (role === 'admin') {
    return (
      <section className="shell py-section-sm">
        <p className="max-w-xl font-display text-xl font-medium text-page-fg">
          Tin nhắn dành cho người tìm việc và nhà tuyển dụng.
        </p>
        <Link to="/admin" className={cn('mt-4 inline-block rounded-control text-sm underline underline-offset-4', FOCUS)}>
          Về khu quản trị
        </Link>
      </section>
    )
  }
  return <Inbox viewer={role === 'jobseeker' ? 'seeker' : 'recruiter'} />
}

function Inbox({ viewer }: { viewer: Side }) {
  const conversations = useConversations(viewer)
  const [params, setParams] = useSearchParams()
  const c = params.get('c')
  const active = conversations.find((x) => x.key === c) ?? null

  // Desktop: chưa chọn thì mở hội thoại đầu (mobile vẫn hiện danh sách vì chỉ lg+ mới coi là "đã chọn")
  const fallback = !active ? conversations[0] : null

  const select = (x: ConversationSummary) => setParams({ c: x.key }, { replace: true })
  const back = () => setParams({}, { replace: true })

  // Đường dẫn sâu trỏ tới hội thoại không tồn tại → bỏ `c`
  useEffect(() => {
    if (c && !active && conversations.length > 0) setParams({}, { replace: true })
  }, [c, active, conversations.length, setParams])

  const shown = active ?? fallback

  return (
    <div className="shell h-[calc(100svh-4rem)] py-4 lg:py-6">
      <div className="grid h-full min-h-0 grid-cols-1 gap-8 lg:grid-cols-[340px_minmax(0,1fr)]">
        <div className={cn('min-h-0', active ? 'hidden lg:block' : 'block')}>
          <ConversationList viewer={viewer} conversations={conversations} activeKey={shown?.key ?? null} onSelect={select} />
        </div>
        <div className={cn('min-h-0', active ? 'block' : 'hidden lg:block')}>
          {shown ? (
            <ChatPane key={shown.key} viewer={viewer} jobId={shown.jobId} seekerId={shown.seekerId} onBack={back} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center text-page-muted">
              <MessageSquare aria-hidden="true" className="h-6 w-6" />
              <p className="mt-3 text-sm">Chọn một cuộc trò chuyện để bắt đầu.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
