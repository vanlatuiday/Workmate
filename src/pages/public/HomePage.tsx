import { lazy, Suspense, useEffect, useRef } from 'react'

import { useSmoothScroll } from '@hooks/useSmoothScroll'
import { ScrollTrigger } from '@utils/gsap'
import { ParticleBoundary, useParticlesFailed } from '@components/motion/particleStatus'
import { useReducedMotion } from '@hooks/useReducedMotion'
import CustomCursor from '@components/motion/CustomCursor'
import { afterHeroBgStyle, HOME_BG_JOIN, waveBgStyle } from '@components/home/homeBackground'
import { HomeBgLayers, useHomeBgParallax } from '@components/home/HomeBackdrop'
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
 *   ①  IntroHero            than chì        logo hạt giữa màn hình tan ra; hero là ảnh tràn màn hình + tìm kiếm
 *   ②  UrgentJobsSection    than chì        hàng thẻ việc cuộn ngang
 *   ②b StreetSceneSection  than chì         con phố nét mảnh, người đi bộ bước ra từ tiệm Workmate — chỉ trang trí
 *   ③  FeatureBlocksSection ngà (than chì → ngà, chuyển dài ở đầu section)             "cuốn sách" lật trang khi cuộn (máy tính); điện thoại xếp dọc
 *   ④  NewJobsSection       ngà             lưới 6 việc mới đăng (NTD: "Tin của bạn")
 *   ⑤  ExploreSection       ngà             ô nhóm ngành có ảnh + liên kết khu vực/hình thức
 *   ⑥  RecruiterSection     ngà             tấm than chì cho nhà tuyển dụng, nở ra khi cuộn tới
 *   ⑦  FinalCtaSection      than chì        lời kết + nút quay về tìm kiếm
 *
 * Màu nền/chữ đổi theo `data-theme` của từng section (useSectionThemes). Trang chủ chỉ dùng
 * hai nền, theo thứ tự: than chì (① + ② + ②b) → ngà (③–⑥) → than chì (⑦).
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
  useHomeBgParallax(rootRef)

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
      {/* Nền xanh nối tiếp hero cho cả phần còn lại của trang (homeBackground.ts) */}
      {/* Lớp nền không đặt z-index: nằm dưới hạt (z-[5]) và dưới các phần (mỗi phần là relative z-10) */}
      {/* overflow-clip: cắt phần nền kéo dài lên trên khi nền trôi chậm (không tạo khung cuộn, sticky vẫn chạy) */}
      <div className="relative overflow-clip">
        {/* Nền phần dưới hero: đoạn nối (ảnh hero soi gương) → cột tia sáng đồng nhất tới hết trang.
            Cam chỉ ở hero và sau phần ⑥ (RecruiterSection tự mang quầng cam). */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute inset-x-0 top-0" style={{ height: HOME_BG_JOIN }}>
            <HomeBgLayers style={afterHeroBgStyle} />
          </div>
          {/* Tia sáng lượn sóng phủ dần lên đoạn nối (mask nhiều nấc cho mềm), đủ hẳn sau HOME_BG_JOIN.
              Lớp trong kéo dài trên/dưới để trôi chậm (useHomeBgParallax) mà không lộ mép. */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{
              WebkitMaskImage: `linear-gradient(to bottom, transparent 0, rgb(0 0 0 / 0.15) calc(${HOME_BG_JOIN} * 0.35), rgb(0 0 0 / 0.6) calc(${HOME_BG_JOIN} * 0.7), #000 ${HOME_BG_JOIN})`,
              maskImage: `linear-gradient(to bottom, transparent 0, rgb(0 0 0 / 0.15) calc(${HOME_BG_JOIN} * 0.35), rgb(0 0 0 / 0.6) calc(${HOME_BG_JOIN} * 0.7), #000 ${HOME_BG_JOIN})`,
            }}
          >
            <div data-home-wave className="absolute inset-x-0 -top-[10%] -bottom-[10%]">
              <HomeBgLayers style={waveBgStyle} />
            </div>
          </div>
          {/* Quầng cam đáy hero tỏa tiếp xuống dưới rồi tan (cùng tâm với HeroOrange ở mép trên) → không bị cắt */}
          <div className="home-orange-join absolute inset-x-0 top-0 h-[70svh]" />
          <div data-home-stars className="home-stars absolute inset-x-0 -top-[15%] -bottom-[15%]" />
        </div>
        {/* Dưới hero không còn hồng ở hai mép: nhuộm xanh hai bên (chỉ đổi sắc, giữ sáng tối của ảnh).
            Nằm ngoài lớp nền trôi để luôn bắt đầu ngay dưới hero; hiện dần trong 50vh đầu cho liền với
            các góc hồng ở đáy hero. */}
        <div aria-hidden className="home-bg-depink pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-wm-azure" />
        </div>
        {/* Mép dưới tối dần sang màu chân trang (night) để không có vết cắt ngang */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent to-wm-night" />
        <UrgentJobsSection />
        <StreetSceneSection />
        <FeatureBlocksSection />
        <NewJobsSection />
        <ExploreSection />
        <RecruiterSection />
        <FinalCtaSection onFindJob={() => heroRef.current?.focusSearch()} />
      </div>
    </div>
  )
}
