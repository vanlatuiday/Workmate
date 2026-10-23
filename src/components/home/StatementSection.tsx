import { useRef } from 'react'
import { gsap, useGSAP } from '@utils/gsap'
import { useReducedMotion } from '@hooks/useReducedMotion'
import MaskedWords from '@components/motion/MaskedWords'
import { brandStatement } from './content'
import { THEMES } from './useSectionThemes'

/**
 * Section E — tuyên ngôn thương hiệu, điểm nhấn chuyển cảnh của trang.
 *
 * Một tấm nền sage nở ra từ giữa (clip-path) phủ lên section xám đậm phía
 * trước — sáng mở ra trên nền tối. Màu nền cả trang chỉ đổi sang sage khi tấm này đã gần phủ kín
 * (data-theme-start muộn hơn mặc định), nên người dùng thấy một tấm màu lan ra
 * chứ không phải nền bị thay đột ngột.
 */
export default function StatementSection() {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()

  useGSAP(
    () => {
      if (reduced) return

      gsap.fromTo(
        '[data-panel]',
        { clipPath: 'inset(24% 12% 24% 12% round 32px)' },
        {
          clipPath: 'inset(0% 0% 0% 0% round 0px)',
          ease: 'none',
          scrollTrigger: { trigger: ref.current, start: 'top 90%', end: 'top 10%', scrub: true },
        },
      )

      gsap.fromTo(
        '[data-word]',
        { yPercent: 120, opacity: 0 },
        {
          yPercent: 0,
          opacity: 1,
          stagger: 0.03,
          ease: 'power3.out',
          scrollTrigger: { trigger: ref.current, start: 'top 45%', end: 'top -5%', scrub: 0.6 },
        },
      )
    },
    { scope: ref, dependencies: [reduced] },
  )

  return (
    <section
      ref={ref}
      data-theme="sage"
      data-theme-start="top 35%"
      data-theme-end="top 5%"
    >
      {/* Tấm nền và nội dung cùng nằm trong lớp bị clip, nên chữ chỉ hiện bên trong
          tấm sage — không lọt ra ngoài nằm trên nền xám đậm (chữ tối trên nền tối).
          Màu chữ cố định theo tấm sage, không theo màu trang. */}
      <div
        data-panel
        className="min-h-[110svh] flex items-center"
        style={{ background: THEMES.sage.bg, color: THEMES.sage.fg }}
      >
        <div className="shell w-full py-section">
          <p className="eyebrow opacity-80">
            <span className="w-8 h-px bg-current" />
            Điều chúng tôi tin
          </p>
          <MaskedWords
            as="p"
            text={brandStatement}
            className="font-display text-display-md font-semibold mt-10 max-w-[20ch]"
          />
        </div>
      </div>
    </section>
  )
}
