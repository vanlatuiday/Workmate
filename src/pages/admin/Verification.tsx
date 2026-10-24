import { useEffect, useRef, useState } from 'react'
import { FileText, ChevronDown, Check, X, BadgeCheck, AlertCircle } from 'lucide-react'
import { PageHeader, StatusBadge, EmptyState, MockNotice } from '@components/dashboard'
import { COMPANY_SIZES } from '@/constants'
import { cn } from '@utils/cn'
import { mockVerifications, type VerificationRequest, type VerificationStatus } from './mockData'
import { FOCUS } from '@utils/focus'

const BTN_PRIMARY = `rounded-full bg-page-fg px-5 py-2.5 text-sm font-medium text-page-bg ${FOCUS}`
const BTN_SECONDARY = `rounded-full border border-page-line px-5 py-2.5 text-sm font-medium text-page-fg transition-colors duration-300 hover:border-page-fg ${FOCUS}`

const TABS: { value: VerificationStatus; label: string; empty: string }[] = [
  { value: 'pending', label: 'Chờ duyệt', empty: 'Không còn hồ sơ nào chờ duyệt.' },
  { value: 'approved', label: 'Đã duyệt', empty: 'Chưa có hồ sơ nào được duyệt.' },
  { value: 'rejected', label: 'Từ chối', empty: 'Chưa có hồ sơ nào bị từ chối.' },
]

const sizeLabel = (v: string) => COMPANY_SIZES.find((s) => s.value === v)?.label ?? v

