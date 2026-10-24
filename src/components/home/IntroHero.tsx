import { forwardRef, lazy, Suspense, useImperativeHandle, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, MapPin, ArrowDown, ArrowUpRight } from 'lucide-react'

import { gsap, useGSAP } from '@utils/gsap'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { scrollToY } from '@hooks/useSmoothScroll'
import MaskedWords from '@components/motion/MaskedWords'
import RollText from '@components/motion/RollText'
import { useAuthStore } from '@context/authStore'
import { heroCopy, heroTags } from './content'

// Tách riêng để shader không nằm trong bundle chính
const HeroCanvas = lazy(() => import('@components/motion/HeroCanvas'))

export type IntroHeroHandle = {
  /** Cuộn tới chỗ thanh tìm kiếm đã hiện đủ rồi đặt con trỏ vào ô từ khóa. */
  focusSearch: () => void
}

/** Logo ở trạng thái intro rộng chừng này phần chiều ngang màn hình. */
const INTRO_LOGO_WIDTH = { ratio: 0.5, max: 620, mobileRatio: 0.62 }

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
  const wrapRef = useRef<HTMLElement>(null)
  const keywordRef = useRef<HTMLInputElement>(null)
  // Vị trí cuộn mà intro kết thúc — để focus/CTA nhảy thẳng tới
  const introEnd = useRef(0)

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
      const logo = document.querySelector<HTMLElement>('[data-brand-logo]')
      const headerItems = Array.from(document.querySelectorAll<HTMLElement>('[data-header-item]'))
      const headerBg = document.querySelector<HTMLElement>('[data-header-bg]')
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
      const introScale = () => {
        const vw = window.innerWidth
        const ratio = vw < 640 ? INTRO_LOGO_WIDTH.mobileRatio : INTRO_LOGO_WIDTH.ratio
        return Math.min(vw * ratio, INTRO_LOGO_WIDTH.max) / naturalRect().width
      }

      // Trạng thái ẩn ban đầu đặt bằng gsap.set, ngoài timeline. Nếu dùng fromTo bắt
      // đầu giữa timeline, mỗi lần ScrollTrigger refresh (đo lại layout) sẽ trả các
      // tween chưa tới lượt về trạng thái gốc → nav và hero hiện sẵn ngay ở intro.
      gsap.set(headerItems, { opacity: 0, y: -12 })
      gsap.set(headerBg, { opacity: 0 })
      gsap.set('[data-hero-item]', { opacity: 0, y: 32 })
      gsap.set('[data-hero-title] [data-word]', { yPercent: 120, opacity: 0 })

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

      // 0 → 0.45: logo từ giữa màn hình về header.
      // force3D: false — giữ transform 2D để trình duyệt vẽ lại chữ sắc nét ở
      // mỗi tỉ lệ; transform 3D sẽ phóng to một ảnh chụp cỡ nhỏ → logo bị mờ.
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
        .to('[data-scroll-hint]', { autoAlpha: 0, duration: 0.08 }, 0)
        // Kết cấu WebGL chỉ thuộc về intro than chì — mờ đi trong lúc nền chuyển sang ngà
        .to('[data-hero-canvas]', { opacity: 0, duration: 0.32 }, 0.08)
        // 0.22 → 0.5: header hiện dần từng cụm
        .to(headerItems, { opacity: 1, y: 0, duration: 0.18, stagger: 0.05, ease: 'power2.out' }, 0.22)
        .to(headerBg, { opacity: 1, duration: 0.2 }, 0.28)
        // 0.38 → 0.9: nội dung hero
        .to(
          '[data-hero-title] [data-word]',
          { yPercent: 0, opacity: 1, duration: 0.3, stagger: 0.025, ease: 'power3.out' },
          0.38,
        )
        .to('[data-hero-item]', { opacity: 1, y: 0, duration: 0.3, stagger: 0.06, ease: 'power2.out' }, 0.42)
        // Giữ một nhịp cho người dùng đọc trước khi lớp sticky nhả ra
        .to({}, { duration: 0.1 })

      // onUpdate chỉ chạy khi cuộn — lúc vừa mở trang phải tự đặt trạng thái intro
      if ((tl.scrollTrigger?.progress ?? 0) < 0.45) html.setAttribute('data-intro', '')

      // Bàn phím / trình đọc màn hình đi vào phần chưa hiện → cuộn qua intro để nó hiện ra
      const onFocusIn = (e: FocusEvent) => {
        if (!html.hasAttribute('data-intro')) return
        const target = e.target as Element
        if (target.closest('[data-header-item], [data-hero-item]')) scrollToY(introEnd.current)
      }
      document.addEventListener('focusin', onFocusIn)

      return () => {
        document.removeEventListener('focusin', onFocusIn)
        html.removeAttribute('data-intro')
      }
    },
    // Đổi vai trò ngay trên trang chủ (đăng nhập/đăng xuất) → chữ hero được render lại thành
    // phần tử mới chưa bị giấu; dựng lại timeline để chúng cũng ẩn trong intro như lúc tải trang
    { scope: wrapRef, dependencies: [reduced, audience], revertOnUpdate: true },
  )

  return (
    <section
      ref={wrapRef}
      // Intro nền than chì, hero nền ngà. Khi tắt chuyển động thì không có intro → ngà luôn.
      data-theme={reduced ? 'ivory' : 'charcoal'}
      aria-label="Tìm việc"
      className={reduced ? 'relative' : 'relative h-[200svh]'}
    >
      {/* Mốc đổi nền than chì → ngà, chạy cùng lúc logo bay về header
          (cuộn được 10% → 50% chiều cao màn hình). Xem useSectionThemes. */}
      {!reduced && (
        <div
          aria-hidden
          data-theme="ivory"
          data-theme-start="top -10%"
          data-theme-end="top -50%"
          className="absolute inset-x-0 top-0 h-px"
        />
      )}

      <div className="sticky top-0 min-h-[100svh] flex flex-col justify-center overflow-clip">
        {!reduced && (
          <div data-hero-canvas aria-hidden className="absolute inset-0 -z-10 pointer-events-none">
            <Suspense fallback={null}>
              <HeroCanvas />
            </Suspense>
          </div>
        )}

        <div className="shell w-full pt-24 pb-16">
          <p data-hero-item className="eyebrow text-page-muted">
            <span className="w-8 h-px bg-page-line" />
            Nền tảng việc làm linh hoạt
          </p>

          <div data-hero-title>
            <MaskedWords
              as="h1"
              text={copy.title}
              className="font-display text-display-lg font-semibold mt-6 md:mt-8 max-w-[18ch] text-page-fg"
            />
          </div>

          <p data-hero-item className="mt-6 md:mt-8 max-w-xl text-base md:text-lg text-page-muted leading-relaxed">
            {copy.lead}
          </p>

          {copy.search && (
          <>
          <div data-hero-item className="mt-8 md:mt-12 max-w-3xl">
            <form
              onSubmit={handleSearch}
              role="search"
              className="flex flex-col sm:flex-row gap-px bg-page-edge rounded-card overflow-hidden border border-page-edge"
            >
              <label className="flex-1 flex items-center gap-3 bg-page-surface px-5 py-4 focus-within:bg-page-bg focus-within:ring-2 focus-within:ring-inset focus-within:ring-page-fg transition-colors">
                <Search className="w-4 h-4 text-page-muted shrink-0" />
                <span className="sr-only">Từ khóa tìm việc</span>
                <input
                  ref={keywordRef}
                  type="text"
                  placeholder="Vị trí, kỹ năng, ngành nghề…"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-page-fg placeholder:text-page-muted"
                />
              </label>

              <label className="flex items-center gap-3 bg-page-surface px-5 py-4 sm:w-56 focus-within:bg-page-bg focus-within:ring-2 focus-within:ring-inset focus-within:ring-page-fg transition-colors">
                <MapPin className="w-4 h-4 text-page-muted shrink-0" />
                <span className="sr-only">Địa điểm</span>
                <input
                  type="text"
                  placeholder="Địa điểm…"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="flex-1 w-full bg-transparent outline-none text-sm text-page-fg placeholder:text-page-muted"
                />
              </label>

              <button
                type="submit"
                className="group bg-page-fg text-page-bg font-medium text-sm px-8 py-4
                           hover:bg-wm-graphite transition-colors duration-300
                           outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-page-bg"
              >
                <RollText>Tìm việc</RollText>
              </button>
            </form>
          </div>

          <ul data-hero-item className="flex flex-wrap gap-2 mt-4" aria-label="Ngành nghề phổ biến">
            {heroTags.map((tag) => (
              <li key={tag}>
                <Link
                  to={`/viec-lam?keyword=${encodeURIComponent(tag)}`}
                  className="block text-xs text-page-muted border border-page-line rounded-full px-3 py-1.5
                             hover:text-page-fg hover:border-page-fg transition-colors duration-300"
                >
                  {tag}
                </Link>
              </li>
            ))}
          </ul>
          </>
          )}

          {/* Lối đi theo vai trò: bên dưới ô tìm việc, hoặc thay cho nó */}
          <div data-hero-item className={copy.search ? 'flex flex-wrap gap-3 mt-6' : 'flex flex-wrap gap-3 mt-8 md:mt-12'}>
            {copy.actions.map((a, i) => (
              <Link
                key={a.href}
                to={a.href}
                className={
                  i === 0 && !copy.search
                    ? 'group inline-flex items-center gap-2 bg-page-fg text-page-bg font-medium text-sm px-8 py-4 rounded-full transition-opacity duration-300 hover:opacity-90'
                    : 'group inline-flex items-center gap-2 border border-page-line text-page-fg font-medium text-sm px-6 py-3 rounded-full hover:border-page-fg transition-colors duration-300'
                }
              >
                <RollText>{a.label}</RollText>
                <ArrowUpRight className="w-4 h-4" aria-hidden />
              </Link>
            ))}
          </div>
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
