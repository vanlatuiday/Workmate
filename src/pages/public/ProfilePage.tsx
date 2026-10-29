import { useRef, useState } from 'react'
import { gsap, useGSAP } from '@utils/gsap'
import { usePageEnterDelay } from '@components/motion/PageTransition'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { BentoContext } from './profile/bentoContext'
import IntroChapter from './profile/IntroChapter'
import PublishTile from './profile/PublishTile'
import { AboutChapter, AvailabilityChapter, ExperienceChapter, SkillsChapter, WantsChapter } from './profile/Sections'
import { useProfileDraft } from './profile/useProfileDraft'

/**
 * Hồ sơ người tìm việc — sửa là lưu ngay vào profileStore (localStorage), điểm phù hợp ở mọi trang cập nhật theo.
 * Desktop: lưới bento 12×6 vừa một màn hình, nền than chì, khối sáng. Bấm "Sửa" thì khối phóng ra phủ
 * cả lưới (xem ChapterShell). Mobile: xếp dọc, cuộn bình thường.
 */
export default function ProfilePage() {
  const delay = usePageEnterDelay()
  const reduced = useReducedMotion()
  const api = useProfileDraft()
  const gridRef = useRef<HTMLDivElement>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Vào trang: các khối lần lượt bật lên
  useGSAP(() => {
    if (reduced) return
    gsap.from('[data-tile]', { y: 24, scale: 0.96, opacity: 0, duration: 0.6, stagger: 0.06, delay, ease: 'power3.out', clearProps: 'transform,opacity' })
  }, { scope: gridRef, dependencies: [reduced] })

  return (
    <BentoContext.Provider value={{ editingId, setEditingId }}>
      <div className="theme-charcoal min-h-[calc(100svh-4rem)] bg-page-bg">
        <div className="shell py-5">
          <div
            ref={gridRef}
            className="relative grid grid-cols-1 gap-3 lg:h-[calc(100svh-4rem-2.5rem)] lg:grid-cols-12 lg:grid-rows-6"
          >
            <IntroChapter api={api} delay={delay} />
            <SkillsChapter api={api} />
            <PublishTile api={api} />
            <ExperienceChapter api={api} />
            <AvailabilityChapter api={api} />
            <WantsChapter api={api} />
            <AboutChapter api={api} />
          </div>
        </div>
      </div>
    </BentoContext.Provider>
  )
}
