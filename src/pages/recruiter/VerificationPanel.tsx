import { notifySuccess } from '@utils/feedback'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { AlertCircle, BadgeCheck, FileText, Paperclip, X } from 'lucide-react'
import { Panel, SkeletonList, StatusBadge } from '@components/dashboard'
import { useCatalogStore } from '@context/catalogStore'
import { useCompanyStore } from '@context/companyStore'
import {
  VERIFY_MAX_BYTES, VERIFY_MAX_FILES, VERIFY_NOTE_MAX, checkVerificationFiles, fetchVerification, submitVerification, withdrawVerification,
  type VerificationState,
} from '@services/companyService'
import { FOCUS } from '@utils/focus'
import { BTN_DANGER, BTN_PRIMARY, BTN_SECONDARY, BTN_SM } from '@utils/ui'
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

/** Khu "Xác minh doanh nghiệp" ở hồ sơ công ty: đã xác minh / đang chờ / chưa gửi hoặc bị từ chối. */
export default function VerificationPanel() {
  const myId = useCompanyStore((s) => s.id)
  const locked = useCatalogStore((s) => s.companies.find((c) => c.id === myId)?.locked ?? false)
  const uid = useId()
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
        <div>
          <p className="font-medium text-page-fg">Doanh nghiệp đã được xác minh</p>
          <p className="mt-1 text-sm text-page-muted">Nhãn xác minh hiện ở trang công ty và các tin tuyển dụng của bạn.</p>
        </div>
      </div>
    )
  } else if (state.latest?.status === 'pending') {
    const v = state.latest
    body = (
      <div>
        <p className="text-sm text-page-fg">Yêu cầu gửi ngày <span className="tnum">{dateLabel(v.submittedAt)}</span> đang chờ quản trị viên duyệt.</p>
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
          <form onSubmit={(e) => { void submit(e) }} noValidate>
            <p className="text-sm text-page-muted">
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
            <button type="submit" disabled={busy || files.length === 0} className={cn(BTN_PRIMARY, BTN_SM, 'mt-4')}>
              {busy ? 'Đang gửi…' : rejected ? 'Gửi lại yêu cầu' : 'Gửi yêu cầu xác minh'}
            </button>
          </form>
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
