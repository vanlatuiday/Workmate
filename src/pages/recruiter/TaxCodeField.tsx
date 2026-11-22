import { useEffect, useId, useRef, useState } from 'react'
import { AlertCircle, AlertTriangle } from 'lucide-react'
import { StatusBadge } from '@components/dashboard'
import { useCompanyStore } from '@context/companyStore'
import { TAX_RESULT_LABEL, previewTaxCode, type TaxLookup, type TaxPreview } from '@services/companyService'
import { apiErrorMessage } from '@services/authService'
import { notifySuccess } from '@utils/feedback'
import { FOCUS } from '@utils/focus'
import { BTN_GHOST, BTN_PRIMARY, BTN_SECONDARY, BTN_SM } from '@utils/ui'
import { cn } from '@utils/cn'

// Ô nhập mã số doanh nghiệp + tra thử + lưu: dùng ở khung Xác minh (hồ sơ công ty) và form bắt đầu của nhà tuyển dụng.

const FIELD = `w-full rounded-control border border-page-edge bg-page-surface px-3 py-2 text-sm text-page-fg ${FOCUS}`

/** Kết quả tra mã số: tên chính thức, địa chỉ, tình trạng và các cảnh báo (tên lệch, trùng mã) */
export function TaxResultBox({ lookup, nameMatches, usedByOther }: { lookup: TaxLookup; nameMatches: boolean | null; usedByOther: boolean }) {
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
      {lookup.source === 'mock' && <p className="mt-2 text-xs text-page-muted">Dữ liệu giả lập</p>}
    </div>
  )
}

/** Nhập mã số doanh nghiệp, tra thử rồi lưu. `readOnly` khi công ty đã xác minh hoặc yêu cầu đang chờ. `heading` null = không hiện tiêu đề. */
export function TaxCodeField({ readOnly, readOnlyNote, heading = 'Bước 1 · Mã số doanh nghiệp' }: { readOnly: boolean; readOnlyNote?: string; heading?: string | null }) {
  const uid = useId()
  const tax = useCompanyStore((s) => s.tax)
  const saveTaxCode = useCompanyStore((s) => s.saveTaxCode)
  // Xóa mã chỉ được khi chưa hoàn thành bước bắt đầu (sau đó mã là bắt buộc, chỉ đổi được)
  const canClear = useCompanyStore((s) => s.needsOnboarding)
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
      {heading && <h3 className="text-sm font-medium text-page-fg">{heading}</h3>}
      {readOnly ? (
        <div className="mt-2">
          <p className="text-sm text-page-fg">Mã số: <span className="tnum font-medium">{saved || 'Chưa nhập'}</span></p>
          {readOnlyNote && <p className="mt-1 text-xs text-page-muted">{readOnlyNote}</p>}
          {tax.taxLookup && <TaxResultBox lookup={tax.taxLookup} nameMatches={tax.taxNameMatches} usedByOther={false} />}
        </div>
      ) : (
        <>
          <div className={cn('flex flex-col gap-1.5', heading && 'mt-2')}>
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
            {saved && canClear && <button type="button" disabled={saving} onClick={() => { void save('') }} className={cn(BTN_GHOST, BTN_SM)}>Xóa mã đã lưu</button>}
            {!dirty && saved && !saving && <span className="text-xs text-page-muted">Đã lưu</span>}
          </div>
        </>
      )}
    </div>
  )
}

