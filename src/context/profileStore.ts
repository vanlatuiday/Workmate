import { useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AVAILABILITY_DEFAULT, PROFILE_DEFAULT } from '@pages/jobseeker/mockData'
import type { SeekerCriteria } from '@pages/public/match/score'
import type { JobType } from '@/types'

// Hồ sơ người tìm việc của tài khoản demo (admin1) — MỘT nguồn duy nhất cho /ho-so, /tim-viec/ho-so,
// /ca-nhan và mọi điểm phù hợp (catalog, /match, dashboard). Bản sao trên máy ở localStorage (`workmate-profile`).
// Đăng nhập bằng người tìm việc: nạp từ /api/seeker/profile, mọi thay đổi tự lưu lên máy chủ (services/profileService).
// Khách / tài khoản khác: hồ sơ mẫu chỉ trên máy; đăng xuất thì về hồ sơ mẫu.

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

/** Hàm đẩy thay đổi lên máy chủ và tải ảnh lên — `services/profileService` đăng ký (tránh import vòng) */
interface ProfileSync {
  save: (patch: Partial<SeekerProfile>) => void
  uploadAvatar: (file: File) => Promise<string | null>
  /** Đang đăng nhập bằng người tìm việc? (không → chỉ lưu trên máy như bản demo) */
  active: () => boolean
  reload: () => Promise<void>
}
let sync: ProfileSync | null = null
export const registerProfileSync = (s: ProfileSync) => { sync = s }

const isBlob = (url: string | null) => !!url && url.startsWith('blob:')

interface ProfileState {
  profile: SeekerProfile
  /** URL ảnh đại diện: ảnh trên máy chủ, hoặc object URL (blob:) khi chưa đăng nhập / đang tải lên */
  avatarUrl: string | null
  update: (patch: Partial<SeekerProfile>) => void
  /** Đổi ảnh: hiện ngay bản xem trước, rồi tải lên nếu đang đăng nhập. Trả về thông báo lỗi hoặc null */
  setAvatarFile: (file: File) => Promise<string | null>
  /** Ghi URL ảnh từ máy chủ (thu hồi object URL cũ) */
  setAvatarUrl: (url: string | null) => void
  /** Thay toàn bộ hồ sơ bằng bản từ máy chủ (không gửi ngược lên) */
  replace: (profile: SeekerProfile, avatarUrl: string | null) => void
  /** Về hồ sơ mẫu trên máy (khách / đăng xuất) */
  resetLocal: () => void
  /** "Đặt lại dữ liệu demo": đang đăng nhập thì nạp lại từ máy chủ, không xóa dữ liệu thật */
  reset: () => void
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: SEED,
      avatarUrl: null,
      update: (patch) => {
        set((s) => ({ profile: { ...s.profile, ...patch } }))
        sync?.save(patch)
      },
      setAvatarFile: async (file) => {
        const prev = get().avatarUrl
        const preview = URL.createObjectURL(file)
        set({ avatarUrl: preview })
        if (!sync?.active()) {
          if (isBlob(prev)) URL.revokeObjectURL(prev!)
          return null
        }
        const err = await sync.uploadAvatar(file) // thành công → setAvatarUrl đã thay bản xem trước
        if (err && get().avatarUrl === preview) {
          URL.revokeObjectURL(preview)
          set({ avatarUrl: prev })
        }
        return err
      },
      setAvatarUrl: (url) => {
        const old = get().avatarUrl
        if (isBlob(old) && old !== url) URL.revokeObjectURL(old!)
        set({ avatarUrl: url })
      },
      replace: (profile, avatarUrl) => {
        get().setAvatarUrl(avatarUrl)
        set({ profile })
      },
      resetLocal: () => get().replace(SEED, null),
      reset: () => {
        if (sync?.active()) void sync.reload()
        else get().resetLocal()
      },
    }),
    {
      name: 'workmate-profile',
      version: 2,
      // Ảnh trên máy chủ giữ được qua lần tải lại; object URL thì không
      partialize: (s) => ({ profile: s.profile, avatarUrl: isBlob(s.avatarUrl) ? null : s.avatarUrl }),
      migrate: (state) => state as ProfileState,
    },
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
