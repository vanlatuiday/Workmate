// DANH MỤC VIỆC LÀM DÙNG CHUNG — một nguồn việc làm + điểm do máy chủ tính cho mọi trang phía
// người tìm việc (Việc làm, trang công ty, Kết nối, dashboard "Việc phù hợp"/"Tổng quan").
// Đứng riêng để tránh vòng import giữa `jobs/data.ts` và `match/data.ts`.
import { useCallback } from 'react'
import type { JobType } from '@/types'
import { DANANG_DISTRICTS } from '@constants/index'
import { companyOf, type MatchJob } from '@pages/public/match/data'
import { useVisibleJobs } from '@services/adminService'
import { getSeekerCriteria } from '@context/profileStore'
import { useAuthStore } from '@context/authStore'
import type { CatalogJob } from '@context/catalogStore'
import { useSeekerMatches } from '@services/matchingService'
import { scoreMatch, type MatchOutcome } from '@pages/public/match/score'
import { categoryByKey, categoryOf } from '@components/home/categories'
import { foldVi } from '@utils/text'

export type { MatchJob }

/**
 * Mọi việc người tìm việc thấy được: chỉ tin đã duyệt, đang mở và công ty không bị khóa
 * (cờ `visible` do máy chủ tính). Tự cập nhật khi quản trị viên thay đổi.
 */
export const useAllJobs = (): CatalogJob[] => useVisibleJobs()

/** Hook: `ready` = điểm đã về (hoặc không cần chờ), `outcomeOf(job)` cập nhật giao diện khi điểm về (khách / vai trò khác: điểm mẫu tính tại chỗ với hồ sơ demo) */
export function useSeekerOutcomes() {
  const isSeeker = useAuthStore((s) => s.user?.role === 'jobseeker')
  const m = useSeekerMatches()
  const { outcomeOf } = m
  const of = useCallback(
    (job: MatchJob): MatchOutcome | undefined => (isSeeker ? outcomeOf(job.id) : scoreMatch(getSeekerCriteria(), job, job.distanceKm)),
    [isSeeker, outcomeOf],
  )
  return { ready: !isSeeker || m.ready, outcomeOf: of }
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
  /** Chỉ việc trong bán kính hồ sơ (hồ sơ: maxDistanceKm) */
  nearMe: boolean
  /**
   * Nhóm công việc đang xem: khóa trong HOME_CATEGORIES, `ALL_CATEGORIES` = tất cả nhóm, '' = chưa chọn
   * (trang hiện bộ chọn nhóm). Lưu ở query `nhom`.
   */
  category: string
}

/** Giá trị `category` / query `nhom` cho "Tất cả" */
export const ALL_CATEGORIES = 'tat-ca'

export const EMPTY_FILTERS: JobFilters = { q: '', district: '', type: '', minSalaryK: 0, nearMe: false, category: '' }

/** Khu vực đang hỗ trợ, khớp với hồ sơ công ty; vẫn chọn được quận chưa có tin. */
export const DISTRICTS = [...DANANG_DISTRICTS].sort((a, b) => a.localeCompare(b, 'vi'))

/** Đọc bộ lọc từ query. Nhận cả tên tham số cũ của ô tìm kiếm trang chủ / footer (keyword, city, type, nearMe). */
export function filtersFromParams(p: URLSearchParams): JobFilters {
  const type = (p.get('loai') ?? p.get('type') ?? '') as JobType | ''
  // Ô "địa điểm" ở trang chủ là chữ tự do (vd "hai chau, da nang") → khớp với tên quận nếu có
  const location = (p.get('quan') ?? p.get('city') ?? '').trim()
  const city = norm(location)
  const wholeCity = /^(?:(?:thanh pho|tp\.?)\s+)?da nang$/.test(city)
  // Giữ địa điểm chưa hỗ trợ để trả kết quả rỗng và giải thích, tránh âm thầm bỏ điều kiện.
  const district = city && !wholeCity ? DISTRICTS.find((d) => city.includes(norm(d)) || norm(d).includes(city)) ?? location : ''
  const nhom = (p.get('nhom') ?? '').trim()
  const q = (p.get('q') ?? p.get('keyword') ?? '').trim()
  const minSalaryK = Number(p.get('luong') ?? 0) || 0
  const nearMe = (p.get('gan') ?? p.get('nearMe')) === 'true' || p.get('gan') === '1'
  // Có `nhom` hợp lệ → dùng; không thì có điều kiện lọc khác (liên kết từ trang chủ / footer) → coi như "Tất cả"; còn lại → bộ chọn nhóm
  const category = categoryByKey(nhom) ? nhom : nhom === ALL_CATEGORIES || q || district || type || minSalaryK || nearMe ? ALL_CATEGORIES : ''
  return {
    q: (p.get('q') ?? p.get('keyword') ?? '').trim(),
    district,
    type,
    minSalaryK,
    nearMe,
    category,
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
  if (f.category) p.set('nhom', f.category)
  return p
}

/** Điều kiện lọc của ô tìm kiếm (không tính nhóm) */
export const hasFilters = (f: JobFilters) => !!(f.q || f.district || f.type || f.minSalaryK || f.nearMe)

/** Đang lọc theo một nhóm cụ thể (không phải "Tất cả" / chưa chọn) */
const hasCategory = (f: JobFilters) => !!categoryByKey(f.category)

/** Bỏ dấu + chữ thường để tìm "pha che" vẫn ra "Pha chế" */
const norm = (s: string) => foldVi(s).trim()

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
  if (hasCategory(f) && categoryOf(job).key !== f.category) return false
  if (f.district && job.district !== f.district) return false
  if (f.type && job.jobType !== f.type) return false
  if (f.minSalaryK && job.salaryMaxK < f.minSalaryK) return false
  if (f.nearMe && job.distanceKm > getSeekerCriteria().maxDistanceKm) return false
  if (f.q) {
    const c = companyOf(job.companyId)
    if (!textMatches(f.q, [job.title, c.name, c.industry, job.district, ...job.skills].join(' '))) return false
  }
  return true
}
