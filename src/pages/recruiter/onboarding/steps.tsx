import { useEffect, useRef, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import CompanyLogo from '@components/common/CompanyLogo'
import { photoUrl } from '@components/discover/types'
import { COVER_CHOICES, useCompanyStore, type CompanyProfile } from '@context/companyStore'
import { checkLogoFile, uploadCompanyLogo } from '@services/companyService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { BTN_SECONDARY, BTN_SM } from '@utils/ui'
import type { CompanySize } from '@/types'
import { DISTRICTS, FIELD, Field, ListEditor, SIZES } from '../CompanyProfile'
import { TaxCodeField } from '../TaxCodeField'

// Nội dung từng bước của form bắt đầu. Dữ liệu nháp (`draft`) do OnboardingPage giữ, bước nào cũng chỉ sửa nháp;
// bấm "Tiếp theo" thì trang mới lưu phần đã đổi lên máy chủ.

export type Draft = Pick<CompanyProfile, 'name' | 'industry' | 'district' | 'size' | 'tagline' | 'about' | 'cover' | 'environment' | 'values' | 'policies' | 'culture' | 'email' | 'phone'> & { address: string }
export type SetDraft = <K extends keyof Draft>(k: K, v: Draft[K]) => void
interface StepProps { draft: Draft; set: SetDraft }

/** Mô tả ngắn dưới tiêu đề mỗi bước */
const Intro = ({ children }: { children: string }) => <p className="mt-2 text-sm text-page-muted">{children}</p>

export function StepTax() {
  return (
    <>
      <p className="mt-2 text-sm text-page-muted">Dùng để xác thực doanh nghiệp. Tra mã trước, thấy đúng công ty của bạn rồi mới lưu.</p>
      <div className="mt-5"><TaxCodeField readOnly={false} heading={null} /></div>
    </>
  )
}

/** Logo: tải lên / đổi ngay (logo bắt buộc nên không có nút xóa) */
function LogoPicker({ name }: { name: string }) {
  const logoUrl = useCompanyStore((s) => s.logoUrl)
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pick = async (file: File | undefined) => {
    if (inputRef.current) inputRef.current.value = ''
    if (!file) return
    const bad = checkLogoFile(file)
    if (bad) { setError(bad); return }
    setError(null); setBusy(true)
    const err = await uploadCompanyLogo(file)
    setBusy(false)
    if (err) setError(err)
  }
  return (
    <div className="flex flex-wrap items-center gap-4">
      <CompanyLogo name={name || 'Công ty'} logoUrl={logoUrl} className="h-20 w-20 text-xl" />
      <div className="min-w-0 flex-1">
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-label="Chọn tệp logo"
          onChange={(e) => { void pick(e.target.files?.[0]) }} />
        <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} className={cn(BTN_SECONDARY, BTN_SM)}>
          {busy ? 'Đang tải…' : logoUrl ? 'Đổi logo' : 'Tải logo'}
        </button>
        <p className="mt-2 text-xs text-page-muted">JPG, PNG hoặc WEBP, tối đa 2MB.</p>
        {error && (
          <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm font-medium text-danger">
            <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />{error}
          </p>
        )}
      </div>
    </div>
  )
}

