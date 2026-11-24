import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

import postShiftImg from '@assets/images/home/home-post-shift.webp'
import findJobImg from '@assets/images/home/home-find-job.webp'
import TextReveal from '@components/motion/TextReveal'
import RollText from '@components/motion/RollText'
import Magnetic from '@components/motion/Magnetic'
import { homeSections, homeSectionsByRole } from './content'
import { useHomeRole } from './homeData'
import LightCurves from './LightCurves'
import { gsap, useGSAP } from '@utils/gsap'
import { useHomeReducedMotion } from '@hooks/useHomeReducedMotion'

/**
 * Section ⑥ — bố cục dọc không khung: tiêu đề + dòng phụ + nút (chữ ngà) căn giữa, ảnh minh họa tách nền bên dưới. Tấm đứng yên khi cuộn (taste skill: ngoài 2 khoảnh khắc không gì chạy theo cuộn, 2026-11-20).
 */
export default function RecruiterSection() {
  const ref = useRef<HTMLElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const role = useHomeRole()
  const reduced = useHomeReducedMotion()

  // Khi cuộn tới: chữ hiện (TextReveal) rồi laptop trồi lên + lớn dần 96% → 100% (một lần); sau đó trôi lên xuống rất chậm.
  // gsap.from trong matchMedia → mặc định CSS vẫn hiện đủ nếu GSAP không chạy; giảm chuyển động: không tween.
  useGSAP(
    () => {
      const art = ref.current?.querySelector<HTMLElement>('[data-art]')
      const img = ref.current?.querySelector<HTMLElement>('[data-art-float]')
      if (!art || !img) return
      if (reduced) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(art, {
          opacity: 0, y: 48, scale: 0.96, duration: 1, ease: 'power3.out', delay: 0.15,
          scrollTrigger: { trigger: art, start: 'top 85%', once: true },
        })
        gsap.to(img, { y: -8, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 })
      })
      return () => mm.revert()
    },
    { scope: ref, dependencies: [reduced, role], revertOnUpdate: true },
  )
  // Nhà tuyển dụng → nhắc hoàn thiện trang công ty; người tìm việc → mời tìm việc;
  // khách → mời đăng tin
  const copy =
    role === 'recruiter' ? homeSectionsByRole.recruiter.panel
    : role === 'jobseeker' ? homeSectionsByRole.jobseeker.panel
    : homeSections.recruiter
  // Ảnh minh họa tách nền: người tìm việc → màn hình "Tìm việc phù hợp"; khách + NTD → "Đăng ca tuyển dụng"
  const art = role === 'jobseeker'
    ? { src: findJobImg, alt: 'Minh họa màn hình tìm việc phù hợp trên Workmate, kèm lịch rảnh, việc gần bạn và gợi ý ngành nghề', w: 1400, h: 1050 }
    : { src: postShiftImg, alt: 'Minh họa màn hình đăng ca tuyển dụng trên Workmate, kèm số ứng viên phù hợp và lịch làm', w: 1400, h: 1050 }

  return (
    <section ref={ref} data-theme="night" className="relative isolate z-10 overflow-x-clip px-4 py-section-sm md:px-[max(16px,2.5vw)]" aria-labelledby="home-recruiter-title">
      <LightCurves side="center" />
      {/* Bố cục dọc, không khung (chủ dự án 2026-11-21): chữ ngà căn giữa ở trên, ảnh minh họa tách nền nổi trên nền sao ở dưới */}
      <div ref={wrapRef} className="relative mx-auto flex max-w-5xl flex-col items-center text-center text-wm-ivory">
        <TextReveal
          id="home-recruiter-title"
          text={copy.title}
          className="text-balance font-display text-display-sm font-semibold"
        />
        <p className="mt-5 max-w-xl text-base leading-relaxed text-wm-ivory/85 md:text-lg">{copy.body}</p>
        <Magnetic className="mt-8">
          <Link to={copy.cta.href} className="stmt-btn stmt-btn-primary group">
            <RollText>{copy.cta.label}</RollText>
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </Magnetic>
        {/* Quầng cam (cam chỉ ở hero và ở đây — chủ dự án 2026-11-19) thu lại, nằm sau ảnh; chữ phía trên đứng trên nền xanh.
            [data-home-orange] vẫn để HomeBackdrop cho trôi nhẹ. */}
        <div className="relative isolate mt-4 w-full max-w-[64rem] md:mt-6">
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 flex items-center justify-center">
            <div data-home-orange className="home-orange h-[115%] w-[125%] shrink-0" />
          </div>
          {/* Vệt sáng xanh ngọc dưới đáy laptop (như mặt bàn phản chiếu): mắt "hạ cánh" trước khi sang mục sau */}
          <span aria-hidden className="recruit-floor pointer-events-none absolute inset-x-[12%] bottom-[-2%] h-[14%]" />
          <div data-art className="relative">
            <img
              data-art-float
              src={art.src}
              alt={art.alt}
              width={art.w}
              height={art.h}
              loading="lazy"
              decoding="async"
              className="relative h-auto w-full"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
