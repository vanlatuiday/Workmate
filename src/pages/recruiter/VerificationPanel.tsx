import { notifySuccess } from '@utils/feedback'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { AlertCircle, AlertTriangle, BadgeCheck, FileText, Paperclip, X } from 'lucide-react'
import { Panel, SkeletonList, StatusBadge } from '@components/dashboard'
import { useCatalogStore } from '@context/catalogStore'
import { useCompanyStore } from '@context/companyStore'
import {
  TAX_RESULT_LABEL, VERIFY_MAX_BYTES, VERIFY_MAX_FILES, VERIFY_NOTE_MAX, checkVerificationFiles, fetchVerification, previewTaxCode, submitVerification, withdrawVerification,
  type TaxLookup, type TaxPreview, type VerificationState,
} from '@services/companyService'
import { FOCUS } from '@utils/focus'
import { apiErrorMessage } from '@services/authService'
import { BTN_DANGER, BTN_GHOST, BTN_PRIMARY, BTN_SECONDARY, BTN_SM } from '@utils/ui'
import { cn } from '@utils/cn'

const FIELD = `w-full rounded-control border border-page-edge bg-page-surface px-3 py-2 text-sm text-page-fg ${FOCUS}`

const sizeLabel = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)
const dateLabel = (iso: string) => new Date(iso).toLocaleDateString('vi-VN')

function FileRow({ name, size, onRemove }: { name: string; size: number; onRemove?: () => void }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-control border border-page-line px-3 py-2 text-sm text-page-fg">
      <span className="flex min-w-0 items-center gap-2">
        <FileText className="h-4 w-4 flex-shrink-0 text-page-muted" aria-hidden="true" />
        <span className="min-w-0 break-all">{name}</span>
        <span className="tnum flex-shrink-0 text-xs text-page-muted">{sizeLabel(size)}</span>
      </span>
      {onRemove && (
        <button type="button" onClick={onRemove} className={cn('-m-2 flex-shrink-0 rounded-full p-2 text-page-muted hover:text-page-fg', FOCUS)}>
          <X className="h-4 w-4" aria-hidden="true" /><span className="sr-only">Bỏ tệp {name}</span>
        </button>
      )}
    </li>
  )
}

/** Kết quả tra mã số: tên chính thức, địa chỉ, tình trạng và các cảnh báo (tên lệch, trùng mã) */
function TaxResultBox({ lookup, nameMatches, usedByOther }: { lookup: TaxLookup; nameMatches: boolean | null; usedByOther: boolean }) {
  const warn = (text: string) => (
    <p className="mt-2 flex items-start gap-1.5 rounded-control bg-warning-soft px-3 py-2 text-sm font-medium text-warning-ink">
      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" /><span className="min-w-0 break-words">{text}</span>
    </p>
  )
  return (
    <div className="mt-3 rounded-control border border-page-line p-3 text-sm text-page-fg">
      {lookup.result === 'active' && (
        <>
          <StatusBadge tone="soft">{TAX_RESULT_LABEL.active}</StatusBadge>
          {lookup.name && <p className="mt-2 break-words font-medium">{lookup.name}</p>}
          {lookup.address && <p className="mt-1 break-words text-page-muted">{lookup.address}</p>}
          {lookup.statusText && <p className="mt-1 text-page-muted">Tình trạng: {lookup.statusText}</p>}
          {nameMatches === false && warn('Tên đăng ký trên dữ liệu thuế khác tên công ty trong hồ sơ. Quản trị viên sẽ thấy điểm này khi duyệt.')}
          {usedByOther && warn('Đã có tài khoản khác dùng mã số này. Quản trị viên sẽ đối chiếu khi duyệt.')}
        </>
      )}
      {lookup.result === 'inactive' && (
        <div className="rounded-control bg-danger-soft px-3 py-2 text-danger">
          <p className="flex items-start gap-1.5 font-medium"><AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />{TAX_RESULT_LABEL.inactive}</p>
          {lookup.name && <p className="mt-1 break-words">{lookup.name}</p>}
          <p className="mt-1">{lookup.statusText || 'Mã số này đã ngừng hoạt động.'} Hãy nhập mã số đang hoạt động để gửi xác minh.</p>
        </div>
      )}
      {lookup.result === 'not_found' && (
        <p className="flex items-start gap-1.5 rounded-control bg-danger-soft px-3 py-2 font-medium text-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />Không tìm thấy mã số này trên dữ liệu thuế
        </p>
      )}
      {lookup.result === 'unavailable' && (
        <p className="text-page-muted">Chưa tra được lúc này, quản trị viên sẽ kiểm tra khi duyệt.</p>
      )}
      {lookup.source === 'mock' && <p className="mt-2 text-xs text-page-muted">Dữ liệu giả lập (chế độ demo)</p>}
    </div>
  )
}

