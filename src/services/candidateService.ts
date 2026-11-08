// Nạp ứng viên từ máy chủ và đổi sang dạng `MatchCandidate` mà các trang đang dùng.
import api from './api'
import { useCandidateStore } from '@context/candidateStore'
import { useAdminStore } from '@context/adminStore'
import { CANDIDATES, type MatchCandidate } from '@pages/public/match/data'
import type { SeekerCriteria } from '@pages/public/match/score'
import type { Photo } from '@components/discover/types'

interface ServerCandidate {
  id: string
  name: string
  area: string
  distanceKm: number
  summary: string
  working: boolean
  criteria: SeekerCriteria
}

/** Ảnh minh họa không lộ mặt: ứng viên mẫu giữ ảnh riêng, người khác lấy cố định theo id từ ảnh của ứng viên mẫu */
function photoOf(id: string): Photo {
  const own = CANDIDATES.find((c) => c.id === id)
  if (own) return own.photo
  const hash = [...id].reduce((n, ch) => (n * 31 + ch.charCodeAt(0)) >>> 0, 7)
  return CANDIDATES[hash % CANDIDATES.length].photo
}

const toCandidate = (c: ServerCandidate): MatchCandidate => ({
  id: c.id, positionId: '*', name: c.name, area: c.area, distanceKm: c.distanceKm,
  summary: c.summary || 'Chưa có giới thiệu',
  availability: c.working ? { kind: 'working' } : { kind: 'ready' },
  criteria: c.criteria, photo: photoOf(c.id),
})

export async function loadCandidates() {
  const { data } = await api.get<ServerCandidate[]>('/recruiter/candidates')
  useCandidateStore.getState().set(data.map(toCandidate))
}

/** Quản trị viên: mọi người tìm việc, kèm trạng thái khóa */
export async function loadAdminSeekers() {
  const { data } = await api.get<(ServerCandidate & { locked: boolean })[]>('/admin/seekers')
  useCandidateStore.getState().set(data.map(toCandidate))
  useAdminStore.setState({ lockedSeekers: Object.fromEntries(data.filter((s) => s.locked).map((s) => [s.id, true])) })
}
