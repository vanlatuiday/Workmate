import type { CatalogJob } from '@context/catalogStore'

export type CompanyEditSection = 'general' | 'about' | 'culture' | 'location' | 'benefits' | 'cover'

/** Các trường dùng chung giữa hồ sơ riêng và danh mục công khai. */
export interface CompanyProfileData {
  tagline?: string
  about?: string
  industry?: string
  size?: string
  foundedYear?: number | null
  culture?: string
  values?: string[]
  environment?: string[]
  policies?: string[]
  address?: string
  district?: string
}

export function companyProfileItems(items: readonly string[] = []): string[] {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))]
}

/** Tiêu chí tuyển dụng lấy từ tin đăng để không lưu thêm bộ tiêu chí trùng lặp. */
export function companyRecruitmentFacts(jobs: Pick<CatalogJob, 'jobType' | 'shiftLabel' | 'district'>[]) {
  return {
    jobTypes: companyProfileItems(jobs.map((job) => job.jobType)),
    shifts: companyProfileItems(jobs.map((job) => job.shiftLabel)),
    districts: companyProfileItems(jobs.map((job) => job.district)),
  }
}
