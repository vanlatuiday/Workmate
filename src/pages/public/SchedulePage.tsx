import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ArrowDown, ArrowUpRight, CalendarCheck2, CalendarDays, CalendarX, Clock3, MapPin, MessageCircle, Video } from 'lucide-react'
import { HireAction } from '@components/hire'
import ChooseSlotDialog from '@components/interview/ChooseSlotDialog'
import DialogShell from '@components/interview/DialogShell'
import PlaceText from '@components/interview/PlaceText'
import { MODE_LABEL } from '@components/interview/format'
import { EmptyState, StatusBadge } from '@components/dashboard'
import { useAuthStore } from '@context/authStore'
import { useConnectionStore } from '@context/connectionStore'
import FadeIn from '@components/motion/FadeIn'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { scrollToY } from '@hooks/useSmoothScroll'
import { cancelInterview, declineInterview, useInterviews, type Interview, type Side } from '@services/connectionService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { BTN_DANGER, BTN_PRIMARY, BTN_SECONDARY, BTN_SM } from '@utils/ui'
import { Tabs } from './match/parts'
import { describeConversation } from './messages/describe'
import MessageLink from '@components/messenger/MessageLink'
import { dayKey, getScheduleData, whenOf, type ScheduleTabKey } from './schedule/data'
import './schedule/schedule.css'

