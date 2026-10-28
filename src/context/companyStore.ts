import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Photo } from '@components/discover/types'
import type { CompanySize } from '@/types'
import { COMPANY } from '@pages/public/personal/companyData'

// Hồ sơ công ty của doanh nghiệp demo (admin2) — sửa ở /tuyen-dung/ho-so-cong-ty, lưu localStorage
// (`workmate-company`). Trang công khai (công ty "song-han" ở Việc làm / Kết nối) đọc từ đây.
// Khi có backend: thay bằng API hồ sơ công ty.

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

interface CompanyState {
  profile: CompanyProfile
  update: (patch: Partial<CompanyProfile>) => void
  reset: () => void
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      profile: SEED,
      update: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
      reset: () => set({ profile: SEED }),
    }),
    { name: 'workmate-company', version: 1, partialize: (s) => ({ profile: s.profile }) },
  ),
)
