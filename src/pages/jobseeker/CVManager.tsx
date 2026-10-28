import { useEffect, useRef, useState, type DragEvent, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import toast from 'react-hot-toast'
import { AlertCircle, FileText, Image as ImageIcon, Upload, X } from 'lucide-react'
import { EmptyState, PageHeader, Panel, StatusBadge } from '@components/dashboard'
import { CV_MAX_COUNT, CV_TYPES, useCvStore, type CvMeta } from '@context/cvStore'
import { getFile } from '@utils/fileStore'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'

const BTN = `inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-300 ${FOCUS}`
const BTN_SOLID = `${BTN} border-page-fg bg-page-fg text-page-bg hover:bg-page-bg hover:text-page-fg`
const BTN_LINE = `${BTN} border-page-line text-page-fg hover:border-page-fg`

/** Dung lượng dạng KB / MB */
const formatSize = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)
const formatDate = (iso: string) => new Date(iso).toLocaleDateString('vi-VN')
const extOf = (type: string) => (type === 'application/pdf' ? 'pdf' : type.split('/')[1] === 'jpeg' ? 'jpg' : type.split('/')[1])

/** Khung xem trước CV (modal): PDF nhúng iframe, ảnh hiện <img>. Esc hoặc nút Đóng để thoát. */
function PreviewDialog({ cv, onClose }: { cv: CvMeta; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null)
  const [missing, setMissing] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  // Lấy file từ IndexedDB → object URL; trả lại bộ nhớ khi đóng
  useEffect(() => {
    let objectUrl: string | null = null
    let alive = true
    getFile(cv.id)
      .then((blob) => {
        if (!alive) return
        if (!blob) return setMissing(true)
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => alive && setMissing(true))
    return () => {
      alive = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [cv.id])

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: globalThis.KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-page-bg p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={`Xem trước ${cv.name}`} className="flex h-full max-h-[90vh] w-full max-w-4xl flex-col rounded-card border border-page-line bg-page-surface">
        <div className="flex items-center justify-between gap-4 border-b border-page-line px-5 py-3">
          <p className="truncate font-medium text-page-fg">{cv.name}</p>
          <button ref={closeRef} type="button" onClick={onClose} className={`${BTN_LINE} gap-1.5`}>
            <X className="h-4 w-4" aria-hidden="true" />Đóng
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-4">
          {missing && <p className="py-12 text-center text-sm text-page-muted">Không tìm thấy nội dung file trên trình duyệt này.</p>}
          {!missing && !url && <p className="py-12 text-center text-sm text-page-muted">Đang tải…</p>}
          {url && (cv.type === 'application/pdf'
            ? <iframe title={`Xem trước ${cv.name}`} src={url} className="h-full min-h-[60vh] w-full rounded-control border border-page-line" />
            : <img src={url} alt={`Bản xem trước ${cv.name}`} className="mx-auto max-h-full max-w-full object-contain" />)}
        </div>
      </div>
    </div>,
    document.body,
  )
}

/** Một dòng CV: tên (đổi tại chỗ), thông tin file, các nút thao tác */
function CvRow({ cv, isDefault, onPreview }: { cv: CvMeta; isDefault: boolean; onPreview: () => void }) {
  const { rename, setDefault, remove } = useCvStore()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(cv.name)
  const [confirming, setConfirming] = useState(false)
  const Icon = cv.type === 'application/pdf' ? FileText : ImageIcon

  const saveName = () => {
    rename(cv.id, draft)
    setEditing(false)
  }
  const onNameKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') saveName()
    if (e.key === 'Escape') { e.stopPropagation(); setEditing(false) }
  }

  // Tải xuống: dựng object URL tạm rồi bấm một thẻ <a download>
  const download = async () => {
    const blob = await getFile(cv.id).catch(() => undefined)
    if (!blob) return toast.error('Không tìm thấy nội dung file.')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${cv.name}.${extOf(cv.type)}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const doRemove = async () => {
    await remove(cv.id)
    toast.success('Đã xóa CV')
  }

  return (
    <li className="py-5 first:pt-0 last:pb-0">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-page-line text-page-muted">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            {editing ? (
              <input
                autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onNameKey} onBlur={saveName}
                aria-label="Tên CV (Enter để lưu, Esc để hủy)"
                className={`w-full rounded-control border border-page-edge bg-page-surface px-3 py-1.5 text-sm text-page-fg ${FOCUS}`}
              />
            ) : (
              <p className="flex flex-wrap items-center gap-2 font-medium text-page-fg">
                <span className="break-all">{cv.name}</span>
                {isDefault && <StatusBadge tone="strong">Mặc định</StatusBadge>}
              </p>
            )}
            <p className="mt-1 text-sm text-page-muted">
              {extOf(cv.type).toUpperCase()} · {formatSize(cv.size)} · Tải lên {formatDate(cv.uploadedAt)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button type="button" className={BTN_LINE} onClick={onPreview}>Xem<span className="sr-only"> {cv.name}</span></button>
          <button type="button" className={BTN_LINE} onClick={download}>Tải xuống<span className="sr-only"> {cv.name}</span></button>
          <button type="button" className={BTN_LINE} onClick={() => { setDraft(cv.name); setEditing(true) }}>Đổi tên<span className="sr-only"> {cv.name}</span></button>
          {!isDefault && <button type="button" className={BTN_LINE} onClick={() => { setDefault(cv.id); toast.success('Đã đặt làm CV mặc định') }}>Đặt làm mặc định</button>}
          <button type="button" className={BTN_LINE} onClick={() => setConfirming(true)}>Xóa<span className="sr-only"> {cv.name}</span></button>
        </div>
      </div>

      {confirming && (
        <div role="alertdialog" aria-label={`Xác nhận xóa ${cv.name}`} className="mt-4 flex flex-col gap-3 rounded-card border border-page-fg p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-page-fg">Xóa CV “{cv.name}”? Không thể hoàn tác.</p>
          <div className="flex gap-2">
            <button type="button" autoFocus className={BTN_SOLID} onClick={doRemove}>Xóa CV</button>
            <button type="button" className={BTN_LINE} onClick={() => setConfirming(false)}>Hủy</button>
          </div>
        </div>
      )}
    </li>
  )
}

