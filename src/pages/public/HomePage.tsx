import { useEffect, useRef } from 'react'

import { useSmoothScroll } from '@hooks/useSmoothScroll'
import { ScrollTrigger } from '@utils/gsap'
import CustomCursor from '@components/motion/CustomCursor'
import IntroHero, { type IntroHeroHandle } from '@components/home/IntroHero'
import UrgentJobsSection from '@components/home/UrgentJobsSection'
import StreetSceneSection from '@components/home/StreetSceneSection'
import FeatureBlocksSection from '@components/home/FeatureBlocksSection'
import NewJobsSection from '@components/home/NewJobsSection'
import ExploreSection from '@components/home/ExploreSection'
import RecruiterSection from '@components/home/RecruiterSection'
import FinalCtaSection from '@components/home/FinalCtaSection'
import { useSectionThemes } from '@components/home/useSectionThemes'
import { useHomeHeader } from '@components/home/useHomeHeader'

/**
 * Trang chủ: intro logo rồi một chuỗi section kiểu "ảnh + khối + hàng thẻ".
 *
 *   ①  IntroHero            than chì → ngà  logo giữa màn hình → header; hero là khối ảnh bo góc + tìm kiếm
 *   ②  UrgentJobsSection    ngà             hàng thẻ việc cuộn ngang
 *   ②b StreetSceneSection  than chì         con phố nét mảnh, người đi bộ bước ra từ tiệm Workmate — chỉ trang trí
 *   ③  FeatureBlocksSection đá (stone)      "cuốn sách" lật trang khi cuộn (máy tính); điện thoại xếp dọc
 *   ④  NewJobsSection       ngà             lưới 6 việc mới đăng (NTD: "Tin của bạn")
 *   ⑤  ExploreSection       ngà             ô nhóm ngành có ảnh + liên kết khu vực/hình thức
 *   ⑥  RecruiterSection     ngà             tấm than chì cho nhà tuyển dụng, nở ra khi cuộn tới
 *   ⑦  FinalCtaSection      than chì        lời kết + nút quay về tìm kiếm
 *
 * Màu nền/chữ đổi theo `data-theme` của từng section (useSectionThemes).
 * Chữ mẫu ở components/home/content.ts, ảnh ở components/home/homeMedia.ts.
 * Các section cũ (Fit/Opportunities/HowItWorks/Statement/Closing) còn trong thư mục nhưng không render.
 */
export default function HomePage() {
  useSmoothScroll()

  const rootRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<IntroHeroHandle>(null)
  useSectionThemes(rootRef)
  useHomeHeader()

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
      {/* Phần 2 là tấm bo góc đè lên mép dưới banner (-mt = bán kính bo góc), trượt lên che
          banner khi cuộn — banner lùi vào trong (IntroHero). z-10: nằm trên lớp sticky của hero. */}
      <div className="relative z-10 -mt-4 rounded-t-card bg-page-bg">
        <UrgentJobsSection />
      </div>
      <StreetSceneSection />
      <FeatureBlocksSection />
      <NewJobsSection />
      <ExploreSection />
      <RecruiterSection />
      <FinalCtaSection onFindJob={() => heroRef.current?.focusSearch()} />
    </div>
  )
}
