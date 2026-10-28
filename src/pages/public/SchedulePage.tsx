import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { CalendarX, MapPin, Video } from 'lucide-react'
import ChooseSlotDialog from '@components/interview/ChooseSlotDialog'
import DialogShell from '@components/interview/DialogShell'
import { fmtSlot, MODE_LABEL } from '@components/interview/format'
import { EmptyState, StatusBadge } from '@components/dashboard'
import { useAuthStore } from '@context/authStore'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { cancelInterview, useInterviews, type Interview, type Side } from '@services/connectionService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { Tabs } from './match/parts'
import { describeConversation } from './messages/describe'

type TabKey = 'upcoming' | 'pending' | 'past'

const dayKey = (iso: string | Date) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}
const whenOf = (iv: Interview) => iv.chosen ?? iv.slots[0]
const BTN = cn('inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-300', FOCUS)
const BTN_SOLID = cn(BTN, 'border-page-fg bg-page-fg text-page-bg hover:bg-page-bg hover:text-page-fg')
const BTN_LINE = cn(BTN, 'border-page-line text-page-fg hover:border-page-fg')

/** /lich-phong-van — lịch phỏng vấn của tài khoản demo (kho demo, chưa có backend). */
export default function SchedulePage() {
  const role = useAuthStore((s) => s.user?.role)
  if (!role) return <Navigate to="/dang-nhap" state={{ from: '/lich-phong-van' }} />
  if (role === 'admin') {
    return (
      <section className="shell py-section-sm">
        <p className="max-w-xl font-display text-xl font-medium text-page-fg">Lịch phỏng vấn dành cho người tìm việc và nhà tuyển dụng.</p>
        <Link to="/admin" className={cn('mt-4 inline-block rounded-control text-sm underline underline-offset-4', FOCUS)}>
          Về khu quản trị
        </Link>
      </section>
    )
  }
  return <Schedule viewer={role === 'jobseeker' ? 'seeker' : 'recruiter'} />
}

function Schedule({ viewer }: { viewer: Side }) {
  const all = useInterviews(viewer)
  const reduced = useReducedMotion()
  const [tab, setTab] = useState<TabKey>('upcoming')
  const [choosing, setChoosing] = useState<Interview | null>(null)
  const [cancelling, setCancelling] = useState<Interview | null>(null)

  const now = Date.now()
  const upcoming = all.filter((iv) => iv.status === 'confirmed' && new Date(whenOf(iv)).getTime() >= now)
  const pending = all.filter((iv) => iv.status === 'pending')
  const past = all
    .filter((iv) => !upcoming.includes(iv) && !pending.includes(iv))
    .sort((a, b) => whenOf(b).localeCompare(whenOf(a)))
  const lists: Record<TabKey, Interview[]> = { upcoming, pending, past }

  // Dải tuần: 7 ngày từ hôm nay, chấm ở ngày có lịch đã xác nhận
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d
  })
  const hasEvent = (d: Date) => upcoming.some((iv) => dayKey(whenOf(iv)) === dayKey(d))
  const jump = (d: Date) => {
    setTab('upcoming')
    // Chờ danh sách "Sắp tới" hiện rồi mới cuộn tới nhóm ngày
    requestAnimationFrame(() => document.getElementById(`day-${dayKey(d)}`)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }))
  }

  // Nhóm theo ngày chỉ dùng cho tab "Sắp tới"
  const groups = upcoming.reduce<{ key: string; iso: string; list: Interview[] }[]>((acc, iv) => {
    const k = dayKey(whenOf(iv))
    const g = acc.find((x) => x.key === k)
    if (g) g.list.push(iv)
    else acc.push({ key: k, iso: whenOf(iv), list: [iv] })
    return acc
  }, [])

  const card = (iv: Interview) => (
    <InterviewCard
      key={iv.id}
      iv={iv}
      viewer={viewer}
      isPast={past.includes(iv)}
      onChoose={() => setChoosing(iv)}
      onCancel={() => setCancelling(iv)}
    />
  )

  const empty: Record<TabKey, string> = {
    upcoming: 'Chưa có lịch phỏng vấn sắp tới',
    pending: 'Không có lời mời nào đang chờ xác nhận',
    past: 'Chưa có buổi phỏng vấn nào đã qua hoặc đã hủy',
  }

  return (
    <section className="shell py-section-sm" aria-labelledby="schedule-title">
      <div className="mx-auto max-w-3xl">
        <h1 id="schedule-title" className="font-display text-display-sm font-semibold text-page-fg">Lịch phỏng vấn</h1>

        <ol className="mt-8 grid grid-cols-7 gap-1.5 sm:gap-2" aria-label="7 ngày tới">
          {days.map((d, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => jump(d)}
                className={cn(
                  'flex w-full flex-col items-center rounded-card border py-2.5 text-page-fg transition-colors duration-300 hover:border-page-fg',
                  i === 0 ? 'border-page-fg' : 'border-page-line',
                  FOCUS,
                )}
              >
                <span className="text-xs capitalize text-page-muted">{i === 0 ? 'Nay' : d.toLocaleDateString('vi-VN', { weekday: 'short' })}</span>
                <span className="tnum font-display text-lg font-semibold">{d.getDate()}</span>
                <span aria-hidden="true" className={cn('mt-1 h-1.5 w-1.5 rounded-full', hasEvent(d) ? 'bg-page-fg' : 'bg-transparent')} />
                {hasEvent(d) && <span className="sr-only">Có lịch phỏng vấn</span>}
              </button>
            </li>
          ))}
        </ol>

        <div className="mt-8">
          <Tabs
            idPrefix="schedule"
            label="Nhóm lịch phỏng vấn"
            value={tab}
            onChange={(id) => setTab(id as TabKey)}
            tabs={[
              { id: 'upcoming', label: 'Sắp tới', count: upcoming.length },
              { id: 'pending', label: 'Chờ xác nhận', count: pending.length },
              { id: 'past', label: 'Đã qua / đã hủy', count: past.length },
            ]}
          >
            {lists[tab].length === 0 ? (
              <EmptyState icon={CalendarX} title={empty[tab]} description={viewer === 'recruiter' ? 'Mời ứng viên đã kết nối phỏng vấn ở trang Kết nối hoặc Tin nhắn.' : 'Khi doanh nghiệp mời phỏng vấn, lịch sẽ hiện ở đây.'} />
            ) : tab === 'upcoming' ? (
              groups.map((g) => (
                <div key={g.key} id={`day-${g.key}`} className="mb-8 scroll-mt-24">
                  <h2 className="mb-3 text-sm font-medium capitalize text-page-muted">
                    {dayKey(g.iso) === dayKey(new Date()) ? 'Hôm nay' : new Date(g.iso).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                  </h2>
                  <ul className="space-y-3">{g.list.map(card)}</ul>
                </div>
              ))
            ) : (
              <ul className="space-y-3">{lists[tab].map(card)}</ul>
            )}
          </Tabs>
        </div>
      </div>

      {choosing && <ChooseSlotDialog interview={choosing} onClose={() => setChoosing(null)} />}
      {cancelling && <CancelDialog iv={cancelling} onClose={() => setCancelling(null)} />}
    </section>
  )
}