/** Quản lý CV: tải lên (kéo-thả hoặc chọn file), xem, đổi tên, đặt mặc định, tải xuống, xóa. */
export default function CVManager() {
  const items = useCvStore((s) => s.items)
  const defaultId = useCvStore((s) => s.defaultId)
  const add = useCvStore((s) => s.add)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const preview = items.find((x) => x.id === previewId) ?? null

  // Thêm lần lượt từng file; dừng ở lỗi đầu tiên để người dùng đọc được
  const upload = async (files: FileList | File[]) => {
    setError(null)
    for (const f of Array.from(files)) {
      const err = await add(f)
      if (err) return setError(err)
      toast.success(`Đã tải lên “${f.name}”`)
    }
  }
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) void upload(e.dataTransfer.files)
  }

  return (
    <div>
      <PageHeader title="Quản lý CV" description="Tải CV lên để doanh nghiệp xem khi bạn ứng tuyển. CV mặc định sẽ được dùng trước." />

      <Panel title="Tải CV lên" className="mb-6">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn('flex flex-col items-center rounded-card border border-dashed px-6 py-10 text-center transition-colors', dragging ? 'border-page-fg bg-page-bg' : 'border-page-edge')}
        >
          <Upload className="mb-3 h-6 w-6 text-page-muted" aria-hidden="true" />
          <p className="text-sm text-page-fg">Kéo file vào đây hoặc</p>
          <button type="button" className={`${BTN_SOLID} mt-3`} onClick={() => inputRef.current?.click()}>Chọn file</button>
          <input ref={inputRef} type="file" multiple accept={CV_TYPES.join(',')} className="sr-only" tabIndex={-1} aria-label="Chọn file CV"
            onChange={(e) => { if (e.target.files) void upload(e.target.files); e.target.value = '' }} />
          <p className="mt-3 text-xs text-page-muted">PDF hoặc ảnh, tối đa 5MB, tối đa {CV_MAX_COUNT} CV.</p>
        </div>
        {error && (
          <p role="alert" className="mt-3 flex items-center gap-1.5 text-sm font-medium text-page-fg">
            <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />{error}
          </p>
        )}
      </Panel>

      {items.length === 0 ? (
        <EmptyState icon={FileText} title="Chưa có CV nào" description="Tải CV đầu tiên lên để dùng khi ứng tuyển." />
      ) : (
        <Panel title={`CV của bạn (${items.length}/${CV_MAX_COUNT})`}>
          <ul className="divide-y divide-page-line">
            {items.map((cv) => <CvRow key={cv.id} cv={cv} isDefault={cv.id === defaultId} onPreview={() => setPreviewId(cv.id)} />)}
          </ul>
        </Panel>
      )}

      <p className="mt-4 text-xs text-page-muted">File chỉ lưu trên trình duyệt này (bản mẫu, chưa tải lên máy chủ).</p>
      {preview && <PreviewDialog cv={preview} onClose={() => setPreviewId(null)} />}
    </div>
  )
}
