import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Camera, Loader2 } from 'lucide-react'
import DialogShell from '@components/interview/DialogShell'
import { apiErrorMessage } from '@services/authService'
import { savePersonalCover } from '@services/profileService'
import { BTN_GHOST, BTN_PRIMARY, BTN_SECONDARY, BTN_SM } from '@utils/ui'
import { cn } from '@utils/cn'
import fallback from '@assets/images/personal-cover-preview.webp'
import { prepareCover } from './prepareCover'

export default function CoverEditor({ currentUrl, onClose }: { currentUrl: string | null; onClose: () => void }) {
  const input = useRef<HTMLInputElement>(null)
  const alive = useRef(true)
  const [selected, setSelected] = useState<File | null>()
  const [preview, setPreview] = useState<string>()
  const [busy, setBusy] = useState<'preparing' | 'saving' | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    alive.current = true
    return () => { alive.current = false }
  }, [])
  useEffect(() => {
    if (!selected) { setPreview(undefined); return }
    const url = URL.createObjectURL(selected)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [selected])

  async function choose(file: File) {
    setError('')
    setBusy('preparing')
    try {
      const prepared = await prepareCover(file)
      if (alive.current) setSelected(prepared)
    } catch (err) {
      if (alive.current) setError((err as Error).message)
    } finally {
      if (alive.current) setBusy(null)
    }
  }

  async function save() {
    if (selected === undefined || busy) return
    setError('')
    setBusy('saving')
    try {
      await savePersonalCover(selected)
      if (alive.current) {
        toast.success(selected ? 'Đã đổi ảnh bìa.' : 'Đã dùng ảnh bìa mặc định.')
        onClose()
      }
    } catch (err) {
      if (alive.current) setError(apiErrorMessage(err, 'Chưa lưu được ảnh bìa. Bạn thử lại nhé.'))
    } finally {
      if (alive.current) setBusy(null)
    }
  }

  return <DialogShell titleId="personal-cover-title" title="Đổi ảnh bìa" subtitle="Nên chọn ảnh ngang, chủ thể ở giữa." onClose={() => { if (busy !== 'saving') onClose() }}>
    <div className="space-y-4" aria-busy={!!busy}>
      <img src={selected === null ? fallback : preview || currentUrl || fallback} alt="Xem trước ảnh bìa" className="aspect-[3/1] w-full rounded-card object-cover object-center" />
      <p className="text-sm leading-6 text-page-muted">JPG, PNG hoặc WebP, tối đa 10 MB. Ảnh được tối ưu trước khi lưu và hiển thị theo khung của từng màn hình.</p>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" aria-label="Chọn ảnh bìa từ thiết bị" disabled={!!busy} onChange={(e) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (file) void choose(file)
      }} />
      <div className="flex flex-wrap gap-2">
        <button type="button" className={cn(BTN_SECONDARY, BTN_SM)} disabled={!!busy} onClick={() => input.current?.click()}><Camera aria-hidden className="h-4 w-4" />Chọn ảnh từ máy</button>
        <button type="button" className={cn(BTN_GHOST, BTN_SM)} disabled={!!busy || (!currentUrl && !selected)} onClick={() => { setSelected(null); setError('') }}>Dùng ảnh mặc định</button>
      </div>
      {selected && <p className="text-xs text-page-muted">Dung lượng sau tối ưu: {Math.ceil(selected.size / 1024)} KB</p>}
      {busy && <p role="status" className="flex items-center gap-2 text-sm text-page-muted"><Loader2 aria-hidden className="h-4 w-4 animate-spin motion-reduce:animate-none" />{busy === 'preparing' ? 'Đang tối ưu ảnh…' : 'Đang lưu ảnh bìa…'}</p>}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-page-line pt-4">
        <button type="button" className={BTN_GHOST} disabled={busy === 'saving'} onClick={onClose}>Hủy</button>
        <button type="button" className={BTN_PRIMARY} disabled={!!busy || selected === undefined} onClick={() => void save()}>Lưu ảnh bìa</button>
      </div>
    </div>
  </DialogShell>
}
