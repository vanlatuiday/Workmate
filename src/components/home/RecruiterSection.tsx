import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

import { gsap, useGSAP } from '@utils/gsap'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { photoSrcSet, photoUrl } from '@components/discover/types'
import TextReveal from '@components/motion/TextReveal'
import RollText from '@components/motion/RollText'
import Magnetic from '@components/motion/Magnetic'
import { homeMedia } from './homeMedia'
import { homeSections, homeSectionsByRole } from './content'
import { useHomeRole } from './homeData'

/**
 * Section ⑥ — tấm than chì lớn dành cho nhà tuyển dụng. Nền section vẫn là ngà (tấm
 * này tự mang màu cố định). Khi cuộn tới, tấm phóng từ 0,9 → 1 theo tiến trình cuộn.
 */
export default function RecruiterSection() {
  const ref = useRef<HTMLElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const role = useHomeRole()
  // Nhà tuyển dụng → nhắc hoàn thiện trang công ty; người tìm việc → mời tìm việc;
  // khách → mời đăng tin
  const copy =
    role === 'recruiter' ? homeSectionsByRole.recruiter.panel
    : role === 'jobseeker' ? homeSectionsByRole.jobseeker.panel
    : homeSections.recruiter
  const photo = role === 'recruiter' ? homeMedia.company : role === 'jobseeker' ? homeMedia.seeker : homeMedia.recruiter

  useGSAP(
    () => {
      if (reduced || !panelRef.current) return
      gsap.fromTo(
        panelRef.current,
        { scale: 0.9 },
        {
          scale: 1,
          ease: 'none',
          scrollTrigger: { trigger: panelRef.current, start: 'top 95%', end: 'top 40%', scrub: 0.6 },
        },
      )
    },
    { scope: ref, dependencies: [reduced] },
  )

  return (
    <section ref={ref} data-theme="ivory" className="shell pb-section" aria-labelledby="home-recruiter-title">
      <div ref={panelRef} className="grid overflow-hidden rounded-card bg-wm-charcoal text-wm-ivory md:grid-cols-2">
        <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
          <TextReveal
            id="home-recruiter-title"
            text={copy.title}
            className="font-display text-display-sm font-semibold"
          />
          <p className="mt-5 max-w-md text-base leading-relaxed text-wm-mist md:text-lg">{copy.body}</p>
          <Magnetic className="mt-8 self-start">
          <Link
            to={copy.cta.href}
            className="group inline-flex min-h-11 w-fit items-center gap-2 rounded-full bg-wm-ivory px-8 py-3.5 text-sm font-medium
                       text-wm-charcoal transition-opacity duration-300 hover:opacity-90"
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
    </section>
  )
}
