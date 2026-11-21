import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap, useGSAP } from '@utils/gsap'
import { usePageEnterDelay } from '@components/motion/PageTransition'
import { useReducedMotion } from '@hooks/useReducedMotion'
import CompletionRing from '@components/common/CompletionRing'
import IntroChapter from './profile/IntroChapter'
import ProfilePreview from './profile/ProfilePreview'
import PublicStatusBar from './profile/PublicStatusBar'
import SectionIndex from './profile/SectionIndex'
import { AboutChapter, AvailabilityChapter, ExperienceChapter, SkillsChapter, WantsChapter } from './profile/Sections'
import { useProfileDraft } from './profile/useProfileDraft'

/**
 * Hồ sơ người tìm việc — trình sửa DUY NHẤT (/tim-viec/ho-so chuyển về đây): mục lục dính bên trái, biểu mẫu ở giữa, xem trước bên phải (từ xl).
 * Mọi ô luôn sửa được; sửa là lưu ngay vào profileStore (đã đăng nhập thì tự lưu lên máy chủ), điểm phù hợp ở mọi trang cập nhật theo.
 */
export default function ProfilePage() {
  const delay = usePageEnterDelay()
  const reduced = useReducedMotion()
  const api = useProfileDraft()
  const formRef = useRef<HTMLDivElement>(null)
  const { percent, suggestions, sections } = api
  const { hash } = useLocation()

  // Vào trang: các nhóm lần lượt nổi lên (chỉ transform/opacity)
  useGSAP(() => {
    if (reduced) return
    gsap.from('[data-group]', { y: 20, opacity: 0, duration: 0.6, stagger: 0.07, delay, ease: 'power3.out', clearProps: 'transform,opacity' })
  }, { scope: formRef, dependencies: [reduced] })

  // Vào trang với #neo (vd. từ thanh bên): cuộn tới phần đó sau khi các nhóm đã vào xong; scroll-mt của nhóm chừa chỗ cho header
  useEffect(() => {
    const id = decodeURIComponent(hash.slice(1))
    if (!id) return
    const t = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
    }, delay * 1000 + 120)
    return () => window.clearTimeout(t)
  }, [hash, delay, reduced])

  // Nhảy tới ô còn thiếu: cuộn vào giữa màn hình rồi focus (không cuộn lại lần nữa)
  const jump = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' })
    el.focus({ preventScroll: true })
  }

  return (
    <div className="theme-ivory min-h-[calc(100svh-4.5rem)] overflow-x-clip bg-page-bg text-page-fg">
      <div className="shell py-section-sm">
        <h1 className="sr-only">Hồ sơ của bạn</h1>
        <PublicStatusBar api={api} />
        <div className="relative isolate mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[10rem_minmax(0,1fr)] xl:grid-cols-[10rem_minmax(0,1fr)_20rem]">
          <SectionIndex sections={sections} reduced={reduced} />
          <div ref={formRef} className="min-w-0 space-y-5">
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
            </div>
          </div>
          <aside className="xl:sticky xl:top-24 xl:self-start" aria-label="Xem trước hồ sơ">
            <ProfilePreview api={api} />
          </aside>
        </div>
      </div>
    </div>
  )
}
