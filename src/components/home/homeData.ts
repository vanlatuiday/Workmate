import { useMemo } from 'react'

import { useAuthStore } from '@context/authStore'
import { useDemoStore } from '@context/demoStore'
import { useSettingsStore } from '@context/settingsStore'
import { useAdmin } from '@services/adminService'
import { CANDIDATES, isSeekerVisibleTo, ME_CANDIDATE, type MatchCandidate } from '@pages/public/match/data'

/** Vai trò để chọn nội dung trang chủ: quản trị xem như khách (trừ hero, đã xử lý riêng) */
export type HomeRole = 'guest' | 'jobseeker' | 'recruiter'

export function useHomeRole(): HomeRole {
  const role = useAuthStore((s) => s.user?.role)
  return role === 'jobseeker' || role === 'recruiter' ? role : 'guest'
}

/** Bỏ dấu + chữ thường để so khớp tiếng Việt (cùng cách với trang Tìm ứng viên) */
export const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase().trim()

/**
 * Ứng viên nhà tuyển dụng được thấy — cùng luật với trang Tìm ứng viên: bỏ trùng theo tên,
 * bỏ người bị quản trị khóa, người tìm việc demo chỉ hiện khi quyền riêng tư cho phép.
 * Người sẵn sàng đi làm xếp trước.
 */
export function useHomeCandidates(): MatchCandidate[] {
  const lockedSeekers = useAdmin((s) => s.lockedSeekers)
  // Đăng ký để đổi cài đặt riêng tư / kết nối thì danh sách tính lại
  const seekerVisibility = useSettingsStore((s) => s.bySide.seeker.visibility)
  const connections = useDemoStore((s) => s.connections)

  return useMemo(() => {
    const all = [
      ...CANDIDATES.filter((c, i, a) => a.findIndex((x) => norm(x.name) === norm(c.name)) === i),
      ME_CANDIDATE,
    ].filter((c) => !lockedSeekers[c.id] && (c.id !== ME_CANDIDATE.id || isSeekerVisibleTo()))
    const rank = (c: MatchCandidate) => (c.availability.kind === 'ready' ? 0 : 1)
    return all.sort((a, b) => rank(a) - rank(b))
  }, [lockedSeekers, seekerVisibility, connections])
}
