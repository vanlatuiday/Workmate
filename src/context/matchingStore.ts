import { create } from 'zustand'
import type { CriterionKey, MatchOutcome } from '@pages/public/match/score'

// Điểm phù hợp do máy chủ tính (nguồn sự thật) — chỉ giữ trong bộ nhớ, nạp qua `@services/matchingService`.
// `jobs`: việc → điểm cho người tìm việc đang đăng nhập. `candidates`: theo từng tin của nhà tuyển dụng.

export type Weights = Record<CriterionKey, number>
/** Kết quả một cặp: giống MatchOutcome kèm khoảng cách người ↔ chỗ làm do máy chủ tính */
export type ServerOutcome = MatchOutcome & { distanceKm: number }
export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface CandidateScores {
  status: LoadStatus
  items: Record<string, ServerOutcome>
}

interface MatchingState {
  /** Trọng số mặc định máy chủ dùng */
  weights: Weights | null
  jobsStatus: LoadStatus
  jobs: Record<string, ServerOutcome>
  /** jobId → điểm của các ứng viên */
  candidates: Record<string, CandidateScores>
  clear: () => void
}

export const useMatchingStore = create<MatchingState>()((set) => ({
  weights: null,
  jobsStatus: 'idle',
  jobs: {},
  candidates: {},
  clear: () => set({ weights: null, jobsStatus: 'idle', jobs: {}, candidates: {} }),
}))
