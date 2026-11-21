import { Link } from 'react-router-dom'
import {
  ArrowRight, BarChart3, Briefcase, CalendarClock, CalendarDays, CalendarX, Camera, Check, ClipboardList, Handshake, History,
  LayoutDashboard, Mail, MapPin, Pencil, Phone, ShieldCheck, UserCheck, Users, Video,
} from 'lucide-react'
import CompanyLogo from '@components/common/CompanyLogo'
import TaxValidBadge from '@components/common/TaxValidBadge'
import LightCurves from '@components/home/LightCurves'
import { EmptyState, MatchScore, SkeletonList, StatusBadge } from '@components/dashboard'
import FadeIn from '@components/motion/FadeIn'
import { fmtSlot, MODE_LABEL } from '@components/interview/format'
import PlaceText from '@components/interview/PlaceText'
import { useCompanyJobs, useJobNumbers, fitCandidatesOf, type CompanyJobRow } from '@services/adminService'
import { useHires, useInterviews, useMyPairs } from '@services/connectionService'
import { useCandidateMatches } from '@services/matchingService'
import { useConnectionStore } from '@context/connectionStore'
import { useCatalogStore } from '@context/catalogStore'
import { useCompanyStore } from '@context/companyStore'
import { useCandidates } from '@pages/public/match/data'
import { findAnyJob } from '@pages/public/jobs/lookup'
import { describeConversation } from '@pages/public/messages/describe'
import { candidateHref } from '@pages/public/personal/links'
import { formatRelativeTime } from '@utils/format'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { BTN_SECONDARY, BTN_SM } from '@utils/ui'
import briefcaseArt from '@assets/images/home/hero-art-briefcase.webp'
import { CardLink, EmptyHint, JD_CHIP, JdCard, OverviewTabs, weekDays, type OverviewTab } from '../jobseeker/overview/parts'

const DAY_MS = 86_400_000
const COMPANY_HREF = '/tuyen-dung/ho-so-cong-ty'

const TABS: OverviewTab[] = [
  { id: 'rd-tong-quan', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'rd-tin', label: 'Tin đang tuyển', icon: Briefcase },
  { id: 'rd-ung-vien', label: 'Ứng viên', icon: Users },
  { id: 'rd-phong-van', label: 'Lịch phỏng vấn', icon: CalendarClock },
  { id: 'rd-hoat-dong', label: 'Hoạt động', icon: History },
]

/** Nhãn + màu huy hiệu của một tin (kiểm duyệt thắng trạng thái đăng tuyển) */
function badgeOf(r: CompanyJobRow): { label: string; tone: 'accent' | 'warning' | 'danger' | 'muted' } {
  if (r.status === 'pending') return { label: 'Chờ duyệt', tone: 'muted' }
  if (r.status === 'rejected') return { label: 'Bị từ chối', tone: 'danger' }
  if (r.status === 'hidden') return { label: 'Bị ẩn', tone: 'danger' }
  if (r.jobStatus === 'paused') return { label: 'Tạm dừng', tone: 'warning' }
  if (r.jobStatus === 'closed') return { label: 'Đã đóng', tone: 'muted' }
  return { label: 'Đang mở', tone: 'accent' }
}

/**
 * Tổng quan nhà tuyển dụng (/tuyen-dung) — cùng ngôn ngữ xanh kính với tổng quan người tìm việc, dữ liệu thật:
 *   công ty: companyStore · tin: useCompanyJobs + useJobNumbers · ca cần người: slots của tin đang mở ·
 *   ứng viên phù hợp: fitCandidatesOf (điểm máy chủ) · phỏng vấn: useInterviews · hoạt động: useMyPairs('recruiter').
 */
