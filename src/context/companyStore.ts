import { create } from 'zustand'
import api from '@services/api'
import { IS_PRODUCTION } from '@utils/isProduction'
import type { Photo } from '@components/discover/types'
import type { CompanySize } from '@/types'
import { COMPANY } from '@pages/public/personal/companyData'
import type { TaxInfo } from '@services/companyService'

// Hồ sơ công ty của nhà tuyển dụng đang đăng nhập (GET/PATCH /recruiter/company), sửa ở /tuyen-dung/ho-so-cong-ty.
// Trang công khai đọc từ danh mục (`catalogStore`), lưu xong thì nạp lại danh mục.

export interface CompanyProfile {
  name: string
  industry: string
  district: string
  size: CompanySize
  /** Một câu giới thiệu ngắn (thẻ, danh sách) */
  tagline: string
  /** Giới thiệu đầy đủ */
  about: string
  environment: string[]
  values: string[]
  policies: string[]
  culture: string
  email: string
  phone: string
  cover: Photo
}

/** Ảnh bìa có sẵn để chọn (Unsplash) — chưa có chỗ lưu ảnh tải lên */
export const COVER_CHOICES: Photo[] = [
  { id: '1554118811-1e0d58224f24', alt: 'Không gian quán cà phê nhiều cây xanh, quầy pha chế phía sau' },
  { id: '1501339847302-ac426a4a7cbb', alt: 'Biển hiệu chữ CAFE phát sáng trong quán' },
  { id: '1441986300917-64674bd600d8', alt: 'Cửa hàng quần áo với kệ gỗ và đèn treo' },
  { id: '1414235077428-338989a2e8c0', alt: 'Món ăn trình bày trên đĩa trắng giữa bàn tiệc' },
  { id: '1497366811353-6870744d04b2', alt: 'Văn phòng trống với bàn họp dài và cửa kính' },
  { id: '1517248135467-4c7edcad34c4', alt: 'Phòng ăn nhà hàng với bàn gỗ và đèn vàng' },
]

const SEED: CompanyProfile = {
  name: COMPANY.name,
  industry: COMPANY.industry,
  district: 'Hải Châu',
  size: '11-50',
  tagline: 'Quán cà phê, cửa hàng tiện lợi và tiệc cưới quanh trung tâm.',
  about: COMPANY.intro,
  environment: COMPANY.environment,
  values: COMPANY.values,
  policies: COMPANY.policies,
  culture: COMPANY.culture,
  email: COMPANY.recruiter.email,
  phone: '0236 3 888 000',
  cover: COVER_CHOICES[0],
}

/** Mục bắt buộc của form bắt đầu mà máy chủ báo còn thiếu */
export type MissingRequired = 'taxCode' | 'name' | 'logo'

interface CompanyState {
  /** Id công ty của tôi; rỗng khi chưa nạp hoặc không phải nhà tuyển dụng */
  id: string
  /** Đã nạp xong hồ sơ từ máy chủ (cổng chuyển sang form bắt đầu chờ cờ này để không nháy trang) */
  loaded: boolean
  /** Lần nạp gần nhất bị lỗi (mạng/máy chủ) */
  loadFailed: boolean
  /** Logo nằm ngoài `profile` để tải logo không làm form đang sửa bị nạp lại */
  logoUrl: string | null
  /** Địa chỉ nằm ngoài `profile` (chỉ form bắt đầu dùng) để không đổi form hồ sơ */
  address: string
  /** Mã số doanh nghiệp + kết quả tra; nằm ngoài `profile` để lưu mã không làm form hồ sơ nạp lại */
  tax: TaxInfo
  /** Trạng thái form bắt đầu; cũng nằm ngoài `profile` */
  onboardedAt: string | null
  needsOnboarding: boolean
  missingRequired: MissingRequired[]
  profile: CompanyProfile
  setLogoUrl: (url: string | null) => void
  load: () => Promise<void>
  /** Nạp lại logo / mã số / cờ onboarding mà KHÔNG đổi `profile` (sau khi tải logo lên) */
  refreshStatus: () => Promise<void>
  /** Ném lỗi nếu máy chủ từ chối — nơi gọi hiện thông báo */
  update: (patch: Partial<CompanyProfile> & { address?: string }) => Promise<void>
  /** Lưu mã số doanh nghiệp ('' = xóa). Ném lỗi nếu máy chủ từ chối (400 sai mã / mã ngừng hoạt động, 403 đã xác minh) */
  saveTaxCode: (taxCode: string) => Promise<void>
  /** Hoàn thành form bắt đầu. Ném lỗi nếu còn thiếu mục bắt buộc (400) */
  completeOnboarding: () => Promise<void>
  clear: () => void
}

