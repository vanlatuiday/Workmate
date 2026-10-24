import { create } from 'zustand'
import type { CompanyProfile, ProfileKind, SeekerProfile } from './model'
import { SAMPLE_COMPANY, SAMPLE_SEEKER } from './sampleData'

/**
 * State chung của trang cá nhân — chỉ trong bộ nhớ (không persist, không localStorage).
 * Sửa ở chế độ chủ sở hữu → chế độ người xem và ô "Mức độ phù hợp" đọc cùng state nên đổi ngay.
 */
interface ProfileState {
  seeker: SeekerProfile
  company: CompanyProfile
  updateSeeker: (patch: Partial<SeekerProfile>) => void
  updateCompany: (patch: Partial<CompanyProfile>) => void
  reset: () => void
}

export const useProfileStore = create<ProfileState>()((set) => ({
  seeker: SAMPLE_SEEKER,
  company: SAMPLE_COMPANY,
  updateSeeker: (patch) => set((s) => ({ seeker: { ...s.seeker, ...patch } })),
  updateCompany: (patch) => set((s) => ({ company: { ...s.company, ...patch } })),
  reset: () => set({ seeker: SAMPLE_SEEKER, company: SAMPLE_COMPANY }),
}))

// ─── Thanh điều khiển demo: ai đang đăng nhập, đang xem trang nào ───────────

/** "Tôi là" — loại tài khoản giả lập */
export type DemoActor = ProfileKind
/** Đang xem trang của mình hay của đối phương */
export type DemoView = 'own' | 'other'

/**
 * Hồ sơ đang hiển thị:
 *   ứng viên + của tôi   → hồ sơ ứng viên, chủ sở hữu
 *   ứng viên + đối phương → trang doanh nghiệp, người xem
 *   doanh nghiệp + của tôi → trang doanh nghiệp, chủ sở hữu
 *   doanh nghiệp + đối phương → hồ sơ ứng viên, người xem
 */
export function shownKind(actor: DemoActor, view: DemoView): ProfileKind {
  if (view === 'own') return actor
  return actor === 'seeker' ? 'company' : 'seeker'
}

/** Tham số URL ↔ trạng thái demo, để thẻ ở trang khác dẫn thẳng tới đúng chế độ */
export const DEMO_PARAMS = {
  actor: { seeker: 'ung-vien', company: 'doanh-nghiep' } as Record<DemoActor, string>,
  view: { own: 'cua-toi', other: 'doi-phuong' } as Record<DemoView, string>,
}

/** Đường dẫn tới trang cá nhân ở một chế độ cụ thể */
export function profileHref(actor: DemoActor, view: DemoView) {
  return `/trang-ca-nhan?vai=${DEMO_PARAMS.actor[actor]}&xem=${DEMO_PARAMS.view[view]}`
}

/** Link tới trang doanh nghiệp (người tìm việc xem) và hồ sơ ứng viên (doanh nghiệp xem) */
export const COMPANY_PROFILE_HREF = profileHref('seeker', 'other')
export const SEEKER_PROFILE_HREF = profileHref('company', 'other')
