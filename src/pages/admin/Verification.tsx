import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Check, ExternalLink, FileText, X } from 'lucide-react'
import { PageHeader, StatusBadge, EmptyState, SkeletonList } from '@components/dashboard'
import { useCatalogStore, type CatalogCompany } from '@context/catalogStore'
import { fetchVerifications, getVerificationDocUrl, reviewVerification, setCompanyVerified, type AdminVerification } from '@services/adminService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'

const BTN_PRIMARY = `rounded-full bg-page-fg px-5 py-2.5 text-sm font-medium text-page-bg ${FOCUS}`
const BTN_SECONDARY = `rounded-full border border-page-line px-5 py-2.5 text-sm font-medium text-page-fg transition-colors duration-300 hover:border-page-fg ${FOCUS}`

type Tab = 'req-pending' | 'req-approved' | 'req-rejected' | 'pending' | 'verified'
const REQ_TABS = ['req-pending', 'req-approved', 'req-rejected'] as const
const TABS: { value: Tab; label: string; empty: string }[] = [
  { value: 'req-pending', label: 'Chờ duyệt', empty: 'Không có yêu cầu nào đang chờ duyệt.' },
  { value: 'req-approved', label: 'Đã duyệt', empty: 'Chưa có yêu cầu nào được duyệt.' },
  { value: 'req-rejected', label: 'Đã từ chối', empty: 'Chưa có yêu cầu nào bị từ chối.' },
  { value: 'pending', label: 'Công ty chưa xác minh', empty: 'Mọi công ty đều đã được xác minh.' },
  { value: 'verified', label: 'Công ty đã xác minh', empty: 'Chưa có công ty nào được xác minh.' },
]
const REASONS = ['Giấy tờ không rõ nét', 'Tên doanh nghiệp không khớp', 'Giấy tờ đã hết hạn', 'Thiếu giấy tờ cần thiết']
const FIELD = `w-full rounded-control border border-page-edge bg-page-surface px-3 py-2 text-sm text-page-fg ${FOCUS}`
const dateLabel = (iso: string) => new Date(iso).toLocaleDateString('vi-VN')
const sizeLabel = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)

