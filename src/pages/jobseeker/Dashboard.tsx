import { Link } from 'react-router-dom'
import { ArrowRight, Bookmark, BarChart3, Briefcase, CalendarCheck, CalendarDays, ClipboardList, History, MapPin, Sparkles, UserRound, Zap } from 'lucide-react'
import CompanyLogo from '@components/common/CompanyLogo'
import { useAuthStore } from '@context/authStore'
import { JOB_TYPES } from '@constants/index'
import { EmptyState, MatchScore, SkeletonList, StatusBadge } from '@components/dashboard'
import { useCatalogStore } from '@context/catalogStore'
import { useMatchStore } from '@context/matchStore'
import { useProfileStore } from '@context/profileStore'
import { useInterviews, useMyPairs } from '@services/connectionService'
import { describeConversation } from '@pages/public/messages/describe'
import { formatRelativeTime } from '@utils/format'
import { useAllJobs, useSeekerOutcomes } from '@pages/public/jobs/catalog'
import { companyOf } from '@pages/public/match/data'
import { completeness, sectionStatus } from '@pages/public/profile/useProfileDraft'
import { FOCUS } from '@utils/focus'
import { BTN_SM } from '@utils/ui'
import { cn } from '@utils/cn'
import FadeIn from '@components/motion/FadeIn'
import briefcaseArt from '@assets/images/home/hero-art-briefcase.webp'
import {
  CardLink, EditPencil, EmptyHint, JD_CHIP, JdCard, OverviewTabs, ProfileHero, SkillTile, WeekStrip, durationOf,
} from './overview/parts'

/**
 * Tổng quan người tìm việc (/tim-viec) — bố cục theo mẫu xanh kính của chủ dự án (2026-11-21), dữ liệu thật:
 *   hồ sơ/kinh nghiệm/kỹ năng/lịch rảnh: profileStore · số liệu: useMyPairs, matchStore, useInterviews ·
 *   việc phù hợp: catalog + useSeekerOutcomes · mức hoàn thiện: completeness/sectionStatus (trang /ho-so).
 */