type Server = CompanyProfile & {
  id: string
  logoUrl: string | null
  address?: string | null
  taxCode?: string | null
  taxLookup?: TaxInfo['taxLookup']
  taxNameMatches?: boolean | null
  onboardedAt?: string | null
  needsOnboarding?: boolean
  missingRequired?: MissingRequired[]
}

const NO_TAX: TaxInfo = { taxCode: null, taxLookup: null, taxNameMatches: null }
const taxOf = (d: Server): TaxInfo => ({ taxCode: d.taxCode ?? null, taxLookup: d.taxLookup ?? null, taxNameMatches: d.taxNameMatches ?? null })
/** Phần trạng thái ngoài `profile`, lấy từ mọi phản hồi của máy chủ */
const statusOf = (d: Server) => ({
  logoUrl: d.logoUrl ?? null,
  address: d.address ?? '',
  tax: taxOf(d),
  onboardedAt: d.onboardedAt ?? null,
  needsOnboarding: d.needsOnboarding ?? false,
  missingRequired: d.missingRequired ?? [],
})

const pick = ({ name, industry, district, size, tagline, about, environment, values, policies, culture, email, phone, cover }: Server): CompanyProfile => ({
  name, industry, district, size, tagline, about, environment, values, policies, culture, email, phone, cover,
})

/** Bản cho người dùng thật không hiện hồ sơ công ty mẫu trong lúc chờ máy chủ */
const INITIAL: CompanyProfile = IS_PRODUCTION
  ? { ...SEED, name: '', industry: '', district: '', tagline: '', about: '', environment: [], values: [], policies: [], culture: '', email: '', phone: '' }
  : SEED

const EMPTY_STATUS = { logoUrl: null, address: '', tax: NO_TAX, onboardedAt: null, needsOnboarding: false, missingRequired: [] as MissingRequired[] }

// Một lượt nạp tại một thời điểm (cổng + phiên đăng nhập cùng gọi); đăng xuất thì bỏ kết quả của lượt cũ
let inflight: Promise<void> | null = null
let epoch = 0

export const useCompanyStore = create<CompanyState>()((set, get) => ({
  id: '',
  loaded: false,
  loadFailed: false,
  ...EMPTY_STATUS,
  profile: INITIAL,
  setLogoUrl: (logoUrl) => set({ logoUrl }),
  load: () => {
    if (inflight) return inflight
    const mine = epoch
    const p = api.get<Server>('/recruiter/company').then(
      ({ data }) => { if (mine === epoch) set({ id: data.id, loaded: true, loadFailed: false, ...statusOf(data), profile: pick(data) }) },
      (err) => { if (mine === epoch) set({ loadFailed: true }); throw err },
    ).finally(() => { if (mine === epoch) inflight = null })
    inflight = p
    return p
  },
  refreshStatus: async () => {
    const { data } = await api.get<Server>('/recruiter/company')
    set(statusOf(data))
  },
  update: async (patch) => {
    const { data } = await api.patch<Server>('/recruiter/company', patch)
    set({ ...statusOf(data), profile: pick(data) })
  },
  saveTaxCode: async (taxCode) => {
    const { data } = await api.patch<Server>('/recruiter/company', { taxCode })
    set(statusOf(data))
  },
  completeOnboarding: async () => {
    const { data } = await api.post<Server>('/recruiter/company/onboarding/complete')
    set({ id: data.id || get().id, ...statusOf(data), profile: pick(data) })
  },
  clear: () => { epoch += 1; inflight = null; set({ id: '', loaded: false, loadFailed: false, ...EMPTY_STATUS, profile: INITIAL }) },
}))
