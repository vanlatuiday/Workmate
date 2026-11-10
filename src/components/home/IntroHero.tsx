import { forwardRef, lazy, Suspense, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useNavigationType } from 'react-router-dom'
import { Search, MapPin, ArrowDown, ArrowUpRight } from 'lucide-react'

import { gsap, ScrollTrigger, useGSAP } from '@utils/gsap'
import { setInitialScroll } from '@components/common/RouteScroll'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { getSmoothScroll, scrollToY } from '@hooks/useSmoothScroll'
import MaskedWords from '@components/motion/MaskedWords'
import RollText from '@components/motion/RollText'
import Magnetic from '@components/motion/Magnetic'
import { useParticlesFailed } from '@components/motion/particleStatus'
import { useAuthStore } from '@context/authStore'
import { photoSrcSet, photoUrl } from '@components/discover/types'
import { heroCopy, heroTags } from './content'
import { homeMedia } from './homeMedia'

// Tách riêng để shader không nằm trong bundle chính
const HeroCanvas = lazy(() => import('@components/motion/HeroCanvas'))

export type IntroHeroHandle = {
  /** Cuộn tới chỗ thanh tìm kiếm đã hiện đủ rồi đặt con trỏ vào ô từ khóa. */
  focusSearch: () => void
}

/** Logo ở trạng thái intro rộng chừng này phần chiều ngang màn hình. */
const INTRO_LOGO_WIDTH = { ratio: 0.5, max: 620, mobileRatio: 0.62 }

/** Bề rộng (px) của logo ở trạng thái intro với màn hình rộng `vw` — dùng chung với lớp hạt. */
export function introLogoWidth(vw: number) {
  return Math.min(vw * (vw < 640 ? INTRO_LOGO_WIDTH.mobileRatio : INTRO_LOGO_WIDTH.ratio), INTRO_LOGO_WIDTH.max)
}

let webglOk: boolean | undefined
/** Trình duyệt có WebGL không (kiểm tra đồng bộ, nhớ kết quả). Quyết định có dùng lớp hạt hay không. */
export function supportsWebGL() {
  if (webglOk === undefined) {
    try {
      const gl = document.createElement('canvas').getContext('webgl')
      webglOk = !!gl
      gl?.getExtension('WEBGL_lose_context')?.loseContext()
    } catch {
      webglOk = false
    }
  }
  return webglOk
}

/**
 * Logo hạt là "phần demo": chỉ mở ở đó lần đầu vào trang web trong phiên (tab) này.
 * Các lần sau (bấm Workmate từ trang khác, tải lại) mở thẳng ở banner; lướt lên vẫn thấy logo.
 */
const INTRO_SEEN_KEY = 'wm:intro-seen'
function introSeen() {
  try {
    return sessionStorage.getItem(INTRO_SEEN_KEY) === '1'
  } catch {
    return false
  }
}
function markIntroSeen() {
  try {
    sessionStorage.setItem(INTRO_SEEN_KEY, '1')
  } catch {
    /* chế độ riêng tư chặn sessionStorage — coi như lần đầu */
  }
}

/** Vị trí banner của trang chủ đang mở (0 = chưa có / không có intro) — cho logo header cuộn về. */
let bannerY = 0
/** Đang ở trang chủ: cuộn mượt về banner. Trả false nếu trang chủ chưa dựng intro. */
export function scrollToHomeBanner() {
  if (!bannerY) return false
  scrollToY(bannerY, true)
  return true
}

/** Thời gian (giây) trôi trọn qua intro khi lướt nhẹ. */
const INTRO_GLIDE = 2.4
/** Chuyển động bắt đầu ngay (không "đứng một nhịp" như kiểu tăng tốc từ 0) rồi chậm dần êm khi tới nơi. */
const introEase = (t: number) => Math.sin((t * Math.PI) / 2)
/** Các sự kiện wheel cách nhau dưới khoảng này coi là cùng một lần lướt (quán tính trackpad). */
const GESTURE_GAP_MS = 180
/** Lướt lên từ các phần bên dưới về tới hero: đủ dài để phanh từ từ, không khựng. */
const FROM_BELOW_GLIDE = 1.1
/** Đi nhanh theo đà lướt rồi chậm dần rất êm (đuôi dài) — cảm giác đỗ lại thay vì phanh gấp. */
const fromBelowEase = (t: number) => 1 - Math.pow(1 - t, 4)