/** Một yêu cầu xác minh: thông tin công ty, giấy tờ (xem qua link ký tạm), nút duyệt / từ chối */
function RequestCard({ v, onReviewed, onNotice }: { v: AdminVerification; onReviewed: () => Promise<void>; onNotice: (m: string) => void }) {
  const uid = useId()
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const reasonRef = useRef<HTMLTextAreaElement>(null)
  useEffect(() => { if (rejecting) reasonRef.current?.focus() }, [rejecting])

  const open = async (docId: string) => {
    // Mở tab trước (trong cú nhấp) để trình duyệt không chặn cửa sổ bật lên, rồi mới gán link
    const w = window.open('', '_blank')
    if (w) w.opener = null
    const r = await getVerificationDocUrl(v.id, docId)
    if (r.url && w) w.location.href = r.url
    else {
      w?.close()
      setErr(r.error ?? 'Không mở được giấy tờ.')
    }
  }

  const review = async (status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !reason.trim()) { setErr('Vui lòng nhập lý do từ chối.'); reasonRef.current?.focus(); return }
    setErr(null); setBusy(true)
    const r = await reviewVerification(v.id, status, status === 'rejected' ? reason.trim() : undefined)
    if (r.error) {
      if (r.conflict) { onNotice('Yêu cầu này đã được xử lý trước đó, danh sách đã được nạp lại.'); await onReviewed() }
      else setErr(r.error)
      setBusy(false)
      return
    }
    onNotice(status === 'approved' ? `Đã duyệt xác minh cho ${v.company.name}.` : `Đã từ chối yêu cầu của ${v.company.name}.`)
    await onReviewed()
  }

  return (
    <li className="rounded-card border border-page-line bg-page-surface p-5 md:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-medium text-page-fg">
            <Link to={`/cong-ty/${v.company.id}`} className={`rounded-control underline-offset-4 hover:underline ${FOCUS}`}>{v.company.name}</Link>
          </h2>
          <p className="mt-1 text-sm text-page-muted">{[v.company.industry, v.company.district].filter(Boolean).join(' · ')}</p>
          <p className="mt-1 text-xs text-page-muted">Gửi ngày <span className="tnum">{dateLabel(v.submittedAt)}</span>{v.reviewedAt && <> · xử lý ngày <span className="tnum">{dateLabel(v.reviewedAt)}</span></>}</p>
        </div>
        <div className="flex flex-shrink-0 flex-wrap gap-2">
          {v.company.locked && <StatusBadge tone="danger">Bị khóa</StatusBadge>}
          <StatusBadge tone={v.status === 'approved' ? 'accent' : v.status === 'rejected' ? 'danger' : 'neutral'}>
            {v.status === 'approved' ? 'Đã duyệt' : v.status === 'rejected' ? 'Đã từ chối' : 'Chờ duyệt'}
          </StatusBadge>
        </div>
      </div>

      {v.note && <p className="mt-3 whitespace-pre-line break-words text-sm text-page-fg">Ghi chú: {v.note}</p>}
      {v.status === 'rejected' && v.rejectReason && <p className="mt-3 whitespace-pre-line break-words text-sm text-page-fg">Lý do từ chối: {v.rejectReason}</p>}

      <ul className="mt-4 flex flex-col gap-2" aria-label="Giấy tờ">
        {v.documents.map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-3 rounded-control border border-page-line px-3 py-2 text-sm text-page-fg">
            <span className="flex min-w-0 items-center gap-2">
              <FileText className="h-4 w-4 flex-shrink-0 text-page-muted" aria-hidden="true" />
              <span className="min-w-0 break-all">{d.name}</span>
              <span className="tnum flex-shrink-0 text-xs text-page-muted">{sizeLabel(d.size)}</span>
            </span>
            <button type="button" onClick={() => { void open(d.id) }} className={`inline-flex flex-shrink-0 items-center gap-1 rounded-full border border-page-line px-3 py-1 text-xs font-medium text-page-fg hover:border-page-fg ${FOCUS}`}>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />Xem<span className="sr-only"> {d.name}</span>
            </button>
          </li>
        ))}
      </ul>

      {v.status === 'pending' && (
        <div className="mt-5">
          {rejecting ? (
            <div>
              <label htmlFor={`${uid}-r`} className="text-sm text-page-muted">Lý do từ chối (bắt buộc)</label>
              <ul className="mt-2 flex flex-wrap gap-2" aria-label="Lý do gợi ý">
                {REASONS.map((r) => (
                  <li key={r}>
                    <button type="button" onClick={() => setReason(r)} className={`rounded-full border border-page-line px-3 py-1 text-xs text-page-fg hover:border-page-fg ${FOCUS}`}>{r}</button>
                  </li>
                ))}
              </ul>
              <textarea ref={reasonRef} id={`${uid}-r`} rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)}
                aria-invalid={err && !reason.trim() ? true : undefined} className={`mt-2 ${FIELD}`} />
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" disabled={busy} onClick={() => { void review('rejected') }} className={`${BTN_PRIMARY} disabled:opacity-50`}>{busy ? 'Đang xử lý…' : 'Xác nhận từ chối'}</button>
                <button type="button" disabled={busy} onClick={() => { setRejecting(false); setErr(null) }} className={BTN_SECONDARY}>Hủy</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => { void review('approved') }} className={`${BTN_PRIMARY} disabled:opacity-50`}>
                <Check className="mr-1.5 inline h-4 w-4" aria-hidden="true" />{busy ? 'Đang xử lý…' : 'Duyệt'}<span className="sr-only"> {v.company.name}</span>
              </button>
              <button type="button" disabled={busy} onClick={() => setRejecting(true)} className={`${BTN_SECONDARY} disabled:opacity-50`}>
                <X className="mr-1.5 inline h-4 w-4" aria-hidden="true" />Từ chối<span className="sr-only"> {v.company.name}</span>
              </button>
            </div>
          )}
        </div>
      )}
      {err && <p role="alert" className="mt-3 text-sm font-medium text-page-fg">{err}</p>}
    </li>
  )
}

