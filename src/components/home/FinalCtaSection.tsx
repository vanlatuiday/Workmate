import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'

import { useAuthStore } from '@context/authStore'
import Reveal from '@components/motion/Reveal'
import TextReveal from '@components/motion/TextReveal'
import Magnetic from '@components/motion/Magnetic'
import RollText from '@components/motion/RollText'
import { homeSections, homeSectionsByRole } from './content'
import HomeSearchForm from './HomeSearchForm'
import { ExploreChips } from './ExploreSection'

/**
 * Section ⑦ — lời kết trên nền đen ấm (night). Footer nằm ngay sau.
 * Khách / người tìm việc: ô tìm việc gọn (cùng form với hero; nút "Tìm việc" là điểm nhấn duy nhất).
 * Nhà tuyển dụng / quản trị (hero không có ô tìm việc): nút dẫn tới việc của họ.
 */
export default function FinalCtaSection() {
  const role = useAuthStore((s) => s.user?.role)
  const recruiter = role === 'recruiter'
  const copy = recruiter ? homeSectionsByRole.recruiter.final : homeSections.final
  // Nhà tuyển dụng / quản trị không có ô tìm việc ở hero → dẫn thẳng tới việc của họ
  const roleLink = recruiter
    ? { to: homeSectionsByRole.recruiter.final.cta.href, label: homeSectionsByRole.recruiter.final.cta.label }
    : role === 'admin'
      ? { to: '/admin', label: 'Vào khu quản trị' }
      : null

  const button =
    'group inline-flex min-h-11 items-center gap-2 rounded-full bg-accent px-8 py-4 text-sm font-semibold text-accent-fg transition-[filter,transform] duration-300 hover:brightness-110 active:scale-[0.97] motion-reduce:active:scale-100'

  return (
    <section
      data-theme="night"
      // Ngà → đen ấm (night): đoạn chuyển dài (95% → 35%) để nền tối dần êm; end tới được trước hết trang vì còn footer bên dưới
      data-theme-start="top 95%"
      data-theme-end="top 35%"
      className="relative z-10 px-4 py-section-sm md:px-[max(16px,2.5vw)]" aria-labelledby="home-final-title">
      <TextReveal
        id="home-final-title"
        text={copy.title}
        className="max-w-[18ch] text-balance font-display text-display-lg font-semibold text-page-fg"
      />
      <Reveal delay={0.2} className="mt-12">
        {roleLink ? (
          <Magnetic>
            <Link to={roleLink.to} className={button}>
              <RollText>{roleLink.label}</RollText>
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </Magnetic>
        ) : (
          <HomeSearchForm size="sm" className="w-full max-w-2xl" />
        )}
      </Reveal>
      {!recruiter && <ExploreChips className="mt-12 max-w-5xl" />}
    </section>
  )
}