/** Bước 1: nhập mã số doanh nghiệp, tra thử rồi lưu. `readOnly` khi công ty đã xác minh hoặc yêu cầu đang chờ. */
function TaxStep({ readOnly, readOnlyNote }: { readOnly: boolean; readOnlyNote?: string }) {
  const uid = useId()
  const tax = useCompanyStore((s) => s.tax)
  const saveTaxCode = useCompanyStore((s) => s.saveTaxCode)
  const saved = tax.taxCode ?? ''
  const [value, setValue] = useState(saved)
  const [preview, setPreview] = useState<TaxPreview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [saving, setSaving] = useState(false)

  // Hồ sơ nạp xong sau khi panel hiện: đồng bộ ô nhập với mã đã lưu (không ghi đè khi người dùng đang sửa)
  const syncedRef = useRef(saved)
  useEffect(() => {
    if (syncedRef.current !== saved) { setValue((v) => (v === syncedRef.current ? saved : v)); syncedRef.current = saved }
  }, [saved])

  const trimmed = value.trim()
  const previewFresh = preview && preview.taxCode === trimmed ? preview : null
  const dirty = trimmed !== saved
  // Hiện kết quả vừa tra nếu có; không thì kết quả đã lưu (chỉ khi ô nhập chưa bị sửa)
  const shown = previewFresh
    ? { lookup: previewFresh.lookup, nameMatches: previewFresh.nameMatches, usedByOther: previewFresh.usedByOther }
    : !dirty && tax.taxLookup ? { lookup: tax.taxLookup, nameMatches: tax.taxNameMatches, usedByOther: false } : null
  const blocked = previewFresh ? previewFresh.lookup.result === 'inactive' || previewFresh.lookup.result === 'not_found' : false

  const check = async () => {
    if (!trimmed) { setError('Nhập mã số doanh nghiệp trước khi kiểm tra.'); return }
    setError(null); setChecking(true)
    const r = await previewTaxCode(trimmed)
    if (r.error) { setError(r.error); setPreview(null) }
    else setPreview(r.data)
    setChecking(false)
  }

  const save = async (code: string) => {
    setError(null); setSaving(true)
    try {
      await saveTaxCode(code)
      notifySuccess(code ? 'Đã lưu mã số doanh nghiệp' : 'Đã xóa mã số doanh nghiệp')
      if (!code) setValue('')
      setPreview(null)
    } catch (err) {
      setError(apiErrorMessage(err, 'Không lưu được mã số.'))
    }
    setSaving(false)
  }

  const errId = `${uid}-err`
  return (
    <div>
      <h3 className="text-sm font-medium text-page-fg">Bước 1 · Mã số doanh nghiệp</h3>
      {readOnly ? (
        <div className="mt-2">
          <p className="text-sm text-page-fg">Mã số: <span className="tnum font-medium">{saved || 'Chưa nhập'}</span></p>
          {readOnlyNote && <p className="mt-1 text-xs text-page-muted">{readOnlyNote}</p>}
          {tax.taxLookup && <TaxResultBox lookup={tax.taxLookup} nameMatches={tax.taxNameMatches} usedByOther={false} />}
        </div>
      ) : (
        <>
          <div className="mt-2 flex flex-col gap-1.5">
            <label htmlFor={`${uid}-c`} className="text-sm text-page-muted">Mã số doanh nghiệp</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input id={`${uid}-c`} type="text" inputMode="numeric" autoComplete="off" maxLength={14} value={value}
                placeholder="VD: 0401112222" onChange={(e) => { setValue(e.target.value); setError(null) }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void check() } }}
                aria-invalid={error ? true : undefined} aria-describedby={error ? `${errId} ${uid}-h` : `${uid}-h`}
                className={cn(FIELD, 'sm:max-w-xs')} />
              <button type="button" disabled={checking || saving} onClick={() => { void check() }} className={cn(BTN_SECONDARY, BTN_SM)}>
                {checking ? 'Đang kiểm tra…' : 'Kiểm tra'}
              </button>
            </div>
            <span id={`${uid}-h`} className="text-xs text-page-muted">10 chữ số trên giấy đăng ký kinh doanh; chi nhánh thêm -001…</span>
            {error && (
              <p id={errId} role="alert" className="flex items-start gap-1.5 text-sm font-medium text-danger">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" /><span className="min-w-0 break-words">{error}</span>
              </p>
            )}
          </div>

          {shown && <TaxResultBox {...shown} />}
          {!shown && saved && dirty && <p className="mt-3 text-xs text-page-muted">Mã đang lưu: <span className="tnum">{saved}</span>. Bấm “Kiểm tra” để tra mã mới.</p>}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" disabled={!previewFresh || blocked || !dirty || saving || checking} onClick={() => { void save(trimmed) }} className={cn(BTN_PRIMARY, BTN_SM)}>
              {saving ? 'Đang lưu…' : 'Lưu mã số'}
            </button>
            {saved && <button type="button" disabled={saving} onClick={() => { void save('') }} className={cn(BTN_GHOST, BTN_SM)}>Xóa mã đã lưu</button>}
            {!dirty && saved && !saving && <span className="text-xs text-page-muted">Đã lưu</span>}
          </div>
        </>
      )}
    </div>
  )
}

