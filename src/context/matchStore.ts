import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Trạng thái thao tác ở trang /match (lưu, ứng tuyển, mời, bỏ qua) — lưu localStorage để tải lại vẫn còn.
// Tin việc khóa theo id vị trí; ứng viên khóa theo cặp `${positionId}:${candidateId}`
// vì cùng một người có thể hợp nhiều vị trí và được xử lý riêng từng vị trí.
/** Chế độ xem danh sách ở /match: ảnh lớn uốn cong theo cuộn hoặc thẻ danh sách */
export type MatchView = 'gallery' | 'list'

interface MatchState {
  /** Lựa chọn chế độ xem lần trước — mặc định Bộ sưu tập */
  view: MatchView
  setView: (view: MatchView) => void
  savedJobs: string[]
  appliedJobs: string[]
  savedCandidates: string[]
  invitedCandidates: string[]
  skippedCandidates: string[]
  toggleSavedJob: (id: string) => void
  applyJob: (id: string) => void
  toggleSavedCandidate: (key: string) => void
  inviteCandidate: (key: string) => void
  skipCandidate: (key: string) => void
  /** Hiện lại các ứng viên đã bỏ qua (hoàn tác) */
  unskipCandidates: (keys: string[]) => void
}

/** Khóa ứng viên theo vị trí */
export const candidateKey = (positionId: string, candidateId: string) => `${positionId}:${candidateId}`

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
const add = (list: string[], id: string) => (list.includes(id) ? list : [...list, id])

export const useMatchStore = create<MatchState>()(
  persist(
    (set) => ({
      view: 'gallery',
      setView: (view) => set({ view }),
      savedJobs: [],
      appliedJobs: [],
      savedCandidates: [],
      invitedCandidates: [],
      skippedCandidates: [],
      toggleSavedJob: (id) => set((s) => ({ savedJobs: toggle(s.savedJobs, id) })),
      applyJob: (id) => set((s) => ({ appliedJobs: add(s.appliedJobs, id) })),
      toggleSavedCandidate: (key) => set((s) => ({ savedCandidates: toggle(s.savedCandidates, key) })),
      // Đã mời thì không còn nằm trong danh sách bỏ qua
      inviteCandidate: (key) =>
        set((s) => ({
          invitedCandidates: add(s.invitedCandidates, key),
          skippedCandidates: s.skippedCandidates.filter((k) => k !== key),
        })),
      skipCandidate: (key) => set((s) => ({ skippedCandidates: add(s.skippedCandidates, key) })),
      unskipCandidates: (keys) => set((s) => ({ skippedCandidates: s.skippedCandidates.filter((k) => !keys.includes(k)) })),
    }),
    { name: 'workmate-match' },
  ),
)
