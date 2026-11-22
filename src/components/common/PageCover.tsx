import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@utils/cn'
import { usePageEnterDelay } from '@components/motion/PageTransition'
import { useIsDay } from '@components/layout/dayContext'
import { HomeBgLayers } from '@components/home/HomeBackdrop'
import { beamBgStyle, heroBgStyle, waveBgStyle } from '@components/home/homeBackground'

/*
 * Bìa trang (page cover) — hệ thống bìa rút ra từ nền xanh trang chủ. Ba cấp:
 *   lg    trang giới thiệu/marketing: ~58svh, ảnh hero + tia sáng "thở" + quầng cam ở đáy (cam CHỈ ở cấp này)
 *   md    trang khám phá: ~34svh (tối thiểu 280px), nền tia sáng đồng nhất, không cam; có chỗ cho ô tìm kiếm
 *   strip dải chức năng ở đầu dashboard: 140–180px, TĨNH, vạch 2px màu vai trò ở đáy
 * Mọi cấp: theme night (chữ ngà), lớp abyss làm tối để chữ ≥ 4,5:1, chỉ token màu, bo rounded-card/full/control.
 * Chuyển động duy nhất: chữ trồi lên một lần khi vào trang (.pc-rise, index.css; opacity + transform, giảm chuyển động → đứng yên).
 *
 * Bìa công khai (lg/md) nằm dưới header cố định 72px: PublicLayout đã chừa pt-[72px] cho <main>, nên bìa kéo lên
 * bằng -mt-[72px] rồi tự đệm lại 72px — nền xanh phủ kín cả vùng sau header. Bìa gắn data-surface="dark" để
 * useHeaderSurface cho header chữ ngà; phần nội dung phía dưới bọc bằng <DarkPageBody> (cũng data-surface="dark").
 */

/** Cùng lề ngang với các phần dưới hero trang chủ */
const EDGE = 'px-4 md:px-[max(16px,2.5vw)]'

/** Kính tối dùng cho thẻ trên nền xanh (cùng công thức thẻ trang chủ) */
/** Trên trang ban ngày (.theme-day) tự thành kính trắng + viền xanh nhạt (index.css → .cover-glass); dashboard giữ kính tối */
export const COVER_GLASS = 'cover-glass'

type CoverRole = 'jobseeker' | 'recruiter' | 'admin'

/** Màu vạch đáy của dải chức năng theo vai trò */
const ROLE_LINE: Record<CoverRole, string> = {
  jobseeker: 'bg-wm-leaf',
  recruiter: 'bg-wm-tangerine',
  admin: 'bg-wm-ivory/60',
}

type Crumb = { label: string; to?: string }

type Props = {
  level: 'lg' | 'md' | 'strip'
  title: string
  /** lg: nhãn nhỏ phía trên tiêu đề (viết hoa chữ đầu câu, không in hoa) */
  label?: string
  /** lg / strip: một câu dẫn dưới tiêu đề */
  lead?: string
  /** md: dòng số liệu dưới tiêu đề */
  fact?: ReactNode
  /** strip: đường dẫn trên tiêu đề */
  breadcrumb?: Crumb[]
  /** strip: vai trò → màu vạch đáy */
  role?: CoverRole
  /** lg: vùng hành động (nút chính + liên kết phụ). strip: hành động bên phải */
  actions?: ReactNode
  /** md: chỗ cho ô tìm kiếm / bộ lọc (tự vẽ kính tối) */
  children?: ReactNode
  /** md: cột phải từ lg (vd. thẻ tóm tắt); hẹp thì xuống dưới `children` */
  aside?: ReactNode
  /** lg / md: bỏ lớp tan dần ở đáy (pc-cover-fade) để nội dung bên dưới là tấm ngà <IvoryPageBody> đè lên mép bìa */
  sheet?: boolean
  /** lg / md: căn giữa tiêu đề, dòng dẫn, ô tìm kiếm; `aside` (nếu có) xuống dưới `children`, không còn cột phải */
  centered?: boolean
  className?: string
}

/** Thuộc tính chuyển động vào trang: lớp + độ trễ (ms) */
function rise(enter: number, step: number) {
  return { className: 'pc-rise', style: { ['--pc-delay' as string]: `${Math.round(enter * 1000) + step}ms` } }
}

export default function PageCover(props: Props) {
  if (props.level === 'strip') return <Strip {...props} />
  return <Cover {...props} />
}

/* ─── lg / md ─────────────────────────────────────────────────────────────── */

