import { SkeletonList, MatchScore } from '@components/dashboard'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, FileText, MapPin, Phone, Target, UserRound } from 'lucide-react'
import DetailNotFound from '@components/discover/detail/NotFound'
import { HireAction } from '@components/hire'
import { useSeekerReviews } from '@services/connectionService'
import InterviewAction from '@components/interview/InterviewAction'
import MessageLink from '@components/messenger/MessageLink'
import ReportButton from '@components/report/ReportButton'
import ConsiderButton from '@components/application/ConsiderButton'
import { useCatalogStore, type CatalogJob } from '@context/catalogStore'
import { useCompanyStore } from '@context/companyStore'
import { useConnectionStore } from '@context/connectionStore'
import { ScoreRing } from '@pages/public/match/parts'
import CandidateCvDialog from '@pages/public/match/CandidateCvDialog'
import { useCandidateMatches } from '@services/matchingService'
import { EmptyNote } from '@pages/public/personal/parts'
import { Card } from '@pages/public/personal/personalPrototypeParts'
import { SeekerProfileCards, type SeekerCardData } from '@pages/public/personal/SeekerProfileSections'
import '@pages/public/personal/personalPrototype.css'
import { fetchCandidateProfile, type CandidateProfile as Profile } from '@services/candidateService'
import { expressInterest, markApplicationViewed, usePairStatuses, withdrawInterest } from '@services/connectionService'
import { isFutureStart } from '@utils/format'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { BTN_PRIMARY, BTN_SECONDARY, BTN_SM } from '@utils/ui'
import cover from '@assets/images/personal-cover-preview.webp'
import backdrop from '@assets/images/page-bg-jobs-preview.webp'
import avatarDefault from '@assets/images/avatar-default.webp'

/**
 * Nút hành động theo trạng thái giữa doanh nghiệp và ứng viên ở một tin.
 * `compact` (khu đầu trang, khung CV): nhãn ngắn, kết nối rồi chỉ còn "Nhắn tin".
 */
function JobActions({ job, profile, compact }: { job: CatalogJob; profile: Profile; compact?: boolean }) {
  const status = usePairStatuses('recruiter')(job.id, profile.id)
  return (
    <>
      {status === 'none' && (
        <button type="button" className={cn(BTN_PRIMARY, BTN_SM)} onClick={() => expressInterest('recruiter', job.id, profile.id)}>
          {compact ? 'Quan tâm ứng viên' : 'Quan tâm'}<span className="sr-only"> cho vị trí {job.title}</span>
        </button>
      )}
      {status === 'received' && (job.visible ? (
        <>
          <button type="button" className={cn(BTN_PRIMARY, BTN_SM)} onClick={() => expressInterest('recruiter', job.id, profile.id)}>
            Đồng ý kết nối<span className="sr-only"> cho vị trí {job.title}</span>
          </button>
          <ConsiderButton jobId={job.id} seekerId={profile.id} className={cn(BTN_SECONDARY, BTN_SM)} srLabel={`cho vị trí ${job.title}`} />
        </>
      ) : (
        <p className="text-sm text-page-muted">Ứng viên đã ứng tuyển. Mở lại tin để đồng ý kết nối.</p>
      ))}
      {status === 'sent' && (
        <>
          {compact ? (
            <button type="button" disabled className={cn(BTN_SECONDARY, BTN_SM)}>
              <Check className="h-4 w-4" aria-hidden="true" />
              Đã quan tâm
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm text-page-muted">
              <Check className="h-4 w-4" aria-hidden="true" />
              Đã quan tâm, chờ phản hồi
            </span>
          )}
          <button type="button" onClick={() => withdrawInterest('recruiter', job.id, profile.id)} className={`rounded-control px-1 text-xs text-page-muted underline underline-offset-4 hover:text-page-fg ${FOCUS}`}>
            Rút<span className="sr-only"> quan tâm vị trí {job.title}</span>
          </button>
        </>
      )}
      {status === 'connected' && (
        <>
          <MessageLink convKey={`${job.id}|${profile.id}`} className={cn(BTN_SECONDARY, BTN_SM)}>
            Nhắn tin<span className="sr-only"> về vị trí {job.title}</span>
          </MessageLink>
          {!compact && (
            <>
              <InterviewAction viewer="recruiter" jobId={job.id} seekerId={profile.id} />
              <HireAction viewer="recruiter" jobId={job.id} seekerId={profile.id} />
            </>
          )}
        </>
      )}
    </>
  )
}

