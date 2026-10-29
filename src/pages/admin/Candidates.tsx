import { useId, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Lock, LockOpen, Search, UserCircle } from 'lucide-react'
import { EmptyState, MockNotice, PageHeader, Panel, StatusBadge } from '@components/dashboard'
import DetailDrawer from '@components/admin/DetailDrawer'
import { BTN_PRIMARY, BTN_SECONDARY, ConfirmDialog, FIELD, norm } from '@components/admin/parts'
import { JOB_TYPES } from '@constants/index'
import { useDemoStore } from '@context/demoStore'
import { DAY_SHORT, SESSIONS } from '@pages/jobseeker/mockData'
import { CANDIDATES, ME_CANDIDATE, type MatchCandidate } from '@pages/public/match/data'
import { setSeekerLocked, useAdmin } from '@services/adminService'
import { FOCUS } from '@utils/focus'

type Filter = 'all' | 'ready' | 'working' | 'locked'
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'ready', label: 'Sẵn sàng đi làm' },
  { id: 'working', label: 'Đang đi làm' },
  { id: 'locked', label: 'Bị khóa' },
]

// Toàn bộ ứng viên: bỏ trùng theo tên (một người có thể hợp nhiều tin) + người tìm việc demo
const ALL: MatchCandidate[] = [
  ...CANDIDATES.filter((c, i, a) => a.findIndex((x) => norm(x.name) === norm(c.name)) === i),
  ME_CANDIDATE,
]

const availabilityText = (c: MatchCandidate) => (c.availability.kind === 'ready' ? `Sẵn sàng từ ${c.availability.from}` : 'Đang đi làm')

/** Tóm tắt lịch rảnh: "T2 sáng+tối, T3 tối" */
function scheduleText(slots: string[]) {
  return (
    DAY_SHORT.map((d, di) => {
      const ss = SESSIONS.filter((_, si) => slots.includes(`${di}-${si}`)).map((s) => s.toLowerCase())
      return ss.length ? `${d} ${ss.join('+')}` : ''
    }).filter(Boolean).join(', ') || 'Chưa nêu lịch rảnh'
  )
}