/** /admin/xac-minh — gắn hoặc bỏ nhãn đã xác minh cho công ty. Chưa có quy trình nộp giấy tờ nên quản trị viên tự đối chiếu. */
export default function Verification() {
  const companies = useCatalogStore((s) => s.companies)
  const [tab, setTab] = useState<Tab>('req-pending')
  const [requests, setRequests] = useState<AdminVerification[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [requestsLoaded, setRequestsLoaded] = useState(false)
  const loadRequests = useCallback(async () => {
    const r = await fetchVerifications()
    setRequests(r.data)
    setLoadError(r.error)
    setRequestsLoaded(true)
  }, [])
  useEffect(() => { void loadRequests() }, [loadRequests])
  const [notice, setNotice] = useState('')
  // Công ty vừa xử lý rời khỏi tab nên đưa focus về dòng thông báo
  const noticeRef = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    if (notice) noticeRef.current?.focus()
  }, [notice])

  const isReq = (REQ_TABS as readonly string[]).includes(tab)
  const reqOf = (t: Tab) => requests.filter((r) => `req-${r.status}` === t)
  const countOf = (t: Tab) => ((REQ_TABS as readonly string[]).includes(t) ? reqOf(t).length : companies.filter((c) => c.verified === (t === 'verified')).length)
  const visible = isReq ? [] : companies.filter((c) => c.verified === (tab === 'verified'))
  const visibleReqs = isReq ? reqOf(tab) : []

  const toggle = async (c: CatalogCompany) => {
    await setCompanyVerified(c.id, !c.verified)
    // Máy chủ từ chối thì setCompanyVerified đã báo lỗi và kho giữ nguyên: không báo thành công
    const now = useCatalogStore.getState().companies.find((x) => x.id === c.id)?.verified
    if (now === c.verified) return
    setNotice(c.verified ? `Đã bỏ nhãn xác minh của ${c.name}.` : `Đã xác minh ${c.name}.`)
  }

  const onTabKey = (e: React.KeyboardEvent, index: number) => {
    // Điều hướng tab bằng phím mũi tên, Home, End
    let next: number
    if (e.key === 'ArrowRight') next = (index + 1) % TABS.length
    else if (e.key === 'ArrowLeft') next = (index + TABS.length - 1) % TABS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = TABS.length - 1
    else return
    e.preventDefault()
    setTab(TABS[next].value)
    document.getElementById(`vtab-${TABS[next].value}`)?.focus()
  }

  return (
    <div>
      <PageHeader title="Xác minh doanh nghiệp" description="Duyệt giấy tờ do doanh nghiệp gửi, hoặc gắn / bỏ nhãn đã xác minh thủ công." />

      <div role="tablist" aria-label="Trạng thái xác minh" className="flex flex-wrap gap-2">
        {TABS.map((t, i) => {
          const active = tab === t.value
          return (
            <button
              key={t.value} id={`vtab-${t.value}`} type="button" role="tab"
              aria-selected={active} aria-controls="vpanel" tabIndex={active ? 0 : -1}
              onClick={() => setTab(t.value)} onKeyDown={(e) => onTabKey(e, i)}
              className={cn(
                'whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-300',
                active ? 'border-page-fg bg-page-fg text-page-bg' : 'border-page-line text-page-fg hover:border-page-fg',
                FOCUS,
              )}
            >
              {t.label} <span className="tnum">({countOf(t.value)})</span>
            </button>
          )
        })}
      </div>

      <p ref={noticeRef} tabIndex={-1} role="status" className="my-4 min-h-5 text-sm text-page-fg focus:outline-none">{notice}</p>

      <div id="vpanel" role="tabpanel" aria-labelledby={`vtab-${tab}`}>
        {loadError && isReq && <p role="alert" className="mb-4 text-sm text-page-fg">{loadError}</p>}
        {isReq && !requestsLoaded && !loadError ? (
          <SkeletonList rows={3} label="Đang tải yêu cầu xác minh…" />
        ) : isReq ? (
          visibleReqs.length === 0 ? (
            <EmptyState icon={BadgeCheck} title={TABS.find((t) => t.value === tab)!.empty} />
          ) : (
            <ul className="space-y-4">
              {visibleReqs.map((v) => <RequestCard key={v.id} v={v} onReviewed={loadRequests} onNotice={setNotice} />)}
            </ul>
          )
        ) : visible.length === 0 ? (
          <EmptyState icon={BadgeCheck} title={TABS.find((t) => t.value === tab)!.empty} />
        ) : (
          <ul className="space-y-4">
            {visible.map((c) => (
              <li key={c.id} className="rounded-card border border-page-line bg-page-surface p-5 md:p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-medium text-page-fg">{c.name}</h2>
                    <p className="mt-1 text-sm text-page-muted">{[c.industry, c.district, `${c.size} người`].filter(Boolean).join(' · ')}</p>
                    {c.tagline && <p className="mt-1 text-sm text-page-muted">{c.tagline}</p>}
                  </div>
                  <div className="flex flex-shrink-0 flex-wrap gap-2">
                    {c.locked && <StatusBadge tone="danger">Bị khóa</StatusBadge>}
                    <StatusBadge tone={c.verified ? 'accent' : 'neutral'}>{c.verified ? 'Đã xác minh' : 'Chưa xác minh'}</StatusBadge>
                  </div>
                </div>
                <div className="mt-5">
                  <button type="button" onClick={() => void toggle(c)} className={c.verified ? BTN_SECONDARY : BTN_PRIMARY}>
                    {c.verified ? <X className="mr-1.5 inline h-4 w-4" aria-hidden="true" /> : <Check className="mr-1.5 inline h-4 w-4" aria-hidden="true" />}
                    {c.verified ? 'Bỏ xác minh' : 'Xác minh'}<span className="sr-only"> {c.name}</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
