import api from './api'
import type { MatchResult } from '@/types'

export const matchService = {
  getMyMatches: () =>
    api.get<MatchResult[]>('/match/me'),

  expressInterest: (matchId: string) =>
    api.post(`/match/${matchId}/interest`),

  withdrawInterest: (matchId: string) =>
    api.delete(`/match/${matchId}/interest`),

  getMatchScore: (jobId: string) =>
    api.get<MatchResult>(`/match/score/${jobId}`),
}