export default function RecruiterDashboard() {
  const company = useCompanyStore((s) => s.profile)
  const companyId = useCompanyStore((s) => s.id)
  const logoUrl = useCompanyStore((s) => s.logoUrl)
  const address = useCompanyStore((s) => s.address)
  const tax = useCompanyStore((s) => s.tax)
  const taxValid = tax.taxLookup?.result === 'active'

  const rows = useCompanyJobs(companyId)
  const candidates = useCandidates()
  const catalogLoaded = useCatalogStore((s) => s.loaded)
  useCandidateMatches(rows.map((r) => r.job.id))
  const working = useHires().filter((h) => h.status === 'accepted').length
  const numbers = useJobNumbers(rows.map((r) => r.job))
  const interviews = useInterviews()
  const connections = useConnectionStore((s) => s.connections)
  const pairs = useMyPairs('recruiter')

  const jobIds = new Set(rows.map((r) => r.job.id))
  const openRows = rows.filter((r) => r.status === 'approved' && r.jobStatus === 'open')
  const fitTotal = openRows.reduce((n, r) => n + (numbers[r.job.id]?.fit ?? 0), 0)
  const connectedTotal = connections.filter((c) => jobIds.has(c.jobId)).length

  const nowMs = Date.now()
  const upcoming = interviews.filter((iv) => iv.status === 'confirmed' && iv.chosen && new Date(iv.chosen).getTime() >= nowMs)
  const in7Days = upcoming.filter((iv) => new Date(iv.chosen as string).getTime() <= nowMs + 7 * DAY_MS)
  const candidateOf = (id: string) => candidates.find((c) => c.id === id)

  // Ứng viên phù hợp: điểm cao nhất của mỗi người trên các tin đang mở
  const best = new Map<string, { c: ReturnType<typeof candidateOf> & object; score: number; jobTitle: string }>()
  for (const r of openRows) {
    for (const { c, score } of fitCandidatesOf(r.job)) {
      const prev = best.get(c.id)
      if (!prev || score > prev.score) best.set(c.id, { c, score, jobTitle: r.job.title })
    }
  }
  const topCandidates = [...best.values()].sort((a, b) => b.score - a.score).slice(0, 3)

  // Số ca cần người theo ngày (T2..CN): mỗi khóa "ngày-buổi" của tin đang mở tính một ca
  const days = weekDays()
  const shiftsPerDay = days.map((_, i) => openRows.reduce((n, r) => n + r.job.slots.filter((k) => k.startsWith(`${i}-`)).length, 0))

  const activity = pairs.filter((p) => jobIds.has(p.jobId)).slice(0, 4)

  // Mức đầy đủ của trang công ty: không có số đo sẵn nên đếm các trường chính
  const checks = [
    { label: 'Logo công ty', done: !!logoUrl },
    { label: 'Giới thiệu ngắn', done: !!company.tagline.trim() },
    { label: 'Giới thiệu đầy đủ', done: !!company.about.trim() },
    { label: 'Địa chỉ', done: !!address.trim() },
    { label: 'Email liên hệ', done: !!company.email.trim() },
    { label: 'Số điện thoại', done: !!company.phone.trim() },
    { label: 'Mã số thuế', done: !!tax.taxCode },
  ]
  const doneCount = checks.filter((c) => c.done).length
  const percent = Math.round((doneCount / checks.length) * 100)

  const stats = [
    { label: 'Tin đang mở', value: openRows.length, icon: Briefcase, href: '/tuyen-dung/tin-dang', tone: 'text-wm-cyan' },
    { label: 'Ứng viên phù hợp', value: fitTotal, icon: UserCheck, href: '/match', tone: 'text-wm-leaf' },
    { label: 'Đã kết nối', value: connectedTotal, icon: Handshake, href: '/tuyen-dung/match', tone: 'text-wm-amber-light' },
    { label: 'Phỏng vấn 7 ngày tới', value: in7Days.length, icon: CalendarClock, href: '/lich-phong-van', tone: 'text-wm-rust-light' },
  ]

  const name = company.name.trim() || 'Công ty của bạn'
  const place = [company.industry, company.district].filter((x) => x.trim()).join(' · ')

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Thẻ công ty */}
      <section aria-label="Công ty của bạn" className="jd-card jd-hero relative isolate overflow-hidden p-5 md:p-8">
        <LightCurves />
        <Link to={COMPANY_HREF} className={cn(BTN_SECONDARY, BTN_SM, 'absolute right-4 top-4 md:right-6 md:top-6')}>
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Chỉnh sửa trang công ty
        </Link>
        <div className="flex flex-col gap-5 pt-12 sm:flex-row sm:items-center sm:pt-0 md:gap-8">
          <div className="relative flex-shrink-0 self-start sm:self-center">
            <div className="rounded-full p-1 ring-2 ring-wm-cyan shadow-[0_0_28px_-4px_var(--wm-cyan)]">
              <CompanyLogo name={name} logoUrl={logoUrl} decorative className="h-24 w-24 !rounded-full text-2xl md:h-32 md:w-32 md:text-3xl" />
            </div>
            <Link
              to={COMPANY_HREF}
              aria-label="Đổi logo công ty"
              className={cn('absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border border-page-line bg-wm-abyss text-page-fg transition-colors duration-fast hover:border-wm-cyan', FOCUS)}
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="min-w-0 flex-1 sm:pr-56">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h1 className="break-words font-display text-2xl font-semibold text-page-fg md:text-4xl">{name}</h1>
              <TaxValidBadge valid={taxValid} />
            </div>
            {place && <p className="mt-1 text-base text-page-fg md:text-lg">{place}</p>}
            <ul className="mt-3 flex flex-wrap gap-2">
              {address.trim() && (
                <li className={cn(JD_CHIP, 'min-w-0')}><MapPin className="h-4 w-4 flex-shrink-0 text-wm-cyan" aria-hidden="true" /><span className="truncate">{address}</span></li>
              )}
              {company.email.trim() && (
                <li className={cn(JD_CHIP, 'min-w-0')}><Mail className="h-4 w-4 flex-shrink-0 text-wm-cyan" aria-hidden="true" /><span className="truncate">{company.email}</span></li>
              )}
              {company.phone.trim() && (
                <li className={JD_CHIP}><Phone className="h-4 w-4 flex-shrink-0 text-wm-cyan" aria-hidden="true" /><span className="tnum">{company.phone}</span></li>
              )}
            </ul>
            <p className="mt-3 text-sm leading-relaxed text-page-muted md:text-base">
              {company.tagline.trim() || 'Chưa có giới thiệu ngắn. Vài dòng về công ty giúp ứng viên hiểu bạn hơn.'}
            </p>
          </div>
        </div>
      </section>

      <OverviewTabs tabs={TABS} />

      <div className="grid items-start gap-5 md:gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* Cột trái */}
        <div className="min-w-0 space-y-5 md:space-y-6">
          <FadeIn>
            <JdCard id="rd-tong-quan" icon={BarChart3} title="Thống kê">
              <ul className="grid grid-cols-2 gap-y-5 sm:grid-cols-4 sm:divide-x sm:divide-page-line">
                {stats.map(({ label, value, icon: Icon, href, tone }) => (
                  <li key={label}>
                    <Link to={href} className={cn('group flex flex-col items-center gap-1 rounded-control px-2 py-1 text-center', FOCUS)}>
                      <Icon className={cn('h-6 w-6 transition-transform duration-base group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100', tone)} aria-hidden="true" />
                      <span className="tnum font-display text-3xl font-semibold text-page-fg">{value}</span>
                      <span className="text-sm text-page-muted group-hover:text-page-fg">{label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {working > 0 && <p className="mt-4 text-center text-sm text-page-muted">{working} người đã xác nhận đi làm</p>}
            </JdCard>
          </FadeIn>

          <FadeIn>
            <JdCard icon={CalendarDays} title="Ca đang cần người tuần này" action={<CardLink to="/dang-tin">Đăng ca mới</CardLink>}>
              {openRows.length === 0 ? (
                <EmptyHint text="Chưa có tin nào đang mở." to="/dang-tin" label="Đăng tin tuyển dụng" />
              ) : (
                <ul className="grid grid-cols-7 gap-1.5 md:gap-2">
                  {days.map((d, i) => {
                    const n = shiftsPerDay[i]
                    return (
                      <li
                        key={d.label}
                        className={cn(
                          'flex flex-col items-center rounded-control border px-0.5 py-2.5 text-center md:py-3',
                          n > 0 ? 'border-wm-cyan/50 bg-wm-azure/20' : 'border-page-line bg-wm-ivory/5',
                          d.today && 'ring-1 ring-wm-ivory/60',
                        )}
                      >
                        <span className="text-sm font-semibold text-page-fg md:text-base">{d.label}</span>
                        <span className="tnum text-[11px] text-page-muted md:text-sm">{d.date}</span>
                        <span className={cn('tnum mt-1.5 text-[11px] font-medium md:text-xs', n > 0 ? 'text-wm-cyan' : 'text-page-muted')}>
                          {n > 0 ? `${n} ca` : 'Trống'}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </JdCard>
          </FadeIn>

          <FadeIn>
            <JdCard id="rd-tin" icon={Briefcase} title="Tin đang tuyển" action={<CardLink to="/tuyen-dung/tin-dang">Quản lý tin</CardLink>}>
              {!catalogLoaded && rows.length === 0 ? (
                <SkeletonList rows={3} label="Đang tải tin tuyển dụng…" />
              ) : rows.length === 0 ? (
                <EmptyHint text="Bạn chưa đăng tin nào." to="/dang-tin" label="Đăng tin đầu tiên" />
              ) : (
                <ul className="divide-y divide-page-line">
                  {rows.slice(0, 5).map((r) => {
                    const b = badgeOf(r)
                    const n = numbers[r.job.id]
                    return (
                      <li key={r.job.id} className="group/row -mx-3 flex flex-col gap-2 rounded-control px-3 py-3 transition-colors duration-base hover:bg-page-fg/5 focus-within:bg-page-fg/5 motion-reduce:transition-none sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <Link to="/tuyen-dung/tin-dang" className={cn('rounded-control font-medium text-page-fg underline-offset-4 hover:underline', FOCUS)}>{r.job.title}</Link>
                          <p className="mt-1 text-sm text-page-muted">{r.job.shiftLabel}</p>
                          <p className="tnum text-xs text-page-muted">
                            {n ? `${n.interested} ứng viên quan tâm · ${n.fit} phù hợp` : ''}
                          </p>
                        </div>
                        <StatusBadge tone={b.tone}>{b.label}</StatusBadge>
                      </li>
                    )
                  })}
                </ul>
              )}
            </JdCard>
          </FadeIn>

          <FadeIn>
            <JdCard id="rd-ung-vien" icon={UserCheck} title="Ứng viên phù hợp" action={<CardLink to="/match">Xem ứng viên phù hợp</CardLink>}>
              {topCandidates.length === 0 ? (
                <EmptyHint text="Chưa có ứng viên nào đạt từ 60% trên các tin đang mở." to="/tuyen-dung/tim-ung-vien" label="Tìm ứng viên" />
              ) : (
                <ul className="divide-y divide-page-line">
                  {topCandidates.map(({ c, score, jobTitle }) => (
                    <li key={c.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <span aria-hidden="true" className="jd-field flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium text-page-fg">{c.name.charAt(0)}</span>
                      <div className="min-w-0 flex-1">
                        <Link to={candidateHref(c.id)} className={cn('block truncate rounded-control font-medium text-page-fg underline-offset-4 hover:underline', FOCUS)}>{c.name}</Link>
                        <p className="truncate text-sm text-page-muted">{jobTitle}</p>
                      </div>
                      <MatchScore score={score} size="sm" reactive />
                    </li>
                  ))}
                </ul>
              )}
            </JdCard>
          </FadeIn>

          <FadeIn>
            <JdCard id="rd-phong-van" icon={CalendarClock} title="Lịch phỏng vấn sắp tới" action={<CardLink to="/lich-phong-van">Mở lịch</CardLink>}>
              {upcoming.length === 0 ? (
                <EmptyState icon={CalendarX} title="Chưa có lịch phỏng vấn" description="Mời ứng viên đã kết nối phỏng vấn, lịch đã xác nhận sẽ hiện ở đây." />
              ) : (
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  {upcoming.slice(0, 3).map((iv) => {
                    const Icon = iv.mode === 'online' ? Video : MapPin
                    return (
                      <li key={iv.id} className="jd-field min-w-0 rounded-control p-4">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-sm font-medium text-page-fg">{candidateOf(iv.seekerId)?.name ?? 'Ứng viên'}</p>
                          <StatusBadge tone="default">{MODE_LABEL[iv.mode]}</StatusBadge>
                        </div>
                        <p className="mt-1 truncate text-xs text-page-muted">{findAnyJob(iv.jobId)?.title ?? ''}</p>
                        <p className="tnum mt-3 text-sm text-page-fg">{fmtSlot(iv.chosen as string)}</p>
                        <p className="mt-1 flex items-start gap-1.5 text-xs text-page-muted">
                          <Icon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                          <span className="min-w-0"><PlaceText place={iv.place} /></span>
                        </p>
                      </li>
                    )
                  })}
                </ul>
              )}
            </JdCard>
          </FadeIn>
        </div>

        {/* Cột phải */}
        <div className="min-w-0 space-y-5 md:space-y-6">
          <FadeIn>
            <JdCard icon={ShieldCheck} title="Hồ sơ công ty" action={<CardLink to={COMPANY_HREF}>Hoàn thiện</CardLink>}>
              <p className="tnum font-display text-3xl font-semibold text-page-fg">{percent}%</p>
              <div
                role="progressbar"
                aria-label="Mức đầy đủ của trang công ty"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                className="mt-3 h-1.5 overflow-hidden rounded-full bg-page-line"
              >
                <div className="h-full rounded-full bg-wm-cyan" style={{ width: `${percent}%` }} />
              </div>
              <ul className="mt-4 space-y-1.5">
                {checks.map((c) => (
                  <li key={c.label} className="flex items-center gap-2 text-sm">
                    <span aria-hidden="true" className={cn('flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full', c.done ? 'bg-wm-azure/30 text-wm-cyan' : 'border border-page-line text-transparent')}>
                      <Check className="h-3 w-3" />
                    </span>
                    {c.done ? (
                      <span className="text-page-muted">{c.label}</span>
                    ) : (
                      <Link to={COMPANY_HREF} className={cn('rounded-control text-page-fg underline-offset-4 hover:underline', FOCUS)}>
                        Thêm {c.label.toLowerCase()}
                      </Link>
                    )}
                    <span className="sr-only">{c.done ? ', đã có' : ', còn thiếu'}</span>
                  </li>
                ))}
              </ul>
            </JdCard>
          </FadeIn>

          <FadeIn>
            <JdCard id="rd-hoat-dong" icon={History} title="Hoạt động gần đây" action={<CardLink to="/tuyen-dung/match">Xem kết nối</CardLink>}>
              {activity.length === 0 ? (
                <EmptyState icon={ClipboardList} title="Chưa có hoạt động" description="Khi có người tìm việc quan tâm tin của bạn, họ sẽ hiện ở đây." />
              ) : (
                <ul className="divide-y divide-page-line">
                  {activity.map((p) => {
                    const info = describeConversation('recruiter', p.jobId, p.seekerId)
                    return (
                      <li key={`${p.jobId}|${p.seekerId}`} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-page-fg">{info.name}</p>
                          <p className="truncate text-sm text-page-muted">{info.subtitle} · {formatRelativeTime(p.at)}</p>
                        </div>
                        <div>
                          <StatusBadge tone={p.status === 'connected' ? 'accent' : p.status === 'sent' ? 'neutral' : 'soft'}>
                            {p.status === 'connected' ? 'Đã kết nối' : p.status === 'sent' ? 'Chờ ứng viên phản hồi' : 'Ứng viên quan tâm'}
                          </StatusBadge>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </JdCard>
          </FadeIn>

          <FadeIn>
            <section aria-label="Đăng ca mới" className="jd-card jd-lift jd-promo relative overflow-hidden p-5 md:p-6">
              <img src={briefcaseArt} alt="" width={160} height={160} loading="lazy" className="pointer-events-none absolute -bottom-4 -right-3 h-28 w-28 select-none object-contain opacity-90" />
              <p className="relative max-w-[16ch] font-display text-lg font-medium text-page-fg">Đăng ca mới để tìm người rảnh đúng ca!</p>
              <Link
                to="/dang-tin"
                className={cn('relative mt-4 inline-flex items-center justify-center gap-1.5 rounded-full bg-wm-azure px-5 py-2.5 text-sm font-medium text-wm-ivory hover:brightness-110', BTN_SM, FOCUS)}
              >
                Đăng tin <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </section>
          </FadeIn>
        </div>
      </div>
    </div>
  )
}
