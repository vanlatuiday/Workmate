// DANH MỤC VIỆC LÀM DÙNG CHUNG — một nguồn việc làm + một cách tính điểm cho mọi trang phía
// người tìm việc (Việc làm, trang công ty, Kết nối, dashboard "Việc phù hợp"/"Tổng quan").
// Đứng riêng để tránh vòng import giữa `jobs/data.ts` và `match/data.ts`.
import type { JobType } from '@/types'
import { COMPANIES, type DiscoverCompany } from './data'
import { companyOf, DEMO_COMPANY, SEEKER_DEFAULT, type MatchJob } from '@pages/public/match/data'
import { getVisibleJobs, useVisibleJobs } from '@services/adminService'
import { scoreMatch, type MatchOutcome } from '@pages/public/match/score'

export type { MatchJob }

/**
 * Mọi việc người tìm việc thấy được (đọc tức thời): việc của công ty mẫu + tin của doanh nghiệp demo
 * + tin mới đã được duyệt; bỏ tin bị ẩn/từ chối/chờ duyệt và tin của công ty bị khóa (adminService).
 * Trong component dùng `useAllJobs()` để tự cập nhật khi quản trị viên thay đổi.
 */
export const getAllJobs = (): MatchJob[] => getVisibleJobs()
export const useAllJobs = (): MatchJob[] => useVisibleJobs()

/** Việc đang tuyển của một công ty (theo id công ty) */
export function jobsOfCompany(companyId: string): MatchJob[] {
  return getAllJobs().filter((j) => j.companyId === companyId)
}

/** Điểm phù hợp của một việc với hồ sơ người tìm việc demo — cách tính duy nhất (score.ts, 5 tiêu chí) */
export function seekerOutcome(job: MatchJob): MatchOutcome {
  return scoreMatch(SEEKER_DEFAULT, job, job.distanceKm)
}

/** Việc hợp nhất của một công ty (để hiện "Độ phù hợp với bạn") */
export function bestJobOf(companyId: string): { job: MatchJob; outcome: MatchOutcome } | undefined {
  return jobsOfCompany(companyId)
    .map((job) => ({ job, outcome: seekerOutcome(job) }))
    .sort((a, b) => b.outcome.score - a.outcome.score)[0]
}

/** Điều kiện lọc ở trang Việc làm — đọc/ghi qua query của URL */
export interface JobFilters {
  /** Từ khóa: khớp tên việc, tên công ty, ngành, kỹ năng */
  q: string
  /** Quận (trống = mọi quận) */
  district: string
  /** Loại việc (trống = mọi loại) */
  type: JobType | ''
  /** Lương tối thiểu, nghìn đồng/giờ (0 = không lọc) */
  minSalaryK: number
  /** Chỉ việc trong bán kính hồ sơ (SEEKER_DEFAULT.maxDistanceKm) */
  nearMe: boolean
}

export const EMPTY_FILTERS: JobFilters = { q: '', district: '', type: '', minSalaryK: 0, nearMe: false }

/** Các quận có việc — cho ô chọn quận */
export const DISTRICTS = [...new Set(getAllJobs().map((j) => j.district))].sort((a, b) => a.localeCompare(b, 'vi'))

/** Đọc bộ lọc từ query. Nhận cả tên tham số cũ của ô tìm kiếm trang chủ / footer (keyword, city, type, nearMe). */
export function filtersFromParams(p: URLSearchParams): JobFilters {
  const type = (p.get('loai') ?? p.get('type') ?? '') as JobType | ''
  // Ô "địa điểm" ở trang chủ là chữ tự do (vd "hai chau, da nang") → khớp với tên quận nếu có
  const city = norm(p.get('quan') ?? p.get('city') ?? '')
  const district = city ? DISTRICTS.find((d) => city.includes(norm(d)) || norm(d).includes(city)) ?? '' : ''
  return {
    q: (p.get('q') ?? p.get('keyword') ?? '').trim(),
    district,
    type,
    minSalaryK: Number(p.get('luong') ?? 0) || 0,
    nearMe: (p.get('gan') ?? p.get('nearMe')) === 'true' || p.get('gan') === '1',
  }
}

/** Ghi bộ lọc ra query (chỉ ghi điều kiện đang bật) */
export function filtersToParams(f: JobFilters): URLSearchParams {
  const p = new URLSearchParams()
  if (f.q) p.set('q', f.q)
  if (f.district) p.set('quan', f.district)
  if (f.type) p.set('loai', f.type)
  if (f.minSalaryK) p.set('luong', String(f.minSalaryK))
  if (f.nearMe) p.set('gan', '1')
  return p
}

export const hasFilters = (f: JobFilters) => !!(f.q || f.district || f.type || f.minSalaryK || f.nearMe)

/** Bỏ dấu + chữ thường để tìm "pha che" vẫn ra "Pha chế" */
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().trim()

/**
 * Từ khóa có khớp văn bản không (đã bỏ dấu): ưu tiên khớp cả cụm ("pha che" trong "pha che co ban");
 * không thì mỗi từ phải trùng nguyên một từ trong văn bản — tránh "pha" khớp nhầm "pham" (thực phẩm).
 * Chỉ một từ thì cho khớp phần đầu từ để gõ dở vẫn ra ("ban h" → "ban hang").
 */
function textMatches(query: string, text: string): boolean {
  const q = norm(query).replace(/\s+/g, ' ')
  const hay = norm(text).replace(/\s+/g, ' ')
  if (!q) return true
  if (hay.includes(q)) return true
  const words = hay.split(/[\s,·/()-]+/).filter(Boolean)
  const terms = q.split(' ')
  if (terms.length === 1) return words.some((w) => w.startsWith(terms[0]))
  return terms.every((t) => words.includes(t))
}

/** Việc có khớp bộ lọc không */
export function jobMatches(job: MatchJob, f: JobFilters): boolean {
  if (f.district && job.district !== f.district) return false
  if (f.type && job.jobType !== f.type) return false
  if (f.minSalaryK && job.salaryMaxK < f.minSalaryK) return false
  if (f.nearMe && job.distanceKm > SEEKER_DEFAULT.maxDistanceKm) return false
  if (f.q) {
    const c = companyOf(job.companyId)
    if (!textMatches(f.q, [job.title, c.name, c.industry, job.district, ...job.skills].join(' '))) return false
  }
  return true
}

/** Công ty (trong COMPANIES + công ty demo) có ít nhất một việc khớp, kèm các việc khớp */
export function companiesMatching(f: JobFilters, companies?: DiscoverCompany[]): { company: DiscoverCompany; jobs: MatchJob[] }[] {
  // Mặc định: công ty mẫu + công ty demo (có tin mới đã duyệt). Công ty bị khóa / không còn tin nào
  // đang hiện thì bỏ khỏi danh sách.
  const list = companies ?? [...COMPANIES, companyOf(DEMO_COMPANY.id)]
  return list
    .map((company) => ({ company, all: jobsOfCompany(company.id), jobs: jobsOfCompany(company.id).filter((j) => jobMatches(j, f)) }))
    .filter((x) => x.all.length > 0 && (!hasFilters(f) || x.jobs.length > 0))
    .map(({ company, jobs }) => ({ company, jobs }))
}