export default function Verification() {
  // Dữ liệu mẫu — thay bằng API
  const [items, setItems] = useState<VerificationRequest[]>(mockVerifications)
  const [tab, setTab] = useState<VerificationStatus>('pending')
  const [openId, setOpenId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState(false)
  const [notice, setNotice] = useState('')
  // Sau Duyệt/Từ chối/Hủy: nút vừa bấm có thể biến mất, nên đưa focus về nút gốc hoặc dòng thông báo
  const noticeRef = useRef<HTMLParagraphElement>(null)
  const refocusId = useRef<string | null>(null)
  useEffect(() => {
    if (refocusId.current === null) return
    const btn = document.getElementById(`vreject-${refocusId.current}`)
    ;(btn ?? noticeRef.current)?.focus()
    refocusId.current = null
  }, [items, rejectingId])

  const counts = (s: VerificationStatus) => items.filter((i) => i.status === s).length
  const visible = items.filter((i) => i.status === tab)

  const update = (id: string, patch: Partial<VerificationRequest>) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)))

  const approve = (r: VerificationRequest) => {
    refocusId.current = r.id
    update(r.id, { status: 'approved' })
    setNotice(`Đã duyệt hồ sơ ${r.companyName}.`)
  }

  const startReject = (id: string) => {
    setRejectingId(id)
    setReason('')
    setReasonError(false)
    setOpenId(id)
  }

  const confirmReject = (r: VerificationRequest) => {
    if (!reason.trim()) {
      setReasonError(true)
      return
    }
    refocusId.current = r.id
    update(r.id, { status: 'rejected', rejectReason: reason.trim() })
    setRejectingId(null)
    setNotice(`Đã từ chối hồ sơ ${r.companyName}.`)
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
      <PageHeader title="Xác minh doanh nghiệp" description="Duyệt hồ sơ để nhà tuyển dụng được gắn nhãn đã xác minh trên Workmate." />

      <div role="tablist" aria-label="Trạng thái hồ sơ" className="flex flex-wrap gap-2">
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
              {t.label} <span className="tnum">({counts(t.value)})</span>
            </button>
          )
        })}
      </div>

      <p ref={noticeRef} tabIndex={-1} role="status" className="my-4 min-h-5 text-sm text-page-fg focus:outline-none">{notice}</p>

      <div id="vpanel" role="tabpanel" aria-labelledby={`vtab-${tab}`}>
        {visible.length === 0 ? (
          <EmptyState icon={BadgeCheck} title={TABS.find((t) => t.value === tab)!.empty} />
        ) : (
          <ul className="space-y-4">
            {visible.map((r) => {
              const open = openId === r.id
              const rejecting = rejectingId === r.id
              return (
                <li key={r.id} className="rounded-card border border-page-line bg-page-surface p-5 md:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="font-display text-lg font-medium text-page-fg">{r.companyName}</h2>
                      <p className="mt-1 text-sm text-page-muted">{r.industry} · {sizeLabel(r.size)}</p>
                      <p className="mt-1 text-sm text-page-muted">{r.address}</p>
                    </div>
                    <div className="flex flex-shrink-0 flex-col items-start gap-1 sm:items-end">
                      <StatusBadge tone={r.status === 'pending' ? 'default' : r.status === 'approved' ? 'strong' : 'muted'}>
                        {r.status === 'pending' ? 'Chờ duyệt' : r.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                      </StatusBadge>
                      <span className="text-xs text-page-muted">Gửi ngày {r.submittedAt}</span>
                    </div>
                  </div>

                  <button
                    type="button" aria-expanded={open} aria-controls={`vdetail-${r.id}`}
                    onClick={() => setOpenId(open ? null : r.id)}
                    className={`mt-4 inline-flex items-center gap-1.5 rounded-control text-sm text-page-fg underline underline-offset-4 ${FOCUS}`}
                  >
                    {open ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                    <ChevronDown className={cn('h-4 w-4 transition-transform duration-300', open && 'rotate-180')} aria-hidden="true" />
                  </button>

                  <div id={`vdetail-${r.id}`} hidden={!open} className="mt-4 border-t border-page-line pt-4">
                      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                        <div><dt className="text-xs text-page-muted">Mã số thuế</dt><dd className="tnum text-page-fg">{r.taxCode}</dd></div>
                        <div><dt className="text-xs text-page-muted">Người liên hệ</dt><dd className="text-page-fg">{r.contactPerson}</dd></div>
                        <div><dt className="text-xs text-page-muted">Email liên hệ</dt><dd className="break-all text-page-fg">{r.contactEmail}</dd></div>
                        <div><dt className="text-xs text-page-muted">Quy mô</dt><dd className="text-page-fg">{sizeLabel(r.size)}</dd></div>
                      </dl>
                      <p className="mt-4 text-xs text-page-muted">Giấy tờ đã nộp</p>
                      <ul className="mt-2 space-y-2">
                        {r.documents.map((d) => (
                          <li key={d} className="flex items-center gap-2 text-sm text-page-fg">
                            <FileText className="h-4 w-4 flex-shrink-0 text-page-muted" aria-hidden="true" />
                            <span className="break-all">{d}</span>
                          </li>
                        ))}
                      </ul>
                      {r.status === 'rejected' && r.rejectReason && (
                        <p className="mt-4 text-sm text-page-fg"><span className="text-page-muted">Lý do từ chối: </span>{r.rejectReason}</p>
                      )}
                  </div>

                  {r.status === 'pending' && !rejecting && (
                    <div className="mt-5 flex flex-wrap gap-3">
                      <button type="button" onClick={() => approve(r)} className={BTN_PRIMARY}>
                        <Check className="mr-1.5 inline h-4 w-4" aria-hidden="true" />
                        Duyệt<span className="sr-only"> {r.companyName}</span>
                      </button>
                      <button type="button" id={`vreject-${r.id}`} onClick={() => startReject(r.id)} className={BTN_SECONDARY}>
                        <X className="mr-1.5 inline h-4 w-4" aria-hidden="true" />
                        Từ chối<span className="sr-only"> {r.companyName}</span>
                      </button>
                    </div>
                  )}

                  {r.status === 'pending' && rejecting && (
                    <div className="mt-5 border-t border-page-line pt-4">
                      <label htmlFor={`reason-${r.id}`} className="text-sm font-medium text-page-fg">Lý do từ chối (bắt buộc)</label>
                      <textarea
                        id={`reason-${r.id}`} rows={3} value={reason} autoFocus
                        onChange={(e) => { setReason(e.target.value); setReasonError(false) }}
                        aria-invalid={reasonError} aria-describedby={reasonError ? `reason-err-${r.id}` : undefined}
                        placeholder="Nhà tuyển dụng sẽ nhận được lý do này."
                        className={cn('mt-2 w-full rounded-card border bg-page-surface px-4 py-3 text-sm text-page-fg', reasonError ? 'border-page-fg' : 'border-page-edge', FOCUS)}
                      />
                      {reasonError && (
                        <p id={`reason-err-${r.id}`} role="alert" className="mt-1 flex items-center gap-1.5 text-sm font-medium text-page-fg">
                          <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                          Vui lòng nhập lý do trước khi từ chối.
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-3">
                        <button type="button" onClick={() => confirmReject(r)} className={BTN_PRIMARY}>Xác nhận từ chối</button>
                        <button type="button" onClick={() => { refocusId.current = r.id; setRejectingId(null) }} className={BTN_SECONDARY}>Hủy</button>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="mt-6"><MockNotice /></div>
    </div>
  )
}
