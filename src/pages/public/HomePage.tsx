import { useEffect, useRef } from 'react'

import { useSmoothScroll } from '@hooks/useSmoothScroll'
import { ScrollTrigger } from '@utils/gsap'
import CustomCursor from '@components/motion/CustomCursor'
import IntroHero, { type IntroHeroHandle } from '@components/home/IntroHero'
import FitSection from '@components/home/FitSection'
import OpportunitiesSection from '@components/home/OpportunitiesSection'
import HowItWorksSection from '@components/home/HowItWorksSection'
import StatementSection from '@components/home/StatementSection'
import ClosingSection from '@components/home/ClosingSection'
import { useSectionThemes } from '@components/home/useSectionThemes'

/**
 * Trang chủ: một hành trình cuộn liền mạch qua 6 section.
 *
 *   A  IntroHero            than chì → ngà  logo giữa màn hình → header, hiện hero + tìm kiếm
 *   B  FitSection           ngà             lợi ích
 *   C  OpportunitiesSection đá (stone)      thẻ việc làm mẫu
 *   D  HowItWorksSection    xám đậm         quy trình 3 bước — nhịp tối giữa trang
 *   E  StatementSection     sage            tuyên ngôn, tấm nền nở ra bằng clip-path
 *   F  ClosingSection       than chì        lời kết + CTA quay về tìm kiếm
 *
 * Màu nền/chữ đổi theo `data-theme` của từng section (useSectionThemes).
 * Nội dung mẫu nằm ở components/home/content.ts.
 */
export default function HomePage() {
  useSmoothScroll()

  const rootRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<IntroHeroHandle>(null)
  useSectionThemes(rootRef)

  // Font display tải xong làm đổi chiều cao chữ → đo lại vị trí các trigger
  useEffect(() => {
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
  }, [])

  // Đánh dấu để CSS riêng của trang chủ (vd. viền focus) áp dụng cả cho header,
  // menu phủ và footer — các phần này nằm ngoài cây component của trang
  useEffect(() => {
    const html = document.documentElement
    html.dataset.page = 'home'
    return () => {
      delete html.dataset.page
    }
  }, [])

  return (
    <div ref={rootRef} className="bg-page-bg text-page-fg">
      <CustomCursor />
      {/* Kết cấu hạt mờ — dưới header (z-40), trên nội dung */}
      <div aria-hidden className="grain pointer-events-none fixed inset-0 z-30" />
      <IntroHero ref={heroRef} />
      <FitSection />
      <OpportunitiesSection />
      <HowItWorksSection />
      <StatementSection />
      <ClosingSection onFindJob={() => heroRef.current?.focusSearch()} />
    </div>
  )
}