export function StepName({ draft, set }: StepProps) {
  const lookup = useCompanyStore((s) => s.tax.taxLookup)
  const officialName = lookup?.result === 'active' ? lookup.name : undefined
  const officialAddress = lookup?.result === 'active' ? lookup.address : undefined
  // Điền sẵn địa chỉ từ dữ liệu thuế một lần khi vào bước, nếu chưa có địa chỉ
  const prefilled = useRef(false)
  useEffect(() => {
    if (prefilled.current) return
    prefilled.current = true
    if (!draft.address.trim() && officialAddress) set('address', officialAddress)
  }, [draft.address, officialAddress, set])
  return (
    <>
      <Intro>Tên và logo hiện ở thẻ công ty, tin việc làm và tin nhắn. Hai mục này bắt buộc.</Intro>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Tên doanh nghiệp *">
            {(p) => <input {...p} value={draft.name} autoComplete="organization" onChange={(e) => set('name', e.target.value)} className={FIELD} />}
          </Field>
          {officialName && officialName.trim() !== draft.name.trim() && (
            <button type="button" onClick={() => set('name', officialName)} className={cn('mt-2 max-w-full rounded-control text-left text-sm text-page-fg underline underline-offset-4', FOCUS)}>
              Dùng tên đăng ký: <span className="break-words font-medium">{officialName}</span>
            </button>
          )}
        </div>
        <div className="sm:col-span-2">
          <p className="mb-2 text-sm text-page-muted">Logo công ty *</p>
          <LogoPicker name={draft.name} />
        </div>
        <Field label="Ngành nghề (không bắt buộc)">
          {(p) => <input {...p} value={draft.industry} onChange={(e) => set('industry', e.target.value)} className={FIELD} />}
        </Field>
        <Field label="Khu vực (quận)">
          {(p) => (
            <select {...p} value={draft.district} onChange={(e) => set('district', e.target.value)} className={FIELD}>
              {!DISTRICTS.includes(draft.district) && <option>{draft.district}</option>}
              {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
            </select>
          )}
        </Field>
        <Field label="Quy mô (người)">
          {(p) => (
            <select {...p} value={draft.size} onChange={(e) => set('size', e.target.value as CompanySize)} className={FIELD}>
              {SIZES.map((s) => <option key={s}>{s}</option>)}
            </select>
          )}
        </Field>
        <Field label="Địa chỉ">
          {(p) => <input {...p} value={draft.address} autoComplete="street-address" onChange={(e) => set('address', e.target.value)} className={FIELD} />}
        </Field>
      </div>
    </>
  )
}

export function StepIntro({ draft, set }: StepProps) {
  return (
    <>
      <Intro>Vài dòng giúp người tìm việc hiểu công ty bạn. Có thể bỏ qua và bổ sung sau ở Hồ sơ công ty.</Intro>
      <div className="mt-5 flex flex-col gap-4">
        <Field label="Giới thiệu ngắn (một câu)">
          {(p) => <input {...p} value={draft.tagline} onChange={(e) => set('tagline', e.target.value)} className={FIELD} />}
        </Field>
        <Field label="Giới thiệu đầy đủ">
          {(p) => <textarea {...p} rows={5} value={draft.about} onChange={(e) => set('about', e.target.value)} className={FIELD} />}
        </Field>
        <div>
          <p className="mb-2 text-sm text-page-muted">Ảnh bìa</p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {COVER_CHOICES.map((c) => {
              const on = draft.cover.id === c.id
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
        </div>
      </div>
    </>
  )
}

export function StepCulture({ draft, set }: StepProps) {
  return (
    <>
      <Intro>Cho người tìm việc thấy làm ở đây sẽ ra sao. Có thể bỏ qua và bổ sung sau.</Intro>
      <div className="mt-5 flex flex-col gap-6">
        <ListEditor label="Môi trường làm việc" items={draft.environment} onChange={(v) => set('environment', v)} placeholder="Vd. Đồng nghiệp thân thiện" />
        <ListEditor label="Giá trị" items={draft.values} onChange={(v) => set('values', v)} placeholder="Vd. Tôn trọng giờ giấc" />
        <ListEditor label="Chính sách" items={draft.policies} onChange={(v) => set('policies', v)} placeholder="Vd. Trả lương đúng hạn" />
        <Field label="Văn hóa công ty">
          {(p) => <textarea {...p} rows={4} value={draft.culture} onChange={(e) => set('culture', e.target.value)} className={FIELD} />}
        </Field>
      </div>
    </>
  )
}

export function StepContact({ draft, set, emailError }: StepProps & { emailError?: string }) {
  return (
    <>
      <Intro>Thông tin liên hệ hiện ở trang công ty. Có thể bỏ qua và bổ sung sau.</Intro>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Email công ty" error={emailError}>
          {(p) => <input {...p} type="email" autoComplete="email" value={draft.email} onChange={(e) => set('email', e.target.value)} className={FIELD} />}
        </Field>
        <Field label="Điện thoại">
          {(p) => <input {...p} type="tel" inputMode="tel" autoComplete="tel" value={draft.phone} onChange={(e) => set('phone', e.target.value)} className={FIELD} />}
        </Field>
      </div>
    </>
  )
}
