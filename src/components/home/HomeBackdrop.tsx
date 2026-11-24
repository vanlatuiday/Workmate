import type { CSSProperties, RefObject } from 'react'
import { gsap, useGSAP } from '@utils/gsap'
import { HOME_BG_PARALLAX } from './homeBackground'

/**
 * Ảnh nền + lớp "thở": bản sao sáng hơn của chính ảnh, chỉ lộ ở cột giữa (nơi có tia sáng xanh ngọc),
 * opacity lên xuống chậm (CSS .home-bg-glow, index.css). Cùng ảnh, cùng vị trí nên luôn khớp tia sáng.
 */
export function HomeBgLayers({ style }: { style: CSSProperties }) {
  return (
    <>
      <div className="absolute inset-0" style={style} />
      <div className="home-bg-glow absolute inset-0" style={style} />
    </>
  )
}

/**
 * Chuyển động nhẹ của nền phần dưới hero (chủ dự án 2026-11-19: "giữ nhưng nhẹ, trong từng khối"):
 * - Lớp sao ([data-home-stars]) trôi chậm hơn nội dung (HOME_BG_PARALLAX). Lớp sao lặp đều nên kéo dài
 *   trên/dưới để không lộ mép.
 * - Quầng cam sau phần ⑥ ([data-home-orange]) trôi nhẹ trong phạm vi phần đó, luôn nằm sau khối của nó.
 * - Tia sáng lượn sóng ([data-home-wave]) trôi chậm nhẹ. Chỉ transform; tắt chuyển động → đứng yên.
 */
export function useHomeBgParallax(scope: RefObject<HTMLElement>, enabled: boolean) {
  useGSAP(
    () => {
      if (!enabled) return
      const root = scope.current
      const stars = root?.querySelector<HTMLElement>('[data-home-stars]')
      const orange = root?.querySelector<HTMLElement>('[data-home-orange]')
      const wave = root?.querySelector<HTMLElement>('[data-home-wave]')
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        if (stars?.parentElement) {
          gsap.fromTo(
            stars,
            { y: () => -stars.parentElement!.offsetHeight * HOME_BG_PARALLAX * 0.5 },
            {
              y: () => stars.parentElement!.offsetHeight * HOME_BG_PARALLAX * 0.5,
              ease: 'none',
              scrollTrigger: { trigger: stars.parentElement, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
            },
          )
        }
        // Tia sáng lượn sóng trôi chậm → các khúc phình/thắt trôi qua chậm hơn nội dung, tạo chiều sâu
        if (wave?.parentElement) {
          gsap.fromTo(
            wave,
            { y: () => -wave.parentElement!.offsetHeight * 0.08 },
            {
              y: () => wave.parentElement!.offsetHeight * 0.08,
              ease: 'none',
              scrollTrigger: { trigger: wave.parentElement, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
            },
          )
        }
        if (orange) {
          gsap.fromTo(
            orange,
            { yPercent: -10 },
            { yPercent: 10, ease: 'none', scrollTrigger: { trigger: orange.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } },
          )
        }
      })
      return () => mm.revert()
    },
    { scope, dependencies: [enabled], revertOnUpdate: true },
  )
}
