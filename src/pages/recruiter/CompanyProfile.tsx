import { useId, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AlertCircle, Plus, X } from 'lucide-react'
import { MockNotice, PageHeader, Panel, StatusBadge } from '@components/dashboard'
import { photoUrl } from '@components/discover/types'
import { COVER_CHOICES, useCompanyStore, type CompanyProfile as Profile } from '@context/companyStore'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import type { CompanySize } from '@/types'

const BTN = `inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-300 ${FOCUS}`
const BTN_SOLID = `${BTN} border-page-fg bg-page-fg text-page-bg hover:bg-page-bg hover:text-page-fg`
const BTN_LINE = `${BTN} border-page-line text-page-fg hover:border-page-fg`
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
        <button type="button" onClick={add} className={`${BTN_LINE} flex-shrink-0 gap-1.5`}><Plus className="h-4 w-4" aria-hidden="true" />Thêm</button>
      </div>
    </div>
  )
}

/** Hồ sơ công ty: sửa bằng state cục bộ, bấm "Lưu thay đổi" mới ghi vào kho (trang công khai đọc từ kho). */
export default function CompanyProfile() {
  const profile = useCompanyStore((s) => s.profile)
  const update = useCompanyStore((s) => s.update)
  const reset = useCompanyStore((s) => s.reset)
  const [form, setForm] = useState<Profile>(profile)
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})
  const [confirmReset, setConfirmReset] = useState(false)

  const dirty = JSON.stringify(form) !== JSON.stringify(profile)
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => setForm((f) => ({ ...f, [k]: v }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const next = {
      name: form.name.trim() ? undefined : 'Vui lòng nhập tên công ty.',
      email: EMAIL_RE.test(form.email.trim()) ? undefined : 'Email chưa hợp lệ.',
    }
    setErrors(next)
    if (next.name || next.email) return
    update({ ...form, name: form.name.trim(), email: form.email.trim() })
    toast.success('Đã lưu hồ sơ công ty')
  }
  const cancel = () => { setForm(profile); setErrors({}) }
  const doReset = () => {
    reset()
    // Lấy lại giá trị mặc định từ kho để form khớp
    setForm(useCompanyStore.getState().profile)
    setErrors({})
    setConfirmReset(false)
    toast.success('Đã khôi phục hồ sơ mặc định')
  }

  return (
    <div>
      <PageHeader title="Hồ sơ công ty" description="Thông tin này hiện ở trang công ty mà người tìm việc xem." />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <form onSubmit={submit} noValidate className="flex flex-col gap-6">
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
            <button type="submit" className={BTN_SOLID}>Lưu thay đổi</button>
            <button type="button" onClick={cancel} disabled={!dirty} className={`${BTN_LINE} disabled:opacity-50`}>Hủy</button>
            <button type="button" onClick={() => setConfirmReset(true)} className={BTN_LINE}>Khôi phục mặc định</button>
            {dirty && <span role="status" className="text-sm text-page-muted">Có thay đổi chưa lưu</span>}
          </div>
          {confirmReset && (
            <div role="alertdialog" aria-label="Xác nhận khôi phục mặc định" className="flex flex-col gap-3 rounded-card border border-page-fg p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-page-fg">Khôi phục toàn bộ hồ sơ về nội dung mẫu ban đầu?</p>
              <div className="flex gap-2">
                <button type="button" autoFocus className={BTN_SOLID} onClick={doReset}>Khôi phục</button>
                <button type="button" className={BTN_LINE} onClick={() => setConfirmReset(false)}>Hủy</button>
              </div>
            </div>
          )}
          <MockNotice />
        </form>

        {/* Xem trước thẻ công ty như ở trang Việc làm */}
        <aside aria-label="Xem trước" className="lg:sticky lg:top-6 lg:self-start">
          <Panel title="Xem trước">
            <div className="overflow-hidden rounded-card border border-page-line">
              <img src={photoUrl(form.cover.id, 640)} alt={form.cover.alt} className="aspect-[4/3] w-full object-cover" />
              <div className="p-4">
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
