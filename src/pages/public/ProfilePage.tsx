import { useRef } from 'react'
import { gsap, useGSAP } from '@utils/gsap'
import { usePageEnterDelay } from '@components/motion/PageTransition'
import { useReducedMotion } from '@hooks/useReducedMotion'
import CompletionRing from '@components/common/CompletionRing'
import { MATCH_JOBS } from './match/data'
import IntroChapter from './profile/IntroChapter'
import ProfilePreview from './profile/ProfilePreview'
import PublishTile from './profile/PublishTile'
import { AboutChapter, AvailabilityChapter, ExperienceChapter, SkillsChapter, WantsChapter } from './profile/Sections'
import { useProfileDraft } from './profile/useProfileDraft'

// Ảnh trung tính làm ánh màu nền khi chưa có ảnh đại diện (lấy từ dữ liệu mẫu có sẵn)
const FALLBACK_GLOW = `https://images.unsplash.com/photo-${MATCH_JOBS[0].photo.id}?w=160&q=60&auto=format&fit=crop`

/**
 * Hồ sơ người tìm việc — biểu mẫu dọc kiểu trang đăng tin: nhóm kính đánh số bên trái, xem trước bên phải.
 * Mọi ô luôn sửa được; sửa là lưu ngay vào profileStore (đã đăng nhập thì tự lưu lên máy chủ), điểm phù hợp ở mọi trang cập nhật theo.
 */
export default function ProfilePage() {
  const delay = usePageEnterDelay()
  const reduced = useReducedMotion()
  const api = useProfileDraft()
  const formRef = useRef<HTMLDivElement>(null)
  const { profile, percent } = api

  // Vào trang: các nhóm lần lượt nổi lên (chỉ transform/opacity)
  useGSAP(() => {
    if (reduced) return
    gsap.from('[data-group]', { y: 20, opacity: 0, duration: 0.6, stagger: 0.07, delay, ease: 'power3.out', clearProps: 'transform,opacity' })
  }, { scope: formRef, dependencies: [reduced] })

  return (
    <div className="theme-ivory min-h-[calc(100svh-4rem)] overflow-x-clip bg-page-bg text-page-fg">
      <div className="shell py-section-sm">
        <h1 className="sr-only">Hồ sơ của bạn</h1>
        <div className="relative isolate grid grid-cols-1 gap-10 lg:grid-cols-12">
          {/* Ánh màu từ ảnh đại diện (hoặc ảnh mẫu), nhòe mạnh sau cột form → kính có thứ để "lọc" */}
          <img
            src={profile.avatarUrl ?? FALLBACK_GLOW}
            alt=""
            aria-hidden
            className="pointer-events-none absolute left-0 top-24 -z-10 h-[70%] w-full object-cover opacity-30 blur-[90px] saturate-150 lg:w-[58%]"
          />
          <div ref={formRef} className="space-y-5 lg:col-span-7 lg:grid lg:grid-cols-[4.5rem_minmax(0,1fr)] lg:gap-6 lg:space-y-0">
            {/* Vòng hoàn thiện: cột trái riêng ở lg (dính, không đè form); mobile nằm đầu cột, không dính */}
            <CompletionRing value={percent} max={100} label="Mức hoàn thiện hồ sơ" center={`${percent}%`} caption="hoàn thiện" rowText={`Hồ sơ hoàn thiện ${percent}%`} />
            <div className="min-w-0 space-y-5">
            <IntroChapter api={api} />
            <SkillsChapter api={api} />
            <ExperienceChapter api={api} />
            <AvailabilityChapter api={api} />
            <WantsChapter api={api} />
            <AboutChapter api={api} />
            <PublishTile api={api} />
            </div>
          </div>
          <aside className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start" aria-label="Xem trước hồ sơ">
            <ProfilePreview api={api} />
          </aside>
        </div>
      </div>
    </div>
  )
}
