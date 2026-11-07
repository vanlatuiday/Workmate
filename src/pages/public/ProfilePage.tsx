import { useRef } from 'react'
import { gsap, useGSAP } from '@utils/gsap'
import { usePageEnterDelay } from '@components/motion/PageTransition'
import { useReducedMotion } from '@hooks/useReducedMotion'
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
 * Mọi ô luôn sửa được; sửa là lưu ngay vào profileStore (localStorage), điểm phù hợp ở mọi trang cập nhật theo.
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
          <div ref={formRef} className="space-y-5 lg:col-span-7">
            {/* Thanh hoàn thiện dính dưới header */}
            <div className="glass-liquid sticky top-20 z-20 flex items-center gap-4 rounded-full px-5 py-2 backdrop-blur-xl [--glass-alpha:85%]">
              <span className="tnum whitespace-nowrap text-sm text-page-fg">Hồ sơ hoàn thiện {percent}%</span>
              <div
                role="progressbar"
                aria-label="Mức hoàn thiện hồ sơ"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                className="h-1 flex-1 overflow-hidden rounded-full bg-page-line"
              >
                <div className="h-full origin-left rounded-full bg-page-fg transition-transform duration-500 ease-out motion-reduce:transition-none" style={{ transform: `scaleX(${percent / 100})` }} />
              </div>
            </div>
            <IntroChapter api={api} />
            <SkillsChapter api={api} />
            <ExperienceChapter api={api} />
            <AvailabilityChapter api={api} />
            <WantsChapter api={api} />
            <AboutChapter api={api} />
            <PublishTile api={api} />
          </div>
          <aside className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start" aria-label="Xem trước hồ sơ">
            <ProfilePreview api={api} />
          </aside>
        </div>
      </div>
    </div>
  )
}
