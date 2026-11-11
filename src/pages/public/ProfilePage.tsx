import { useRef } from 'react'
import { gsap, useGSAP } from '@utils/gsap'
import { usePageEnterDelay } from '@components/motion/PageTransition'
import { useReducedMotion } from '@hooks/useReducedMotion'
import CompletionRing from '@components/common/CompletionRing'
import IntroChapter from './profile/IntroChapter'
import ProfilePreview from './profile/ProfilePreview'
import PublishTile from './profile/PublishTile'
import { AboutChapter, AvailabilityChapter, ExperienceChapter, SkillsChapter, WantsChapter } from './profile/Sections'
import { useProfileDraft } from './profile/useProfileDraft'

/**
 * Hồ sơ người tìm việc — biểu mẫu dọc kiểu trang đăng tin: nhóm kính đánh số bên trái, xem trước bên phải.
 * Mọi ô luôn sửa được; sửa là lưu ngay vào profileStore (đã đăng nhập thì tự lưu lên máy chủ), điểm phù hợp ở mọi trang cập nhật theo.
 */
export default function ProfilePage() {
  const delay = usePageEnterDelay()
  const reduced = useReducedMotion()
  const api = useProfileDraft()
  const formRef = useRef<HTMLDivElement>(null)
  const { percent, suggestions } = api

  // Vào trang: các nhóm lần lượt nổi lên (chỉ transform/opacity)
  useGSAP(() => {
    if (reduced) return
    gsap.from('[data-group]', { y: 20, opacity: 0, duration: 0.6, stagger: 0.07, delay, ease: 'power3.out', clearProps: 'transform,opacity' })
  }, { scope: formRef, dependencies: [reduced] })

  // Nhảy tới ô còn thiếu: cuộn vào giữa màn hình rồi focus (không cuộn lại lần nữa)
  const jump = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' })
    el.focus({ preventScroll: true })
  }

  return (
    <div className="theme-ivory min-h-[calc(100svh-4rem)] overflow-x-clip bg-page-bg text-page-fg">
      <div className="shell py-section-sm">
        <h1 className="sr-only">Hồ sơ của bạn</h1>
        <div className="relative isolate grid grid-cols-1 gap-10 lg:grid-cols-12">
          <div ref={formRef} className="min-w-0 space-y-5 lg:col-span-7">
            {/* Vòng hoàn thiện + gợi ý cụ thể còn thiếu (cùng tiêu chí tính %), bấm để nhảy tới ô cần điền */}
            <CompletionRing
              value={percent}
              max={100}
              label="Mức hoàn thiện hồ sơ"
              center={`${percent}%`}
              rowText={`Hồ sơ hoàn thiện ${percent}%`}
              suggestions={suggestions.map((sg) => ({ key: sg.key, label: sg.label, onSelect: () => jump(sg.target) }))}
            />
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
