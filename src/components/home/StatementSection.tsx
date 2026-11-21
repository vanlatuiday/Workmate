import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Briefcase, CalendarDays, MapPin, MessagesSquare, Search, Sparkles, TrendingUp, Users, type LucideIcon } from 'lucide-react'

import deskImg from '@assets/images/home/home-desk.webp'
import { useAllJobs } from '@pages/public/jobs/catalog'
import type { MatchJob } from '@pages/public/match/data'
import { useCompanyStore } from '@context/companyStore'
import { useCompanyJobs } from '@services/adminService'
import { gsap, useGSAP } from '@utils/gsap'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { cn } from '@utils/cn'
import { homeSections } from './content'
import { useHomeRole } from './homeData'
import { shiftsOf } from './shiftBoard'

const ICONS = { lich: CalendarDays, duong: MapPin, ketnoi: MessagesSquare } as const
const BTN_ICONS: Record<string, LucideIcon> = { 'Tìm việc ngay': Search, 'Đăng tuyển ngay': Briefcase, 'Sửa lịch rảnh': CalendarDays, 'Xem ứng viên phù hợp': Users }

/**
 * Câu nhấn giữa trang, bố cục 3 vùng (chữ · ảnh bàn làm việc · 3 thẻ tiêu chí). Nền có vài dải cong sáng riêng của section.
 * Chuyển động: khi section vào khung nhìn, các phần hiện dần nhẹ một lần theo thứ tự (opacity + y nhỏ); ảnh bàn và
 * nhãn nghiêng lơ lửng rất chậm. Trạng thái mặc định (CSS) là hiện sẵn: GSAP dùng `from` trong matchMedia nên
 * lỗi JS hay giảm chuyển động đều không làm mất nội dung. Số trên nhãn lấy từ cùng nguồn với bảng ca (shiftsOf).
 */
