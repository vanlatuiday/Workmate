import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Quality = 'high' | 'low'

interface ExperienceState {
  /** Chất lượng hiệu ứng WebGL ở trang chủ. */
  quality: Quality
  setQuality: (q: Quality) => void
}

/** Máy yếu hoặc đang bật tiết kiệm dữ liệu → mặc định chất lượng thấp. */
function defaultQuality(): Quality {
  const nav = navigator as Navigator & {
    deviceMemory?: number
    connection?: { saveData?: boolean }
  }
  const weak =
    (nav.hardwareConcurrency ?? 8) <= 4 ||
    (nav.deviceMemory ?? 8) <= 4 ||
    nav.connection?.saveData === true
  return weak ? 'low' : 'high'
}

export const useExperienceStore = create<ExperienceState>()(
  persist(
    (set) => ({
      quality: defaultQuality(),
      setQuality: (quality) => set({ quality }),
    }),
    { name: 'workmate-experience' },
  ),
)
