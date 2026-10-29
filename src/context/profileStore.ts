import { useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AVAILABILITY_DEFAULT, PROFILE_DEFAULT } from '@pages/jobseeker/mockData'
import type { SeekerCriteria } from '@pages/public/match/score'
import type { JobType } from '@/types'

// Hồ sơ người tìm việc của tài khoản demo (admin1) — MỘT nguồn duy nhất cho /ho-so, /tim-viec/ho-so,
// /ca-nhan và mọi điểm phù hợp (catalog, /match, dashboard). Lưu localStorage (`workmate-profile`).
// Khi có backend: thay bằng API hồ sơ người tìm việc.

export type ExperienceItem = { id: string; title: string; company: string; period: string }

export interface SeekerProfile {
  fullName: string
  phone: string
  /** 1–2 câu giới thiệu (mẫu) */
  intro: string
  /** Đoạn giới thiệu dài hơn (mẫu) */
  about: string
  showAvatar: boolean
  published: boolean
  area: string
  jobTypes: JobType[]
  /** Lương tối thiểu, đồng/giờ */
  salaryMin: number
  maxDistanceKm: number
  skills: string[]
  experience: ExperienceItem[]
  /** Khóa `${chỉ số ngày}-${chỉ số buổi}` của các ô rảnh */
  availability: string[]
}

/** Hồ sơ mẫu ban đầu (và khi "Đặt lại dữ liệu demo") */
const SEED: SeekerProfile = {
  fullName: PROFILE_DEFAULT.fullName,
  phone: PROFILE_DEFAULT.phone,
  intro: 'Sinh viên năm cuối ở Đà Nẵng, quen làm ca tối và cuối tuần. Thích việc cần giao tiếp và làm việc nhóm.',
  about:
    'Mình đã làm phục vụ quán cà phê và cộng tác viên sự kiện hơn hai năm. Mình đúng giờ, học nhanh, không ngại việc nặng vào cuối tuần. Mình muốn tìm công việc gần nhà để có thể làm đều đặn.',
  showAvatar: true,
  published: false,
  area: PROFILE_DEFAULT.area,
  jobTypes: [...PROFILE_DEFAULT.jobTypes],
  salaryMin: PROFILE_DEFAULT.salaryMin,
  maxDistanceKm: PROFILE_DEFAULT.maxDistanceKm,
  skills: [...PROFILE_DEFAULT.skills],
  experience: PROFILE_DEFAULT.experience.map((e) => ({ ...e })),
  availability: [...AVAILABILITY_DEFAULT],
}

interface ProfileState {
  profile: SeekerProfile
  /** Object URL của ảnh đại diện — không lưu được qua lần tải lại nên nằm ngoài `profile`, không persist */
  avatarUrl: string | null
  update: (patch: Partial<SeekerProfile>) => void
  /** Đổi ảnh: thu hồi object URL cũ để khỏi rò bộ nhớ */
  setAvatarFile: (file: File) => void
  reset: () => void
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: SEED,
      avatarUrl: null,
      update: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
      setAvatarFile: (file) => {
        const old = get().avatarUrl
        if (old) URL.revokeObjectURL(old)
        set({ avatarUrl: URL.createObjectURL(file) })
      },
      reset: () => {
        const old = get().avatarUrl
        if (old) URL.revokeObjectURL(old)
        set({ profile: SEED, avatarUrl: null })
      },
    }),
    { name: 'workmate-profile', version: 1, partialize: (s) => ({ profile: s.profile }) },
  ),
)

/** Đổi hồ sơ -> tiêu chí chấm điểm (lương quy ra nghìn đồng/giờ) */
const toCriteria = (p: SeekerProfile): SeekerCriteria => ({
  skills: p.skills,
  slots: p.availability,
  salaryMinK: p.salaryMin / 1000,
  maxDistanceKm: p.maxDistanceKm,
  jobTypes: p.jobTypes,
})

/** Tiêu chí chấm điểm hiện tại (đọc tức thời, ngoài component) */
export const getSeekerCriteria = (): SeekerCriteria => toCriteria(useProfileStore.getState().profile)

/** Tiêu chí chấm điểm — đối tượng chỉ đổi khi hồ sơ đổi, an toàn để đưa vào deps của useMemo */
export function useSeekerCriteria(): SeekerCriteria {
  const profile = useProfileStore((s) => s.profile)
  return useMemo(() => toCriteria(profile), [profile])
}
