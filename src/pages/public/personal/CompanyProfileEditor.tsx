import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import DialogShell from '@components/interview/DialogShell'
import PhotoPicker from '@components/common/PhotoPicker'
import { COVER_CHOICES, useCompanyStore } from '@context/companyStore'
import { useCatalogStore } from '@context/catalogStore'
import { apiErrorMessage } from '@services/authService'
import { DISTRICTS, FIELD, Field, SIZES } from '@pages/recruiter/CompanyProfile'
import { BTN_GHOST, BTN_PRIMARY } from '@utils/ui'
import { notifyError, notifySuccess } from '@utils/feedback'
import type { CompanySize } from '@/types'
import type { CompanyEditSection } from './companyProfilePresentation'
import { companyCurrentYear, companyProfileDraft, companySectionPatch, type CompanyDraft, type CompanyDraftErrors } from './companyProfileEditing'

const TITLES: Record<CompanyEditSection, string> = {
  general: 'Thông tin doanh nghiệp', about: 'Giới thiệu doanh nghiệp', culture: 'Văn hóa doanh nghiệp',
  location: 'Địa điểm làm việc', benefits: 'Phúc lợi', cover: 'Đổi ảnh bìa doanh nghiệp',
}

/** Nháp được chụp lúc mở; đóng popup không ghi thay đổi vào hồ sơ. */
export default function CompanyProfileEditor({ section, onClose }: { section: CompanyEditSection; onClose: () => void }) {
  const titleId = useId()
  const formRef = useRef<HTMLFormElement>(null)
  const companyId = useRef(useCompanyStore.getState().id)
  const alive = useRef(true)
  const savingRef = useRef(false)
  const uploadingRef = useRef(false)
  const [draft, setDraft] = useState(() => {
    const { profile, address } = useCompanyStore.getState()
    return companyProfileDraft(profile, address)
  })
  const [errors, setErrors] = useState<CompanyDraftErrors>({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const busy = saving || uploading
  const year = companyCurrentYear()
  useEffect(() => {
    alive.current = true
    return () => { alive.current = false }
  }, [])

  const change = <K extends keyof CompanyDraft>(key: K, value: CompanyDraft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }
  const close = () => { if (!savingRef.current && !uploadingRef.current) onClose() }
  const uploadChanged = (value: boolean) => { uploadingRef.current = value; setUploading(value) }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (savingRef.current || uploadingRef.current || !companyId.current || companyId.current !== useCompanyStore.getState().id) return
    const result = companySectionPatch(section, draft, year)
    setErrors(result.errors)
    setError('')
    if (!result.patch) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
      return
    }
    savingRef.current = true
    setSaving(true)
    try {
      await useCompanyStore.getState().update(result.patch)
      if (!alive.current || companyId.current !== useCompanyStore.getState().id) {
        savingRef.current = false
        return
      }
    } catch (err) {
      if (alive.current) {
        setError(apiErrorMessage(err, 'Chưa lưu được thay đổi. Bạn thử lại nhé.'))
        setSaving(false)
      }
      savingRef.current = false
      return
    }
    if (!alive.current || companyId.current !== useCompanyStore.getState().id) {
      savingRef.current = false
      return
    }
    // PATCH đã thành công: lỗi tải danh mục không được báo thành lỗi lưu hoặc gửi PATCH lần nữa.
    let refreshed = false
    try { refreshed = await useCatalogStore.getState().load() } catch { /* Giữ thông báo lưu thành công phía dưới. */ }
    savingRef.current = false
    if (!alive.current) return
    setSaving(false)
    if (refreshed) notifySuccess('Đã lưu hồ sơ doanh nghiệp.')
    else notifyError('Đã lưu hồ sơ. Chưa tải lại được trang công khai; hãy tải lại trang khi kết nối ổn định.')
    onClose()
  }

  const listField = (key: 'values' | 'environment' | 'policies', label: string) => (
    <Field label={label} error={errors[key]}>
      {(props) => <textarea {...props} rows={4} value={draft[key]} onChange={(e) => change(key, e.target.value)} className={FIELD} />}
    </Field>
  )

  return <DialogShell titleId={titleId} title={TITLES[section]} subtitle="Lưu để cập nhật nội dung người tìm việc thấy trên trang công ty." onClose={close} className="theme-day bg-wm-day text-wm-abyss md:max-w-2xl">
    <form ref={formRef} onSubmit={(event) => { void save(event) }} noValidate aria-busy={busy} className="space-y-5">
      <fieldset disabled={busy} className="min-w-0 space-y-4">
        {section === 'general' && <>
          <Field label="Tên doanh nghiệp" error={errors.name}>
            {(props) => <input {...props} value={draft.name} maxLength={120} autoComplete="organization" onChange={(e) => change('name', e.target.value)} className={FIELD} />}
          </Field>
          <Field label="Email liên hệ doanh nghiệp" error={errors.email}>
            {(props) => <input {...props} type="email" value={draft.email} maxLength={254} onChange={(e) => change('email', e.target.value)} className={FIELD} />}
          </Field>
          <Field label="Số điện thoại liên hệ" error={errors.phone}>
            {(props) => <input {...props} type="tel" inputMode="tel" value={draft.phone} maxLength={30} onChange={(e) => change('phone', e.target.value)} className={FIELD} />}
          </Field>
          <p className="text-sm leading-6 text-page-muted">Email và số điện thoại này được hiển thị công khai. Có thể để trống nếu chưa muốn chia sẻ.</p>
        </>}
        {section === 'about' && <>
          <Field label="Giới thiệu ngắn" error={errors.tagline}>
            {(props) => <input {...props} value={draft.tagline} maxLength={200} onChange={(e) => change('tagline', e.target.value)} className={FIELD} />}
          </Field>
          <Field label="Giới thiệu đầy đủ" error={errors.about}>
            {(props) => <textarea {...props} rows={6} value={draft.about} maxLength={4000} onChange={(e) => change('about', e.target.value)} className={FIELD} />}
          </Field>
          <Field label="Lĩnh vực hoạt động" error={errors.industry}>
            {(props) => <input {...props} value={draft.industry} maxLength={120} onChange={(e) => change('industry', e.target.value)} className={FIELD} />}
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Quy mô (người)">
              {(props) => <select {...props} value={draft.size} onChange={(e) => change('size', e.target.value as CompanySize)} className={FIELD}>
                {SIZES.map((size) => <option key={size}>{size}</option>)}
              </select>}
            </Field>
            <Field label="Năm thành lập (không bắt buộc)" error={errors.foundedYear}>
              {(props) => <input {...props} type="number" inputMode="numeric" min={1000} max={year} step={1} value={draft.foundedYear} onChange={(e) => change('foundedYear', e.target.value)} className={FIELD} />}
            </Field>
          </div>
        </>}
        {section === 'culture' && <>
          <Field label="Văn hóa doanh nghiệp" error={errors.culture}>
            {(props) => <textarea {...props} rows={5} value={draft.culture} maxLength={4000} onChange={(e) => change('culture', e.target.value)} className={FIELD} />}
          </Field>
          <p className="text-sm leading-6 text-page-muted">Danh sách: mỗi dòng một mục, tối đa 20 mục và 200 ký tự mỗi mục.</p>
          {listField('values', 'Giá trị cốt lõi')}
          {listField('environment', 'Môi trường làm việc')}
        </>}
        {section === 'location' && <>
          <Field label="Quận, huyện" error={errors.district}>
            {(props) => <select {...props} value={draft.district} onChange={(e) => change('district', e.target.value)} className={FIELD}>
              {!DISTRICTS.includes(draft.district) && <option value={draft.district}>{draft.district || 'Chọn quận, huyện'}</option>}
              {DISTRICTS.map((district) => <option key={district}>{district}</option>)}
            </select>}
          </Field>
          <Field label="Địa chỉ doanh nghiệp" error={errors.address}>
            {(props) => <input {...props} value={draft.address} maxLength={300} onChange={(e) => change('address', e.target.value)} className={FIELD} />}
          </Field>
        </>}
        {section === 'benefits' && <>
          <p className="text-sm leading-6 text-page-muted">Mỗi dòng một phúc lợi, tối đa 20 mục và 200 ký tự mỗi mục.</p>
          {listField('policies', 'Phúc lợi dành cho nhân viên')}
        </>}
        {section === 'cover' && <PhotoPicker value={draft.cover} choices={COVER_CHOICES} onChange={(photo) => change('cover', photo)} onBusyChange={uploadChanged} disabled={saving} />}
      </fieldset>
      {busy && <p role="status" className="flex items-center gap-2 text-sm text-page-muted"><Loader2 aria-hidden className="h-4 w-4 animate-spin motion-reduce:animate-none" />{uploading ? 'Đang tải ảnh lên…' : 'Đang lưu và cập nhật hồ sơ…'}</p>}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2 border-t border-page-line pt-4">
        <button type="button" className={BTN_GHOST} disabled={busy} onClick={close}>Hủy</button>
        <button type="submit" className={BTN_PRIMARY} disabled={busy}>{saving ? 'Đang lưu…' : 'Lưu thay đổi'}</button>
      </div>
    </form>
  </DialogShell>
}
