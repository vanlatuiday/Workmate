import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Pause, Play, Pencil, Users, Eye, Handshake, FileText } from 'lucide-react'
import { PageHeader, Panel, StatusBadge, EmptyState, MockNotice } from '@components/dashboard'
import { cn } from '@utils/cn'
import { MOCK_JOBS, JOB_STATUS_LABELS, type JobStatus, type MockJob } from './mockData'

const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-page-fg focus-visible:ring-offset-2 focus-visible:ring-offset-page-bg'
const BTN_PRIMARY = `inline-flex items-center gap-2 rounded-full bg-page-fg px-5 py-2.5 text-sm font-medium text-page-bg ${FOCUS}`
const BTN_SECONDARY = `inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-page-line px-4 py-2 text-sm text-page-fg transition-colors duration-300 hover:border-page-fg ${FOCUS}`

const STATUS_TONE = { open: 'strong', paused: 'default', closed: 'muted', draft: 'muted' } as const
const TABS: ('all' | JobStatus)[] = ['all', 'open', 'paused', 'closed', 'draft']

export default function JobListings() {
  // Dữ liệu mẫu — thay bằng API. Tạm dừng/Mở lại chỉ đổi state cục bộ.
  const [jobs, setJobs] = useState<MockJob[]>(MOCK_JOBS)
  const [tab, setTab] = useState<'all' | JobStatus>('all')
  const [query, setQuery] = useState('')

  const [notice, setNotice] = useState('')
  const [moved, setMoved] = useState(0)
  const noticeRef = useRef<HTMLParagraphElement>(null)

  // Tin rời khỏi tab đang xem (vd tạm dừng ở tab "Đang mở"): nút biến mất nên đưa focus tới dòng thông báo
  useEffect(() => {
    if (moved > 0) noticeRef.current?.focus()
  }, [moved])

  const toggle = (id: string) => {
    const job = jobs.find((j) => j.id === id)
    if (!job) return
    const next: JobStatus = job.status === 'open' ? 'paused' : 'open'
    setJobs((list) => list.map((j) => (j.id === id ? { ...j, status: next } : j)))
    setNotice(`${next === 'paused' ? 'Đã tạm dừng' : 'Đã mở lại'} tin "${job.title}".`)
    if (tab !== 'all' && tab !== next) setMoved((n) => n + 1)
  }

  const count = (t: 'all' | JobStatus) => (t === 'all' ? jobs.length : jobs.filter((j) => j.status === t).length)
  const q = query.trim().toLowerCase()
  const shown = jobs.filter(
    (j) => (tab === 'all' || j.status === tab) && (!q || j.title.toLowerCase().includes(q)),
  )

  /** Cụm hành động của một tin (dùng cho cả bảng và thẻ) */
  const actions = (j: MockJob) => (
    <div className="flex flex-wrap items-center gap-2">
      {j.status !== 'draft' && (
        <Link to={`/tuyen-dung/ung-vien-phu-hop?job=${j.id}`} className={BTN_SECONDARY}>
          <Users className="h-4 w-4" aria-hidden="true" />
          Xem ứng viên<span className="sr-only"> {j.title}</span>
        </Link>
      )}
      {(j.status === 'open' || j.status === 'paused') && (
        <button type="button" onClick={() => toggle(j.id)} className={BTN_SECONDARY}>
          {j.status === 'open' ? (
            <Pause className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Play className="h-4 w-4" aria-hidden="true" />
          )}
          {j.status === 'open' ? 'Tạm dừng' : 'Mở lại'}<span className="sr-only"> {j.title}</span>
        </button>
      )}
      <Link to="/tuyen-dung/dang-tin" className={BTN_SECONDARY} aria-label={`Sửa tin ${j.title}`}>
        <Pencil className="h-4 w-4" aria-hidden="true" />
        Sửa
      </Link>
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tin tuyển dụng"
        description="Quản lý các tin bạn đã đăng, xem ai đang phù hợp với từng vị trí."
        actions={
          <Link to="/tuyen-dung/dang-tin" className={BTN_PRIMARY}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Đăng tin mới
          </Link>
        }
      />
      <MockNotice />

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
              {t === 'all' ? 'Tất cả' : JOB_STATUS_LABELS[t]} <span className="tnum">({count(t)})</span>
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

      <p ref={noticeRef} tabIndex={-1} role="status" className="text-sm text-page-muted focus:outline-none empty:hidden">{notice}</p>

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
                  <th scope="col" className="px-3 py-3 text-right font-medium">Lượt xem</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">Ứng viên phù hợp</th>
                  <th scope="col" className="px-6 py-3 text-right font-medium">MATCH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-page-line">
                {shown.map((j) => (
                  <tr key={j.id} className="align-top">
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-page-fg">{j.title}</span>
                        <StatusBadge tone={STATUS_TONE[j.status]}>{JOB_STATUS_LABELS[j.status]}</StatusBadge>
                      </div>
                      <p className="mt-1 text-xs text-page-muted">{j.jobType} · {j.schedule}</p>
                      <div className="mt-3">{actions(j)}</div>
                    </td>
                    <td className="tnum px-3 py-4 text-page-fg">{j.salary}</td>
                    <td className="tnum px-3 py-4 text-page-muted">{j.postedAt}</td>
                    <td className="tnum px-3 py-4 text-right text-page-fg">{j.views}</td>
                    <td className="tnum px-3 py-4 text-right text-page-fg">{j.suggested}</td>
                    <td className="tnum px-6 py-4 text-right text-page-fg">{j.matches}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </Panel>

          {/* Dưới 1024px: danh sách thẻ */}
          <ul className="space-y-4 lg:hidden">
            {shown.map((j) => (
              <li key={j.id} className="rounded-card border border-page-line bg-page-surface p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-base font-medium text-page-fg">{j.title}</h2>
                  <StatusBadge tone={STATUS_TONE[j.status]}>{JOB_STATUS_LABELS[j.status]}</StatusBadge>
                </div>
                <p className="mt-1 text-xs text-page-muted">{j.jobType} · {j.schedule}</p>
                <p className="tnum mt-2 text-sm text-page-fg">{j.salary}</p>
                <p className="mt-1 text-xs text-page-muted">Đăng ngày {j.postedAt}</p>
                <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-page-line pt-4 text-center">
                  {[
                    { icon: Eye, label: 'Lượt xem', v: j.views },
                    { icon: Users, label: 'Ứng viên', v: j.suggested },
                    { icon: Handshake, label: 'MATCH', v: j.matches },
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
                <div className="mt-4">{actions(j)}</div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
