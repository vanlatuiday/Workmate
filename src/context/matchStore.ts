import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import toast from 'react-hot-toast'
import api from '@services/api'
import { apiErrorMessage } from '@services/authService'
import { useAuthStore } from './authStore'

// Lưu tin (người tìm việc), lưu / bỏ qua ứng viên (nhà tuyển dụng): dữ liệu trên máy chủ, hiện ngay khi bấm rồi
// gửi đi, máy chủ từ chối thì hoàn lại. Chỉ lựa chọn chế độ xem được giữ ở localStorage.
// Tin việc khóa theo id vị trí; ứng viên khóa theo cặp `${positionId}:${candidateId}`
// vì cùng một người có thể hợp nhiều vị trí và được xử lý riêng từng vị trí.
/** Chế độ xem danh sách ở /match: ảnh lớn uốn cong theo cuộn hoặc thẻ danh sách */
export type MatchView = 'gallery' | 'list'

interface MatchState {
  /** Lựa chọn chế độ xem lần trước — mặc định Bộ sưu tập */
  view: MatchView
  setView: (view: MatchView) => void
  savedJobs: string[]
  savedCandidates: string[]
  skippedCandidates: string[]
  toggleSavedJob: (id: string) => void
  toggleSavedCandidate: (key: string) => void
  skipCandidate: (key: string) => void
  /** Hiện lại các ứng viên đã bỏ qua (hoàn tác) */
  unskipCandidates: (keys: string[]) => void
  load: (role: string) => Promise<void>
  clear: () => void
}

/** Khóa ứng viên theo vị trí */
export const candidateKey = (positionId: string, candidateId: string) => `${positionId}:${candidateId}`

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])
const add = (list: string[], id: string) => (list.includes(id) ? list : [...list, id])

const markPath = (key: string, kind: 'saved' | 'skipped') => {
  const i = key.indexOf(':')
  return `/recruiter/candidate-marks/${encodeURIComponent(key.slice(0, i))}/${encodeURIComponent(key.slice(i + 1))}/${kind}`
}

type Lists = Pick<MatchState, 'savedJobs' | 'savedCandidates' | 'skippedCandidates'>

export const useMatchStore = create<MatchState>()(
  persist(
    (set, get) => {
      /** Đổi danh sách ngay, gửi máy chủ; lỗi thì trả về như cũ */
      const apply = (next: Partial<Lists>, send: () => Promise<unknown>) => {
        if (!useAuthStore.getState().token) {
          toast('Đăng nhập để lưu lại')
          return
        }
        const { savedJobs, savedCandidates, skippedCandidates } = get()
        set(next)
        send().catch((err: unknown) => {
          set({ savedJobs, savedCandidates, skippedCandidates })
          toast.error(apiErrorMessage(err, 'Chưa lưu được, vui lòng thử lại.'))
        })
      }
      return {
        view: 'gallery',
        setView: (view) => set({ view }),
        savedJobs: [],
        savedCandidates: [],
        skippedCandidates: [],
        toggleSavedJob: (id) => {
          const on = !get().savedJobs.includes(id)
          const path = `/seeker/saved-jobs/${encodeURIComponent(id)}`
          apply({ savedJobs: toggle(get().savedJobs, id) }, () => (on ? api.put(path) : api.delete(path)))
        },
        toggleSavedCandidate: (key) => {
          const on = !get().savedCandidates.includes(key)
          apply({ savedCandidates: toggle(get().savedCandidates, key) }, () => (on ? api.put(markPath(key, 'saved')) : api.delete(markPath(key, 'saved'))))
        },
        skipCandidate: (key) => apply({ skippedCandidates: add(get().skippedCandidates, key) }, () => api.put(markPath(key, 'skipped'))),
        unskipCandidates: (keys) =>
          apply(
            { skippedCandidates: get().skippedCandidates.filter((k) => !keys.includes(k)) },
            () => Promise.all(keys.map((k) => api.delete(markPath(k, 'skipped')))),
          ),
        load: async (role) => {
          if (role === 'jobseeker') {
            const { data } = await api.get<{ jobId: string }[]>('/seeker/saved-jobs')
            set({ savedJobs: data.map((r) => r.jobId) })
          } else if (role === 'recruiter') {
            const { data } = await api.get<{ jobId: string; seekerId: string; kind: 'saved' | 'skipped' }[]>('/recruiter/candidate-marks')
            const keys = (kind: string) => data.filter((m) => m.kind === kind).map((m) => candidateKey(m.jobId, m.seekerId))
            set({ savedCandidates: keys('saved'), skippedCandidates: keys('skipped') })
          }
        },
        clear: () => set({ savedJobs: [], savedCandidates: [], skippedCandidates: [] }),
      }
    },
    { name: 'workmate-match', version: 2, partialize: (s) => ({ view: s.view }), migrate: (p) => ({ view: (p as { view?: MatchView }).view ?? 'gallery' }) as MatchState },
  ),
)