function Cover({ level, title, label, lead, fact, actions, children, aside, sheet, centered, className }: Props) {
  const enter = usePageEnterDelay()
  const lg = level === 'lg'
  const day = useIsDay()
  return (
    <section
      data-surface={day ? 'day' : 'dark'}
      className={cn(
        // Kéo lên dưới header cố định rồi đệm lại đúng 72px
        day ? 'theme-day' : 'theme-night',
        'relative -mt-[72px] flex flex-col justify-end pt-[72px]',
        lg ? 'min-h-[58svh] md:min-h-[60svh]' : 'min-h-[max(280px,34svh)]',
        className,
      )}
    >
      {/* Lớp nền: gói trong khung riêng để cắt tràn mà không ảnh hưởng phần tử fixed (viên tìm kiếm thu gọn) */}
      {/* Trang ban ngày: không lớp nền riêng — DayBackdrop cố định phía sau là nền chung */}
      {!day && (
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {lg ? (
          <>
            {/* Ảnh hero + tia sáng "thở" (chỉ cấp lg có chuyển động nền) */}
            <HomeBgLayers style={heroBgStyle} />
            {/* Quầng cam–đào ở đáy: điểm ấm duy nhất */}
            <div className="home-hero-orange absolute inset-x-0 bottom-[14%] h-[78%] opacity-60" />
          </>
        ) : (
          // Nền tia sáng xanh ngọc đồng nhất, không cam
          <div className="absolute inset-0" style={beamBgStyle} />
        )}
        {/* Làm tối chung: bìa lặng hơn hero trang chủ */}
        <div className={cn('absolute inset-0', lg ? 'bg-wm-abyss/25' : 'bg-wm-abyss/30')} />
        {/* Vùng chữ bên trái tối thêm để chữ ngà đọc được kể cả trên vệt cam / tia sáng */}
        <div className="absolute inset-0 bg-gradient-to-t from-wm-abyss/80 via-wm-abyss/20 to-transparent md:bg-gradient-to-r md:from-wm-abyss/80 md:via-wm-abyss/35 md:to-transparent" />
        {/* Mép dưới tan dần về đúng màu đầu phần nội dung (DarkPageBody bắt đầu cùng màu) — không có vết cắt ngang */}
        {!sheet && <div className="pc-cover-fade absolute inset-x-0 bottom-0 h-3/5" />}
      </div>
      )}

      <div className={cn('relative', EDGE, lg ? 'pb-10 pt-12 md:pb-14' : 'pb-6 pt-10 md:pb-8', sheet && !day && 'pb-14 md:pb-16')}>
        <div className={cn(aside && !centered && 'lg:grid lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-end lg:gap-10')}>
          <div className={cn('min-w-0', centered && 'text-center')}>
            {label && (
              <p {...rise(enter, 0)} className={cn('pc-rise mb-3 text-sm font-medium text-page-muted')}>
                {label}
              </p>
            )}
            <h1
              {...rise(enter, 60)}
              className={cn(
                'pc-rise max-w-[20ch] text-balance font-display font-semibold text-page-fg',
                centered && 'mx-auto',
                lg ? 'text-display-md' : 'text-display-sm',
              )}
            >
              {title}
            </h1>
            {lead && (
              <p {...rise(enter, 160)} className={cn('pc-rise mt-4 max-w-xl text-base leading-relaxed text-page-fg md:text-lg', centered && 'mx-auto')}>
                {lead}
              </p>
            )}
            {fact && (
              <p {...rise(enter, 160)} className="pc-rise tnum mt-3 text-sm text-page-muted md:text-base">
                {fact}
              </p>
            )}
            {actions && (
              <div {...rise(enter, 260)} className="pc-rise mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                {actions}
              </div>
            )}
            {children && (
              <div {...rise(enter, 260)} className={cn('pc-rise relative z-10 mt-6 md:mt-7', centered && 'mx-auto w-full max-w-3xl text-left')}>
                {children}
              </div>
            )}
          </div>
          {aside && (
            <div {...rise(enter, 260)} className={cn('pc-rise mt-6', centered ? 'mx-auto mt-5 w-full max-w-6xl' : 'lg:mt-0 lg:self-stretch')}>
              {aside}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/* ─── strip ───────────────────────────────────────────────────────────────── */

function Strip({ title, lead, breadcrumb, role = 'jobseeker', actions, className }: Props) {
  return (
    <section
      className={cn(
        // Dải nằm trong cột nội dung dashboard (nền ngà) nên là một khối bo góc, không phủ cả bề ngang
        'theme-night relative mb-6 flex min-h-[140px] flex-col justify-end overflow-hidden rounded-card md:mb-8 md:min-h-[168px]',
        className,
      )}
    >
      {/* Tĩnh hoàn toàn: ảnh nền không có lớp "thở", chỉ gradient abyss → ocean và một vệt tia sáng mờ */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-60" style={heroBgStyle} />
        <div className="absolute inset-0 bg-gradient-to-b from-wm-abyss via-wm-abyss/85 to-wm-ocean/90" />
        <div className="pc-strip-beam absolute inset-0" />
      </div>

      <div className="relative flex flex-col gap-4 px-5 pb-5 pt-5 sm:flex-row sm:items-end sm:justify-between md:px-8 md:pb-6 md:pt-6">
        <div className="min-w-0">
          {breadcrumb && breadcrumb.length > 0 && (
            <nav aria-label="Đường dẫn" className="mb-1.5">
              <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-page-muted">
                {breadcrumb.map((c, i) => (
                  <li key={c.label} className="flex items-center gap-1.5">
                    {i > 0 && <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
                    {c.to ? (
                      <Link to={c.to} className="rounded-control hover:text-page-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-page-fg">
                        {c.label}
                      </Link>
                    ) : (
                      <span aria-current={i === breadcrumb.length - 1 ? 'page' : undefined}>{c.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <h1 className="font-display text-2xl font-semibold text-page-fg md:text-3xl">{title}</h1>
          {lead && <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-page-muted md:text-base">{lead}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
      </div>

      {/* Vạch 2px màu vai trò */}
      <span aria-hidden="true" className={cn('absolute inset-x-0 bottom-0 h-0.5', ROLE_LINE[role])} />
    </section>
  )
}

/* ─── phần nội dung tối dưới bìa công khai ────────────────────────────────── */

/**
 * Nền xanh tiếp nối bên dưới bìa lg/md (chủ dự án chọn: nội dung trang công khai tối như trang chủ).
 * Dùng ảnh tia sáng lượn sóng của trang chủ (waveBgStyle) nhưng TĨNH — không sao, không trôi, không "thở" —
 * nhưng lặng hơn bìa: (a) tối dần khi cuộn xuống (.pc-body-dim: abyss 30% → 62% trong 140svh), (b) tia sáng dạt ra hai mép,
 * cột giữa (sau nội dung) tối hơn và bớt bão hòa (.pc-body-calm), (c) KHÔNG còn tia sáng "thở". Cả hai lớp cùng mặt nạ
 * tan từ 0 ở đầu nên không tạo vết cắt với bìa; .pc-body-fade phủ lên cùng chỗ nối.
 */
export function DarkPageBody({ className, children }: { join?: boolean; className?: string; children: ReactNode }) {
  // Trang ban ngày: khung trong suốt, nền do DayBackdrop lo
  if (useIsDay()) return <div data-surface="day" className={cn('relative min-h-[40svh] flex-1', className)}>{children}</div>
  return (
    <div data-surface="dark" className={cn('theme-night relative min-h-[40svh] flex-1', className)}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0" style={waveBgStyle} />
        <div className="pc-body-dim absolute inset-0" />
        {/* Cột giữa tối hơn + hơi nhạt màu: ánh sáng chỉ còn ở hai mép */}
        <div className="pc-body-calm absolute inset-0" />
        {/* Đầu phần nội dung bắt đầu đúng màu mép dưới của bìa rồi tan vào tia sáng */}
        <div className="pc-body-fade absolute inset-x-0 top-0 h-[36svh]" />
      </div>
      <div className="relative">{children}</div>
    </div>
  )
}

/**
 * Tấm ngà đè lên đáy bìa lg/md (dùng cùng `<PageCover sheet>`): góc trên bo lớn, kéo lên 24px.
 * data-surface="light" để header cố định chuyển sang kiểu sáng khi nằm trên tấm; phía sau góc bo là đáy abyss của bìa.
 * Bìa có `sheet` đã đệm đáy đủ nên nội dung bìa không bị tấm che.
 */
export function IvoryPageBody({ className, children }: { className?: string; children: ReactNode }) {
  if (useIsDay()) return <div data-surface="day" className={cn('relative min-h-[40svh] flex-1', className)}>{children}</div>
  return (
    <div
      data-surface="light"
      className={cn('theme-ivory relative z-10 -mt-6 min-h-[40svh] flex-1 rounded-t-lg', className)}
    >
      {children}
    </div>
  )
}

/** Lề ngang chuẩn cho nội dung dưới bìa (cùng lề chữ trong bìa) */
export const COVER_EDGE = EDGE