const TIME_ZONE = 'Asia/Ho_Chi_Minh'
const dateLabel = (iso: string | Date, options: Intl.DateTimeFormatOptions) => new Date(iso).toLocaleDateString('vi-VN', { timeZone: TIME_ZONE, ...options })
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString('vi-VN', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit' })
const slotLabel = (iso: string) => `${dateLabel(iso, { weekday: 'short', day: '2-digit', month: '2-digit' })} · ${timeLabel(iso)}`
const futureSlots = (iv: Interview, now: number) => iv.slots.filter((slot) => Date.parse(slot) > now)
const DIALOG_CLASS = 'theme-day schedule-dialog'

/** /lich-phong-van — lịch phỏng vấn của tài khoản đang đăng nhập. */
export default function SchedulePage() {
  const user = useAuthStore((s) => s.user)
  if (!user) return <Navigate to="/dang-nhap" state={{ from: '/lich-phong-van' }} />
  if (user.role === 'admin') {
    return (
      <section className="shell py-section-sm">
        <p className="max-w-xl font-display text-xl font-medium text-page-fg">Lịch phỏng vấn dành cho người tìm việc và nhà tuyển dụng.</p>
        <Link to="/admin" className={cn('mt-4 inline-block rounded-control text-sm underline underline-offset-4', FOCUS)}>Về khu quản trị</Link>
      </section>
    )
  }
  return <Schedule key={user.id} viewer={user.role === 'jobseeker' ? 'seeker' : 'recruiter'} />
}

function Schedule({ viewer }: { viewer: Side }) {
  const all = useInterviews()
  const hydrated = useConnectionStore((s) => s.hydrated)
  const reduced = useReducedMotion()
  const [tab, setTab] = useState<ScheduleTabKey>('upcoming')
  const [choosing, setChoosing] = useState<Interview | null>(null)
  const [cancelling, setCancelling] = useState<Interview | null>(null)
  const [declining, setDeclining] = useState<Interview | null>(null)
  const [now, setNow] = useState(Date.now)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  const { upcoming, pending, past, groups } = getScheduleData(all, now)
  const lists = { upcoming, pending, past }
  const today = dayKey(new Date(now))
  const days = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(now)
    day.setUTCDate(day.getUTCDate() + i)
    return day
  })
  const jump = (day: Date) => {
    const key = dayKey(day)
    setSelectedDay(key)
    setTab('upcoming')
    requestAnimationFrame(() => {
      const target = document.getElementById(`day-${key}`) ?? document.getElementById('schedule-list')
      if (target) scrollToY(window.scrollY + target.getBoundingClientRect().top - 112, !reduced)
    })
  }
  const choose = (iv: Interview) => {
    const slots = futureSlots(iv, Date.now())
    if (slots.length) setChoosing({ ...iv, slots })
    else setNow(Date.now())
  }
  const card = (iv: Interview) => (
    <InterviewCard key={iv.id} iv={iv} viewer={viewer} now={now} isPast={past.includes(iv)} onChoose={() => choose(iv)} onCancel={() => setCancelling(iv)} onDecline={() => setDeclining(iv)} />
  )
  const empty: Record<ScheduleTabKey, string> = {
    upcoming: 'Chưa có lịch phỏng vấn sắp tới',
    pending: 'Không có lời mời nào đang chờ xác nhận',
    past: 'Chưa có buổi phỏng vấn nào đã qua hoặc đã hủy',
  }

  return (
    <section className="schedule-page theme-day shell px-4 pb-12 pt-8 text-page-fg sm:px-6 md:px-10 md:pb-16 md:pt-10 lg:px-16" aria-labelledby="schedule-title" data-surface="light">
      <header className="mb-7 flex flex-wrap items-end justify-between gap-5 md:mb-8">
        <div className="max-w-2xl">
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-wm-ocean"><CalendarDays className="h-4 w-4" aria-hidden="true" />Lịch hẹn của bạn</p>
          <h1 id="schedule-title" className="font-display text-display-sm font-semibold tracking-tight">Lịch phỏng vấn</h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-page-muted sm:text-base">{viewer === 'seeker' ? 'Theo dõi lời mời, chọn khung giờ phù hợp và chuẩn bị cho cuộc gặp tiếp theo.' : 'Theo dõi các cuộc hẹn với ứng viên và giữ mọi trao đổi ở cùng một nơi.'}</p>
        </div>
        <p className="flex items-center gap-2 rounded-full border border-page-line bg-wm-day/80 px-4 py-2.5 text-sm capitalize text-page-muted"><CalendarDays className="h-4 w-4 shrink-0 text-wm-ocean" aria-hidden="true" />{dateLabel(new Date(now), { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:gap-8 xl:grid-cols-[minmax(0,1fr)_328px]">
        <div className="min-w-0">
          <div className="day-card rounded-card p-3 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display text-base font-semibold">7 ngày tới</h2>
              <p className="flex items-center gap-1.5 text-xs text-page-muted"><span className="h-1.5 w-1.5 rounded-full bg-wm-azure" aria-hidden="true" />Ngày có lịch đã xác nhận</p>
            </div>
            <ol className="grid grid-cols-7 gap-1 sm:gap-2" aria-label="7 ngày tới">
              {days.map((day, i) => {
                const key = dayKey(day)
                const count = upcoming.filter((iv) => dayKey(whenOf(iv)) === key).length
                const selected = key === (selectedDay ?? today)
                return (
                  <li key={key}>
                    <button type="button" onClick={() => jump(day)} aria-pressed={selected} aria-current={i === 0 ? 'date' : undefined} aria-label={`${dateLabel(day, { weekday: 'long', day: '2-digit', month: '2-digit' })}, ${hydrated ? `${count} lịch đã xác nhận` : 'đang tải lịch'}`} className={cn('flex min-h-[88px] w-full flex-col items-center justify-center rounded-card border text-page-fg transition-colors duration-fast motion-reduce:transition-none', selected ? 'border-wm-abyss bg-wm-abyss text-wm-day' : 'border-transparent bg-wm-day hover:border-page-edge hover:bg-wm-day-tint', FOCUS)}>
                      <span className={cn('text-[11px] sm:text-xs', selected ? 'text-wm-day' : 'text-page-muted')}>{i === 0 ? 'Nay' : dateLabel(day, { weekday: 'short' })}</span>
                      <span className="tnum mt-1 font-display text-xl font-semibold sm:text-2xl">{dateLabel(day, { day: '2-digit' })}</span>
                      <span aria-hidden="true" className={cn('mt-2 h-1.5 w-1.5 rounded-full', hydrated && count ? selected ? 'bg-wm-cyan' : 'bg-wm-azure' : 'bg-transparent')} />
                    </button>
                  </li>
                )
              })}
            </ol>
          </div>

          <FadeIn className="mt-6">
            <div id="schedule-list" className="scroll-mt-28" aria-busy={!hydrated}>
              {hydrated ? (
                <Tabs idPrefix="schedule" label="Nhóm lịch phỏng vấn" value={tab} onChange={(id) => setTab(id as ScheduleTabKey)} tabs={[
                  { id: 'upcoming', label: 'Sắp tới', count: upcoming.length },
                  { id: 'pending', label: 'Chờ xác nhận', count: pending.length },
                  { id: 'past', label: 'Đã qua / đã hủy', count: past.length },
                ]}>
                  {lists[tab].length === 0 ? (
                    <div className="day-card overflow-hidden rounded-card">
                      <EmptyState icon={CalendarX} title={empty[tab]} description={viewer === 'recruiter' ? 'Mời ứng viên đã kết nối phỏng vấn ở trang Kết nối hoặc Tin nhắn.' : 'Khi nhà tuyển dụng mời phỏng vấn, lịch sẽ hiện ở đây.'} action={<Link to="/match" className={cn(BTN_SECONDARY, 'min-h-11')}>Đến trang Kết nối<ArrowUpRight className="h-4 w-4" aria-hidden="true" /></Link>} />
                    </div>
                  ) : tab === 'upcoming' ? (
                    groups.map((group) => (
                      <div key={group.key} id={`day-${group.key}`} className="mb-7 scroll-mt-28 last:mb-0">
                        <div className="mb-3 flex items-center gap-3">
                          <h2 className="shrink-0 text-sm font-semibold capitalize">{group.key === today ? `Hôm nay · ${dateLabel(group.iso, { day: '2-digit', month: '2-digit' })}` : dateLabel(group.iso, { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</h2>
                          <span className="h-px flex-1 bg-page-line" aria-hidden="true" />
                          <span className="text-xs text-page-muted">{group.list.length} cuộc hẹn</span>
                        </div>
                        <ul className="space-y-4">{group.list.map(card)}</ul>
                      </div>
                    ))
                  ) : <ul className="space-y-4">{lists[tab].map(card)}</ul>}
                </Tabs>
              ) : (
                <div className="day-card rounded-card p-6 sm:p-8" role="status">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-wm-day-tint text-wm-ocean"><CalendarDays className="h-5 w-5" aria-hidden="true" /></div>
                  <p className="font-display text-lg font-semibold">Đang tải lịch phỏng vấn…</p>
                  <p className="mt-2 text-sm leading-relaxed text-page-muted">Các cuộc hẹn và lời mời của bạn sẽ hiện tại đây.</p>
                </div>
              )}
            </div>
          </FadeIn>
        </div>

        <aside className="hidden min-w-0 space-y-4 lg:sticky lg:top-28 lg:block" aria-label="Cuộc hẹn tiếp theo">
          <NearestInterview iv={hydrated ? upcoming[0] : undefined} viewer={viewer} hydrated={hydrated} onJump={() => upcoming[0] && jump(new Date(whenOf(upcoming[0])))} />
          <div className="rounded-card border border-page-line bg-wm-day/80 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold"><MessageCircle className="h-4 w-4 text-wm-ocean" aria-hidden="true" />Giữ liên lạc trước cuộc hẹn</div>
            <p className="mt-2 text-sm leading-relaxed text-page-muted">{viewer === 'seeker' ? 'Cần đổi giờ hoặc hỏi thêm về buổi phỏng vấn? Nhắn cho nhà tuyển dụng ngay trong thẻ lịch.' : 'Trao đổi trước với ứng viên về thời gian, địa điểm và những điều cần chuẩn bị.'}</p>
          </div>
        </aside>
      </div>

      {choosing && <ChooseSlotDialog className={DIALOG_CLASS} timeZone={TIME_ZONE} interview={choosing} onClose={() => setChoosing(null)} />}
      {cancelling && <CancelDialog iv={cancelling} onClose={() => setCancelling(null)} />}
      {declining && <DeclineDialog iv={declining} onClose={() => setDeclining(null)} />}
    </section>
  )
}

function InterviewCard({ iv, viewer, now, isPast, onChoose, onCancel, onDecline }: { iv: Interview; viewer: Side; now: number; isPast: boolean; onChoose: () => void; onCancel: () => void; onDecline: () => void }) {
  const info = describeConversation(viewer, iv.jobId, iv.seekerId)
  const ModeIcon = iv.mode === 'online' ? Video : MapPin
  const pending = iv.status === 'pending'
  const available = futureSlots(iv, now)
  const date = whenOf(iv)
  const badge = iv.status === 'confirmed'
    ? isPast ? <StatusBadge tone="muted">Đã diễn ra</StatusBadge> : <StatusBadge tone="strong" className="border-wm-ocean bg-wm-ocean">Đã xác nhận</StatusBadge>
    : pending ? <StatusBadge className="border-wm-ocean/20 bg-wm-day-tint text-wm-ocean">Chờ xác nhận</StatusBadge>
      : <StatusBadge tone="muted">{iv.status === 'declined' ? 'Đã từ chối' : 'Đã hủy'}</StatusBadge>

  return (
    <li className="day-card overflow-hidden rounded-card">
      <article className="p-4 sm:p-5" aria-label={`Phỏng vấn ${info.name}, ${info.subtitle}`}>
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="flex w-14 shrink-0 flex-col items-center rounded-card bg-wm-day-tint py-2.5 text-wm-ocean sm:w-16" aria-hidden="true">
            {pending ? <CalendarDays className="my-2 h-7 w-7" strokeWidth={1.5} /> : <><span className="tnum font-display text-2xl font-semibold leading-none">{dateLabel(date, { day: '2-digit' })}</span><span className="mt-1 text-xs">Tháng {dateLabel(date, { month: 'numeric' })}</span></>}
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">{badge}<span className="text-xs text-page-muted">{pending ? 'Lời mời phỏng vấn' : MODE_LABEL[iv.mode]}</span></div>
            <h3 className="break-words font-display text-lg font-semibold leading-snug sm:text-xl">{info.name}</h3>
            <p className="mt-1 break-words text-sm leading-relaxed text-page-muted">{info.subtitle}</p>
          </div>
        </div>

        <div className="mt-4 border-t border-page-line pt-4">
          {pending ? (
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-medium"><Clock3 className="h-4 w-4 shrink-0 text-wm-ocean" aria-hidden="true" />{iv.slots.length} khung giờ đề xuất</p>
              <ul className="flex flex-wrap gap-2" aria-label="Khung giờ đề xuất">{iv.slots.map((slot) => <li key={slot} className={cn('rounded-control bg-wm-day px-3 py-2 text-xs capitalize', Date.parse(slot) <= now && 'text-page-muted')}><time dateTime={slot}>{slotLabel(slot)}</time>{Date.parse(slot) <= now && <span> · Đã qua</span>}</li>)}</ul>
              {!available.length && <p className="mt-3 text-sm leading-relaxed text-page-muted">Các khung giờ đề xuất đã qua. {viewer === 'seeker' ? 'Nhắn nhà tuyển dụng để thống nhất giờ mới.' : 'Nhắn ứng viên để thống nhất một lời mời mới.'}</p>}
            </div>
          ) : <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium"><Clock3 className="h-4 w-4 shrink-0 text-wm-ocean" aria-hidden="true" /><time dateTime={date} className="capitalize">{slotLabel(date)}</time></p>}
          <div className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-page-muted"><ModeIcon className="mt-0.5 h-4 w-4 shrink-0 text-wm-ocean" aria-hidden="true" /><p className="min-w-0 [overflow-wrap:anywhere]"><span className="font-medium text-page-fg">{MODE_LABEL[iv.mode]}</span><span aria-hidden="true"> · </span><PlaceText place={iv.place} /></p></div>
          {iv.note && <p className="mt-3 rounded-control bg-wm-day px-3 py-2.5 text-sm leading-relaxed text-page-muted [overflow-wrap:anywhere]"><span className="font-medium text-page-fg">Ghi chú: </span>{iv.note}</p>}
        </div>

        <div className="schedule-actions mt-4 flex flex-wrap gap-2">
          {viewer === 'seeker' && pending && available.length > 0 && <button type="button" onClick={onChoose} className={cn(BTN_PRIMARY, BTN_SM, 'min-h-11')}>Chọn giờ<span className="sr-only"> phỏng vấn {info.name}</span></button>}
          {viewer === 'seeker' && pending && !available.length && <button type="button" onClick={onDecline} className={cn(BTN_DANGER, BTN_SM, 'min-h-11')}>Từ chối lời mời<span className="sr-only"> phỏng vấn {info.name}</span></button>}
          {viewer === 'recruiter' && !isPast && (pending || iv.status === 'confirmed') && <button type="button" onClick={onCancel} className={cn(BTN_DANGER, BTN_SM, 'min-h-11')}>Hủy lịch<span className="sr-only"> phỏng vấn {info.name}</span></button>}
          {viewer === 'recruiter' && iv.status === 'confirmed' && <HireAction viewer="recruiter" jobId={iv.jobId} seekerId={iv.seekerId} compact />}
          <MessageLink convKey={`${iv.jobId}|${iv.seekerId}`} className={cn(BTN_SECONDARY, BTN_SM, 'min-h-11')}><MessageCircle className="h-4 w-4" aria-hidden="true" />Nhắn tin<span className="sr-only"> {info.name}</span></MessageLink>
        </div>
      </article>
    </li>
  )
}

function NearestInterview({ iv, viewer, hydrated, onJump }: { iv?: Interview; viewer: Side; hydrated: boolean; onJump: () => void }) {
  const info = iv && describeConversation(viewer, iv.jobId, iv.seekerId)
  return (
    <div className="day-card overflow-hidden rounded-card">
      <div className="flex items-center gap-2 border-b border-page-line bg-wm-day-tint px-5 py-4"><CalendarCheck2 className="h-5 w-5 text-wm-ocean" aria-hidden="true" /><h2 className="font-display text-base font-semibold">Cuộc hẹn gần nhất</h2></div>
      {iv && info ? (
        <div className="p-5">
          <p className="text-sm capitalize text-page-muted">{dateLabel(whenOf(iv), { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
          <p className="tnum mt-2 font-display text-4xl font-semibold tracking-tight text-wm-ocean">{timeLabel(whenOf(iv))}</p>
          <StatusBadge className="mt-3 border-wm-ocean/20 bg-wm-day-tint text-wm-ocean">Đã xác nhận</StatusBadge>
          <p className="mt-5 break-words font-display text-lg font-semibold">{info.name}</p>
          <p className="mt-1 text-sm leading-relaxed text-page-muted">{info.subtitle}</p>
          <div className="mt-4 rounded-card bg-wm-day p-3 text-sm leading-relaxed"><p className="mb-1 font-medium">{MODE_LABEL[iv.mode]}</p><p className="text-page-muted [overflow-wrap:anywhere]"><PlaceText place={iv.place} /></p></div>
          <button type="button" onClick={onJump} className={cn(BTN_SECONDARY, 'mt-5 min-h-11 w-full')}>Đến cuộc hẹn<ArrowDown className="h-4 w-4" aria-hidden="true" /></button>
        </div>
      ) : <div className="p-5"><p className="font-medium">{hydrated ? 'Chưa có cuộc hẹn sắp tới' : 'Đang tải cuộc hẹn…'}</p><p className="mt-2 text-sm leading-relaxed text-page-muted">Lịch đã xác nhận gần nhất sẽ được hiển thị tại đây.</p></div>}
    </div>
  )
}

function DeclineDialog({ iv, onClose }: { iv: Interview; onClose: () => void }) {
  const info = describeConversation('seeker', iv.jobId, iv.seekerId)
  return (
    <DialogShell className={DIALOG_CLASS} titleId="decline-interview-title" title="Từ chối lời mời phỏng vấn?" subtitle={`${info.name} · ${info.subtitle}`} onClose={onClose}>
      <p className="rounded-card bg-wm-day-tint p-4 text-sm leading-relaxed text-page-muted">Các khung giờ đề xuất đã qua. Nhà tuyển dụng sẽ nhận được thông báo khi bạn từ chối lời mời này.</p>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onClose} className={cn(BTN_SECONDARY, BTN_SM, 'min-h-11')}>Giữ lời mời</button>
        <button type="button" onClick={() => { declineInterview(iv.id); onClose() }} className={cn(BTN_DANGER, BTN_SM, 'min-h-11')}>Từ chối lời mời</button>
      </div>
    </DialogShell>
  )
}

/** Xác nhận hủy lịch (thay window.confirm). */
function CancelDialog({ iv, onClose }: { iv: Interview; onClose: () => void }) {
  const info = describeConversation('recruiter', iv.jobId, iv.seekerId)
  return (
    <DialogShell className={DIALOG_CLASS} titleId="cancel-title" title="Hủy lịch phỏng vấn?" subtitle={`${info.name} · ${info.subtitle}`} onClose={onClose}>
      <p className="rounded-card bg-wm-day-tint p-4 text-sm leading-relaxed text-page-muted">Ứng viên sẽ nhận được thông báo và buổi phỏng vấn này sẽ chuyển sang “Đã hủy”.</p>
      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" onClick={onClose} className={cn(BTN_SECONDARY, BTN_SM, 'min-h-11')}>Giữ lịch</button>
        <button type="button" onClick={() => { cancelInterview(iv.id); onClose() }} className={cn(BTN_DANGER, BTN_SM, 'min-h-11')}>Hủy lịch</button>
      </div>
    </DialogShell>
  )
}
