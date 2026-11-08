import { create } from 'zustand'
import type { MatchCandidate } from '@pages/public/match/data'

// Ứng viên nhà tuyển dụng / quản trị viên được thấy — nạp từ máy chủ qua `@services/candidateService`.

interface CandidateState {
  list: MatchCandidate[]
  set: (list: MatchCandidate[]) => void
}

export const useCandidateStore = create<CandidateState>()((set) => ({
  list: [],
  set: (list) => set({ list }),
}))
