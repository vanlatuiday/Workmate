import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, SendHorizontal } from 'lucide-react'
import InterviewAction from '@components/interview/InterviewAction'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { markConversationRead, useActiveInterview, sendMessage, useIsTyping, useMessages, type Side } from '@services/connectionService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { describeConversation } from './describe'
import FadeIn from './FadeIn'

const QUICK_REPLIES: Record<Side, string[]> = {
  seeker: ['Em rảnh các tối trong tuần ạ', 'Em có thể đến phỏng vấn khi nào ạ?', 'Em cảm ơn ạ!'],
  recruiter: ['Bạn có thể đi làm thử tuần sau không?', 'Mình gửi lịch phỏng vấn nhé', 'Cảm ơn bạn!'],
}

const pad = (n: number) => String(n).padStart(2, '0')
const timeOf = (iso: string) => {
  const d = new Date(iso)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const dayKey = (iso: string) => new Date(iso).toDateString()
function dayLabel(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Hôm nay'
  if (d.toDateString() === yesterday.toDateString()) return 'Hôm qua'
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`
}

type Props = { viewer: Side; jobId: string; seekerId: string; onBack: () => void }

/** Cột phải: đầu khung, vùng tin nhắn cuộn, trả lời nhanh và ô soạn. */
export default function ChatPane({ viewer, jobId, seekerId, onBack }: Props) {
  const info = describeConversation(viewer, jobId, seekerId)
  const messages = useMessages(jobId, seekerId)
  const typing = useIsTyping(viewer, jobId, seekerId)
  const reduced = useReducedMotion()
  const hasInterview = !!useActiveInterview(jobId, seekerId)
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  // Tin có sẵn lúc mở hội thoại thì không trượt lên; chỉ tin đến sau mới có hiệu ứng
  const initialIds = useRef(new Set(messages.map((m) => m.id)))
  const lastId = messages[messages.length - 1]?.id

  // Đang mở là coi như đã đọc, kể cả khi tin mới đến
  useEffect(() => {
    markConversationRead(viewer, jobId, seekerId)
  }, [viewer, jobId, seekerId, lastId])

  // Tự cuộn xuống cuối khi có tin mới / phía kia đang gõ
  useLayoutEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: reduced ? 'auto' : 'smooth' })
  }, [lastId, typing, reduced])

  // Ô soạn tự giãn, tối đa ~5 dòng
  useLayoutEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [draft])

  const send = (text: string) => {
    const body = text.trim()
    if (!body) return
    sendMessage(viewer, jobId, seekerId, body)
    setDraft('')
  }
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      send(draft)
    }
  }

  // Gắn nhãn ngày vào tin đầu tiên của mỗi ngày
  const rows = useMemo(
    () => messages.map((m, i) => ({ m, label: i === 0 || dayKey(messages[i - 1].at) !== dayKey(m.at) ? dayLabel(m.at) : null })),
    [messages],
  )

  return (
    <FadeIn className="flex h-full min-h-0 flex-col">
      <header className="flex items-center gap-3 border-b border-page-line pb-4">
        <button type="button" onClick={onBack} className={cn('flex items-center gap-1 rounded-control text-sm text-page-muted hover:text-page-fg lg:hidden', FOCUS)}>
          <ArrowLeft aria-hidden="true" className="h-4 w-4" />
          Quay lại
        </button>
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-page-edge text-sm font-medium text-page-fg">
          {info.initials}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-page-fg">{info.name}</h2>
          <p className="truncate text-xs text-page-muted">{info.subtitle}</p>
        </div>
        <Link to={info.profileHref} className={cn('shrink-0 rounded-control text-sm text-page-muted underline underline-offset-4 hover:text-page-fg', FOCUS)}>
          {info.profileLabel}
        </Link>
      </header>

      {/* Phỏng vấn: nút / chip trạng thái theo vai trò (không hiện gì khi người tìm việc chưa có lời mời) */}
      {(viewer === 'recruiter' || hasInterview) && (
        <div className="flex flex-wrap items-center gap-2 border-b border-page-line py-3">
          <InterviewAction viewer={viewer} jobId={jobId} seekerId={seekerId} compact />
        </div>
      )}

      <div ref={scrollRef} data-lenis-prevent className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain py-5" role="log" aria-live="polite" aria-label="Nội dung cuộc trò chuyện">
        {rows.length === 0 && <p className="py-10 text-center text-sm text-page-muted">Chưa có tin nhắn. Hãy chào trước nhé.</p>}
        {rows.map(({ m, label }) => {
          // Tin hệ thống (vd. lời mời phỏng vấn): dòng chữ nhỏ giữa khung, không phải bong bóng
          if (m.system) {
            return (
              <div key={m.id}>
                {label && <p className="py-2 text-center text-xs text-page-muted">{label}</p>}
                <p className="px-6 text-center text-xs text-page-muted">{m.text} · {timeOf(m.at)}</p>
              </div>
            )
          }
          const mine = m.from === viewer
          const bubble = (
            <div className={cn('flex flex-col', mine ? 'items-end' : 'items-start')}>
              <p
                className={cn(
                  'max-w-[80%] whitespace-pre-wrap break-words px-4 py-2.5 text-sm leading-relaxed',
                  mine ? 'rounded-card rounded-br-control bg-page-fg text-page-bg' : 'rounded-card rounded-bl-control border border-page-line bg-page-surface text-page-fg',
                )}
              >
                {m.text}
              </p>
              <span className="mt-1 text-xs text-page-muted">{timeOf(m.at)}</span>
            </div>
          )
          return (
            <div key={m.id}>
              {label && <p className="py-2 text-center text-xs text-page-muted">{label}</p>}
              {initialIds.current.has(m.id) ? bubble : <FadeIn rise>{bubble}</FadeIn>}
            </div>
          )
        })}
        {typing && (
          <div className="flex items-center gap-1 px-1" role="status">
            <span className="sr-only">Đối phương đang soạn tin</span>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                aria-hidden="true"
                style={{ animationDelay: `${i * 180}ms` }}
                className="h-2 w-2 animate-pulse rounded-full bg-page-muted motion-reduce:animate-none"
              />
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-page-line pt-3">
        <div className="mb-3 flex flex-wrap gap-2">
          {QUICK_REPLIES[viewer].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => send(q)}
              className={cn('rounded-full border border-page-edge px-3 py-1.5 text-xs text-page-fg transition-colors duration-300 hover:bg-page-surface', FOCUS)}
            >
              {q}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-2">
          <label className="flex-1">
            <span className="sr-only">Soạn tin nhắn</span>
            <textarea
              ref={inputRef}
              rows={1}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Nhập tin nhắn… (Enter để gửi, Shift+Enter xuống dòng)"
              className={cn('block w-full resize-none rounded-card border border-page-edge bg-page-bg px-4 py-2.5 text-sm text-page-fg placeholder:text-page-muted', FOCUS)}
            />
          </label>
          <button
            type="button"
            aria-label="Gửi"
            disabled={!draft.trim()}
            onClick={() => send(draft)}
            className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-page-fg text-page-bg transition-opacity duration-300 disabled:opacity-40', FOCUS)}
          >
            <SendHorizontal aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </FadeIn>
  )
}
