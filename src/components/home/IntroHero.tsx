import { Fragment, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Link, useLocation, useNavigationType } from 'react-router-dom'
import { ArrowDown, ArrowUpRight, ChevronDown, Flame, Sparkles } from 'lucide-react'

import { gsap, ScrollTrigger, useGSAP } from '@utils/gsap'
import { setInitialScroll } from '@components/common/RouteScroll'
import { useHomeReducedMotion } from '@hooks/useHomeReducedMotion'
import { getSmoothScroll, scrollToY } from '@hooks/useSmoothScroll'
import HeroFeatureCards from './HeroFeatureCards'
import HeroSideArt, { HeroSparkle } from './HeroSideArt'
import HeroSkyline, { HeroSkyStreaks } from './HeroSkyline'
import HomeSearchForm from './HomeSearchForm'
import RollText from '@components/motion/RollText'
import Magnetic from '@components/motion/Magnetic'
import { useParticlesFailed } from '@components/motion/particleStatus'
import { useAuthStore } from '@context/authStore'
import { heroCopy, heroTags } from './content'
import { HOME_BG_FALLBACK, HOME_GLASS_DARK, heroBgStyle } from './homeBackground'
import { HomeBgLayers } from './HomeBackdrop'

type IntroHeroHandle = {
  /** Cuộn tới chỗ thanh tìm kiếm đã hiện đủ rồi đặt con trỏ vào ô từ khóa. */
  focusSearch: () => void
}

/** Logo ở trạng thái intro rộng chừng này phần chiều ngang màn hình. */
const INTRO_LOGO_WIDTH = { ratio: 0.5, max: 620, mobileRatio: 0.62 }

