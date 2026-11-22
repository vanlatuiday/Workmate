import type { CompanyProfile } from '@context/companyStore'
import type { CompanyEditSection } from './companyProfilePresentation'

export type CompanyDraft = Omit<CompanyProfile, 'foundedYear' | 'values' | 'environment' | 'policies'> & {
  foundedYear: string
  values: string
  environment: string
  policies: string
  address: string
}
export type CompanyDraftErrors = Partial<Record<keyof CompanyDraft, string>>
type CompanyPatch = Partial<CompanyProfile> & { address?: string }

export function companyCurrentYear(now = new Date()) {
  return Number(new Intl.DateTimeFormat('en', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric' }).format(now))
}

export function companyProfileDraft(profile: CompanyProfile, address: string): CompanyDraft {
  return {
    ...profile, address, cover: { ...profile.cover }, foundedYear: profile.foundedYear?.toString() ?? '',
    values: profile.values.join('\n'), environment: profile.environment.join('\n'), policies: profile.policies.join('\n'),
  }
}

/** Chỉ đưa các trường của mục đang mở vào PATCH, giữ nguyên các mục khác. */
export function companySectionPatch(section: CompanyEditSection, draft: CompanyDraft, year = companyCurrentYear()): { patch?: CompanyPatch; errors: CompanyDraftErrors } {
  const errors: CompanyDraftErrors = {}
  const text = (key: keyof CompanyDraft, max: number) => {
    const value = String(draft[key]).trim()
    if (value.length > max) errors[key] = `Tối đa ${max} ký tự.`
    return value
  }
  const list = (key: 'values' | 'environment' | 'policies') => {
    const items = draft[key].split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
    if (items.length > 20) errors[key] = 'Tối đa 20 mục.'
    else if (items.some((item) => item.length > 200)) errors[key] = 'Mỗi mục tối đa 200 ký tự.'
    return items
  }
  let patch: CompanyPatch
  switch (section) {
    case 'general': {
      const name = text('name', 120)
      const email = text('email', 254)
      const phone = text('phone', 30)
      if (name.length < 2) errors.name = 'Tên doanh nghiệp cần ít nhất 2 ký tự.'
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email chưa hợp lệ.'
      patch = { name, email, phone }
      break
    }
    case 'about': {
      const rawYear = draft.foundedYear.trim()
      const foundedYear = rawYear ? Number(rawYear) : null
      if (foundedYear !== null && (!/^\d{4}$/.test(rawYear) || !Number.isInteger(foundedYear) || foundedYear < 1000 || foundedYear > year)) {
        errors.foundedYear = `Nhập năm từ 1000 đến ${year}, hoặc để trống.`
      }
      patch = { tagline: text('tagline', 200), about: text('about', 4000), industry: text('industry', 120), size: draft.size, foundedYear }
      break
    }
    case 'culture':
      patch = { culture: text('culture', 4000), values: list('values'), environment: list('environment') }
      break
    case 'location':
      if (!draft.district) errors.district = 'Chọn quận, huyện của doanh nghiệp.'
      patch = { district: draft.district, address: text('address', 300) }
      break
    case 'benefits':
      patch = { policies: list('policies') }
      break
    case 'cover':
      patch = { cover: { ...draft.cover } }
  }
  return Object.keys(errors).length ? { errors } : { patch, errors }
}