/** Khu "Xác minh doanh nghiệp" ở hồ sơ công ty: đã xác minh / đang chờ / chưa gửi hoặc bị từ chối. */
export default function VerificationPanel() {
  const myId = useCompanyStore((s) => s.id)
  const locked = useCatalogStore((s) => s.companies.find((c) => c.id === myId)?.locked ?? false)
  const uid = useId()
  const tax = useCompanyStore((s) => s.tax)
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<VerificationState | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const r = await fetchVerification()
    setState(r.data)
    setLoadError(r.error)
  }, [])
  useEffect(() => { void load() }, [load])

  const pick = (list: FileList | null) => {
    // Chép ra mảng TRƯỚC khi xóa value: FileList "sống", reset input là nó rỗng theo
    const picked = list ? Array.from(list) : []
    if (inputRef.current) inputRef.current.value = ''
    if (!picked.length) return
    const next = [...files, ...picked]
    const bad = checkVerificationFiles(next)
    if (bad) { setError(bad); return }
    setError(null)
    setFiles(next)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const bad = checkVerificationFiles(files)
    if (bad) { setError(bad); return }
    setError(null); setBusy(true)
    const err = await submitVerification(files, note)
    if (err) setError(err)
    else {
      notifySuccess('Đã gửi yêu cầu xác minh')
      setFiles([]); setNote('')
    }
    // Lỗi 409 (đã có yêu cầu / đã xác minh) cũng cần đồng bộ lại trạng thái
    await load()
    setBusy(false)
  }

  const withdraw = async () => {
    setError(null); setBusy(true)
    const err = await withdrawVerification()
    if (err) setError(err)
    else notifySuccess('Đã rút yêu cầu xác minh')
    await load()
    setBusy(false)
  }

  const errorEl = error && (
    <p role="alert" className="mt-3 flex items-start gap-1.5 text-sm font-medium text-page-fg">
      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" /><span className="min-w-0 break-words">{error}</span>
    </p>
  )

  let body: React.ReactNode
  if (!state) {
    body = loadError ? (
      <div>
        <p role="alert" className="text-sm text-page-fg">{loadError}</p>
        <button type="button" onClick={() => { void load() }} className={cn(BTN_SECONDARY, BTN_SM, 'mt-3')}>Thử lại</button>
      </div>
    ) : (
      <SkeletonList rows={2} label="Đang tải trạng thái xác minh…" />
    )
  } else if (state.verified) {
    body = (
      <div className="flex items-start gap-3">
        <BadgeCheck className="mt-0.5 h-6 w-6 flex-shrink-0 text-page-fg" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-page-fg">Doanh nghiệp đã được xác minh</p>
          <p className="mt-1 text-sm text-page-muted">Nhãn xác minh hiện ở trang công ty và các tin tuyển dụng của bạn.</p>
          <div className="mt-4 border-t border-page-line pt-4"><TaxStep readOnly={!!tax.taxCode} readOnlyNote="Muốn đổi mã số, hãy liên hệ quản trị viên." /></div>
        </div>
      </div>
    )
  } else if (state.latest?.status === 'pending') {
    const v = state.latest
    body = (
      <div>
        <TaxStep readOnly readOnlyNote="Rút yêu cầu nếu cần đổi mã số." />
        <p className="mt-4 text-sm text-page-fg">Yêu cầu gửi ngày <span className="tnum">{dateLabel(v.submittedAt)}</span> đang chờ quản trị viên duyệt.</p>
        <ul className="mt-3 flex flex-col gap-2" aria-label="Giấy tờ đã gửi">
          {v.documents.map((d) => <FileRow key={d.id} name={d.name} size={d.size} />)}
        </ul>
        {v.note && <p className="mt-3 whitespace-pre-line break-words text-sm text-page-muted">Ghi chú: {v.note}</p>}
        <button type="button" disabled={busy} onClick={() => { void withdraw() }} className={cn(BTN_DANGER, BTN_SM, 'mt-4')}>
          {busy ? 'Đang rút…' : 'Rút yêu cầu'}
        </button>
        {errorEl}
      </div>
    )
  } else {
    const rejected = state.latest?.status === 'rejected' ? state.latest : null
    // Lý do chặn nút gửi: hiện ngay dưới nút để người dùng biết cần làm gì
    const res = tax.taxLookup?.result
    const blockReason = !tax.taxCode
      ? 'Cần lưu mã số doanh nghiệp đang hoạt động trước.'
      : res === 'inactive' || res === 'not_found'
        ? 'Mã số đã lưu không hợp lệ (ngừng hoạt động hoặc không tồn tại). Hãy lưu mã khác.'
        : files.length === 0 ? 'Chọn ít nhất một giấy tờ.' : null
    body = (
      <div>
        {rejected && (
          <div role="alert" className="mb-5 rounded-control border-2 border-page-fg p-4">
            <p className="flex items-center gap-1.5 text-sm font-medium text-page-fg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />Yêu cầu trước bị từ chối
            </p>
            <p className="mt-1 whitespace-pre-line break-words text-sm text-page-fg">{rejected.rejectReason || 'Quản trị viên không nêu lý do.'}</p>
            <p className="mt-1 text-xs text-page-muted">Bạn có thể bổ sung giấy tờ và gửi lại bên dưới.</p>
          </div>
        )}
        {locked ? (
          <p className="text-sm text-page-muted">Công ty đang bị khóa nên chưa thể gửi yêu cầu xác minh.</p>
        ) : (
          <>
          <TaxStep readOnly={false} />
          <form onSubmit={(e) => { void submit(e) }} noValidate className="mt-6 border-t border-page-line pt-5">
            <h3 className="text-sm font-medium text-page-fg">Bước 2 · Giấy tờ</h3>
            <p className="mt-2 text-sm text-page-muted">
              Gửi giấy tờ chứng minh doanh nghiệp để nhận nhãn đã xác minh. Gợi ý: giấy phép kinh doanh, giấy chứng nhận mã số thuế, hoặc giấy đăng ký hộ kinh doanh.
            </p>

            <input ref={inputRef} id={`${uid}-f`} type="file" multiple accept="application/pdf,image/png,image/jpeg,image/webp"
              className="sr-only" tabIndex={-1} aria-label="Chọn giấy tờ xác minh" onChange={(e) => pick(e.target.files)} />
            <div className="mt-3">
              <button type="button" disabled={busy || files.length >= VERIFY_MAX_FILES} onClick={() => inputRef.current?.click()} className={cn(BTN_SECONDARY, BTN_SM)}>
                <Paperclip className="h-4 w-4" aria-hidden="true" />Chọn giấy tờ
              </button>
              <p className="mt-2 text-xs text-page-muted">PDF, PNG, JPG hoặc WEBP; tối đa {VERIFY_MAX_FILES} tệp, mỗi tệp {sizeLabel(VERIFY_MAX_BYTES)}.</p>
            </div>

            {files.length > 0 && (
              <ul className="mt-3 flex flex-col gap-2" aria-label="Tệp đã chọn">
                {files.map((f, i) => <FileRow key={`${f.name}-${i}`} name={f.name} size={f.size} onRemove={() => { setFiles(files.filter((_, j) => j !== i)); setError(null) }} />)}
              </ul>
            )}

            <div className="mt-4 flex flex-col gap-1.5">
              <label htmlFor={`${uid}-n`} className="text-sm text-page-muted">Ghi chú (không bắt buộc)</label>
              <textarea id={`${uid}-n`} rows={3} maxLength={VERIFY_NOTE_MAX} value={note} onChange={(e) => setNote(e.target.value)} className={FIELD} />
              <span className="tnum text-xs text-page-muted">{note.length}/{VERIFY_NOTE_MAX}</span>
            </div>

            {errorEl}
            <button type="submit" disabled={busy || blockReason !== null} aria-describedby={blockReason ? `${uid}-why` : undefined} className={cn(BTN_PRIMARY, BTN_SM, 'mt-4')}>
              {busy ? 'Đang gửi…' : rejected ? 'Gửi lại yêu cầu' : 'Gửi yêu cầu xác minh'}
            </button>
            {blockReason && <p id={`${uid}-why`} className="mt-2 text-xs text-page-muted">{blockReason}</p>}
          </form>
          </>
        )}
      </div>
    )
  }

  return (
    <Panel
      title="Xác minh doanh nghiệp"
      action={state && !state.verified && state.latest?.status === 'pending' ? <StatusBadge tone="muted">Chờ duyệt</StatusBadge> : undefined}
    >
      {body}
    </Panel>
  )
}
