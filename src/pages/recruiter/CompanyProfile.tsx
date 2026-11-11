import { useId, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AlertCircle, Plus, X } from 'lucide-react'
import { PageHeader, Panel, StatusBadge } from '@components/dashboard'
import { useCatalogStore } from '@context/catalogStore'
import { apiErrorMessage } from '@services/authService'
import { photoUrl } from '@components/discover/types'
import { COVER_CHOICES, useCompanyStore, type CompanyProfile as Profile } from '@context/companyStore'
import CompanyLogo from '@components/common/CompanyLogo'
import VerificationPanel from './VerificationPanel'
import { checkLogoFile, removeCompanyLogo, uploadCompanyLogo } from '@services/companyService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { BTN_ACCENT, BTN_DANGER, BTN_GHOST, BTN_SECONDARY, BTN_SM } from '@utils/ui'
import type { CompanySize } from '@/types'

const FIELD = `w-full rounded-control border border-page-edge bg-page-surface px-3 py-2 text-sm text-page-fg ${FOCUS}`

const DISTRICTS = ['Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn', 'Liên Chiểu', 'Cẩm Lệ', 'Hòa Vang']
const SIZES: CompanySize[] = ['1-10', '11-50', '51-200', '201-500', '500+']
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Ô nhập/chọn có nhãn; error hiện dưới ô và gắn aria-describedby */
function Field({ label, error, children }: { label: string; error?: string; children: (p: { id: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }) => React.ReactNode }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-page-muted">{label}</label>
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': error ? `${id}-err` : undefined })}
      {error && (
        <p id={`${id}-err`} role="alert" className="flex items-center gap-1.5 text-sm font-medium text-page-fg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />{error}
        </p>
      )}
    </div>
  )
}

