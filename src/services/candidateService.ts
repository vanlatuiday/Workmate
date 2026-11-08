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

/** Hồ sơ một ứng viên; `phone`, `fullArea`, `hasCv` chỉ có khi đã kết nối */
export interface CandidateProfile extends ServerCandidate {
  connected: boolean
  about: string
  avatarUrl: string | null
  experience: { id: string; title: string; company: string; period: string }[]
  fullArea?: string
  phone?: string
  hasCv?: boolean
}

export async function fetchCandidateProfile(id: string): Promise<CandidateProfile> {
  const { data } = await api.get<CandidateProfile>(`/recruiter/candidates/${encodeURIComponent(id)}/profile`)
  return data
}

/** Link xem / tải CV mặc định của ứng viên đã kết nối, hết hạn sau 5 phút */
export async function candidateCvUrl(id: string, download: boolean): Promise<string> {
  const { data } = await api.get<{ url: string }>(`/recruiter/candidates/${encodeURIComponent(id)}/cv`, { params: download ? { download: 1 } : {} })
  return data.url
}