function InterviewCard({ iv, viewer, isPast, onChoose, onCancel }: { iv: Interview; viewer: Side; isPast: boolean; onChoose: () => void; onCancel: () => void }) {
  const info = describeConversation(viewer, iv.jobId, iv.seekerId)
  const ModeIcon = iv.mode === 'online' ? Video : MapPin
  const badge =
    iv.status === 'confirmed'
      ? isPast ? <StatusBadge tone="muted">Đã diễn ra</StatusBadge> : <StatusBadge tone="strong">Đã xác nhận</StatusBadge>
      : iv.status === 'pending' ? <StatusBadge>Chờ xác nhận</StatusBadge>
      : <StatusBadge tone="muted">{iv.status === 'declined' ? 'Đã từ chối' : 'Đã hủy'}</StatusBadge>

  return (
    <li className="rounded-card border border-page-line p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="font-display text-xl font-semibold capitalize text-page-fg">
          {iv.status === 'pending' ? `${iv.slots.length} khung giờ đề xuất` : fmtSlot(whenOf(iv))}
        </p>
        {badge}
      </div>
      <p className="mt-2 text-sm font-medium text-page-fg">
        {info.name} <span className="font-normal text-page-muted">· {info.subtitle}</span>
      </p>
      <p className="mt-1 flex items-start gap-1.5 text-sm text-page-muted">
        <ModeIcon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>{MODE_LABEL[iv.mode]} · {iv.place}</span>
      </p>
      {iv.note && <p className="mt-2 text-sm leading-relaxed text-page-muted">{iv.note}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {viewer === 'seeker' && iv.status === 'pending' && (
          <button type="button" onClick={onChoose} className={BTN_SOLID}>
            Chọn giờ<span className="sr-only"> phỏng vấn {info.name}</span>
          </button>
        )}
        {viewer === 'recruiter' && !isPast && (iv.status === 'pending' || iv.status === 'confirmed') && (
          <button type="button" onClick={onCancel} className={BTN_LINE}>
            Hủy lịch<span className="sr-only"> phỏng vấn {info.name}</span>
          </button>
        )}
        <Link to={`/tin-nhan?c=${iv.jobId}|${iv.seekerId}`} className={BTN_LINE}>
          Nhắn tin<span className="sr-only"> {info.name}</span>
        </Link>
      </div>
    </li>
  )
}

/** Xác nhận hủy lịch (thay window.confirm) */
function CancelDialog({ iv, onClose }: { iv: Interview; onClose: () => void }) {
  const info = describeConversation('recruiter', iv.jobId, iv.seekerId)
  return (
    <DialogShell titleId="cancel-title" title="Hủy lịch phỏng vấn?" subtitle={`${info.name} · ${info.subtitle}`} onClose={onClose}>
      <p className="text-sm leading-relaxed text-page-muted">Ứng viên sẽ nhận được thông báo và buổi phỏng vấn này sẽ chuyển sang "Đã hủy".</p>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onClose} className={BTN_LINE}>Giữ lịch</button>
        <button
          type="button"
          onClick={() => {
            cancelInterview(iv.id)
            onClose()
          }}
          className={BTN_SOLID}
        >
          Hủy lịch
        </button>
      </div>
    </DialogShell>
  )
}
