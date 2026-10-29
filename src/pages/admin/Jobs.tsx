import { useId, useMemo, useState } from 'react'
import { FileText, Search } from 'lucide-react'
import { EmptyState, MockNotice, PageHeader, Panel } from '@components/dashboard'
import DetailDrawer from '@components/admin/DetailDrawer'
import { BTN_SECONDARY, FIELD, FlagList, JobActions, JobStatusBadges, norm, STATUS_LABEL } from '@components/admin/parts'
import { JOB_TYPES } from '@constants/index'
import { companyOf } from '@pages/public/match/data'
import { useAdminJobs, type AdminJobRow, type ModerationStatus } from '@services/adminService'
import { FOCUS } from '@utils/focus'
import { formatRelativeTime } from '@utils/format'

type SortKey = 'newest' | 'salary' | 'flags'
const typeLabel = (t: string) => JOB_TYPES.find((x) => x.value === t)?.label ?? t
const dateOf = (r: AdminJobRow) => (r.job.postedAt ? new Date(r.job.postedAt).toLocaleDateString('vi-VN') : '—')

/** Một dòng thông tin "nhãn — giá trị" trong khung chi tiết */
function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-page-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-page-fg">{children}</dd>
    </div>
  )
}

/** Nội dung khung chi tiết một tin */
function JobDetail({ row }: { row: AdminJobRow }) {
  const { job } = row
  return (
    <div className="space-y-6">
      <img
        src={`https://images.unsplash.com/photo-${job.photo.id}?w=800&q=70&auto=format&fit=crop`}
        alt={job.photo.alt}
        className="aspect-[16/9] w-full rounded-card object-cover"
      />
      <JobStatusBadges row={row} />
      {row.reason && <p className="text-sm text-page-fg">Lý do: {row.reason}</p>}
      <dl className="grid grid-cols-2 gap-4">
        <Fact label="Công ty">{companyOf(job.companyId).name}</Fact>
        <Fact label="Quận">{job.district}</Fact>
        <Fact label="Lương"><span className="tnum">{job.salaryLabel}</span></Fact>
        <Fact label="Loại việc">{typeLabel(job.jobType)}</Fact>
        <Fact label="Ca làm">{job.shiftLabel}</Fact>
        <Fact label="Số lượng cần">{job.quantity ?? '—'}</Fact>
        <Fact label="Ngày đăng">{job.postedAt ? formatRelativeTime(job.postedAt) : 'Tin có sẵn của hệ thống'}</Fact>
      </dl>
      <div>
        <h3 className="text-sm font-medium text-page-fg">Mô tả</h3>
        <p className="mt-1 text-sm leading-relaxed text-page-muted">{job.description || 'Tin chưa có mô tả.'}</p>
      </div>
      <div>
        <h3 className="text-sm font-medium text-page-fg">Kỹ năng</h3>
        {job.skills.length ? (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {job.skills.map((s) => <li key={s} className="rounded-full border border-page-line px-2.5 py-0.5 text-xs text-page-muted">{s}</li>)}
          </ul>
        ) : (
          <p className="mt-1 text-sm text-page-muted">Chưa nêu kỹ năng.</p>
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium text-page-fg">Cờ cảnh báo</h3>
        <div className="mt-2">
          {row.flags.length ? <FlagList flags={row.flags} /> : <p className="text-sm text-page-muted">Không có cờ nào.</p>}
        </div>
      </div>
    </div>
  )
}

/** /admin/tin-tuyen-dung — bảng mọi tin: tìm, lọc, sắp xếp; bấm dòng mở khung chi tiết. */
export default function Jobs() {
  const rows = useAdminJobs()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<'all' | ModerationStatus>('all')
  const [district, setDistrict] = useState('')
  const [type, setType] = useState('')
  const [sort, setSort] = useState<SortKey>('newest')
  const [openId, setOpenId] = useState<string | null>(null)
  const uid = useId()

  const districts = useMemo(() => [...new Set(rows.map((r) => r.job.district))].sort((a, b) => a.localeCompare(b, 'vi')), [rows])

  const shown = useMemo(() => {
    const nq = norm(query)
    const list = rows.filter(
      (r) =>
        (status === 'all' || r.status === status) &&
        (!district || r.job.district === district) &&
        (!type || r.job.jobType === type) &&
        (!nq || norm(r.job.title).includes(nq) || norm(companyOf(r.job.companyId).name).includes(nq)),
    )
    return list.sort((a, b) =>
      sort === 'salary'
        ? b.job.salaryMaxK - a.job.salaryMaxK
        : sort === 'flags'
          ? b.flags.length - a.flags.length
          : (b.job.postedAt ?? '').localeCompare(a.job.postedAt ?? ''),
    )
  }, [rows, query, status, district, type, sort])

  const open = openId ? rows.find((r) => r.job.id === openId) : undefined
  const reset = () => { setQuery(''); setStatus('all'); setDistrict(''); setType('') }

  return (
    <div className="space-y-6">
      <PageHeader title="Tin tuyển dụng" description="Mọi tin trên hệ thống, kể cả tin đang chờ duyệt, bị ẩn hoặc bị từ chối." />

      <div className="flex flex-wrap gap-3">
        <div className="min-w-[12rem] flex-1">
          <label htmlFor={`${uid}-q`} className="sr-only">Tìm theo tiêu đề hoặc công ty</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-page-muted" aria-hidden="true" />
            <input id={`${uid}-q`} type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm theo tiêu đề hoặc công ty" className={`w-full pl-10 ${FIELD}`} />
          </div>
        </div>
        <div className="w-full sm:w-auto">
          <label htmlFor={`${uid}-s`} className="sr-only">Lọc theo trạng thái</label>
          <select id={`${uid}-s`} value={status} onChange={(e) => setStatus(e.target.value as 'all' | ModerationStatus)} className={`w-full ${FIELD}`}>
            <option value="all">Mọi trạng thái</option>
            {(Object.keys(STATUS_LABEL) as ModerationStatus[]).map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
          </select>
        </div>
        <div className="w-full sm:w-auto">
          <label htmlFor={`${uid}-d`} className="sr-only">Lọc theo quận</label>
          <select id={`${uid}-d`} value={district} onChange={(e) => setDistrict(e.target.value)} className={`w-full ${FIELD}`}>
            <option value="">Mọi quận</option>
            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="w-full sm:w-auto">
          <label htmlFor={`${uid}-t`} className="sr-only">Lọc theo loại việc</label>
          <select id={`${uid}-t`} value={type} onChange={(e) => setType(e.target.value)} className={`w-full ${FIELD}`}>
            <option value="">Mọi loại việc</option>
            {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div className="w-full sm:w-auto">
          <label htmlFor={`${uid}-o`} className="sr-only">Sắp xếp</label>
          <select id={`${uid}-o`} value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={`w-full ${FIELD}`}>
            <option value="newest">Mới nhất</option>
            <option value="salary">Lương cao nhất</option>
            <option value="flags">Nhiều cờ nhất</option>
          </select>
        </div>
      </div>

      <p className="text-sm text-page-muted" aria-live="polite">{shown.length} tin</p>

      {shown.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Không có tin phù hợp"
          description="Thử đổi từ khóa hoặc bỏ bớt bộ lọc."
          action={<button type="button" onClick={reset} className={BTN_SECONDARY}>Xóa bộ lọc</button>}
        />
      ) : (
        <Panel className="p-0 md:p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Danh sách tin tuyển dụng</caption>
              <thead>
                <tr className="border-b border-page-line text-xs text-page-muted">
                  <th scope="col" className="px-5 py-3 font-medium">Tin</th>
                  <th scope="col" className="hidden px-3 py-3 font-medium md:table-cell">Công ty</th>
                  <th scope="col" className="px-3 py-3 font-medium">Trạng thái</th>
                  <th scope="col" className="px-3 py-3 text-right font-medium">Cờ</th>
                  <th scope="col" className="hidden px-5 py-3 font-medium lg:table-cell">Ngày đăng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-page-line">
                {shown.map((r) => (
                  <tr key={r.job.id} onClick={() => setOpenId(r.job.id)} className="cursor-pointer transition-colors duration-300 hover:bg-page-bg">
                    <th scope="row" className="px-5 py-3 font-normal">
                      <button type="button" onClick={(e) => { e.stopPropagation(); setOpenId(r.job.id) }} className={`rounded-control text-left font-medium text-page-fg hover:underline ${FOCUS}`}>
                        {r.job.title}
                      </button>
                      <span className="block text-xs text-page-muted">{r.job.district} · {r.job.salaryLabel}</span>
                    </th>
                    <td className="hidden px-3 py-3 text-page-fg md:table-cell">{companyOf(r.job.companyId).name}</td>
                    <td className="px-3 py-3"><JobStatusBadges row={r} /></td>
                    <td className="tnum px-3 py-3 text-right text-page-fg">{r.flags.length}</td>
                    <td className="tnum hidden px-5 py-3 text-page-muted lg:table-cell">{dateOf(r)}</td>
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
          title={open.job.title}
          subtitle={companyOf(open.job.companyId).name}
          onClose={() => setOpenId(null)}
          footer={<JobActions row={open} />}
        >
          <JobDetail row={open} />
        </DetailDrawer>
      )}
    </div>
  )
}
