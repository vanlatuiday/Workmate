import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Pause, Play, Users, Handshake, FileText, Heart, XCircle } from 'lucide-react'
import { PageHeader, Panel, StatusBadge, EmptyState } from '@components/dashboard'
import { cn } from '@utils/cn'
import { setJobStatus, useCompanyJobs, useJobNumbers, type CompanyJobRow } from '@services/adminService'
import { DEMO_COMPANY, POSITIONS } from '@pages/public/match/data'
import { formatRelativeTime } from '@utils/format'
import { FOCUS } from '@utils/focus'

const BTN_PRIMARY = `inline-flex items-center gap-2 rounded-full bg-page-fg px-5 py-2.5 text-sm font-medium text-page-bg ${FOCUS}`
const BTN_SECONDARY = `inline-flex min-h-10 items-center gap-1.5 whitespace-nowrap rounded-full border border-page-line px-4 py-2 text-sm text-page-fg transition-colors duration-300 hover:border-page-fg disabled:cursor-not-allowed disabled:text-page-muted disabled:hover:border-page-line ${FOCUS}`

/** Trạng thái gộp: kiểm duyệt của quản trị thắng, còn lại theo trạng thái đăng tuyển do mình đặt */
type Combined = 'open' | 'paused' | 'closed' | 'pending' | 'attention'
type Tab = 'all' | Combined

const COMBINED_LABEL: Record<Combined, string> = {
  open: 'Đang mở',
  paused: 'Tạm dừng',
  closed: 'Đã đóng',
  pending: 'Chờ duyệt',
  attention: 'Cần xử lý',
}
const TABS: Tab[] = ['all', 'open', 'paused', 'closed', 'pending', 'attention']
const TONE = { open: 'strong', paused: 'default', closed: 'muted', pending: 'muted', attention: 'default' } as const

const combinedOf = (r: CompanyJobRow): Combined =>
  r.status === 'pending' ? 'pending' : r.status === 'approved' ? r.jobStatus : 'attention'

/** Nhãn đầy đủ cho huy hiệu (bị từ chối / ẩn kèm lý do) */
function statusLabel(r: CompanyJobRow) {
  const why = r.reason ? ` — ${r.reason}` : ''
  if (r.status === 'rejected') return `Bị từ chối${why}`
  if (r.status === 'hidden') return `Bị ẩn${why}`
  return COMBINED_LABEL[combinedOf(r)]
}

/** Vì sao chưa thao tác được với tin chưa được duyệt */
const lockedNote = (r: CompanyJobRow) =>
  r.status === 'pending' ? 'Đang chờ quản trị viên duyệt nên chưa thể thao tác.' : 'Tin không còn hiển thị, chưa thể thao tác. Đăng tin mới để thay thế.'

