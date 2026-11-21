import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Camera, Check, ChevronRight, LayoutDashboard, CalendarDays, Mail, MapPin, Pencil, Sparkles, History, type LucideIcon } from 'lucide-react'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { BTN_SECONDARY, BTN_SM } from '@utils/ui'
import { useReducedMotion } from '@hooks/useReducedMotion'
import LightCurves from '@components/home/LightCurves'
import Avatar from '@pages/public/profile/Avatar'
import type { SeekerProfile } from '@context/profileStore'
import { DAY_SHORT } from '../mockData'

/** Tiêu đề thẻ: icon cyan + tên, link hoặc nút sửa ở góc phải */
export function JdCard({ id, icon: Icon, title, action, className, children }: {
  id?: string
  icon: LucideIcon
  title: string
  action?: ReactNode
  className?: string
  children: ReactNode
}) {
  return (
    <section id={id} aria-label={title} className={cn('jd-card jd-lift scroll-mt-24 p-5 md:p-6', className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 font-display text-lg font-medium text-page-fg">
          <Icon className="h-5 w-5 flex-shrink-0 text-wm-cyan" aria-hidden="true" />
          {title}
        </h2>
        {action && <div className="text-sm">{action}</div>}
      </div>
      {children}
    </section>
  )
}

/** Link nhỏ cyan ở góc thẻ: "Xem chi tiết →" */
export function CardLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className={cn('inline-flex items-center gap-1 rounded-control text-wm-cyan underline-offset-4 hover:underline', FOCUS)}>
      {children}
      <ChevronRight className="h-4 w-4" aria-hidden="true" />
    </Link>
  )
}

/** Nút bút chì sửa nhanh → /ho-so */
export function EditPencil({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      aria-label={label}
      className={cn('flex h-8 w-8 items-center justify-center rounded-full border border-page-line text-page-muted transition-colors duration-fast hover:border-page-fg hover:text-page-fg', FOCUS)}
    >
      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
    </Link>
  )
}

/** Câu ngắn khi chưa có dữ liệu + link tới đúng phần của /ho-so */
export function EmptyHint({ text, to, label }: { text: string; to: string; label: string }) {
  return (
    <p className="text-sm leading-relaxed text-page-muted">
      {text}{' '}
      <Link to={to} className={cn('rounded-control font-medium text-wm-cyan underline underline-offset-4', FOCUS)}>{label}</Link>
    </p>
  )
}

/** Chip nhỏ kiểu kính */
export const JD_CHIP = 'jd-field inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm text-page-fg'

// ─── Đầu trang: thẻ hồ sơ ───────────────────────────────────────────────────