/** Một tin của công ty: độ phù hợp với ứng viên này và việc có thể làm tiếp */
function JobRow({ job, profile, score }: { job: CatalogJob; profile: Profile; score?: number }) {
  const status = usePairStatuses('recruiter')(job.id, profile.id)
  // Mở hồ sơ của người đã ứng tuyển = doanh nghiệp đã xem đơn đó
  useEffect(() => {
    if (status === 'received') markApplicationViewed(job.id, profile.id)
  }, [status, job.id, profile.id])
  return (
    <li className="py-5 first:pt-4 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-page-fg">{job.title}</p>
          <p className="mt-0.5 text-sm text-page-muted">{job.shiftLabel} · {job.salaryLabel}</p>
        </div>
        {score !== undefined && <MatchScore score={score} />}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <JobActions job={job} profile={profile} />
      </div>
    </li>
  )
}

/** /ung-vien/:id — trang cá nhân của ứng viên (chỉ xem) cho nhà tuyển dụng. Máy chủ quyết định phần nào được gửi về. */
export default function CandidateProfile() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  const [cvOpen, setCvOpen] = useState<{ origin: HTMLElement | null } | null>(null)
  // Vừa kết nối thì nạp lại để mở họ tên đầy đủ, số điện thoại, CV
  const connected = useConnectionStore((s) => s.connections.some((c) => c.seekerId === id))
  const companyId = useCompanyStore((s) => s.id)
  const allJobs = useCatalogStore((s) => s.jobs)
  const statusOf = usePairStatuses('recruiter')
  const reviews = useSeekerReviews(id)
  // Điểm với từng tin của công ty do máy chủ tính
  const { ready: scoresReady, outcomeOf } = useCandidateMatches(allJobs.filter((j) => j.companyId === companyId).map((j) => j.id))

  useEffect(() => {
    let alive = true
    fetchCandidateProfile(id)
      .then((p) => { if (alive) { setProfile(p); setState('ready') } })
      .catch((err: { response?: { status?: number } }) => { if (alive) setState(err.response?.status === 404 ? 'missing' : 'error') })
    return () => { alive = false }
  }, [id, connected])

  // Header trang cá nhân dùng bảng màu sáng riêng (cùng /ca-nhan)
  useEffect(() => {
    document.documentElement.dataset.personalPreview = ''
    return () => { delete document.documentElement.dataset.personalPreview }
  }, [])

  if (state === 'missing') {
    return <DetailNotFound title="Hồ sơ này không hiển thị" text="Ứng viên đã để hồ sơ ở chế độ riêng tư hoặc đường dẫn không còn đúng." />
  }
  if (state === 'error') {
    return <DetailNotFound title="Chưa tải được hồ sơ" text="Kết nối tới máy chủ đang có vấn đề, vui lòng thử lại sau." />
  }
  if (!profile) {
    return <div className="shell py-section-sm"><SkeletonList rows={4} label="Đang tải hồ sơ…" /></div>
  }

  // Tin còn nhận ứng viên, cùng những tin đã có quan hệ với người này dù nay đã ẩn
  const jobs = allJobs
    .filter((j) => j.companyId === companyId && (j.visible || statusOf(j.id, profile.id) !== 'none'))
    .map((job) => ({ job, score: outcomeOf(job.id, profile.id)?.score }))
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
  const best = jobs[0]
  const area = profile.fullArea || profile.area
  const data: SeekerCardData = {
    area,
    jobTypes: profile.criteria.jobTypes,
    availableFrom: isFutureStart(profile.availableFrom) ? profile.availableFrom : null,
    salaryMinK: profile.criteria.salaryMinK,
    availability: profile.criteria.slots,
    skills: profile.criteria.skills,
    skillLevels: profile.skillLevels,
    hobbies: profile.hobbies,
    about: profile.about || profile.summary,
    experience: profile.experience.map((e) => ({ ...e, bullets: e.bullets ?? [] })),
  }
  const quiet = 'personal-preview-edit-link'

  return (
    <div className="personal-preview theme-day relative isolate min-h-[calc(100svh-72px)] overflow-hidden text-page-fg" data-surface="light">
      <div aria-hidden className="personal-preview-backdrop pointer-events-none absolute inset-0 -z-10" style={{ backgroundImage: `url(${backdrop})` }} />
      <div className="mx-auto max-w-[1328px] px-4 pb-12 pt-6 sm:px-6 lg:px-10 lg:pt-7">
        <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/match'))} className={`mb-3 inline-flex items-center gap-2 rounded-control text-sm text-page-muted transition-colors duration-fast hover:text-page-fg ${FOCUS}`}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Quay lại
        </button>
        <header className="personal-preview-cover relative overflow-hidden rounded-card">
          <img src={cover} alt="" width={1800} height={600} className="absolute inset-0 h-full w-full object-cover object-right" decoding="async" />
          <div aria-hidden className="personal-preview-cover-veil absolute inset-0" />
          <div className="relative flex flex-col items-center gap-5 px-6 py-7 text-center sm:flex-row sm:px-8 sm:text-left lg:gap-7 lg:py-8">
            <img src={profile.avatarUrl || avatarDefault} alt={`Ảnh đại diện của ${profile.name}`} className="personal-preview-avatar h-28 w-28 shrink-0 rounded-full object-cover lg:h-36 lg:w-36" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:justify-start">
                <h1 className="min-w-0 max-w-full break-words font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-[34px]">{profile.name}</h1>
                <span className="personal-preview-chip">Ứng viên</span>
              </div>
              {profile.headline && <p className="mt-2 break-words text-sm font-medium">{profile.headline}</p>}
              <p className="mt-3 inline-flex items-center gap-2 text-sm"><MapPin aria-hidden className="h-4 w-4 text-wm-ocean" />{area || 'Chưa nêu khu vực'}</p>
              <div className="mt-3 flex flex-col items-center gap-x-6 gap-y-2 text-sm sm:flex-row sm:flex-wrap sm:items-start">
                <p className="flex items-center gap-2"><UserRound aria-hidden className="h-4 w-4 shrink-0 text-wm-ocean" />{profile.working ? 'Đang đi làm' : 'Sẵn sàng nhận việc'}</p>
                {profile.connected ? (
                  <p className="flex items-center gap-2"><Phone aria-hidden className="h-4 w-4 shrink-0 text-wm-ocean" />
                    {profile.phone ? <a href={`tel:${profile.phone}`} className={`rounded-control font-medium ${FOCUS}`}>{profile.phone}</a> : 'Ứng viên chưa cập nhật số điện thoại'}
                  </p>
                ) : (
                  <p className="flex items-center gap-2 text-page-muted"><Phone aria-hidden className="h-4 w-4 shrink-0 text-wm-ocean" />Họ tên đầy đủ và số điện thoại hiện sau khi hai bên kết nối</p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-3 sm:items-start">
              {best && best.score !== undefined && (
                <div className="flex items-center gap-3">
                  <ScoreRing value={Math.round(best.score)} />
                  <p className="min-w-0 max-w-[14rem] text-left text-xs leading-5 text-page-muted">Phù hợp nhất với tin <span className="font-medium text-page-fg">{best.job.title}</span></p>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {best && <JobActions job={best.job} profile={profile} compact />}
                <button type="button" className={cn(BTN_SECONDARY, BTN_SM, quiet)} onClick={(e) => setCvOpen({ origin: e.currentTarget })}>
                  <FileText aria-hidden className="h-3.5 w-3.5" />Xem CV
                </button>
                <ReportButton target="seeker" targetId={profile.id} name={profile.name} />
              </div>
              {best && <p className="max-w-[20rem] text-xs text-page-muted">Cho tin: {best.job.title}</p>}
            </div>
          </div>
        </header>

        <div className="personal-preview-grid mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.95fr)]">
          <SeekerProfileCards
            viewer
            data={data}
            reviews={reviews}
            details={[{ icon: MapPin, label: 'Cách công ty', value: `${profile.distanceKm.toLocaleString('vi-VN')} km` }, { icon: Target, label: 'Đi làm trong bán kính', value: `${profile.criteria.maxDistanceKm} km` }]}
            rightTop={
              <Card title="Phù hợp với tin của bạn" icon={Target}>
                {!scoresReady && jobs.length ? (
                  <SkeletonList rows={2} label="Đang tính độ phù hợp…" />
                ) : jobs.length ? (
                  <ul className="mt-2 divide-y divide-page-line">
                    {jobs.map(({ job, score }) => <JobRow key={job.id} job={job} profile={profile} score={score} />)}
                  </ul>
                ) : (
                  <div className="mt-4"><EmptyNote invite={{ to: '/dang-tin', label: 'Đăng tin tuyển dụng' }}>Công ty chưa có tin đang hiển thị để so với hồ sơ này.</EmptyNote></div>
                )}
              </Card>
            }
          />
        </div>
        <p className="mt-5 text-center text-xs leading-relaxed text-page-muted">
          Tìm thêm người khác ở <Link to="/tuyen-dung/tim-ung-vien" className={`rounded-control text-page-fg underline underline-offset-4 ${FOCUS}`}>Tìm ứng viên</Link>.
        </p>
      </div>
      {cvOpen && (
        <CandidateCvDialog
          seekerId={profile.id}
          name={profile.name}
          score={best?.score}
          origin={cvOpen.origin}
          onClosed={() => setCvOpen(null)}
          actions={() => best && <JobActions job={best.job} profile={profile} compact />}
        />
      )}
    </div>
  )
}