export default function JobListings() {
  const rows = useCompanyJobs(DEMO_COMPANY.id)
  const numbers = useJobNumbers(rows.map((r) => r.job))
  const [tab, setTab] = useState<Tab>('all')
  const [query, setQuery] = useState('')
  // Tin đang chờ xác nhận đóng (đóng tin là việc khó hoàn tác với người xem nên hỏi lại một bước)
  const [closing, setClosing] = useState<string | null>(null)

  const [notice, setNotice] = useState('')
  const [moved, setMoved] = useState(0)
  const noticeRef = useRef<HTMLParagraphElement>(null)

  // Tin rời khỏi tab đang xem (vd tạm dừng ở tab "Đang mở"): nút biến mất nên đưa focus tới dòng thông báo
  useEffect(() => {
    if (moved > 0) noticeRef.current?.focus()
  }, [moved])

  const change = (r: CompanyJobRow, next: 'open' | 'paused' | 'closed') => {
    setJobStatus(r.job.id, next)
    setClosing(null)
    const verb = next === 'paused' ? 'Đã tạm dừng' : next === 'closed' ? 'Đã đóng' : 'Đã mở lại'
    setNotice(`${verb} tin "${r.job.title}".`)
    if (tab !== 'all' && tab !== next) setMoved((n) => n + 1)
  }

  const count = (t: Tab) => (t === 'all' ? rows.length : rows.filter((r) => combinedOf(r) === t).length)
  const q = query.trim().toLowerCase()
  const shown = rows.filter((r) => (tab === 'all' || combinedOf(r) === tab) && (!q || r.job.title.toLowerCase().includes(q)))

  /** Ngày đăng: tin mới đăng theo thời điểm; tin có sẵn theo ngày ghi trong dữ liệu mẫu */
  const postedText = (r: CompanyJobRow) =>
    r.postedAt ? formatRelativeTime(r.postedAt) : (POSITIONS.find((p) => p.id === r.job.id)?.job.postedAt ?? '—')

  /** Cụm hành động của một tin (dùng cho cả bảng và thẻ) */
  const actions = (r: CompanyJobRow) => {
    const ok = r.status === 'approved'
    const t = r.job.title
    if (!ok) {
      return (
        <p className="text-xs text-page-muted">{lockedNote(r)}</p>
      )
    }
    if (closing === r.job.id) {
      return (
        <div role="group" aria-label={`Xác nhận đóng tin ${t}`} className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-page-fg">Đóng tin này? Tin sẽ ẩn khỏi trang Việc làm.</span>
          <button type="button" onClick={() => setClosing(null)} className={BTN_SECONDARY}>Hủy</button>
          <button type="button" onClick={() => change(r, 'closed')} className={cn(BTN_PRIMARY, 'min-h-10 !px-4 !py-2')}>Xác nhận đóng</button>
        </div>
      )
    }
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Link to="/match" className={BTN_SECONDARY}>
          <Users className="h-4 w-4" aria-hidden="true" />
          Xem ứng viên<span className="sr-only"> {t}</span>
        </Link>
        {r.jobStatus === 'open' ? (
          <button type="button" onClick={() => change(r, 'paused')} className={BTN_SECONDARY}>
            <Pause className="h-4 w-4" aria-hidden="true" />
            Tạm dừng<span className="sr-only"> {t}</span>
          </button>
        ) : (
          <button type="button" onClick={() => change(r, 'open')} className={BTN_SECONDARY}>
            <Play className="h-4 w-4" aria-hidden="true" />
            Mở lại<span className="sr-only"> {t}</span>
          </button>
        )}
        {r.jobStatus !== 'closed' && (
          <button type="button" onClick={() => setClosing(r.job.id)} className={BTN_SECONDARY}>
            <XCircle className="h-4 w-4" aria-hidden="true" />
            Đóng tin<span className="sr-only"> {t}</span>
          </button>
        )}
      </div>
    )
  }

  const num = (r: CompanyJobRow, k: 'fit' | 'interested' | 'connected') => (r.status === 'approved' ? numbers[r.job.id]?.[k] ?? 0 : '—')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tin tuyển dụng"
        description="Quản lý các tin bạn đã đăng, xem ai đang phù hợp với từng vị trí."
        actions={
          <Link to="/dang-tin" className={BTN_PRIMARY}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Đăng tin mới
          </Link>
        }
      />
      <p className="text-xs text-page-muted">Dữ liệu demo trên trình duyệt này — dùng chung với Kết nối và trang Ghép việc.</p>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div role="group" aria-label="Lọc theo trạng thái" className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm transition-colors duration-300',
                tab === t
                  ? 'border-page-fg bg-page-fg text-page-bg'
                  : 'border-page-line text-page-fg hover:border-page-fg',
                FOCUS,
              )}
            >
              {t === 'all' ? 'Tất cả' : COMBINED_LABEL[t]} <span className="tnum">({count(t)})</span>
            </button>
          ))}
        </div>
        <div className="relative md:w-72">
          <label htmlFor="job-search" className="sr-only">Tìm tin theo tên</label>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-page-muted" aria-hidden="true" />
          <input
            id="job-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên tin"
            className={`w-full rounded-full border border-page-edge bg-page-surface py-2.5 pl-11 pr-4 text-sm text-page-fg placeholder:text-page-muted ${FOCUS}`}
          />
        </div>
      </div>

      {/* Giữ sẵn chỗ một dòng để thông báo xuất hiện không đẩy bảng xuống */}
      <p ref={noticeRef} tabIndex={-1} role="status" className="-mt-2 min-h-5 text-sm text-page-muted focus:outline-none">{notice}</p>

      {shown.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Không có tin nào phù hợp"
          description="Thử đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm."
          action={
            <button
              type="button"
              onClick={() => { setTab('all'); setQuery('') }}
              className={BTN_SECONDARY}
            >
              Xóa bộ lọc
            </button>
          }
        />
      ) : (
        <>
          {/* Từ 1024px: bảng */}
          <Panel className="hidden p-0 lg:block lg:p-0">
            <div className="relative overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Danh sách tin tuyển dụng</caption>
              <thead>
                <tr className="border-b border-page-line text-xs text-page-muted">
                  <th scope="col" className="px-6 py-3 font-medium">Tin tuyển dụng</th>
                  <th scope="col" className="px-3 py-3 font-medium">Lương</th>
                  <th scope="col" className="px-3 py-3 font-medium">Ngày đăng</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">Ứng viên phù hợp</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">Đã quan tâm</th>
                  <th scope="col" className="px-6 py-3 text-right font-medium">Kết nối</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-page-line">
                {shown.map((r) => (
                  <tr key={r.job.id} className="align-top">
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-page-fg">{r.job.title}</span>
                        <StatusBadge tone={TONE[combinedOf(r)]}>{statusLabel(r)}</StatusBadge>
                      </div>
                      <p className="mt-1 text-xs text-page-muted">{r.job.district} · {r.job.shiftLabel}</p>
                      <div className="mt-3">{actions(r)}</div>
                    </td>
                    <td className="tnum px-3 py-4 text-page-fg">{r.job.salaryLabel}</td>
                    <td className="tnum px-3 py-4 text-page-muted">{postedText(r)}</td>
                    <td className="tnum px-3 py-4 text-right text-page-fg">{num(r, 'fit')}</td>
                    <td className="tnum px-3 py-4 text-right text-page-fg">{num(r, 'interested')}</td>
                    <td className="tnum px-6 py-4 text-right text-page-fg">{num(r, 'connected')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </Panel>

          {/* Dưới 1024px: danh sách thẻ */}
          <ul className="space-y-4 lg:hidden">
            {shown.map((r) => (
              <li key={r.job.id} className="rounded-card border border-page-line bg-page-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-base font-medium text-page-fg">{r.job.title}</h2>
                  <StatusBadge tone={TONE[combinedOf(r)]}>{statusLabel(r)}</StatusBadge>
                </div>
                <p className="mt-1 text-xs text-page-muted">{r.job.district} · {r.job.shiftLabel}</p>
                <p className="tnum mt-2 text-sm text-page-fg">{r.job.salaryLabel}</p>
                <p className="mt-1 text-xs text-page-muted">Đăng {postedText(r)}</p>
                <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-page-line pt-4 text-center">
                  {[
                    { icon: Users, label: 'Phù hợp', v: num(r, 'fit') },
                    { icon: Heart, label: 'Quan tâm', v: num(r, 'interested') },
                    { icon: Handshake, label: 'Kết nối', v: num(r, 'connected') },
                  ].map(({ icon: I, label, v }) => (
                    <div key={label}>
                      <dt className="flex items-center justify-center gap-1 text-xs text-page-muted">
                        <I className="h-3.5 w-3.5" aria-hidden="true" />
                        {label}
                      </dt>
                      <dd className="tnum mt-1 font-display text-lg font-medium text-page-fg">{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4">{actions(r)}</div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
