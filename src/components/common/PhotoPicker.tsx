import { useEffect, useId, useRef, useState } from 'react'
import { AlertCircle, Upload } from 'lucide-react'
import { photoUrl, type Photo } from '@components/discover/types'
import { uploadCompanyImage } from '@services/companyService'
import { prepareCover } from '@pages/public/personal/prepareCover'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { BTN_SECONDARY, BTN_SM } from '@utils/ui'

interface Props {
  value: Photo
  choices: Photo[]
  onChange: (photo: Photo) => void
  onBusyChange: (busy: boolean) => void
  disabled?: boolean
}

/** Ảnh chỉ lưu vào nháp; form cha quyết định lúc lưu hồ sơ hoặc tin. */
export default function PhotoPicker({ value, choices, onChange, onBusyChange, disabled = false }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const mounted = useRef(false)
  const uploading = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const helpId = useId()
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const pick = async (file: File | undefined) => {
    if (input.current) input.current.value = ''
    if (!file || uploading.current || disabled) return
    uploading.current = true
    setError(null); setBusy(true); onBusyChange(true)
    try {
      const prepared = await prepareCover(file)
      if (!mounted.current) return
      const photo = await uploadCompanyImage(prepared)
      if (mounted.current) onChange(photo)
    } catch (err) {
      if (mounted.current) setError(err instanceof Error ? err.message : 'Không tải được ảnh lên. Bạn thử lại nhé.')
    } finally {
      uploading.current = false
      if (mounted.current) { setBusy(false); onBusyChange(false) }
    }
  }

  return (
    <div className="space-y-4" aria-busy={busy}>
      <img src={photoUrl(value, 900)} alt={value.alt} className="aspect-[2/1] w-full rounded-card border border-page-line object-cover" />
      <div>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1}
          aria-label="Chọn ảnh từ máy" aria-describedby={helpId} disabled={busy || disabled}
          onChange={(e) => { void pick(e.target.files?.[0]) }} />
        <button type="button" disabled={busy || disabled} onClick={() => input.current?.click()} className={cn(BTN_SECONDARY, BTN_SM)} aria-describedby={helpId}>
          <Upload className="h-4 w-4" aria-hidden="true" />{busy ? 'Đang tải ảnh…' : value.url ? 'Đổi ảnh' : 'Tải ảnh lên'}
        </button>
        <p id={helpId} className="mt-2 text-xs text-page-muted">JPG, PNG hoặc WebP, ảnh gốc tối đa 10 MB. Ảnh được nén còn tối đa 2 MB trước khi tải.</p>
        <p role="status" className="sr-only">{busy ? 'Đang xử lý và tải ảnh lên. Vui lòng chờ trước khi lưu.' : ''}</p>
        {error && <p role="alert" className="mt-2 flex items-start gap-1.5 text-sm font-medium text-danger"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><span>{error}</span></p>}
      </div>
      <div>
        <p className="mb-2 text-sm text-page-muted">Hoặc chọn ảnh có sẵn</p>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {choices.map((photo) => {
            const selected = photoUrl(value, 400) === photoUrl(photo, 400)
            return (
              <li key={photo.url || photo.id}>
                <button type="button" aria-pressed={selected} aria-label={`Chọn ảnh: ${photo.alt}`} disabled={busy || disabled}
                  onClick={() => { setError(null); onChange(photo) }}
                  className={cn('block w-full overflow-hidden rounded-card border-2 text-left disabled:cursor-default disabled:opacity-50', selected ? 'border-page-fg' : 'border-page-line hover:border-page-edge', FOCUS)}>
                  <img src={photoUrl(photo, 400)} alt="" loading="lazy" className="aspect-[4/3] w-full object-cover" />
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