export function ProfileHero({ profile, name, email, avatarUrl, headline }: {
  profile: SeekerProfile
  name: string
  email: string
  avatarUrl: string | null
  headline: string
}) {
  const intro = profile.intro.trim()
  return (
    <section aria-label="Hồ sơ của bạn" className="jd-card jd-hero relative isolate overflow-hidden p-5 md:p-8">
      <LightCurves />
      <Link to="/ho-so" className={cn(BTN_SECONDARY, BTN_SM, 'absolute right-4 top-4 md:right-6 md:top-6')}>
        <Pencil className="h-4 w-4" aria-hidden="true" />
        Chỉnh sửa hồ sơ
      </Link>
      <div className="flex flex-col gap-5 pt-10 sm:flex-row sm:items-center sm:pt-0 md:gap-8">
        <div className="relative flex-shrink-0 self-start sm:self-center">
          <div className="rounded-full p-1 ring-2 ring-wm-cyan shadow-[0_0_28px_-4px_var(--wm-cyan)]">
            <Avatar name={name} url={avatarUrl} show={profile.showAvatar} className="h-24 w-24 text-2xl md:h-32 md:w-32 md:text-3xl" />
          </div>
          <Link
            to="/ho-so#thong-tin"
            aria-label="Đổi ảnh đại diện"
            className={cn('absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border border-page-line bg-wm-abyss text-page-fg transition-colors duration-fast hover:border-wm-cyan', FOCUS)}
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="min-w-0 flex-1 sm:pr-48">
          <h1 className="break-words font-display text-2xl font-semibold text-page-fg md:text-4xl">{name}</h1>
          <p className="mt-1 text-base text-page-fg md:text-lg">{headline}</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {profile.area.trim() && (
              <li className={JD_CHIP}><MapPin className="h-4 w-4 flex-shrink-0 text-wm-cyan" aria-hidden="true" />{profile.area}</li>
            )}
            {email && (
              <li className={cn(JD_CHIP, 'min-w-0')}><Mail className="h-4 w-4 flex-shrink-0 text-wm-cyan" aria-hidden="true" /><span className="truncate">{email}</span></li>
            )}
          </ul>
          <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-page-muted md:text-base">
            <span>{intro || 'Chưa có giới thiệu ngắn. Vài dòng về bạn giúp nhà tuyển dụng nhớ bạn hơn.'}</span>
            <Link to="/ho-so#thong-tin" aria-label="Sửa giới thiệu" className={cn('mt-0.5 flex-shrink-0 rounded-full p-1 text-page-muted hover:text-page-fg', FOCUS)}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}

// ─── Hàng tab ───────────────────────────────────────────────────────────────

export type OverviewTab = { id: string; label: string; icon: LucideIcon }

const TABS: OverviewTab[] = [
  { id: 'jd-tong-quan', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'jd-lich-ranh', label: 'Lịch rảnh', icon: CalendarDays },
  { id: 'jd-kinh-nghiem', label: 'Kinh nghiệm', icon: Briefcase },
  { id: 'jd-ky-nang', label: 'Kỹ năng', icon: Sparkles },
  { id: 'jd-hoat-dong', label: 'Hoạt động', icon: History },
]

/** Tab neo trong trang: bấm thì cuộn mượt tới thẻ tương ứng (giảm chuyển động → nhảy thẳng) */
export function OverviewTabs({ tabs = TABS }: { tabs?: OverviewTab[] }) {
  const [active, setActive] = useState(tabs[0].id)
  const reduced = useReducedMotion()
  const go = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    setActive(id)
    document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
  }
  return (
    <nav aria-label="Các phần của tổng quan" className="-mx-1 overflow-x-auto px-1 py-1">
      <ul className="flex w-max gap-2 md:w-auto md:flex-wrap">
        {tabs.map(({ id, label, icon: Icon }) => {
          const on = active === id
          return (
            <li key={id}>
              <a
                href={`#${id}`}
                onClick={(e) => go(e, id)}
                aria-current={on ? 'true' : undefined}
                className={cn(
                  'inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full px-5 text-sm font-medium transition-colors duration-fast motion-reduce:transition-none',
                  on ? 'bg-wm-ivory text-wm-abyss' : 'text-page-fg hover:bg-wm-ivory/10',
                  FOCUS,
                )}
              >
                <Icon className={cn('h-4 w-4', on ? 'text-wm-azure' : 'text-wm-cyan')} aria-hidden="true" />
                {label}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

// ─── Lịch rảnh 7 ngày ───────────────────────────────────────────────────────

/** Ngày (dd/mm) của 7 ngày trong tuần hiện tại, bắt đầu từ thứ Hai; chỉ số khớp DAY_SHORT và khóa availability */
export function weekDays(now = new Date()) {
  const mondayOffset = (now.getDay() + 6) % 7
  return DAY_SHORT.map((label, i) => {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - mondayOffset + i)
    return { label, date: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`, today: i === mondayOffset }
  })
}

export function WeekStrip({ availability }: { availability: string[] }) {
  const days = weekDays()
  return (
    <ul className="grid grid-cols-7 gap-1.5 md:gap-2">
      {days.map((d, i) => {
        const free = availability.some((k) => k.startsWith(`${i}-`))
        return (
          <li
            key={d.label}
            className={cn(
              'flex flex-col items-center rounded-control border px-0.5 py-2.5 text-center md:py-3',
              free ? 'border-wm-cyan/50 bg-wm-azure/20' : 'border-page-line bg-wm-ivory/5',
              d.today && 'ring-1 ring-wm-ivory/60',
            )}
          >
            <span className="text-sm font-semibold text-page-fg md:text-base">{d.label}</span>
            <span className="tnum text-[11px] text-page-muted md:text-sm">{d.date}</span>
            <span className={cn('mt-1.5 text-[11px] font-medium md:text-xs', free ? 'text-wm-cyan' : 'text-page-muted')}>
              {free ? 'Có lịch' : 'Trống'}
            </span>
          </li>
        )
      })}
    </ul>
  )
}

// ─── Kinh nghiệm ────────────────────────────────────────────────────────────

/** "06/2025 – 01/2026" hoặc "2024 – 2025" → "8 tháng" / "2 năm"; không hiểu được (vd. "đến nay") → null */
export function durationOf(period: string): string | null {
  const [a, b] = period.split(/\s*[–-]\s*/)
  if (!a || !b) return null
  const parse = (s: string, end: boolean) => {
    const my = s.trim().match(/^(\d{1,2})\/(\d{4})$/)
    if (my) return { v: +my[2] * 12 + +my[1], exact: true }
    const y = s.trim().match(/^(\d{4})$/)
    if (y) return { v: +y[1] * 12 + (end ? 12 : 1), exact: false }
    return null
  }
  const s = parse(a, false)
  const e = parse(b, true)
  if (!s || !e) return null
  const months = e.v - s.v + (s.exact && e.exact ? 0 : 1)
  if (months <= 0) return null
  if (months < 12) return `${months} tháng`
  const y = Math.floor(months / 12)
  const m = months % 12
  return m ? `${y} năm ${m} tháng` : `${y} năm`
}

export function SkillTile({ label }: { label: string }) {
  return (
    <li className="jd-field flex items-center gap-2 rounded-control px-3 py-2 text-sm text-page-fg">
      <span aria-hidden="true" className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-wm-azure/30 text-wm-cyan">
        <Check className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 break-words">{label}</span>
    </li>
  )
}