export default function StatementSection() {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const role = useHomeRole()
  const criteria = homeSections.statementCriteria[role]
  const btns = homeSections.statementButtons[role]
  const chipN = useWeekShiftCount(role)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const items = gsap.utils.toArray<HTMLElement>('[data-reveal]', ref.current)
        if (items.length) {
          gsap.from(items, {
            opacity: 0,
            y: 18,
            duration: 0.7,
            ease: 'power2.out',
            stagger: 0.12,
            scrollTrigger: { trigger: ref.current, start: 'top 70%', once: true },
          })
        }
        // Lơ lửng rất chậm (chỉ khi cho phép chuyển động)
        gsap.utils.toArray<HTMLElement>('[data-float]', ref.current).forEach((el, i) => {
          gsap.to(el, { y: i % 2 ? 6 : -6, duration: 5 + i * 1.3, ease: 'sine.inOut', yoyo: true, repeat: -1 })
        })
      })
      return () => mm.revert()
    },
    { scope: ref, dependencies: [reduced, role, chipN > 0] },
  )

  return (
    <section
      ref={ref}
      data-theme="night"
      className="relative z-10 flex min-h-[85svh] items-center overflow-hidden px-4 py-section-sm md:px-[max(16px,2.5vw)]"
      aria-labelledby="home-statement-title"
    >
      {/* Dải cong sáng nền (trang trí), mờ dần ở mép trên/dưới để hòa vào nền sao */}
      <div aria-hidden className="stmt-curves pointer-events-none absolute inset-0">
        <span className="stmt-curve stmt-curve-a" />
        <span className="stmt-curve stmt-curve-b" />
        <span className="stmt-curve stmt-curve-c" />
      </div>

      <div className="relative grid w-full gap-10 md:grid-cols-2 lg:grid-cols-[minmax(0,38fr)_minmax(0,26fr)_minmax(0,36fr)] lg:gap-8">
        {/* Cột chữ */}
        <div className="relative z-10 md:col-span-2 lg:col-span-1 lg:self-center">
          <p
            data-reveal
            className="inline-flex flex-wrap items-center gap-x-2.5 gap-y-1 rounded-full border border-wm-ivory/20 bg-wm-ivory/10 px-4 py-2 text-sm backdrop-blur-md"
          >
            <Sparkles className="h-4 w-4 text-wm-cyan" aria-hidden />
            <span className="text-wm-ivory/80">{homeSections.statementEyebrow.lead}</span>
            <span aria-hidden className="text-wm-ivory/60">•</span>
            <span className="text-wm-cyan">{homeSections.statementEyebrow.tail}</span>
          </p>
          <h2
            id="home-statement-title"
            data-reveal
            className="mt-6 max-w-[20ch] text-balance font-display text-display-sm font-semibold text-wm-ivory"
          >
            {homeSections.statementTitle.lead}
            <span className="relative inline-block whitespace-nowrap text-wm-cyan">
              {homeSections.statementTitle.em}
              <svg aria-hidden viewBox="0 0 220 12" preserveAspectRatio="none" className="absolute -bottom-2 left-0 h-2.5 w-full text-wm-cyan">
                <path d="M2 8 C 40 2, 90 10, 140 5 S 200 3, 218 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </span>
            {homeSections.statementTitle.tail}
          </h2>
          <p data-reveal className="mt-6 max-w-[34ch] text-lg text-wm-ivory/85">
            {homeSections.statementSub[role]}
          </p>
          <div data-reveal className="mt-8 flex flex-wrap gap-3">
            {([btns.primary, btns.secondary] as const).map((b, i) => {
              const Icon = BTN_ICONS[b.label]
              return (
                <Link key={b.label} to={b.href} className={i === 0 ? 'stmt-btn stmt-btn-primary' : 'stmt-btn stmt-btn-ghost'}>
                  {Icon && <Icon className="h-5 w-5" aria-hidden />}
                  {b.label}
                  {i === 0 && <ArrowRight className="h-4 w-4" aria-hidden />}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Ảnh bàn làm việc (đã có sẵn bệ sáng + nét lấp lánh trong ảnh). ≥lg: ảnh to, lấn sang trái và chui một phần
            dưới cột thẻ bên phải; thẻ kính có backdrop-blur nên phần ảnh phía sau bị làm mờ → cảm giác chiều sâu */}
        <figure className="relative z-0 mx-auto w-full max-w-[30rem] self-center md:max-w-[36rem] lg:-ml-[45%] lg:-mr-[75%] lg:w-auto lg:max-w-none">
          <div data-reveal className="relative">
            <div data-float>
              <img src={deskImg} alt={homeSections.statementDeskAlt} width={1400} height={927} loading="lazy" decoding="async" className="relative h-auto w-full" />
            </div>
          </div>
          {chipN > 0 && (
            <div data-reveal className="absolute -bottom-3 left-0 z-10 w-max sm:bottom-[4%] lg:left-[8%]" style={{ rotate: '-6deg' }}>
              <div data-float className="stmt-chip flex items-center gap-3 rounded-card border border-wm-ivory/25 bg-wm-abyss/55 px-4 py-3 backdrop-blur-xl">
                <span className="flex h-10 w-10 items-center justify-center rounded-control border border-wm-cyan/40 bg-wm-cyan/15">
                  <Briefcase className="h-5 w-5 text-wm-ivory" aria-hidden />
                </span>
                <span className="font-display text-base font-semibold leading-tight text-wm-ivory">
                  <span className="tnum">{chipN}</span> {homeSections.statementChip.suffix}
                  <br />
                  {homeSections.statementChip.line2}
                </span>
                <TrendingUp className="h-5 w-5 text-wm-cyan" aria-hidden />
              </div>
            </div>
          )}
        </figure>

        {/* 3 thẻ tiêu chí */}
        <ul className="relative z-10 grid w-full content-center gap-4" aria-label="Ba tiêu chí ghép việc">
          {criteria.map((c) => {
            const Icon = ICONS[c.key as keyof typeof ICONS]
            return (
              <li key={c.key} data-reveal>
                {/* Cả thẻ là một liên kết: nhấc 2px + viền sáng hơn khi rê chuột/focus */}
                <Link
                  to={c.cta.href}
                  className={cn(
                    'shift-card group relative grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-3 rounded-card border border-wm-cyan/35 bg-wm-abyss/55 p-4 backdrop-blur-xl backdrop-saturate-150',
                    'transition-[transform,border-color] duration-500 ease-editorial hover:-translate-y-0.5 hover:border-wm-cyan/70 focus-visible:-translate-y-0.5 focus-visible:border-wm-cyan/70',
                    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-wm-ivory motion-reduce:transform-none',
                    'xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:items-center',
                  )}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-control bg-gradient-to-br from-wm-cyan to-wm-azure">
                    <Icon className="h-6 w-6 text-wm-ivory" aria-hidden />
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
                  {/* Mảnh giao diện minh họa (trang trí, không phải dữ liệu thật) */}
                  <span aria-hidden className="col-span-2 xl:col-span-1 xl:justify-self-end">
                    <CriterionPreview kind={c.key as keyof typeof ICONS} />
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

/**
 * Tổng số ca đang cần người trong 7 ngày tới, đúng cách bảng ca tính: khách/ứng viên = mọi việc đang mở,
 * nhà tuyển dụng = việc đang hiển thị của công ty mình. 0 hoặc chưa có dữ liệu → 0 (ẩn nhãn).
 */
function useWeekShiftCount(role: 'guest' | 'jobseeker' | 'recruiter'): number {
  const all = useAllJobs()
  const companyId = useCompanyStore((s) => s.id)
  const companyRows = useCompanyJobs(companyId)
  const [now] = useState(() => new Date())
  const jobs: MatchJob[] = useMemo(
    () => (role === 'recruiter' ? companyRows.filter((r) => r.job.visible).map((r) => r.job) : all),
    [role, companyRows, all],
  )
  return useMemo(() => shiftsOf(jobs, now).length, [jobs, now])
}

const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

/** Mảnh giao diện nhỏ cho từng tiêu chí: hàng 7 ngày · thanh quãng đường · chip kỹ năng */
function CriterionPreview({ kind }: { kind: keyof typeof ICONS }) {
  if (kind === 'lich') {
    const free = new Set([1, 3, 5, 6])
    return (
      <span className="flex flex-wrap gap-1">
        {DAYS.map((d, i) => (
          <span
            key={d}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-control border text-xs font-semibold',
              free.has(i) ? 'border-wm-cyan bg-wm-cyan/25 text-wm-ivory' : 'border-wm-ivory/25 bg-wm-ivory/5 text-wm-ivory/80',
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
  // Kết nối: hai bong bóng chat nhỏ
  return (
    <span className="flex w-48 flex-col gap-1.5 text-xs font-medium">
      <span className="self-start rounded-card rounded-bl-none bg-wm-ivory/10 px-3 py-1.5 text-wm-ivory ring-1 ring-wm-ivory/25">Chào bạn, ca tối T6 còn trống</span>
      <span className="self-end rounded-card rounded-br-none bg-wm-cyan/25 px-3 py-1.5 text-wm-ivory ring-1 ring-wm-cyan/50">Mình nhận ca này</span>
    </span>
  )
}