/** /admin/ung-vien — danh sách ứng viên; khung chi tiết để xem hồ sơ và khóa / mở khóa. */
export default function Candidates() {
  const locked = useAdmin((s) => s.lockedSeekers)
  const connections = useDemoStore((s) => s.connections)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [confirmLock, setConfirmLock] = useState(false)
  const uid = useId()

  const connCount = (id: string) => connections.filter((c) => c.seekerId === id).length

  const shown = useMemo(() => {
    const nq = norm(query)
    return ALL.filter(
      (c) =>
        (filter === 'all' ||
          (filter === 'ready' && c.availability.kind === 'ready') ||
          (filter === 'working' && c.availability.kind === 'working') ||
          (filter === 'locked' && locked[c.id])) &&
        (!nq || norm(c.name).includes(nq) || norm(c.area).includes(nq) || c.criteria.skills.some((s) => norm(s).includes(nq))),
    )
  }, [query, filter, locked])

  const open = openId ? ALL.find((c) => c.id === openId) : undefined

  const unlock = (c: MatchCandidate) => {
    setSeekerLocked(c.id, false)
    toast.success(`Đã mở khóa ${c.name}`)
  }
  const lock = (c: MatchCandidate) => {
    setSeekerLocked(c.id, true)
    setConfirmLock(false)
    toast.success(`Đã khóa ${c.name}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Ứng viên" description="Xem hồ sơ người tìm việc. Ứng viên bị khóa sẽ không hiện cho doanh nghiệp." />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div role="group" aria-label="Lọc ứng viên" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`rounded-full border px-4 py-2 text-sm transition-colors duration-300 ${FOCUS} ${filter === f.id ? 'border-page-fg bg-page-fg text-page-bg' : 'border-page-line text-page-fg hover:border-page-fg'}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="md:w-72">
          <label htmlFor={`${uid}-q`} className="sr-only">Tìm ứng viên</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-page-muted" aria-hidden="true" />
            <input id={`${uid}-q`} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm theo tên, khu vực, kỹ năng" className={`w-full pl-10 ${FIELD}`} />
          </div>
        </div>
      </div>

      <p className="text-sm text-page-muted" aria-live="polite">{shown.length} ứng viên</p>

      {shown.length === 0 ? (
        <EmptyState
          icon={UserCircle}
          title="Không có ứng viên phù hợp"
          description="Thử đổi từ khóa hoặc bộ lọc."
          action={<button type="button" onClick={() => { setQuery(''); setFilter('all') }} className={BTN_SECONDARY}>Xóa bộ lọc</button>}
        />
      ) : (
        <Panel className="p-0 md:p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Danh sách ứng viên</caption>
              <thead>
                <tr className="border-b border-page-line text-xs text-page-muted">
                  <th scope="col" className="px-5 py-3 font-medium">Ứng viên</th>
                  <th scope="col" className="hidden px-3 py-3 font-medium lg:table-cell">Kỹ năng</th>
                  <th scope="col" className="hidden px-3 py-3 font-medium md:table-cell">Sẵn sàng</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">Kết nối</th>
                  <th scope="col" className="px-5 py-3 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-page-line">
                {shown.map((c) => (
                  <tr key={c.id} onClick={() => setOpenId(c.id)} className="cursor-pointer transition-colors duration-300 hover:bg-page-bg">
                    <th scope="row" className="px-5 py-3 font-normal">
                      <button type="button" onClick={(e) => { e.stopPropagation(); setOpenId(c.id) }} className={`rounded-control text-left font-medium text-page-fg hover:underline ${FOCUS}`}>
                        {c.name}
                      </button>
                      <span className="block text-xs text-page-muted">{c.area}</span>
                    </th>
                    <td className="hidden max-w-xs px-3 py-3 text-page-muted lg:table-cell">{c.criteria.skills.slice(0, 3).join(', ')}</td>
                    <td className="hidden px-3 py-3 text-page-fg md:table-cell">{availabilityText(c)}</td>
                    <td className="tnum px-3 py-3 text-right text-page-fg">{connCount(c.id)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge tone={locked[c.id] ? 'strong' : 'default'}>{locked[c.id] ? 'Bị khóa' : 'Hoạt động'}</StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <MockNotice />

      {open && (
        <DetailDrawer
          titleId={`${uid}-drawer`}
          title={open.name}
          subtitle={`${open.area} · ${open.summary}`}
          onClose={() => setOpenId(null)}
          footer={
            locked[open.id] ? (
              <button type="button" onClick={() => unlock(open)} className={BTN_PRIMARY}>
                <LockOpen className="h-4 w-4" aria-hidden="true" />Mở khóa
              </button>
            ) : (
              <button type="button" onClick={() => setConfirmLock(true)} className={BTN_SECONDARY}>
                <Lock className="h-4 w-4" aria-hidden="true" />Khóa ứng viên
              </button>
            )
          }
        >
          <div className="space-y-6">
            <StatusBadge tone={locked[open.id] ? 'strong' : 'default'}>{locked[open.id] ? 'Bị khóa' : 'Hoạt động'}</StatusBadge>
            <dl className="grid grid-cols-2 gap-4">
              <div><dt className="text-xs text-page-muted">Khu vực</dt><dd className="mt-0.5 text-sm text-page-fg">{open.area}</dd></div>
              <div><dt className="text-xs text-page-muted">Tình trạng</dt><dd className="mt-0.5 text-sm text-page-fg">{availabilityText(open)}</dd></div>
              <div><dt className="text-xs text-page-muted">Lương mong muốn</dt><dd className="tnum mt-0.5 text-sm text-page-fg">từ {open.criteria.salaryMinK}.000đ/giờ</dd></div>
              <div><dt className="text-xs text-page-muted">Số kết nối</dt><dd className="tnum mt-0.5 text-sm text-page-fg">{connCount(open.id)}</dd></div>
              <div className="col-span-2">
                <dt className="text-xs text-page-muted">Loại việc mong muốn</dt>
                <dd className="mt-0.5 text-sm text-page-fg">
                  {open.criteria.jobTypes.map((t) => JOB_TYPES.find((x) => x.value === t)?.label ?? t).join(', ')}
                </dd>
              </div>
            </dl>
            <div>
              <h3 className="text-sm font-medium text-page-fg">Kỹ năng</h3>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {open.criteria.skills.map((s) => <li key={s} className="rounded-full border border-page-line px-2.5 py-0.5 text-xs text-page-muted">{s}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-medium text-page-fg">Lịch rảnh</h3>
              <p className="mt-1 text-sm text-page-muted">{scheduleText(open.criteria.slots)}</p>
            </div>
          </div>
        </DetailDrawer>
      )}
      {open && confirmLock && (
        <ConfirmDialog
          title={`Khóa ${open.name}?`}
          message="Ứng viên sẽ không hiện cho doanh nghiệp. Bạn có thể mở khóa bất cứ lúc nào."
          confirmLabel="Khóa ứng viên"
          onCancel={() => setConfirmLock(false)}
          onConfirm={() => lock(open)}
        />
      )}
    </div>
  )
}
