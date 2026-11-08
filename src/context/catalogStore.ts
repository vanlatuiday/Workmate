import { create } from 'zustand'
import api from '@services/api'
import type { Photo } from '@components/discover/types'
import type { CriterionKey } from '@pages/public/match/score'
import type { JobType } from '@/types'
import type { DiscoverCompany } from '@pages/public/jobs/data'

// KHO DANH MỤC (không lưu localStorage) — nguồn duy nhất cho tin tuyển dụng, doanh nghiệp và cấu hình hệ thống
// mà mọi trang đọc đồng bộ. Dữ liệu thật đến từ máy chủ: `load()` gọi GET /catalog + GET /config/public và
// thay toàn bộ. Dữ liệu mẫu trong code (COMPANIES, MATCH_JOBS…) chỉ là giá trị BAN ĐẦU/DỰ PHÒNG: nạp bởi
// `context/catalogSeed.ts` để lần vẽ đầu không trống và web vẫn chạy khi máy chủ tắt.
// File này KHÔNG import dữ liệu mẫu (tránh vòng import với match/data → companyOf).

export type JobOpenStatus = 'open' | 'paused' | 'closed'
export type ModerationStatus = 'pending' | 'approved' | 'rejected' | 'hidden'

/** = MatchJob + phần của tin đăng + trạng thái (khớp CatalogJob của máy chủ) */
export interface CatalogJob {
  id: string
  companyId: string
  title: string
  district: string
  distanceKm: number
  salaryLabel: string
  shiftLabel: string
  photo: Photo
  skills: string[]
  slots: string[]
  salaryMinK: number
  salaryMaxK: number
  jobType: JobType
  description: string
  quantity: number
  radiusKm: number
  /** ISO */
  postedAt: string
  status: JobOpenStatus
  moderation: ModerationStatus
  moderationReason?: string
  /** Đã duyệt + đang mở + công ty không bị khóa */
  visible: boolean
}

/** = DiscoverCompany + trạng thái xác minh / khóa */
export interface CatalogCompany extends DiscoverCompany {
  verified: boolean
  locked: boolean
  /** Doanh nghiệp đã tắt "Công khai trang công ty" */
  hidden?: boolean
}

/** Cấu hình hệ thống. Phần công khai ai cũng có; `bannedWords` chỉ có khi quản trị viên đã nạp /admin/config */
export interface SystemConfig {
  weights: Record<CriterionKey, number>
  bannedWords: string[]
  minWageK: number
  defaultRadiusKm: number
  registrationOpen: boolean
}

/** Một dòng ở trang quản trị: tin + cờ tự động + công ty có bị khóa không (từ GET /admin/jobs) */
export interface AdminJobData {
  job: CatalogJob
  flags: string[]
  companyLocked: boolean
}

export const DEFAULT_CONFIG: SystemConfig = {
  weights: { skills: 35, schedule: 25, salary: 16, distance: 14, jobType: 10 },
  bannedWords: ['đặt cọc', 'phí giữ chỗ', 'việc nhẹ lương cao', 'chuyển khoản trước'],
  minWageK: 20,
  defaultRadiusKm: 8,
  registrationOpen: true,
}

interface CatalogState {
  companies: CatalogCompany[]
  jobs: CatalogJob[]
  config: SystemConfig
  /** Dòng quản trị (chỉ khi đăng nhập admin); null = chưa nạp */
  adminRows: AdminJobData[] | null
  /** Đã nạp từ máy chủ ít nhất một lần */
  loaded: boolean

  /** Nạp lại danh mục theo người đang đăng nhập; lỗi mạng thì giữ dữ liệu hiện có */
  load: () => Promise<void>
  upsertJob: (job: CatalogJob) => void
  upsertCompany: (company: CatalogCompany) => void
  setConfig: (config: Partial<SystemConfig>) => void
  setAdminRows: (rows: AdminJobData[] | null) => void
}

export const useCatalogStore = create<CatalogState>()((set) => ({
  // Rỗng cho tới khi catalogSeed.ts nạp dữ liệu mẫu
  companies: [],
  jobs: [],
  config: DEFAULT_CONFIG,
  adminRows: null,
  loaded: false,

  load: async () => {
    try {
      const [cat, cfg] = await Promise.all([
        api.get<{ companies: CatalogCompany[]; jobs: CatalogJob[] }>('/catalog'),
        api.get<Omit<SystemConfig, 'bannedWords'>>('/config/public'),
      ])
      set((s) => ({
        companies: cat.data.companies,
        jobs: cat.data.jobs,
        // giữ danh sách từ cấm đã nạp (nếu là admin)
        config: { ...s.config, ...cfg.data },
        loaded: true,
      }))
    } catch {
      /* máy chủ tắt / lỗi mạng: dùng dữ liệu mẫu ban đầu */
    }
  },
  upsertJob: (job) =>
    set((s) => ({
      jobs: s.jobs.some((j) => j.id === job.id) ? s.jobs.map((j) => (j.id === job.id ? job : j)) : [job, ...s.jobs],
    })),
  upsertCompany: (company) =>
    set((s) => ({
      companies: s.companies.some((c) => c.id === company.id) ? s.companies.map((c) => (c.id === company.id ? company : c)) : [...s.companies, company],
    })),
  setConfig: (config) => set((s) => ({ config: { ...s.config, ...config } })),
  setAdminRows: (adminRows) => set({ adminRows }),
}))
