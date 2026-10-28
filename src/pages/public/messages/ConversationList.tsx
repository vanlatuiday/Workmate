import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageSquare, Search } from 'lucide-react'
import { EmptyState } from '@components/dashboard'
import type { ConversationSummary, Side } from '@services/connectionService'
import { formatRelativeTime } from '@utils/format'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { describeConversation } from './describe'

type Props = {
  viewer: Side
  conversations: ConversationSummary[]
  activeKey: string | null
  onSelect: (c: ConversationSummary) => void
}

/** Cột trái: ô lọc theo tên + danh sách hội thoại (tin cuối, giờ, chưa đọc). */
export default function ConversationList({ viewer, conversations, activeKey, onSelect }: Props) {
  const [query, setQuery] = useState('')

  const items = useMemo(() => {
    const q = query.trim().toLowerCase()
    return conversations
      .map((c) => ({ c, info: describeConversation(viewer, c.jobId, c.seekerId) }))
      .filter(({ info }) => !q || info.name.toLowerCase().includes(q))
  }, [conversations, query, viewer])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="px-1 pb-4">
        <h1 className="font-display text-2xl font-semibold text-page-fg">Tin nhắn</h1>
        <label className="relative mt-4 block">
          <span className="sr-only">Lọc theo tên</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-page-muted" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Lọc theo tên"
            className={cn('w-full rounded-card border border-page-edge bg-page-bg py-2.5 pl-9 pr-3 text-sm text-page-fg placeholder:text-page-muted', FOCUS)}
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" data-lenis-prevent>
        {conversations.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="Chưa có cuộc trò chuyện nào"
            description="Kết nối ở trang Kết nối để bắt đầu."
            action={
              <Link to="/match" className={cn('rounded-control text-sm underline underline-offset-4 text-page-fg', FOCUS)}>
                Đến trang Kết nối
              </Link>
            }
          />
        ) : items.length === 0 ? (
          <p className="px-2 py-6 text-sm text-page-muted">Không có cuộc trò chuyện khớp “{query}”.</p>
        ) : (
          <ul className="space-y-1">
            {items.map(({ c, info }) => (
              <li key={c.key}>
                <button
                  type="button"
                  onClick={() => onSelect(c)}
                  aria-current={c.key === activeKey ? 'true' : undefined}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-card px-3 py-3 text-left transition-colors duration-300 hover:bg-page-surface',
                    c.key === activeKey && 'bg-page-surface',
                    FOCUS,
                  )}
                >
                  <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-page-edge text-sm font-medium text-page-fg">
                    {info.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className={cn('truncate text-sm text-page-fg', c.unread > 0 ? 'font-semibold' : 'font-medium')}>{info.name}</span>
                      <span className="shrink-0 text-xs text-page-muted">{formatRelativeTime(c.last?.at ?? c.at)}</span>
                    </span>
                    <span className="block truncate text-xs text-page-muted">{info.subtitle}</span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span className={cn('truncate text-sm', c.unread > 0 ? 'text-page-fg' : 'text-page-muted')}>
                        {c.last ? `${c.last.from === viewer ? 'Bạn: ' : ''}${c.last.text}` : 'Chưa có tin nhắn — hãy chào trước'}
                      </span>
                      {c.unread > 0 && (
                        <span className="shrink-0 rounded-full bg-page-fg px-2 text-xs font-medium text-page-bg">
                          {c.unread}
                          <span className="sr-only"> tin chưa đọc</span>
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
