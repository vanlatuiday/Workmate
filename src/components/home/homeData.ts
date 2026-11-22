import { useMemo } from 'react'

import { useAuthStore } from '@context/authStore'
import { useCandidates, type MatchCandidate } from '@pages/public/match/data'
import { foldVi } from '@utils/text'

/** Vai trò để chọn nội dung trang chủ: quản trị xem như khách (trừ hero, đã xử lý riêng) */
export type HomeRole = 'guest' | 'jobseeker' | 'recruiter'

export function useHomeRole(): HomeRole {
  const role = useAuthStore((s) => s.user?.role)
  return role === 'jobseeker' || role === 'recruiter' ? role : 'guest'
}

/** Bỏ dấu + chữ thường để so khớp tiếng Việt (cùng cách với trang Tìm ứng viên) */
export const norm = (s: string) => foldVi(s).trim()

/** Ứng viên nhà tuyển dụng được thấy (máy chủ đã lọc) — người sẵn sàng đi làm xếp trước */
export function useHomeCandidates(): MatchCandidate[] {
  const list = useCandidates()
  return useMemo(() => {
    const rank = (c: MatchCandidate) => (c.availability.kind === 'ready' ? 0 : 1)
    return [...list].sort((a, b) => rank(a) - rank(b))
  }, [list])
}