export default function JobseekerDashboard() {
  const user = useAuthStore((s) => s.user)
  const profile = useProfileStore((s) => s.profile)
  const avatarUrl = useProfileStore((s) => s.avatarUrl)
  const name = profile.fullName.trim() || user?.displayName || user?.email?.split('@')[0] || 'Bạn'
  const draft = { ...profile, avatarUrl }
  const percent = completeness(draft)
  const nextMissing = sectionStatus(draft).find((s) => !s.done)

  const pairs = useMyPairs('seeker')
  const savedCount = useMatchStore((s) => s.savedJobs.length)
  const interviews = useInterviews()
  const now = new Date().toISOString()
  const upcoming = interviews.filter((iv) => iv.status === 'confirmed' && (iv.chosen ?? iv.slots[0]) > now).length
  const appliedCount = pairs.filter((p) => p.status === 'sent' || p.status === 'connected').length
  const connectedCount = pairs.filter((p) => p.status === 'connected').length
  const recent = pairs.slice(0, 3)
  // 3 việc điểm cao nhất theo cách tính chung (catalog.ts)
  const allJobs = useAllJobs()
  const catalogLoaded = useCatalogStore((s) => s.loaded)
  const { ready: scoresReady, outcomeOf } = useSeekerOutcomes()
  const jobs = allJobs.flatMap((job) => { const outcome = outcomeOf(job); return outcome ? [{ job, outcome }] : [] })
    .sort((a, b) => b.outcome.score - a.outcome.score)
    .slice(0, 3)

  // Dòng tiêu đề dưới tên: kinh nghiệm gần nhất, không có thì loại việc mong muốn
  const first = profile.experience[0]
  const jobTypeLabels = profile.jobTypes.map((t) => JOB_TYPES.find((j) => j.value === t)?.label).filter(Boolean) as string[]
  const headline = first ? `${first.title} · ${first.company}` : jobTypeLabels.length ? `Tìm việc ${jobTypeLabels.slice(0, 2).join(', ').toLowerCase()}` : 'Đang tìm việc linh hoạt'

  const stats = [
    { label: 'Đã ứng tuyển', value: appliedCount, icon: ClipboardList, href: '/tim-viec/ung-tuyen', tone: 'text-wm-cyan' },
    { label: 'Việc đã lưu', value: savedCount, icon: Bookmark, href: '/tim-viec/da-luu', tone: 'text-wm-amber-light' },
    { label: 'Kết nối', value: connectedCount, icon: Zap, href: '/tim-viec/match', tone: 'text-wm-leaf' },
    { label: 'Phỏng vấn sắp tới', value: upcoming, icon: CalendarCheck, href: '/lich-phong-van', tone: 'text-wm-rust-light' },
  ]

  return (
    <div className="space-y-5 md:space-y-6">
      <ProfileHero profile={profile} name={name} email={user?.email ?? ''} avatarUrl={avatarUrl} headline={headline} />
      <OverviewTabs />

      <div className="grid items-start gap-5 md:gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* Cột trái */}
        <div className="min-w-0 space-y-5 md:space-y-6">
          <FadeIn>
            <JdCard id="jd-tong-quan" icon={BarChart3} title="Thống kê của bạn">
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
            </JdCard>
          </FadeIn>

          <FadeIn>
            <JdCard id="jd-lich-ranh" icon={CalendarDays} title="Lịch rảnh của bạn" action={<CardLink to="/ho-so#lich-ranh">Xem chi tiết</CardLink>}>
              {profile.availability.length === 0 ? (
                <EmptyHint text="Bạn chưa chọn ca rảnh nào." to="/ho-so#lich-ranh" label="Chọn lịch rảnh" />
              ) : (
                <WeekStrip availability={profile.availability} />
              )}
            </JdCard>
          </FadeIn>

          <FadeIn>
            <JdCard id="jd-kinh-nghiem" icon={Briefcase} title="Kinh nghiệm làm việc" action={<CardLink to="/ho-so#kinh-nghiem">Xem hết</CardLink>}>
              {profile.experience.length === 0 ? (
                <EmptyHint text="Bạn chưa thêm kinh nghiệm nào." to="/ho-so#kinh-nghiem" label="Thêm kinh nghiệm" />
              ) : (
                <ul className="divide-y divide-page-line">
                  {profile.experience.slice(0, 3).map((e) => {
                    const dur = durationOf(e.period)
                    return (
                      <li key={e.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                        <CompanyLogo name={e.company} decorative className="h-12 w-12 text-sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-page-fg">{e.company}</p>
                          <p className="truncate text-sm text-page-muted">{e.title}</p>
                          <p className="tnum text-xs text-page-muted">{e.period}</p>
                        </div>
                        {dur && <span className="jd-field flex-shrink-0 rounded-full px-3 py-1 text-xs text-page-fg">{dur}</span>}
                      </li>
                    )
                  })}
                </ul>
              )}
            </JdCard>
          </FadeIn>

          <FadeIn>
            <JdCard id="jd-viec-phu-hop" icon={Sparkles} title="Việc phù hợp với bạn" action={<CardLink to="/tim-viec/phu-hop">Xem việc phù hợp</CardLink>}>
              {(!catalogLoaded || !scoresReady) && jobs.length === 0 ? (
                <SkeletonList rows={3} label="Đang tải việc phù hợp…" />
              ) : jobs.length === 0 ? (
                <EmptyHint text="Chưa có việc nào khớp với hồ sơ." to="/ho-so#mong-muon" label="Chỉnh mong muốn" />
              ) : (
                <ul className="divide-y divide-page-line">
                  {jobs.map(({ job, outcome }) => (
                    <li key={job.id} className="group/row -mx-3 flex flex-col gap-3 rounded-control px-3 py-4 transition-colors duration-base ease-out hover:bg-page-fg/5 focus-within:bg-page-fg/5 motion-reduce:transition-none sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <Link to={`/viec-lam/${job.id}`} className={cn('rounded-control font-medium text-page-fg underline-offset-4 hover:underline', FOCUS)}>
                          {job.title}
                        </Link>
                        <p className="mt-1 flex items-center gap-2 text-sm text-page-muted">
                          <CompanyLogo name={companyOf(job.companyId).name} logoUrl={companyOf(job.companyId).logoUrl} decorative className="h-5 w-5 text-[9px]" />
                          {companyOf(job.companyId).name}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-page-muted">
                          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden="true" />{job.district}, Đà Nẵng</span>
                          <span>{job.salaryLabel}</span>
                          <span>{JOB_TYPES.find((t) => t.value === job.jobType)?.label}</span>
                        </p>
                      </div>
                      <MatchScore score={outcome.score} size="sm" reactive />
                    </li>
                  ))}
                </ul>
              )}
            </JdCard>
          </FadeIn>

          <FadeIn>
            <JdCard id="jd-hoat-dong" icon={History} title="Hoạt động gần đây" action={<CardLink to="/tim-viec/ung-tuyen">Xem đơn ứng tuyển</CardLink>}>
              {recent.length === 0 ? (
                <EmptyState icon={ClipboardList} title="Chưa có đơn ứng tuyển" description="Hãy ứng tuyển việc đầu tiên." />
              ) : (
                <ul className="divide-y divide-page-line">
                  {recent.map((p) => {
                    const info = describeConversation('seeker', p.jobId, p.seekerId)
                    return (
                      <li key={`${p.jobId}|${p.seekerId}`} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="font-medium text-page-fg">{info.subtitle}</p>
                          <p className="text-sm text-page-muted">{info.name} · {formatRelativeTime(p.at)}</p>
                        </div>
                        <StatusBadge tone={p.status === 'connected' ? 'accent' : p.status === 'sent' ? 'neutral' : 'soft'}>
                          {p.status === 'connected' ? 'Đã kết nối' : p.status === 'sent' ? 'Chờ phản hồi' : 'Doanh nghiệp quan tâm bạn'}
                        </StatusBadge>
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
            <JdCard icon={UserRound} title="Giới thiệu bản thân" action={<EditPencil to="/ho-so#ve-ban" label="Sửa giới thiệu" />}>
              {profile.about.trim() || profile.intro.trim() ? (
                <p className="text-sm leading-relaxed text-page-fg">{profile.about.trim() || profile.intro.trim()}</p>
              ) : (
                <EmptyHint text="Bạn chưa viết giới thiệu." to="/ho-so#ve-ban" label="Viết giới thiệu" />
              )}
              {jobTypeLabels.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-2" aria-label="Loại việc mong muốn">
                  {jobTypeLabels.map((l) => <li key={l} className={JD_CHIP}>{l}</li>)}
                </ul>
              )}
            </JdCard>
          </FadeIn>

          <FadeIn>
            <JdCard id="jd-ky-nang" icon={Sparkles} title="Kỹ năng nổi bật" action={<CardLink to="/ho-so#ky-nang">Xem hết</CardLink>}>
              {profile.skills.length === 0 ? (
                <EmptyHint text="Bạn chưa thêm kỹ năng nào." to="/ho-so#ky-nang" label="Thêm kỹ năng" />
              ) : (
                <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {profile.skills.slice(0, 6).map((s) => <SkillTile key={s} label={s} />)}
                </ul>
              )}
            </JdCard>
          </FadeIn>

          <FadeIn>
            <JdCard icon={UserRound} title="Hồ sơ của bạn" action={<CardLink to="/ho-so">Hoàn thiện</CardLink>}>
              <p className="tnum font-display text-3xl font-semibold text-page-fg">{percent}%</p>
              <div
                role="progressbar"
                aria-label="Mức hoàn thiện hồ sơ"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                className="mt-3 h-1.5 overflow-hidden rounded-full bg-page-line"
              >
                <div className="h-full rounded-full bg-wm-cyan" style={{ width: `${percent}%` }} />
              </div>
              <p className="mt-4 text-sm leading-relaxed text-page-muted">
                {nextMissing
                  ? `Còn thiếu phần ${nextMissing.label.toLowerCase()}. Hồ sơ càng đầy đủ, việc gợi ý càng sát với bạn.`
                  : 'Hồ sơ của bạn đã đủ các phần. Giữ lịch rảnh luôn mới để nhận việc sát hơn.'}
              </p>
              <Link
                to={nextMissing ? `/ho-so#${nextMissing.id}` : '/ho-so'}
                className={cn('mt-5 inline-flex items-center justify-center gap-1.5 rounded-full bg-wm-cyan px-5 py-2.5 text-sm font-medium text-wm-abyss hover:brightness-110', BTN_SM, FOCUS)}
              >
                Cập nhật hồ sơ <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </JdCard>
          </FadeIn>

          <FadeIn>
            <section aria-label="Khám phá việc làm" className="jd-card jd-lift jd-promo relative overflow-hidden p-5 md:p-6">
              <img src={briefcaseArt} alt="" width={160} height={160} loading="lazy" className="pointer-events-none absolute -bottom-4 -right-3 h-28 w-28 select-none object-contain opacity-90" />
              <p className="relative max-w-[16ch] font-display text-lg font-medium text-page-fg">Khám phá thêm cơ hội việc làm phù hợp với bạn!</p>
              <Link
                to="/viec-lam"
                className={cn('relative mt-4 inline-flex items-center justify-center gap-1.5 rounded-full bg-wm-azure px-5 py-2.5 text-sm font-medium text-wm-ivory hover:brightness-110', BTN_SM, FOCUS)}
              >
                Tìm việc ngay <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </section>
          </FadeIn>
        </div>
      </div>
    </div>
  )
}
