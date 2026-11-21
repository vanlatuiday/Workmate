import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Briefcase,
  Building2,
  CalendarDays,
  Check,
  FileCheck2,
  ShieldCheck,
  Target,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@utils/cn'
import { heroFeatures, type HeroFeature } from './content'

const ICONS: Record<HeroFeature['icon'], LucideIcon> = {
  target: Target,
  calendar: CalendarDays,
  users: Users,
  briefcase: Briefcase,
  userCheck: UserCheck,
  shield: ShieldCheck,
  fileCheck: FileCheck2,
  building: Building2,
}

/**
 * Ba thẻ tính năng kính ở đáy hero, nội dung theo vai trò (heroFeatures trong content.ts).
 * Cả thẻ là MỘT <Link> (mũi tên tròn chỉ để trang trí, aria-hidden). Kính + viền sáng mép dùng
 * lại `.shift-card` (index.css; ::before/::after có pointer-events: none nên không chặn bấm).
 * Mỗi <li data-hero-card> do timeline intro điều khiển (mờ → hiện, trượt lên lần lượt); hover/nâng
 * thẻ nằm trên <a> bên trong nên không đụng transform của li.
 * Phần tử ngoài cùng mang data-hero-item để timeline intro cho hiện cùng nội dung.
 */
export default function HeroFeatureCards({ audience }: { audience: keyof typeof heroFeatures }) {
  const features = heroFeatures[audience]

  return (
    <div data-hero-item className="relative shell w-full">
      <ul aria-label="Điểm nổi bật" className="mx-auto grid max-w-6xl grid-cols-3 gap-4 xl:gap-6">
        {features.map((f, idx) => {
          const Icon = ICONS[f.icon]
          return (
            <li key={f.title} data-hero-card className="relative">
              <Link
                to={f.link.href}
                className={cn(
                  'shift-card hero-fcard group relative flex h-full flex-col gap-4 rounded-card border p-5 text-left xl:flex-row',
                  'transition-[transform,border-color] duration-500 ease-editorial hover:-translate-y-0.5 hover:!border-wm-ivory/70 focus-visible:-translate-y-0.5 focus-visible:!border-wm-ivory/70',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wm-ivory motion-reduce:transform-none',
                )}
              >
                <span className="flex h-16 w-16 shrink-0 items-center justify-center hero-ftile rounded-control bg-gradient-to-br from-wm-azure to-wm-cyan">
                  <Icon className="h-8 w-8 text-wm-ivory" aria-hidden />
                </span>
                <span className="flex min-w-0 flex-1 flex-col xl:pr-10">
                  <span className="font-display text-xl font-semibold leading-tight text-wm-ivory">{f.title}</span>
                  <span className="mt-1.5 text-sm text-wm-ivory/95">{f.body}</span>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-wm-ivory">
                    {f.link.label}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transform-none" aria-hidden />
                  </span>
                </span>
                <span
                  aria-hidden
                  className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full border border-wm-ivory/30 bg-wm-ivory/10 text-wm-ivory transition-colors duration-300 group-hover:bg-wm-ivory/20"
                >
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
              {/* Ô tick kính nghiêng đè mép phải thẻ giữa: nằm ở li (không bị overflow của thẻ cắt), không bắt chuột */}
              {idx === 1 && (
                <span
                  aria-hidden
                  className="hero-tick pointer-events-none absolute -right-3 top-[42%] z-10 flex h-11 w-11 items-center justify-center rounded-control border border-wm-ivory/70 bg-wm-ivory/90 text-wm-azure backdrop-blur-md"
                >
                  <Check className="h-6 w-6" strokeWidth={3} />
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
