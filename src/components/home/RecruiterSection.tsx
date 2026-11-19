import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

import { photoSrcSet, photoUrl } from '@components/discover/types'
import TextReveal from '@components/motion/TextReveal'
import RollText from '@components/motion/RollText'
import Magnetic from '@components/motion/Magnetic'
import { homeMedia } from './homeMedia'
import { homeSections, homeSectionsByRole } from './content'
import { useHomeRole } from './homeData'

/**
 * Section ⑥ — dải gradient cam mơ → đào dành cho nhà tuyển dụng, ăn với quầng cam phía sau. Chữ than chì
 * (≥ 4,5:1 trên cả hai đầu gradient) và nút than chì; tấm tự mang màu cố định. Tấm đứng yên khi cuộn (taste skill: ngoài 2 khoảnh khắc không gì chạy theo cuộn, 2026-11-20).
 */
export default function RecruiterSection() {
  const ref = useRef<HTMLElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const role = useHomeRole()
  // Nhà tuyển dụng → nhắc hoàn thiện trang công ty; người tìm việc → mời tìm việc;
  // khách → mời đăng tin
  const copy =
    role === 'recruiter' ? homeSectionsByRole.recruiter.panel
    : role === 'jobseeker' ? homeSectionsByRole.jobseeker.panel
    : homeSections.recruiter
  const photo = role === 'recruiter' ? homeMedia.company : role === 'jobseeker' ? homeMedia.seeker : homeMedia.recruiter

  return (
    <section ref={ref} data-theme="night" className="relative z-10 px-4 py-section-sm md:px-[max(16px,2.5vw)]" aria-labelledby="home-recruiter-title">
      {/* Quầng cam mềm sau khối (cam chỉ ở hero và ở đây — chủ dự án 2026-11-19). Khung ngoài định vị theo
          khối (trừ pb-section); lớp trong để GSAP trôi nhẹ (useHomeBgParallax). -z-10: dưới nội dung section. */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 bottom-section -z-10 flex items-center justify-center">
        <div data-home-orange className="home-orange h-[150%] w-screen shrink-0" />
      </div>
      <div ref={wrapRef} className="relative">
      <div ref={panelRef} className="grid overflow-hidden rounded-card bg-gradient-to-r from-wm-apricot to-wm-peach text-wm-charcoal md:grid-cols-2">
        <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
          <TextReveal
            id="home-recruiter-title"
            text={copy.title}
            className="text-balance font-display text-display-sm font-semibold"
          />
          <p className="mt-5 max-w-md text-base leading-relaxed text-wm-charcoal/90 md:text-lg">{copy.body}</p>
          <Magnetic className="mt-8 self-start">
          <Link
            to={copy.cta.href}
            className="group inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-wm-charcoal px-8 py-3.5 text-sm font-semibold
                       text-wm-ivory transition-[background-color,transform] duration-300 hover:bg-wm-charcoal/80 active:scale-[0.97] motion-reduce:active:scale-100
                       focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wm-charcoal"
          >
            <RollText>{copy.cta.label}</RollText>
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
          </Magnetic>
        </div>

        <div className="aspect-[4/3] md:aspect-auto md:min-h-[26rem]">
          <img
            src={photoUrl(photo.id, 960)}
            srcSet={photoSrcSet(photo.id)}
            sizes="(min-width: 768px) 50vw, 100vw"
            alt={photo.alt}
            width={960}
            height={720}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      </div>
      </div>
    </section>
  )
}
