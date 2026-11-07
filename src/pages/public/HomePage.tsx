import { lazy, Suspense, useEffect, useRef } from 'react'

import { useSmoothScroll } from '@hooks/useSmoothScroll'
import { ScrollTrigger } from '@utils/gsap'
import { ParticleBoundary, useParticlesFailed } from '@components/motion/particleStatus'
import { useReducedMotion } from '@hooks/useReducedMotion'
import CustomCursor from '@components/motion/CustomCursor'
import IntroHero, { supportsWebGL, type IntroHeroHandle } from '@components/home/IntroHero'
import UrgentJobsSection from '@components/home/UrgentJobsSection'
import StreetSceneSection from '@components/home/StreetSceneSection'
import FeatureBlocksSection from '@components/home/FeatureBlocksSection'
import NewJobsSection from '@components/home/NewJobsSection'
import ExploreSection from '@components/home/ExploreSection'
import RecruiterSection from '@components/home/RecruiterSection'
import FinalCtaSection from '@components/home/FinalCtaSection'
import { useSectionThemes } from '@components/home/useSectionThemes'
import { useHomeHeader } from '@components/home/useHomeHeader'

// Lớp hạt WebGL tách riêng khỏi bundle chính (như HeroCanvas)
const ParticleField = lazy(() => import('@components/motion/ParticleField'))

/**
 * Trang chủ: intro logo rồi một chuỗi section kiểu "ảnh + khối + hàng thẻ".
 *
 *   ①  IntroHero            than chì → graphite  logo hạt giữa màn hình tan ra; hero là ảnh tràn màn hình + tìm kiếm
 *   ②  UrgentJobsSection    ngà             hàng thẻ việc cuộn ngang
 *   ②b StreetSceneSection  than chì         con phố nét mảnh, người đi bộ bước ra từ tiệm Workmate — chỉ trang trí
 *   ③  FeatureBlocksSection ngà             "cuốn sách" lật trang khi cuộn (máy tính); điện thoại xếp dọc
 *   ④  NewJobsSection       ngà             lưới 6 việc mới đăng (NTD: "Tin của bạn")
 *   ⑤  ExploreSection       ngà             ô nhóm ngành có ảnh + liên kết khu vực/hình thức
 *   ⑥  RecruiterSection     ngà             tấm than chì cho nhà tuyển dụng, nở ra khi cuộn tới
 *   ⑦  FinalCtaSection      than chì        lời kết + nút quay về tìm kiếm
 *
 * Màu nền/chữ đổi theo `data-theme` của từng section (useSectionThemes). Trang chủ chỉ dùng
 * hai nền: than chì (tối) và ngà (sáng).
 * Chữ mẫu ở components/home/content.ts, ảnh ở components/home/homeMedia.ts.
 * Các section cũ (Fit/Opportunities/HowItWorks/Statement/Closing) còn trong thư mục nhưng không render.
 */
export default function HomePage() {
  useSmoothScroll()
  // Lớp hạt (logo → nền mờ): chỉ khi cho phép chuyển động và có WebGL — IntroHero dùng cùng điều kiện
  const reduced = useReducedMotion()
  const particlesFailed = useParticlesFailed()
  const particles = !reduced && supportsWebGL() && !particlesFailed

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
      {/* Kết cấu hạt mờ — dưới header (z-40) */}
      <div aria-hidden className="grain pointer-events-none fixed inset-0 z-30" />
      {/* Hạt: logo ở intro, rồi tan thành nền mờ. Canvas z-[5]: trên nền trang và banner hero
          (lớp sticky, z auto), DƯỚI nội dung các section (mỗi section gốc là relative z-10) và header (z-40). */}
      {particles && (
        <ParticleBoundary>
          <Suspense fallback={null}>
            <ParticleField />
          </Suspense>
        </ParticleBoundary>
      )}
      <IntroHero ref={heroRef} />
      {/* Phần 2 là tấm bo góc đè lên mép dưới banner (-mt = bán kính bo góc), trượt lên che
          banner khi cuộn — banner lùi vào trong (IntroHero). Không đặt z-index: cần nền của nó
          nằm dưới hạt; vẫn che được banner vì đứng sau hero trong cây DOM. Nội dung bên trong là z-10. */}
      <div className="relative -mt-4 rounded-t-card bg-page-bg">
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