/**
 * Section A — mở đầu trang chủ.
 *
 * Trạng thái đầu: chỉ có logo Workmate giữa màn hình trên nền tối. Cuộn xuống:
 * logo (chính là logo trong header, không phải bản sao) thu nhỏ và trượt về góc
 * trái, các mục điều hướng hiện dần, rồi tới nội dung hero và thanh tìm kiếm.
 * Mọi thứ chạy theo tiến trình cuộn nên cuộn ngược là chạy ngược.
 *
 * Bố cục: khối cao 200svh, bên trong là lớp sticky 100svh — intro diễn ra trong
 * 100svh cuộn đầu tiên mà không cần pin của GSAP, nên không có pin-spacer chèn
 * vào và chiều cao trang không bao giờ đổi đột ngột.
 *
 * Header và hero mặc định ở trạng thái cuối (thấy đủ). JS chỉ thêm phần intro,
 * nên khi tắt chuyển động hoặc JS lỗi, trang vẫn dùng được bình thường.
 */
const IntroHero = forwardRef<IntroHeroHandle>(function IntroHero(_, ref) {
  const reduced = useReducedMotion()
  // Lớp hạt hỏng → dựng lại timeline với tween logo bay (logo header không bị ẩn)
  const particlesFailed = useParticlesFailed()
  const wrapRef = useRef<HTMLElement>(null)
  const keywordRef = useRef<HTMLInputElement>(null)
  // Vị trí cuộn mà intro kết thúc — để focus/CTA nhảy thẳng tới
  const introEnd = useRef(0)
  // Quyết định một lần lúc mount: mở ở banner thay vì logo? (Back/Forward thì để RouteScroll trả về chỗ cũ)
  const navigationType = useNavigationType()
  const [locationKey] = useState(useLocation().key)
  const [startAtBanner] = useState(() => introSeen() && navigationType !== 'POP')
  // Chỉ nhảy lần đầu dựng timeline (đổi vai trò dựng lại timeline thì không nhảy nữa)
  const startedAtBanner = useRef(false)
  useEffect(() => {
    markIntroSeen()
    return () => {
      bannerY = 0
    }
  }, [])

  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const navigate = useNavigate()
  // Lời mở đầu đổi theo vai trò (khách: trung lập)
  const audience = useAuthStore((s) => s.user?.role) ?? 'guest'
  const copy = heroCopy[audience]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (keyword) params.set('keyword', keyword)
    if (location) params.set('city', location)
    navigate(`/viec-lam?${params.toString()}`)
  }

  useImperativeHandle(ref, () => ({
    focusSearch() {
      scrollToY(introEnd.current)
      keywordRef.current?.focus({ preventScroll: true })
    },
  }))

  useGSAP(
    () => {
      if (reduced) return

      // Các phần tử header nằm trong PublicLayout, đánh dấu bằng data-attribute.
      // Dùng document.querySelector* — selector chuỗi của GSAP ở đây bị giới hạn
      // trong scope của hero nên sẽ không thấy header.
      // Các cụm còn lại của header (nav, tài khoản, nền) do useHomeHeader + CSS lo.
      const logo = document.querySelector<HTMLElement>('[data-brand-logo]')
      if (!logo) return

      const html = document.documentElement
      const canvasWrap = wrapRef.current?.querySelector<HTMLElement>('[data-hero-canvas]')

      // Vị trí/kích thước logo khi nằm yên trong header (bỏ qua transform đang có)
      const naturalRect = () => {
        const prev = logo.style.transform
        logo.style.transform = 'none'
        const rect = logo.getBoundingClientRect()
        logo.style.transform = prev
        return rect
      }
      const introScale = () => introLogoWidth(window.innerWidth) / naturalRect().width
      // Có lớp hạt (ParticleField): logo giữa màn hình do hạt ghép, logo header nằm yên
      // và chỉ hiện dần khi hạt tan. Không có WebGL: logo thật bay từ giữa màn hình về header.
      const particles = supportsWebGL() && !particlesFailed

      // Trạng thái ẩn ban đầu đặt bằng gsap.set, ngoài timeline. Nếu dùng fromTo bắt
      // đầu giữa timeline, mỗi lần ScrollTrigger refresh (đo lại layout) sẽ trả các
      // tween chưa tới lượt về trạng thái gốc → nav và hero hiện sẵn ngay ở intro.
      gsap.set('[data-hero-item]', { opacity: 0, y: 32 })
      gsap.set('[data-hero-title] [data-word]', { yPercent: 120, opacity: 0 })
      if (particles) gsap.set(logo, { opacity: 0 })

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: wrapRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.6,
          invalidateOnRefresh: true,
          onRefresh: (self) => {
            introEnd.current = self.end
            bannerY = self.end
          },
          onUpdate: (self) => {
            // Còn ở intro → các phần chưa hiện không nhận click (xem index.css)
            if (self.progress < 0.45) html.setAttribute('data-intro', '')
            else html.removeAttribute('data-intro')
            // Lớp WebGL đã mờ hẳn thì tắt luôn, để canvas thôi vẽ (IntersectionObserver
            // trong HeroCanvas thấy display:none là dừng vòng lặp)
            if (canvasWrap) canvasWrap.style.display = self.progress > 0.42 ? 'none' : ''
          },
        },
      })

      // 0 → 0.45: logo từ giữa màn hình về header (bản không có hạt).
      // force3D: false — giữ transform 2D để trình duyệt vẽ lại chữ sắc nét ở
      // mỗi tỉ lệ; transform 3D sẽ phóng to một ảnh chụp cỡ nhỏ → logo bị mờ.
      if (particles) {
        // 0.3 → 0.45: logo header hiện dần khi hạt đã tan gần hết (cuộn ngược thì mờ đi)
        tl.to(logo, { opacity: 1, duration: 0.15 }, 0.3)
      } else {
        tl.fromTo(
          logo,
          {
            x: () => window.innerWidth / 2 - (naturalRect().left + naturalRect().width / 2),
            y: () => window.innerHeight / 2 - (naturalRect().top + naturalRect().height / 2),
            scale: introScale,
          },
          { x: 0, y: 0, scale: 1, ease: 'power2.inOut', duration: 0.45, force3D: false },
          0,
        )
      }
      tl
        .to('[data-scroll-hint]', { autoAlpha: 0, duration: 0.08 }, 0)
        // Kết cấu WebGL chỉ thuộc về intro than chì — mờ đi khi cuộn khỏi intro (nền trang giữ than chì suốt banner, Việc gấp và con phố)
        .to('[data-hero-canvas]', { opacity: 0, duration: 0.32 }, 0.08)
        // 0.38 → 0.9: nội dung hero
        .to(
          '[data-hero-title] [data-word]',
          { yPercent: 0, opacity: 1, duration: 0.3, stagger: 0.025, ease: 'power3.out' },
          0.38,
        )
        .to('[data-hero-item]', { opacity: 1, y: 0, duration: 0.3, stagger: 0.06, ease: 'power2.out' }, 0.42)
        // Giữ một nhịp cho người dùng đọc trước khi lớp sticky nhả ra
        .to({}, { duration: 0.1 })

      // Qua khỏi banner: phần 2 (tấm bo góc, HomePage) trượt lên che, banner phía sau
      // "lùi vào trong" — trôi chậm hơn trang, thu nhỏ nhẹ và tối dần. Lướt lên thì ngược lại.
      // Bắt đầu đúng lúc lớp sticky nhả ra nên không đụng tới intro.
      gsap
        .timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: wrapRef.current, start: 'bottom bottom', end: 'bottom top', scrub: true },
        })
        .to('[data-hero-stage]', { y: () => window.innerHeight * 0.45, scale: 0.94, transformOrigin: '50% 0%' }, 0)
        .to('[data-hero-dim]', { opacity: 0.6 }, 0)

      // onUpdate chỉ chạy khi cuộn — lúc vừa mở trang phải tự đặt trạng thái intro
      if ((tl.scrollTrigger?.progress ?? 0) < 0.45) html.setAttribute('data-intro', '')

      // Mở thẳng ở banner, ngay khung hình đầu (layout effect, trước khi vẽ): cuộn tới cuối intro,
      // báo RouteScroll (chạy ngay sau) dùng vị trí này thay vì đầu trang, rồi cho timeline tới đích
      // luôn — không để scrub tua lại hiệu ứng logo. Lenis khởi tạo sau đó, đọc đúng vị trí hiện tại.
      const st = tl.scrollTrigger
      const wrap = wrapRef.current
      if (startAtBanner && st && wrap && !startedAtBanner.current) {
        startedAtBanner.current = true
        // Lúc này ScrollTrigger có thể chưa đo xong (end = 0) → tự tính: đáy khối intro chạm đáy màn hình
        const end = Math.round(wrap.getBoundingClientRect().top + window.scrollY + wrap.offsetHeight - window.innerHeight)
        introEnd.current = end
        window.scrollTo(0, end)
        setInitialScroll(locationKey, end)
        ScrollTrigger.refresh()
        st.getTween()?.progress(1)
        tl.progress(1)
      }

      // Bàn phím / trình đọc màn hình đi vào phần chưa hiện → cuộn qua intro để nó hiện ra
      const onFocusIn = (e: FocusEvent) => {
        if (!html.hasAttribute('data-intro')) return
        const target = e.target as Element
        // Logo header cũng ẩn trong intro khi có lớp hạt
        if (target.closest('[data-header-item], [data-hero-item], [data-brand-logo]')) scrollToY(introEnd.current)
      }
      document.addEventListener('focusin', onFocusIn)

      return () => {
        document.removeEventListener('focusin', onFocusIn)
        html.removeAttribute('data-intro')
        if (particles) logo.style.opacity = ''
      }
    },
    // Đổi vai trò ngay trên trang chủ (đăng nhập/đăng xuất) → chữ hero được render lại thành
    // phần tử mới chưa bị giấu; dựng lại timeline để chúng cũng ẩn trong intro như lúc tải trang
    { scope: wrapRef, dependencies: [reduced, audience, particlesFailed], revertOnUpdate: true },
  )

  // Intro là MỘT khối: lướt nhẹ xuống là trôi một mạch tới hero, lướt lên từ hero là
  // trôi một mạch về logo — không bao giờ dừng lửng giữa chừng. Hiệu ứng vẫn chạy
  // theo vị trí cuộn như cũ, chỉ là vị trí cuộn được đưa trọn tới đích.
  useEffect(() => {
    if (reduced) return

    let animating = false
    let soft = false // đang trôi từ dưới lên vào hero (không khóa, lướt tiếp được)
    let glideTarget = 0
    let lastWheel = 0
    let swallowGesture = false // bỏ phần quán tính trackpad còn lại sau khi đã nhảy
    let lastY = window.scrollY
    let dir: 1 | -1 = 1
    let idle = 0

    const glide = (target: number, fromBelow = false) => {
      const lenis = getSmoothScroll()
      if (!lenis) {
        window.scrollTo({ top: target, behavior: 'smooth' })
        return
      }
      animating = true
      soft = fromBelow
      glideTarget = target
      lenis.scrollTo(target, {
        duration: fromBelow ? FROM_BELOW_GLIDE : INTRO_GLIDE,
        easing: fromBelow ? fromBelowEase : introEase,
        lock: !fromBelow,
        force: true,
        onComplete: () => {
          animating = false
          soft = false
          // Font tải xong giữa chừng làm ScrollTrigger đo lại → mốc hero xê dịch vài chục px.
          // Chỉnh cho khớp, nếu không lần lướt lên kế tiếp chỉ nhích nhẹ thay vì về logo.
          const end = introEnd.current
          if (target > 0 && end && Math.abs(window.scrollY - end) > 2) lenis.scrollTo(end, { immediate: true, force: true })
        },
      })
    }

    const onWheel = (e: WheelEvent) => {
      const end = introEnd.current
      if (!end || e.ctrlKey || document.body.style.overflow === 'hidden') return
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return

      const now = performance.now()
      const newGesture = now - lastWheel > GESTURE_GAP_MS
      lastWheel = now
      if (newGesture) swallowGesture = false

      const y = window.scrollY
      const lenis = getSmoothScroll()
      const next = (lenis?.targetScroll ?? y) + e.deltaY
      // Xuống trong intro / lên khi đang ở hero hoặc trong intro / lên từ dưới mà sắp lọt vào intro
      const down = e.deltaY > 0 && y < end - 2
      const up = e.deltaY < 0 && y <= end + 2 && y > 2
      const enteringFromBelow = e.deltaY < 0 && y > end + 2 && next < end

      if (animating || swallowGesture || down || up || enteringFromBelow) {
        e.preventDefault()
        e.stopImmediatePropagation() // chặn trước Lenis (listener capture trên window)
      } else return

      if (animating && soft && newGesture) {
        // Đang trôi từ dưới lên vào hero mà lướt thêm một cú: lên → đi luôn về logo;
        // xuống → thôi trôi, trả lại cho cuộn thường (không bắt chờ hết lượt)
        if (e.deltaY < 0) {
          glide(0)
          swallowGesture = true
        } else {
          animating = false
          soft = false
          getSmoothScroll()?.scrollTo(window.scrollY, { immediate: true, force: true })
        }
        return
      }
      if (animating) {
        // Lướt NGƯỢC chiều giữa lúc đang trôi → đổi hướng ngay, không bắt chờ hết lượt
        const goingDown = glideTarget > window.scrollY
        if (newGesture && e.deltaY > 0 !== goingDown && y < end + 2) glide(goingDown ? 0 : end)
        return
      }
      if (swallowGesture) return

      if (enteringFromBelow) {
        // Từ dưới lướt lên: về nhanh tới hero, KHÔNG nuốt phần lướt còn lại — lướt tiếp
        // thì đi luôn lên logo. (Trước đây trôi 2,4s và bỏ mọi cú lăn → chuột như bị đơ.)
        glide(end, true)
        return
      }
      swallowGesture = true
      glide(down ? end : 0)
    }

    // Lưới an toàn cho cảm ứng, phím mũi tên, kéo thanh cuộn: dừng giữa intro → đi nốt
    const onScroll = () => {
      const y = window.scrollY
      if (y !== lastY) dir = y > lastY ? 1 : -1
      lastY = y
      window.clearTimeout(idle)
      idle = window.setTimeout(() => {
        const end = introEnd.current
        const cur = window.scrollY
        if (animating || !end || cur <= 2 || cur >= end - 2) return
        glide(dir > 0 ? end : 0)
      }, 160)
    }

    window.addEventListener('wheel', onWheel, { passive: false, capture: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('wheel', onWheel, { capture: true })
      window.removeEventListener('scroll', onScroll)
      window.clearTimeout(idle)
    }
  }, [reduced])

  return (
    <section
      ref={wrapRef}
      // Banner, Việc gấp và con phố cùng một khối than chì (không đổi sắc giữa chừng); sang ngà ở FeatureBlocksSection.
      // Giảm chuyển động cũng dùng than chì để thứ tự màu giống nhau (khối hero có nền ảnh tối riêng nên vẫn đọc được).
      data-theme="charcoal"
      aria-label="Tìm việc"
      // useHomeHeader: còn thấy khối này thì header chỉ có logo + nút menu
      data-home-hero
      className={reduced ? 'relative' : 'relative h-[200svh]'}
    >
      <div className="sticky top-0 min-h-[100svh] flex flex-col justify-center overflow-clip">
        {!reduced && (
          <div data-hero-canvas aria-hidden className="absolute inset-0 -z-10 pointer-events-none">
            <Suspense fallback={null}>
              <HeroCanvas />
            </Suspense>
          </div>
        )}

        {/* Hero: ảnh tràn toàn màn hình (sát mép, nằm dưới header), chữ ngà căn giữa.
            Màu trong khối này cố định (wm-*) vì nền là ảnh tối, không theo theme trang. */}
        {/* data-hero-stage: khối lùi vào trong khi phần 2 che lên (không dùng data-hero-item
            vì transform của các phần đó thuộc timeline intro) */}
        <div data-hero-stage className="relative w-full">
          <div
            data-hero-item
            className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-wm-charcoal"
          >
            <img
              src={photoUrl(homeMedia.hero.id, 1400)}
              srcSet={photoSrcSet(homeMedia.hero.id)}
              sizes="100vw"
              alt={homeMedia.hero.alt}
              width={1400}
              height={900}
              className="absolute inset-0 h-full w-full object-cover"
            />
            {/* Lớp tối phủ ảnh để chữ ngà luôn đọc được */}
            <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-wm-charcoal/60 via-wm-charcoal/65 to-wm-charcoal/85" />

            <div className="relative shell flex w-full flex-col items-center pt-24 pb-16 text-center text-wm-ivory">
              <p data-hero-item className="eyebrow text-wm-mist">
                <span className="w-8 h-px bg-wm-mist" />
                Nền tảng việc làm linh hoạt
              </p>

              <div data-hero-title>
                <MaskedWords
                  as="h1"
                  text={copy.title}
                  className="font-display text-display-md font-semibold mt-4 md:mt-8 mx-auto max-w-[18ch] text-wm-ivory"
                />
              </div>

              {/* Điện thoại: bỏ đoạn dẫn để cả khối vừa một màn hình */}
              <p data-hero-item className="hidden sm:block mx-auto mt-6 md:mt-8 max-w-xl text-base md:text-lg text-wm-mist leading-relaxed">
                {copy.lead}
              </p>

              {copy.search && (
              <>
              <div data-hero-item className="mx-auto mt-6 md:mt-10 w-full max-w-3xl text-left">
                {/* Viên thuốc kính trên ảnh tối; focus hiện bằng vòng sáng quanh cả form */}
                <form
                  onSubmit={handleSearch}
                  role="search"
                  className="flex flex-col sm:flex-row sm:items-center p-1.5 rounded-card sm:rounded-full
                             border border-wm-ivory/40 bg-wm-ivory/10 backdrop-blur-xl backdrop-saturate-150
                             shadow-[inset_0_1px_0_color-mix(in_srgb,var(--wm-ivory)_45%,transparent),inset_0_0_18px_color-mix(in_srgb,var(--wm-ivory)_8%,transparent),0_8px_24px_-8px_color-mix(in_srgb,var(--wm-charcoal)_45%,transparent)]
                             transition-[transform,background-color,border-color,box-shadow] duration-300
                             hover:bg-wm-ivory/20 hover:border-wm-ivory/60 hover:-translate-y-0.5 motion-reduce:transform-none
                             hover:shadow-[inset_0_1px_0_color-mix(in_srgb,var(--wm-ivory)_60%,transparent),inset_0_0_18px_color-mix(in_srgb,var(--wm-ivory)_12%,transparent),0_14px_32px_-8px_color-mix(in_srgb,var(--wm-charcoal)_60%,transparent)]
                             focus-within:border-wm-ivory/80 focus-within:ring-2 focus-within:ring-wm-ivory/50"
                >
                  <label className="flex-1 flex items-center gap-3 px-5 py-3.5 min-h-11">
                    <Search className="w-4 h-4 text-wm-ivory shrink-0" aria-hidden="true" />
                    <span className="sr-only">Từ khóa tìm việc</span>
                    <input
                      ref={keywordRef}
                      type="text"
                      placeholder="Vị trí, kỹ năng, ngành nghề…"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      className="flex-1 min-w-0 bg-transparent !outline-none text-sm text-wm-ivory placeholder:text-wm-ivory/80"
                    />
                  </label>

                  <label className="flex items-center gap-3 px-5 py-3.5 min-h-11 sm:w-56 border-t border-wm-ivory/25 sm:border-t-0 sm:border-l">
                    <MapPin className="w-4 h-4 text-wm-ivory shrink-0" aria-hidden="true" />
                    <span className="sr-only">Địa điểm</span>
                    <input
                      type="text"
                      placeholder="Địa điểm…"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="flex-1 w-full min-w-0 bg-transparent !outline-none text-sm text-wm-ivory placeholder:text-wm-ivory/80"
                    />
                  </label>

                  <button
                    type="submit"
                    className="group mt-1.5 sm:mt-0 sm:ml-1.5 min-h-11 rounded-full bg-wm-ivory text-wm-charcoal font-medium text-sm px-8 py-3
                               hover:bg-wm-mist transition-colors duration-300
                               focus-visible:!outline-wm-charcoal focus-visible:!outline-offset-[-4px]"
                  >
                    <RollText>Tìm việc</RollText>
                  </button>
                </form>
              </div>

              <ul data-hero-item className="flex flex-wrap justify-center gap-2 mt-4" aria-label="Ngành nghề phổ biến">
                {heroTags.map((tag) => (
                  <li key={tag}>
                    <Link
                      to={`/viec-lam?keyword=${encodeURIComponent(tag)}`}
                      className="flex min-h-9 items-center text-xs text-wm-ivory border border-wm-mist rounded-full px-3 py-1.5
                                 hover:bg-wm-ivory hover:text-wm-charcoal transition-colors duration-300"
                    >
                      {tag}
                    </Link>
                  </li>
                ))}
              </ul>
              </>
              )}

              {/* Lối đi theo vai trò: bên dưới ô tìm việc, hoặc thay cho nó */}
              <div data-hero-item className={copy.search ? 'flex flex-wrap justify-center gap-3 mt-5 md:mt-6' : 'flex flex-wrap justify-center gap-3 mt-8 md:mt-12'}>
                {copy.actions.map((a, i) => (
                  <Magnetic key={a.href}>
                  <Link
                    to={a.href}
                    className={
                      i === 0 && !copy.search
                        ? 'group inline-flex min-h-11 items-center gap-2 bg-wm-ivory text-wm-charcoal font-medium text-sm px-8 py-4 rounded-full transition-opacity duration-300 hover:opacity-90'
                        : 'group inline-flex min-h-11 items-center gap-2 border border-wm-mist text-wm-ivory font-medium text-sm px-6 py-3 rounded-full hover:bg-wm-ivory hover:text-wm-charcoal transition-colors duration-300'
                    }
                  >
                    <RollText>{a.label}</RollText>
                    <ArrowUpRight className="w-4 h-4" aria-hidden />
                  </Link>
                  </Magnetic>
                ))}
              </div>
            </div>
          </div>
          {/* Lớp tối dần khi banner lùi ra sau phần 2 (opacity do GSAP điều khiển) */}
          <div data-hero-dim aria-hidden className="pointer-events-none absolute inset-0 bg-wm-charcoal opacity-0" />
        </div>

        {/* Gợi ý cuộn — chỉ có ở trạng thái intro, mờ đi ngay khi bắt đầu cuộn */}
        {!reduced && (
          <p
            data-scroll-hint
            aria-hidden
            className="absolute bottom-8 inset-x-0 flex flex-col items-center gap-2
                       text-[11px] uppercase tracking-[0.2em] text-page-muted"
          >
            Cuộn để bắt đầu
            <ArrowDown className="w-3.5 h-3.5" />
          </p>
        )}
      </div>
    </section>
  )
})

export default IntroHero