/** Danh sách chuỗi: mỗi mục có nút xóa, ô nhập ở dưới để thêm */
function ListEditor({ label, items, onChange, placeholder }: { label: string; items: string[]; onChange: (v: string[]) => void; placeholder: string }) {
  const [draft, setDraft] = useState('')
  const id = useId()
  const add = () => {
    const v = draft.trim()
    if (v && !items.includes(v)) onChange([...items, v])
    setDraft('')
  }
  return (
    <div>
      <label htmlFor={id} className="text-sm text-page-muted">{label}</label>
      {items.length > 0 && (
        <ul className="mt-2 flex flex-col gap-2">
          {items.map((it, i) => (
            <li key={`${it}-${i}`} className="flex items-start justify-between gap-3 rounded-control border border-page-line px-3 py-2 text-sm text-page-fg">
              <span className="min-w-0 break-words">{it}</span>
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label={`Xóa “${it}”`} className={cn('-m-2 flex-shrink-0 rounded-full p-2 text-page-muted hover:text-page-fg', FOCUS)}>
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 flex gap-2">
        <input id={id} value={draft} placeholder={placeholder} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }} className={FIELD} />
        <button type="button" onClick={add} className={cn(BTN_SECONDARY, BTN_SM, 'flex-shrink-0')}><Plus className="h-4 w-4" aria-hidden="true" />Thêm</button>
      </div>
    </div>
  )
}

/** Logo công ty: tải lên / đổi / xóa ngay (không chờ "Lưu thay đổi"). Công ty bị khóa thì không sửa được. */
function LogoPanel({ name }: { name: string }) {
  const logoUrl = useCompanyStore((s) => s.logoUrl)
  const myId = useCompanyStore((s) => s.id)
  const locked = useCatalogStore((s) => s.companies.find((c) => c.id === myId)?.locked ?? false)
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pick = async (file: File | undefined) => {
    if (inputRef.current) inputRef.current.value = '' // cho phép chọn lại cùng một file
    if (!file) return
    const bad = checkLogoFile(file)
    if (bad) { setError(bad); return }
    setError(null); setBusy(true)
    const err = await uploadCompanyLogo(file)
    setBusy(false)
    if (err) setError(err)
    else toast.success('Đã cập nhật logo công ty')
  }
  const remove = async () => {
    setError(null); setBusy(true)
    const err = await removeCompanyLogo()
    setBusy(false)
    if (err) setError(err)
    else toast.success('Đã xóa logo công ty')
  }

  return (
    <Panel title="Logo công ty">
      <div className="flex flex-wrap items-center gap-4">
        <CompanyLogo name={name || 'Công ty'} logoUrl={logoUrl} className="h-20 w-20 text-xl" />
        <div className="min-w-0 flex-1">
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-label="Chọn tệp logo"
            onChange={(e) => { void pick(e.target.files?.[0]) }} />
          {locked ? (
            <p className="text-sm text-page-muted">Công ty đang bị khóa nên chưa thể đổi logo.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className={cn(BTN_SECONDARY, BTN_SM)}>
                {busy ? 'Đang tải…' : logoUrl ? 'Đổi logo' : 'Tải logo'}
              </button>
              {logoUrl && (
                <button type="button" disabled={busy} onClick={() => { void remove() }} className={cn(BTN_DANGER, BTN_SM)}>Xóa logo</button>
              )}
            </div>
          )}
          <p className="mt-2 text-xs text-page-muted">JPG, PNG hoặc WEBP, tối đa 2MB. Logo hiện ở thẻ công ty, tin việc làm và tin nhắn.</p>
          {error && (
            <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm font-medium text-page-fg">
              <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />{error}
            </p>
          )}
        </div>
      </div>
    </Panel>
  )
}

/** Hồ sơ công ty: sửa bằng state cục bộ, bấm "Lưu thay đổi" mới gửi lên máy chủ. */
export default function CompanyProfile() {
  const profile = useCompanyStore((s) => s.profile)
  const update = useCompanyStore((s) => s.update)
  const logoUrl = useCompanyStore((s) => s.logoUrl)
  const [form, setForm] = useState<Profile>(profile)
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})
  const [saving, setSaving] = useState(false)

  const dirty = JSON.stringify(form) !== JSON.stringify(profile)
  // Hồ sơ nạp xong từ máy chủ sau khi trang đã mở: đưa vào form
  const [synced, setSynced] = useState(profile)
  if (synced !== profile) {
    setSynced(profile)
    setForm(profile)
  }
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const next = {
      name: form.name.trim() ? undefined : 'Vui lòng nhập tên công ty.',
      email: EMAIL_RE.test(form.email.trim()) ? undefined : 'Email chưa hợp lệ.',
    }
    setErrors(next)
    if (next.name || next.email) return
    setSaving(true)
    try {
      await update({ ...form, name: form.name.trim(), email: form.email.trim() })
      // Trang công khai đọc từ danh mục
      await useCatalogStore.getState().load()
      toast.success('Đã lưu hồ sơ công ty')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Chưa lưu được hồ sơ công ty, vui lòng thử lại.'))
    } finally {
      setSaving(false)
    }
  }
  const cancel = () => { setForm(profile); setErrors({}) }

  return (
    <div>
      <PageHeader title="Hồ sơ công ty" description="Thông tin này hiện ở trang công ty mà người tìm việc xem." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
        <VerificationPanel />
        <form onSubmit={submit} noValidate className="flex flex-col gap-6">
          <LogoPanel name={profile.name} />

          <Panel title="Thông tin chung">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Tên công ty" error={errors.name}>
                  {(p) => <input {...p} value={form.name} onChange={(e) => set('name', e.target.value)} className={FIELD} />}
                </Field>
              </div>
              <Field label="Ngành">
                {(p) => <input {...p} value={form.industry} onChange={(e) => set('industry', e.target.value)} className={FIELD} />}
              </Field>
              <Field label="Quận">
                {(p) => (
                  <select {...p} value={form.district} onChange={(e) => set('district', e.target.value)} className={FIELD}>
                    {!DISTRICTS.includes(form.district) && <option>{form.district}</option>}
                    {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                  </select>
                )}
              </Field>
              <Field label="Quy mô (người)">
                {(p) => (
                  <select {...p} value={form.size} onChange={(e) => set('size', e.target.value as CompanySize)} className={FIELD}>
                    {SIZES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                )}
              </Field>
              <div className="sm:col-span-2">
                <Field label="Giới thiệu ngắn (một câu)">
                  {(p) => <input {...p} value={form.tagline} onChange={(e) => set('tagline', e.target.value)} className={FIELD} />}
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Giới thiệu đầy đủ">
                  {(p) => <textarea {...p} rows={5} value={form.about} onChange={(e) => set('about', e.target.value)} className={FIELD} />}
                </Field>
              </div>
            </div>
          </Panel>

          <Panel title="Ảnh bìa">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {COVER_CHOICES.map((c) => {
                const on = form.cover.id === c.id
                return (
                  <li key={c.id}>
                    <button type="button" aria-pressed={on} onClick={() => set('cover', c)}
                      className={cn('block w-full overflow-hidden rounded-card border-2 text-left', on ? 'border-page-fg' : 'border-page-line hover:border-page-edge', FOCUS)}>
                      <img src={photoUrl(c.id, 400)} alt={c.alt} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                      <span className="sr-only">{on ? 'Đang chọn' : 'Chọn ảnh này'}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </Panel>

          <Panel title="Môi trường, giá trị, chính sách">
            <div className="flex flex-col gap-6">
              <ListEditor label="Môi trường làm việc" items={form.environment} onChange={(v) => set('environment', v)} placeholder="Vd. Đồng nghiệp thân thiện" />
              <ListEditor label="Giá trị" items={form.values} onChange={(v) => set('values', v)} placeholder="Vd. Tôn trọng giờ giấc" />
              <ListEditor label="Chính sách" items={form.policies} onChange={(v) => set('policies', v)} placeholder="Vd. Trả lương đúng hạn" />
            </div>
          </Panel>

          <Panel title="Văn hóa">
            <Field label="Văn hóa công ty">
              {(p) => <textarea {...p} rows={4} value={form.culture} onChange={(e) => set('culture', e.target.value)} className={FIELD} />}
            </Field>
          </Panel>

          <Panel title="Liên hệ">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" error={errors.email}>
                {(p) => <input {...p} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={FIELD} />}
              </Field>
              <Field label="Điện thoại">
                {(p) => <input {...p} type="tel" inputMode="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={FIELD} />}
              </Field>
            </div>
          </Panel>

          {/* Thanh hành động */}
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={saving} className={BTN_ACCENT}>{saving ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
            <button type="button" onClick={cancel} disabled={!dirty} className={BTN_GHOST}>Hủy</button>
            {dirty && <span role="status" className="text-sm text-page-muted">Có thay đổi chưa lưu</span>}
          </div>
        </form>
        </div>

        {/* Xem trước thẻ công ty như ở trang Việc làm */}
        <aside aria-label="Xem trước" className="lg:sticky lg:top-6 lg:self-start">
          <Panel title="Xem trước">
            <div className="overflow-hidden rounded-card border border-page-line">
              <img src={photoUrl(form.cover.id, 640)} alt={form.cover.alt} className="aspect-[4/3] w-full object-cover" />
              <div className="p-4">
                <CompanyLogo name={form.name || 'Công ty'} logoUrl={logoUrl} decorative className="mb-3 h-12 w-12 text-sm" />
                <p className="font-display text-lg font-medium text-page-fg">{form.name || 'Tên công ty'}</p>
                <p className="mt-1 text-sm text-page-muted">{form.industry} · {form.district}</p>
                <p className="mt-2 text-sm leading-relaxed text-page-fg">{form.tagline}</p>
                <div className="mt-3"><StatusBadge tone="muted">{form.size} người</StatusBadge></div>
              </div>
            </div>
            <Link to="/cong-ty/song-han" className={cn('mt-4 inline-block rounded-control text-sm font-medium text-page-fg underline underline-offset-4', FOCUS)}>
              Xem trang công ty
            </Link>
            {dirty && <p className="mt-2 text-xs text-page-muted">Trang công ty chỉ đổi sau khi bạn lưu.</p>}
          </Panel>
        </aside>
      </div>
    </div>
  )
}
