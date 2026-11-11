import { Link } from 'react-router-dom'
import { ArrowUp, ArrowUpRight } from 'lucide-react'

import { useAuthStore } from '@context/authStore'
import Reveal from '@components/motion/Reveal'
import TextReveal from '@components/motion/TextReveal'
import Magnetic from '@components/motion/Magnetic'
import RollText from '@components/motion/RollText'
import { homeSections, homeSectionsByRole } from './content'

type Props = {
  /** Đưa người dùng về thanh tìm kiếm ở hero. */
  onFindJob: () => void
}

/** Section ⑦ — lời kết trên nền đen ấm (night). Footer nằm ngay sau. */
export default function FinalCtaSection({ onFindJob }: Props) {
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
      className="relative z-10 shell py-section" aria-labelledby="home-final-title">
      <TextReveal
        id="home-final-title"
        text={copy.title}
        className="max-w-[16ch] font-display text-display-lg font-semibold text-page-fg"
      />
      <Reveal delay={0.2} className="mt-12">
        <Magnetic>
          {roleLink ? (
            <Link to={roleLink.to} className={button}>
              <RollText>{roleLink.label}</RollText>
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          ) : (
            <button type="button" onClick={onFindJob} className={button}>
              <RollText>{homeSections.final.cta}</RollText>
              <ArrowUp className="h-4 w-4" aria-hidden />
            </button>
          )}
        </Magnetic>
      </Reveal>
    </section>
  )
}