/** Bề rộng (px) của logo ở trạng thái intro với màn hình rộng `vw` — dùng chung với lớp hạt. */
function introLogoWidth(vw: number) {
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
  const reduced = useHomeReducedMotion()
  // Lớp hạt hỏng → dựng lại timeline với tween logo bay (logo header không bị ẩn)
  const particlesFailed = useParticlesFailed()
  const wrapRef = useRef<HTMLElement>(null)
  const keywordRef = useRef<HTMLInputElement>(null)
  // Vị trí cuộn mà intro kết thúc — để focus/CTA nhảy thẳng tới
  const introEnd = useRef(0)
  // Quyết định một lần lúc mount: mở ở banner thay vì logo? (Back/Forward thì để RouteScroll trả về chỗ cũ)
  const navigationType = useNavigationType()
  const [locationKey] = useState(useLocation().key)
  // Đã đăng nhập: luôn mở thẳng hero (kể cả tải lại trang). Khách: chỉ bỏ màn mở đầu khi đã xem trong phiên này và không phải quay lại/tải lại
  const [startAtBanner] = useState(() => !!useAuthStore.getState().user || (introSeen() && navigationType !== 'POP'))
  // Chỉ nhảy lần đầu dựng timeline (đổi vai trò dựng lại timeline thì không nhảy nữa)
  const startedAtBanner = useRef(false)
  useEffect(() => {
    markIntroSeen()
    return () => {
      bannerY = 0
    }
  }, [])

  // Lời mở đầu đổi theo vai trò (khách: trung lập)
  const audience = useAuthStore((s) => s.user?.role) ?? 'guest'
  const copy = heroCopy[audience]

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
      gsap.set('[data-intro-night]', { opacity: 1 })
      gsap.set('[data-intro-dome]', { scale: 1, transformOrigin: '50% 100%' })
      gsap.set('[data-hero-orange]', { opacity: 0, scale: 0.7, yPercent: 14, transformOrigin: '50% 100%' })
      gsap.set('[data-hero-card]', { opacity: 0, y: 56 })

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
        // Nền: vòm sáng nở ra, lớp phủ xanh mờ dần lộ hero (cam trong ảnh hiện muộn nhờ ease), rồi cụm cam dâng lên
        .to('[data-intro-dome]', { scale: 1.35, duration: 0.42, ease: 'power1.inOut' }, 0.04)
        .to('[data-intro-night]', { opacity: 0, duration: 0.4, ease: 'power2.in' }, 0.06)
        .to('[data-hero-orange]', { opacity: 1, scale: 1, yPercent: 0, duration: 0.34, ease: 'power2.out' }, 0.3)
        // 0.38 → 0.9: nội dung hero
        .to(
          '[data-hero-title] [data-word]',
          { yPercent: 0, opacity: 1, duration: 0.3, stagger: 0.025, ease: 'power3.out' },
          0.38,
        )
        .to('[data-hero-item]', { opacity: 1, y: 0, duration: 0.3, stagger: 0.06, ease: 'power2.out' }, 0.42)
        // 3 thẻ tính năng nổi lên lần lượt, sau cùng
        .to('[data-hero-card]', { opacity: 1, y: 0, duration: 0.24, stagger: 0.08, ease: 'power2.out' }, 0.62)
        // Giữ một nhịp cho người dùng đọc trước khi lớp sticky nhả ra
        .to({}, { duration: 0.1 })

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
        // Mở thẳng ở banner: timeline đã ở cuối nên thẻ không có lượt hiện → cho nổi lên lần lượt một lần
        gsap.fromTo('[data-hero-card]', { opacity: 0, y: 56 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.14, ease: 'power3.out', delay: 0.35 })
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

  // Các lớp trôi nhẹ theo chuột (chỉ chuột/trackpad, không giảm chuyển động). Chỉ dùng transform
  // trên phần tử có data-depth — không đụng tới phần tử mà timeline intro đang điều khiển.
  useGSAP(
    (_, contextSafe) => {
      const hero = wrapRef.current
      if (reduced || !hero || !contextSafe) return
      const mm = gsap.matchMedia()
      mm.add('(pointer: fine) and (prefers-reduced-motion: no-preference)', () => {
        const layers = gsap.utils.toArray<HTMLElement>('[data-depth]').map((el) => ({
          depth: Number(el.dataset.depth) || 0,
          x: gsap.quickTo(el, 'x', { duration: 0.8, ease: 'power3.out' }),
          y: gsap.quickTo(el, 'y', { duration: 0.8, ease: 'power3.out' }),
        }))
        const move = contextSafe((e: PointerEvent) => {
          const nx = (e.clientX / window.innerWidth - 0.5) * 2
          const ny = (e.clientY / window.innerHeight - 0.5) * 2
          layers.forEach((l) => {
            l.x(nx * l.depth)
            l.y(ny * l.depth)
          })
        })
        const reset = contextSafe(() => layers.forEach((l) => { l.x(0); l.y(0) }))
        hero.addEventListener('pointermove', move)
        hero.addEventListener('pointerleave', reset)
        return () => {
          hero.removeEventListener('pointermove', move)
          hero.removeEventListener('pointerleave', reset)
        }
      })
      return () => mm.revert()
    },
    { scope: wrapRef, dependencies: [audience, reduced], revertOnUpdate: true },
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

  // Nút chuột cuộn: trôi mượt tới section liền sau hero (Lenis nếu đang chạy, không thì cuộn gốc; giảm chuyển động → nhảy thẳng)
  const scrollToNext = () => {
    const next = wrapRef.current?.nextElementSibling
    if (!(next instanceof HTMLElement)) return
    const lenis = getSmoothScroll()
    if (reduced) next.scrollIntoView({ behavior: 'auto' })
    else if (lenis) lenis.scrollTo(next, { duration: 1.2, force: true })
    else next.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section
      ref={wrapRef}
      // Banner, Việc gấp và con phố cùng một khối than chì (không đổi sắc giữa chừng); sang ngà ở FeatureBlocksSection.
      // Giảm chuyển động cũng dùng than chì để thứ tự màu giống nhau (khối hero có nền ảnh tối riêng nên vẫn đọc được).
      data-theme="night"
      aria-label="Tìm việc"
      // useHomeHeader: còn thấy khối này thì header chỉ có logo + nút menu
      data-home-hero
      className={reduced ? 'relative' : 'relative h-[200svh]'}
    >
      <div className="sticky top-0 min-h-[100svh] flex flex-col justify-center overflow-clip">
        {/* Nền xanh (references/backgr.png): đứng yên sau cả màn mở đầu lẫn banner — intro hiện logo
            trên nền này, lướt xuống thì logo tan và nội dung hero hiện dần (xem homeBackground.ts). */}
        <div data-home-bg="hero" aria-hidden className="pointer-events-none absolute inset-0 -z-20">
          <HomeBgLayers style={heroBgStyle} />
          {/* Màn mở đầu: phủ kín ảnh hero bằng nền xanh tối có vòm sáng xanh nhẹ ôm phần dưới màn hình (không cam).
              Lướt xuống: vòm nở ra, lớp phủ mờ dần để lộ hero, cuối cùng cụm cam mới dâng lên (timeline intro).
              Mặc định ẩn (giảm chuyển động / mở thẳng ở banner). */}
          {/* Quầng cam đáy hero, rộng hơn cam sẵn trong ảnh; hiện sau cùng khi vào hero */}
          <div data-hero-orange className="home-hero-orange absolute inset-0" />
          <div data-intro-night className="home-intro-night absolute inset-0 opacity-0">
            <div data-intro-dome className="home-intro-dome absolute inset-x-0 bottom-0 h-[75%]" />
          </div>
        </div>

        {/* data-hero-stage: khung chứa banner (không dùng data-hero-item
            vì transform của các phần đó thuộc timeline intro) */}
        <div data-hero-stage className="relative w-full">
          <div
            data-hero-item
            className="relative flex min-h-[100svh] flex-col items-center overflow-hidden lg:justify-center"
          >
            {/* Quầng xanh đậm rất nhẹ sau chữ: vệt sáng xanh ngọc ở giữa nền làm chữ trắng nhạt đi */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background: `radial-gradient(ellipse 52% 46% at 50% 54%, color-mix(in srgb, ${HOME_BG_FALLBACK} 42%, transparent) 0%, transparent 100%)`,
              }}
            />

            {/* Quầng sáng cyan/ngà sau tiêu đề — lớp sâu nhất, trôi theo chuột nhiều nhất */}
            <div data-depth="18" aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div
                className="h-[46%] w-[min(88%,980px)] rounded-full opacity-60 blur-3xl"
                style={{
                  background:
                    'radial-gradient(ellipse at center, color-mix(in srgb, var(--wm-cyan) 55%, transparent) 0%, color-mix(in srgb, var(--wm-ivory) 22%, transparent) 45%, transparent 75%)',
                  transform: 'translateY(-24%)',
                }}
              />
            </div>

            {/* Vệt sáng cong trên trời + dải thành phố đáy hero (sau chữ, thẻ và nút chuột) */}
            <HeroSkyStreaks />
            <HeroSkyline />

            {/* Ảnh 3D hai bên (trống cho tới khi có ảnh — xem heroArt trong content.ts) */}
            <HeroSideArt />

            {/* Khối chữ chiếm phần còn lại phía trên hàng thẻ, căn giữa */}
            <div className="relative shell flex w-full flex-1 flex-col items-center justify-center pt-24 lg:flex-none lg:pt-4 pb-16 lg:pb-0 text-center text-wm-ivory">
              <p
                data-hero-item
                className="inline-flex items-center gap-2 rounded-full border border-wm-ivory/20 bg-wm-ivory/10 px-4 py-2 text-sm font-medium text-wm-ivory backdrop-blur-md"
              >
                <Sparkles className="h-4 w-4 text-wm-cyan" aria-hidden />
                Nền tảng việc làm linh hoạt
              </p>

              <div data-hero-title data-depth="10">
               <div className="relative mx-auto w-fit max-w-full">
                {/* Hai sao ở góc tiêu đề (ngoài khung chữ, không đè chữ) */}
                <HeroSparkle size={14} className="-left-7 top-1 hidden md:block" delay={0.4} duration={3.4} />
                <HeroSparkle size={10} tone="cyan" className="-right-8 bottom-[38%] hidden md:block" delay={1.5} duration={2.8} />
                {/* Một h1 duy nhất: câu đầy đủ cho trình đọc màn hình, hai dòng chữ lớn (từng từ có data-word cho intro) ẩn khỏi nó */}
                <h1
                  className="font-display font-semibold mt-4 md:mt-6 mx-auto text-wm-ivory leading-[1.04] tracking-[-0.035em] text-[clamp(2.5rem,min(7.2vw,9.2svh),6.5rem)]"
                  // Không dùng text-shadow: mặt nạ overflow-hidden quanh từng từ cắt bóng thành ô chữ nhật — quầng sáng nằm ở lớp riêng phía sau
                >
                  <span className="sr-only">{copy.title}</span>
                  {copy.titleLines.map((line, li) => {
                    const words = line.split(' ').map((word, i, arr) => (
                      <Fragment key={`${word}-${i}`}>
                        {/* pb/-mb: nới đáy mặt nạ để dấu tiếng Việt không bị cắt; dòng nghiêng chừa thêm bên phải */}
                        <span className={`inline-block overflow-hidden align-bottom pb-[0.12em] -mb-[0.12em]${li === 1 ? ' hero-italic-word' : ''}`}>
                          <span data-word className="inline-block">
                            {word}
                          </span>
                        </span>
                        {i < arr.length - 1 && ' '}
                      </Fragment>
                    ))
                    return li === 1 ? (
                      // Dòng 2: xanh ngọc, nghiêng + nét vẽ tay bên dưới (cùng kiểu StatementSection)
                      <span key={line} aria-hidden className="block">
                        <span className="relative inline-block whitespace-nowrap italic text-wm-cyan">
                          {words}
                          <svg aria-hidden viewBox="0 0 220 12" preserveAspectRatio="none" className="absolute -bottom-[0.14em] left-0 h-[0.12em] min-h-2 w-full text-wm-cyan">
                            <path d="M2 8 C 40 2, 90 10, 140 5 S 200 3, 218 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                          </svg>
                        </span>
                      </span>
                    ) : (
                      <span key={line} aria-hidden className="block">
                        {words}
                      </span>
                    )
                  })}
                </h1>
               </div>
              </div>

              {/* Đoạn dẫn luôn hiện để khách trên màn hẹp cũng hiểu phạm vi và cách ghép việc. */}
              <p data-hero-item className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-wm-ivory/90 sm:text-base md:mt-5 md:text-lg">
                {copy.lead}
              </p>

              {/* Lớp trôi theo chuột (data-depth) bọc ngoài các phần tử intro, không đặt transform lên chúng */}
              <div data-depth="5" className="flex w-full flex-col items-center">
              {copy.search && (
              <>
              <div data-hero-item className="mx-auto mt-6 md:mt-8 w-full max-w-3xl text-left">
                {/* Viên thuốc kính trên ảnh tối; focus hiện bằng vòng sáng quanh cả form */}
                <HomeSearchForm inputRef={keywordRef} />
              </div>

              <div data-hero-item className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <p id="hero-tags-label" className="mr-1 inline-flex items-center gap-1.5 text-sm font-semibold text-wm-ivory">
                  <Flame className="h-4 w-4 text-wm-apricot" aria-hidden />
                  Tìm nhiều:
                </p>
                <ul aria-labelledby="hero-tags-label" className="flex flex-wrap justify-center gap-2">
                  {heroTags.map((tag) => (
                    <li key={tag}>
                      <Link
                        to={`/viec-lam?keyword=${encodeURIComponent(tag)}`}
                        className={`flex min-h-11 items-center text-xs text-wm-ivory border border-wm-ivory/40 ${HOME_GLASS_DARK} rounded-full px-3.5 py-1.5
                                   hover:bg-wm-ivory hover:text-wm-charcoal focus-visible:bg-wm-ivory focus-visible:text-wm-charcoal
                                   active:scale-[0.97] motion-reduce:active:scale-100 transition-[color,background-color,transform] duration-300`}
                      >
                        {tag}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              </>
              )}

              {/* Lối đi theo vai trò: bên dưới ô tìm việc, hoặc thay cho nó */}
              {copy.actions.length > 0 && (
              <div data-hero-item className={copy.search ? 'flex flex-wrap justify-center gap-3 mt-5 md:mt-6' : 'flex flex-wrap justify-center gap-3 mt-8 md:mt-12'}>
                {copy.actions.map((a, i) => (
                  <Magnetic key={a.href}>
                  <Link
                    to={a.href}
                    className={
                      i === 0 && !copy.search
                        ? 'group inline-flex min-h-11 items-center gap-2 bg-accent text-accent-fg font-semibold text-sm px-8 py-4 rounded-full transition-[filter,transform] duration-300 hover:brightness-110 active:scale-[0.97] motion-reduce:active:scale-100'
                        : `home-secondary-action group inline-flex min-h-11 items-center gap-2 border border-wm-ivory/40 ${HOME_GLASS_DARK} text-wm-ivory font-medium text-sm px-6 py-3 rounded-full hover:bg-wm-ivory hover:text-wm-charcoal focus-visible:bg-wm-ivory focus-visible:text-wm-charcoal active:scale-[0.97] motion-reduce:active:scale-100 transition-[color,background-color,transform] duration-300`
                    }
                  >
                    <RollText>{a.label}</RollText>
                    <ArrowUpRight className="w-4 h-4" aria-hidden />
                  </Link>
                  </Magnetic>
                ))}
              </div>
              )}
              </div>
            </div>

            {/* Hàng thẻ tính năng kính: nằm trọn trong hero, cách mép dưới một khoảng. Chỉ từ lg */}
            <div data-depth="-12" className="relative hidden lg:[@media(min-height:820px)]:block w-full mt-11 pb-[72px]">
              <HeroFeatureCards audience={audience} />
            </div>

            {/* Chuột cuộn: cùng điều kiện với hàng thẻ (lg + cao >= 820px) để không đè thẻ; hiện cùng nội dung hero (cha là data-hero-item) */}
            <button
              type="button"
              aria-label="Cuộn xuống mục tiếp theo"
              onClick={scrollToNext}
              className="group absolute bottom-3 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-0.5 rounded-full p-2 text-wm-ivory/80 transition-colors hover:text-wm-ivory focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wm-ivory lg:[@media(min-height:820px)]:flex"
            >
              <span aria-hidden className="relative block h-[34px] w-[22px] rounded-full border-[1.5px] border-wm-ivory/80">
                <span className="hero-mouse-dot absolute left-1/2 top-[7px] block h-1.5 w-[3px] -translate-x-1/2 rounded-full bg-wm-ivory" />
              </span>
              <ChevronDown aria-hidden className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Gợi ý cuộn — chỉ có ở trạng thái intro, mờ đi ngay khi bắt đầu cuộn */}
        {!reduced && (
          <p
            data-scroll-hint
            aria-hidden
            className="absolute bottom-8 inset-x-0 flex flex-col items-center gap-2
                       text-sm text-page-muted"
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
