import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Bell, CheckCheck, Clock3 } from 'lucide-react'
import { EmptyState } from '@components/dashboard'
import { SkeletonList } from '@components/dashboard/Skeleton'
import { useConnectionStore } from '@context/connectionStore'
import { useCatalogStore } from '@context/catalogStore'
import { useMediaQuery } from '@hooks/useMediaQuery'
import { useConnectionsReady, useNotifications, type Side } from '@services/connectionService'
import { CHIP, CHIP_OFF, CHIP_ON } from '@utils/ui'
import { cn } from '@utils/cn'
import NotificationList from './NotificationList'
import { groupNotifications } from './notificationGroups'

type Tab = 'actions' | 'updates'

export default function NotificationBoard({ viewer, open, onNavigate }: { viewer: Side; open: boolean; onNavigate: () => void }) {
  const notifications = useNotifications(viewer)
  const ready = useConnectionsReady()
  const interviews = useConnectionStore((s) => s.interviews)
  const hires = useConnectionStore((s) => s.hires)
  const interests = useConnectionStore((s) => s.interests)
  const connections = useConnectionStore((s) => s.connections)
  const jobs = useCatalogStore((s) => s.jobs)
  const wide = useMediaQuery('(min-width: 1024px)')
  const [tab, setTab] = useState<Tab | null>(null)
  const [now, setNow] = useState(Date.now)
  const refs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({})
  const groups = groupNotifications({ viewer, notifications, interviews, hires, interests, connections, jobs, now })
  const activeTab = tab ?? (groups.actions.length ? 'actions' : 'updates')

  useEffect(() => {
    if (!open) return
    setNow(Date.now())
    const timer = window.setInterval(() => setNow(Date.now()), 30000)
    return () => window.clearInterval(timer)
  }, [open])
  useEffect(() => {
    if (!open) setTab(null)
    else if (ready) setTab((value) => value ?? (groups.actions.length ? 'actions' : 'updates'))
  }, [open, ready, groups.actions.length])

  const columns = [
    { id: 'actions' as const, title: 'Cần phản hồi', description: 'Những việc đang chờ bạn xử lý', icon: Clock3, emptyIcon: CheckCheck, emptyTitle: 'Không có việc cần phản hồi', emptyDescription: 'Các lời mời còn hiệu lực hoặc hồ sơ cần xem sẽ xuất hiện tại đây.' },
    { id: 'updates' as const, title: 'Cập nhật', description: 'Hoạt động và lời mời đã xử lý hoặc hết hạn', icon: Bell, emptyIcon: Bell, emptyTitle: 'Chưa có cập nhật', emptyDescription: 'Kết nối, gợi ý phù hợp và các hoạt động mới sẽ xuất hiện tại đây.' },
  ]
  const changeTabByKey = (e: KeyboardEvent<HTMLDivElement>) => {
    let next: Tab
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') next = activeTab === 'actions' ? 'updates' : 'actions'
    else if (e.key === 'Home') next = 'actions'
    else if (e.key === 'End') next = 'updates'
    else return
    e.preventDefault()
    setTab(next)
    refs.current[next]?.focus()
  }

  return <div className="flex min-h-0 flex-1 flex-col">
    {!wide && <div role="tablist" aria-label="Loại thông báo" className="grid shrink-0 grid-cols-2 gap-2 border-b border-page-line px-4 py-3 sm:px-5" onKeyDown={changeTabByKey}>
      {columns.map(({ id, title }) => <button key={id} ref={(el) => { refs.current[id] = el }} id={`notification-${id}-tab`} type="button" role="tab" aria-selected={activeTab === id} aria-controls={`notification-${id}-panel`} tabIndex={activeTab === id ? 0 : -1} onClick={() => setTab(id)} className={cn(CHIP, activeTab === id ? CHIP_ON : CHIP_OFF, 'min-h-11 min-w-0 justify-center px-2 text-xs sm:text-sm')}>
        {title}<span className="rounded-full bg-page-surface px-1.5 text-xs text-page-fg">{ready ? groups[id].length : '…'}</span>
      </button>)}
    </div>}
    <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-2 lg:divide-x lg:divide-page-line">
      {columns.map(({ id, title, description, icon: Icon, emptyIcon, emptyTitle, emptyDescription }) => (
        <section key={id} id={`notification-${id}-panel`} role={wide ? 'region' : 'tabpanel'} aria-labelledby={`notification-${id}-${wide ? 'heading' : 'tab'}`} tabIndex={wide ? undefined : 0} className={cn('min-h-0 flex-col outline-none', !wide && activeTab !== id ? 'hidden' : 'flex')}>
          <div className="shrink-0 px-4 pb-3 pt-4 sm:px-5">
            <h3 id={`notification-${id}-heading`} className="flex items-center gap-2 text-sm font-semibold text-page-fg"><Icon aria-hidden="true" className="h-4 w-4 text-accent-ink" />{title}<span className="rounded-full bg-page-surface px-2 py-0.5 text-xs text-page-muted">{ready ? groups[id].length : '…'}</span></h3>
            <p className="mt-1 text-xs leading-5 text-page-muted">{description}</p>
          </div>
          <div data-lenis-prevent className="notification-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-5 sm:pb-5">
            {!ready ? <SkeletonList rows={3} label={`Đang tải ${title.toLowerCase()}…`} /> : groups[id].length ? <NotificationList viewer={viewer} entries={groups[id]} onNavigate={onNavigate} /> : <EmptyState icon={emptyIcon} title={emptyTitle} description={emptyDescription} />}
          </div>
        </section>
      ))}
    </div>
  </div>
}
