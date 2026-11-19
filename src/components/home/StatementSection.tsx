import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, MapPin, Sparkles, ArrowRight } from 'lucide-react'

import { gsap, useGSAP } from '@utils/gsap'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { cn } from '@utils/cn'
import { homeSections } from './content'
import { useHomeRole } from './homeData'

const ICONS = { lich: CalendarDays, duong: MapPin, kynang: Sparkles } as const

/**
 * Câu nhấn giữa trang (word-highlight): bên trái là câu, từng từ sáng dần từ mờ → ngà theo tiến trình cuộn
 * (cuộn ngược thì tối lại). Bên phải 3 tiêu chí của câu (lịch rảnh · quãng đường · kỹ năng): mỗi mục sáng lên
 * đúng lúc từ của nó trong câu sáng tới — cùng một timeline, không phải khoảnh khắc thứ ba. Nút của mục dẫn
 * theo vai trò (khách → đăng ký, ứng viên → đúng mục trong hồ sơ, NTD → đăng tin).
 * Chỉ đổi opacity. Chữ là văn bản thật. Giảm chuyển động: mọi thứ sáng sẵn, không có ScrollTrigger.
 */
export default function StatementSection() {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const role = useHomeRole()
  const words = homeSections.statement.split(' ')
  const criteria = homeSections.statementCriteria[role]
  const STEP = 0.7 // khoảng lệch giữa hai từ trong timeline

  useGSAP(
    () => {
      const els = gsap.utils.toArray<HTMLElement>('[data-word]', ref.current)
      if (!els.length) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          // Sáng trọn khi giữa section tới giữa màn hình (taste: khoảnh khắc ở trạng thái hoàn chỉnh khi section đứng giữa màn)
          scrollTrigger: { trigger: ref.current, start: 'top 85%', end: 'center 55%', scrub: 0.4 },
        })
        // Mỗi từ mất một "khe" tiến trình, các khe chồng nhẹ cho mượt
        tl.fromTo(els, { opacity: 0.22 }, { opacity: 1, duration: 1, stagger: STEP }, 0)
        // Mục bên phải sáng đúng lúc từ của nó sáng
        criteria.forEach((c) => {
          const at = Math.max(0, words.indexOf(c.word)) * STEP
          tl.fromTo(`[data-crit="${c.key}"]`, { opacity: 0.45 }, { opacity: 1, duration: 1 }, at)
          tl.fromTo(gsap.utils.toArray(`[data-crit-glow="${c.key}"]`, ref.current), { opacity: 0 }, { opacity: 1, duration: 1 }, at)
        })
      })
      return () => mm.revert()
    },
    { scope: ref, dependencies: [reduced, role] },
  )

  return (
    <section
      ref={ref}
      data-theme="night"
      className="relative z-10 grid min-h-[85svh] px-4 md:px-[max(16px,2.5vw)] items-center gap-10 py-section-sm lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-20"
      aria-labelledby="home-statement-title"
    >
      <h2
        id="home-statement-title"
        className="max-w-[22ch] text-balance font-display text-display-sm font-semibold text-wm-ivory"
      >
        {words.map((w, i) => (
          <span key={i} data-word className={reduced ? undefined : 'opacity-[0.22]'}>
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        ))}
      </h2>

      <ul className="grid w-full gap-4 lg:max-w-[38rem] lg:justify-self-end" aria-label="Ba tiêu chí ghép việc">
        {criteria.map((c) => {
          const Icon = ICONS[c.key as keyof typeof ICONS]
          return (
            <li key={c.key} data-crit={c.key} className={cn(!reduced && 'opacity-[0.45]')}>
              {/* Cả thẻ là một liên kết: nhấc 2px + viền sáng khi rê chuột/focus; chữ hành động nhỏ ở dưới */}
              <Link
                to={c.cta.href}
                className={cn(
                  'group relative grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 overflow-hidden rounded-card border border-wm-ivory/25 p-5',
                  'bg-wm-abyss/60 shadow-[0_24px_60px_-28px_var(--wm-night)] backdrop-blur-xl backdrop-saturate-150',
                  // Viền sáng mảnh ở mép trên như mặt kính
                  'before:pointer-events-none before:absolute before:inset-x-5 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-wm-ivory/60 before:to-transparent',
                  'transition-[transform,border-color] duration-500 ease-editorial hover:-translate-y-0.5 hover:border-wm-ivory/50',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wm-ivory motion-reduce:transform-none',
                  'sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center',
                )}
              >
                {/* Vạch sáng cạnh trái khi mục được "bật" theo câu */}
                <span
                  aria-hidden
                  data-crit-glow={c.key}
                  className={cn(
                    'pointer-events-none absolute inset-0 rounded-card ring-1 ring-inset ring-wm-cyan/60',
                    'bg-[radial-gradient(120%_90%_at_0%_50%,color-mix(in_srgb,var(--wm-cyan)_18%,transparent),transparent_60%)]',
                    !reduced && 'opacity-0',
                  )}
                />
                <span
                  aria-hidden
                  data-crit-glow={c.key}
                  className={cn('absolute inset-y-5 left-0 w-[3px] rounded-full bg-wm-cyan', !reduced && 'opacity-0')}
                />
                <span className="relative flex h-11 w-11 items-center justify-center rounded-control border border-wm-ivory/25 bg-wm-ivory/10">
                  <span
                    aria-hidden
                    data-crit-glow={c.key}
                    className={cn('absolute inset-0 rounded-control bg-wm-cyan/20', !reduced && 'opacity-0')}
                  />
                  <Icon className="relative h-5 w-5 text-wm-ivory" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-lg font-semibold leading-tight text-wm-ivory">{c.title}</span>
                  <span className="mt-1 block text-sm text-wm-ivory/85">{c.body}</span>
                  <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-wm-ivory">
                    <span className="border-b border-transparent transition-colors duration-300 group-hover:border-wm-ivory group-focus-visible:border-wm-ivory">
                      {c.cta.label}
                    </span>
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden />
                  </span>
                </span>
                {/* Mảnh giao diện minh họa cho tiêu chí (trang trí, không phải dữ liệu thật) */}
                <span aria-hidden className="col-span-2 sm:col-span-1 sm:justify-self-end">
                  <CriterionPreview kind={c.key as keyof typeof ICONS} />
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

/** Mảnh giao diện nhỏ cho từng tiêu chí: hàng 7 ngày · thanh quãng đường · chip kỹ năng */
function CriterionPreview({ kind }: { kind: keyof typeof ICONS }) {
  if (kind === 'lich') {
    const free = new Set([1, 3, 5, 6])
    return (
      <span className="flex gap-1">
        {DAYS.map((d, i) => (
          <span
            key={d}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-control text-[10px] font-semibold',
              free.has(i) ? 'bg-wm-cyan/25 text-wm-ivory ring-1 ring-wm-cyan/50' : 'bg-wm-ivory/5 text-wm-ivory/50',
            )}
          >
            {d}
          </span>
        ))}
      </span>
    )
  }
  if (kind === 'duong') {
    return (
      <span className="flex w-40 items-center gap-2 text-xs font-medium text-wm-ivory/85">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-wm-ivory" />
        <span className="relative h-1.5 flex-1 rounded-full bg-wm-ivory/10">
          <span className="absolute inset-y-0 left-0 w-3/5 rounded-full bg-wm-cyan/70" />
          <span className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-wm-ivory bg-wm-cyan" style={{ left: 'calc(60% - 6px)' }} />
        </span>
        <span className="tnum whitespace-nowrap text-wm-ivory">≤ 5 km</span>
      </span>
    )
  }
  return (
    <span className="flex flex-wrap gap-1.5">
      {['Pha chế', 'Giao tiếp', 'Thu ngân'].map((k) => (
        <span key={k} className="rounded-full border border-wm-ivory/30 bg-wm-ivory/10 px-3 py-1 text-xs font-medium text-wm-ivory">
          {k}
        </span>
      ))}
    </span>
  )
}
