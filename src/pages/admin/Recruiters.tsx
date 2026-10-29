import { useId, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Building2, Lock, LockOpen, Search, ShieldCheck } from 'lucide-react'
import { EmptyState, MockNotice, PageHeader, Panel, StatusBadge } from '@components/dashboard'
import DetailDrawer from '@components/admin/DetailDrawer'
import { BTN_PRIMARY, BTN_SECONDARY, ConfirmDialog, FIELD, norm, STATUS_LABEL } from '@components/admin/parts'
import { COMPANIES, type DiscoverCompany } from '@pages/public/jobs/data'
import { companyOf, DEMO_COMPANY } from '@pages/public/match/data'
import { setCompanyLocked, setCompanyVerified, useAdmin, useAdminJobs } from '@services/adminService'
import { FOCUS } from '@utils/focus'

type Filter = 'all' | 'verified' | 'unverified' | 'locked'
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'verified', label: 'Đã xác minh' },
  { id: 'unverified', label: 'Chưa xác minh' },
  { id: 'locked', label: 'Bị khóa' },
]

/** /admin/nha-tuyen-dung — danh sách công ty; khung chi tiết để gắn nhãn xác minh và khóa. */
export default function Recruiters() {
  const jobRows = useAdminJobs()
  const verified = useAdmin((s) => s.verifiedCompanies)
  const locked = useAdmin((s) => s.lockedCompanies)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [openId, setOpenId] = useState<string | null>(null)
  const [confirmLock, setConfirmLock] = useState(false)
  const uid = useId()

  // Công ty mẫu + công ty của doanh nghiệp demo (tên lấy từ Hồ sơ công ty)
  const companies: DiscoverCompany[] = useMemo(() => [...COMPANIES, companyOf(DEMO_COMPANY.id)], [])

  const stats = (id: string) => {
    const mine = jobRows.filter((r) => r.job.companyId === id)
    return { total: mine.length, live: mine.filter((r) => r.status === 'approved' && !r.companyLocked).length, rows: mine }
  }

  const shown = useMemo(() => {
    const nq = norm(query)
    return companies.filter(
      (c) =>
        (filter === 'all' ||
          (filter === 'verified' && verified[c.id]) ||
          (filter === 'unverified' && !verified[c.id]) ||
          (filter === 'locked' && locked[c.id])) &&
        (!nq || norm(c.name).includes(nq) || norm(c.industry).includes(nq)),
    )
  }, [companies, query, filter, verified, locked])

  const open = openId ? companies.find((c) => c.id === openId) : undefined

  const toggleVerified = (c: DiscoverCompany) => {
    const next = !verified[c.id]
    setCompanyVerified(c.id, next)
    toast.success(next ? `Đã gắn nhãn xác minh cho ${c.name}` : `Đã bỏ nhãn xác minh của ${c.name}`)
  }
  const unlock = (c: DiscoverCompany) => {
    setCompanyLocked(c.id, false)
    toast.success(`Đã mở khóa ${c.name}`)
  }
  const lock = (c: DiscoverCompany) => {
    setCompanyLocked(c.id, true)
    setConfirmLock(false)
    toast.success(`Đã khóa ${c.name}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Nhà tuyển dụng" description="Gắn nhãn xác minh, khóa hoặc mở khóa công ty. Công ty bị khóa thì mọi tin đều bị ẩn." />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div role="group" aria-label="Lọc công ty" className="flex flex-wrap gap-2">
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
          <label htmlFor={`${uid}-q`} className="sr-only">Tìm công ty</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-page-muted" aria-hidden="true" />
            <input id={`${uid}-q`} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm theo tên hoặc ngành" className={`w-full pl-10 ${FIELD}`} />
          </div>
        </div>
      </div>

      <p className="text-sm text-page-muted" aria-live="polite">{shown.length} công ty</p>

      {shown.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Không có công ty phù hợp"
          description="Thử đổi từ khóa hoặc bộ lọc."
          action={<button type="button" onClick={() => { setQuery(''); setFilter('all') }} className={BTN_SECONDARY}>Xóa bộ lọc</button>}
        />
      ) : (
        <Panel className="p-0 md:p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Danh sách nhà tuyển dụng</caption>
              <thead>
                <tr className="border-b border-page-line text-xs text-page-muted">
                  <th scope="col" className="px-5 py-3 font-medium">Công ty</th>
                  <th scope="col" className="hidden px-3 py-3 font-medium md:table-cell">Quận</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">Tin hiện / tổng</th>
                  <th scope="col" className="px-5 py-3 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-page-line">
                {shown.map((c) => {
                  const st = stats(c.id)
                  return (
                    <tr key={c.id} onClick={() => setOpenId(c.id)} className="cursor-pointer transition-colors duration-300 hover:bg-page-bg">
                      <th scope="row" className="px-5 py-3 font-normal">
                        <button type="button" onClick={(e) => { e.stopPropagation(); setOpenId(c.id) }} className={`rounded-control text-left font-medium text-page-fg hover:underline ${FOCUS}`}>
                          {c.name}
                        </button>
                        <span className="block text-xs text-page-muted">{c.industry}</span>
                      </th>
                      <td className="hidden px-3 py-3 text-page-fg md:table-cell">{c.district}</td>
                      <td className="tnum px-3 py-3 text-right text-page-fg">{st.live} / {st.total}</td>
                      <td className="px-5 py-3">
                        <span className="inline-flex flex-wrap gap-1.5">
                          {verified[c.id] && <StatusBadge tone="default">Đã xác minh</StatusBadge>}
                          {locked[c.id] && <StatusBadge tone="strong">Bị khóa</StatusBadge>}
                          {!verified[c.id] && !locked[c.id] && <StatusBadge tone="muted">Chưa xác minh</StatusBadge>}
                        </span>
                      </td>
                    </tr>
                  )
                })}
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
          subtitle={`${open.industry} · ${open.district}`}
          onClose={() => setOpenId(null)}
          footer={
            <>
              <button type="button" onClick={() => toggleVerified(open)} className={BTN_SECONDARY}>
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                {verified[open.id] ? 'Bỏ nhãn xác minh' : 'Gắn nhãn xác minh'}
              </button>
              {locked[open.id] ? (
                <button type="button" onClick={() => unlock(open)} className={BTN_PRIMARY}>
                  <LockOpen className="h-4 w-4" aria-hidden="true" />Mở khóa
                </button>
              ) : (
                <button type="button" onClick={() => setConfirmLock(true)} className={BTN_SECONDARY}>
                  <Lock className="h-4 w-4" aria-hidden="true" />Khóa công ty
                </button>
              )}
            </>
          }
        >
          <div className="space-y-6">
            <span className="inline-flex flex-wrap gap-1.5">
              {verified[open.id] && <StatusBadge tone="default">Đã xác minh</StatusBadge>}
              {locked[open.id] && <StatusBadge tone="strong">Bị khóa</StatusBadge>}
              {!verified[open.id] && !locked[open.id] && <StatusBadge tone="muted">Chưa xác minh</StatusBadge>}
            </span>
            <dl className="grid grid-cols-2 gap-4">
              <div><dt className="text-xs text-page-muted">Ngành</dt><dd className="mt-0.5 text-sm text-page-fg">{open.industry}</dd></div>
              <div><dt className="text-xs text-page-muted">Quận</dt><dd className="mt-0.5 text-sm text-page-fg">{open.district}</dd></div>
              <div><dt className="text-xs text-page-muted">Quy mô</dt><dd className="tnum mt-0.5 text-sm text-page-fg">{open.size} người</dd></div>
            </dl>
            <div>
              <h3 className="text-sm font-medium text-page-fg">Giới thiệu</h3>
              <p className="mt-1 text-sm leading-relaxed text-page-muted">{open.about}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-page-fg">Tin tuyển dụng ({stats(open.id).total})</h3>
              {stats(open.id).rows.length === 0 ? (
                <p className="mt-1 text-sm text-page-muted">Công ty chưa có tin nào.</p>
              ) : (
                <ul className="mt-2 divide-y divide-page-line">
                  {stats(open.id).rows.map((r) => (
                    <li key={r.job.id} className="flex items-center justify-between gap-3 py-2.5">
                      <span className="min-w-0 text-sm text-page-fg">{r.job.title}</span>
                      <StatusBadge tone={r.status === 'approved' ? 'default' : r.status === 'pending' ? 'strong' : 'muted'}>{STATUS_LABEL[r.status]}</StatusBadge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </DetailDrawer>
      )}
      {open && confirmLock && (
        <ConfirmDialog
          title={`Khóa ${open.name}?`}
          message="Mọi tin của công ty sẽ bị ẩn khỏi người tìm việc. Bạn có thể mở khóa bất cứ lúc nào."
          confirmLabel="Khóa công ty"
          onCancel={() => setConfirmLock(false)}
          onConfirm={() => lock(open)}
        />
      )}
    </div>
  )
}
