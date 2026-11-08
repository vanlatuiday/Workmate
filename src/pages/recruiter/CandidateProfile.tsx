import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { ArrowLeft, Check, Download, FileText } from 'lucide-react'
import { MatchScore } from '@components/dashboard'
import { Facts } from '@components/discover/parts'
import { TextBlock, TagList } from '@components/discover/detail/DetailBlocks'
import DetailLayout from '@components/discover/detail/DetailLayout'
import DetailNotFound from '@components/discover/detail/NotFound'
import { HireAction, SeekerReviews } from '@components/hire'
import InterviewAction from '@components/interview/InterviewAction'
import MessageLink from '@components/messenger/MessageLink'
import ReportButton from '@components/report/ReportButton'
import { JOB_TYPES } from '@constants/index'
import { useCatalogStore, type CatalogJob } from '@context/catalogStore'
import { useCompanyStore } from '@context/companyStore'
import { useConnectionStore } from '@context/connectionStore'
import { BTN_PRIMARY, BTN_SECONDARY, personInitials } from '@pages/public/match/parts'
import { scoreMatch } from '@pages/public/match/score'
import { EmptyNote, WeekGrid } from '@pages/public/personal/parts'
import { apiErrorMessage } from '@services/authService'
import { candidateCvUrl, fetchCandidateProfile, type CandidateProfile as Profile } from '@services/candidateService'
import { expressInterest, usePairStatuses, withdrawInterest } from '@services/connectionService'
import { FOCUS } from '@utils/focus'

/** Mở CV ở tab mới. Mở tab trước khi chờ máy chủ để trình duyệt không chặn cửa sổ bật lên */
async function openCv(seekerId: string, download: boolean) {
  const tab = window.open('', '_blank')
  try {
    const url = await candidateCvUrl(seekerId, download)
    if (tab) tab.location.href = url
    else window.location.href = url
  } catch (err) {
    tab?.close()
    toast.error(apiErrorMessage(err, 'Chưa mở được CV, vui lòng thử lại.'))
  }
}

/** Một tin của công ty: độ phù hợp với ứng viên này và việc có thể làm tiếp */
function JobRow({ job, profile }: { job: CatalogJob; profile: Profile }) {
  const status = usePairStatuses('recruiter')(job.id, profile.id)
  const score = scoreMatch(profile.criteria, job, profile.distanceKm).score
  return (
    <li className="py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-medium text-page-fg">{job.title}</p>
          <p className="mt-0.5 text-sm text-page-muted">{job.shiftLabel} · {job.salaryLabel}</p>
        </div>
        <MatchScore score={score} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {status === 'none' && (
          <button type="button" className={BTN_PRIMARY} onClick={() => { expressInterest('recruiter', job.id, profile.id); toast.success('Đã quan tâm, chờ ứng viên phản hồi') }}>
            Quan tâm<span className="sr-only"> cho vị trí {job.title}</span>
          </button>
        )}
        {status === 'received' && (job.visible ? (
          <button type="button" className={BTN_PRIMARY} onClick={() => expressInterest('recruiter', job.id, profile.id)}>
            Đồng ý kết nối<span className="sr-only"> cho vị trí {job.title}</span>
          </button>
        ) : (
          <p className="text-sm text-page-muted">Ứng viên đã ứng tuyển. Mở lại tin để đồng ý kết nối.</p>
        ))}
        {status === 'sent' && (
          <>
            <span className="inline-flex items-center gap-1.5 text-sm text-page-muted">
              <Check className="h-4 w-4" aria-hidden="true" />
              Đã quan tâm, chờ phản hồi
            </span>
            <button type="button" onClick={() => withdrawInterest('recruiter', job.id, profile.id)} className={`rounded-control px-1 text-xs text-page-muted underline underline-offset-4 hover:text-page-fg ${FOCUS}`}>
              Rút<span className="sr-only"> quan tâm vị trí {job.title}</span>
            </button>
          </>
        )}
        {status === 'connected' && (
          <>
            <MessageLink convKey={`${job.id}|${profile.id}`} className={BTN_SECONDARY}>
              Nhắn tin<span className="sr-only"> về vị trí {job.title}</span>
            </MessageLink>
            <InterviewAction viewer="recruiter" jobId={job.id} seekerId={profile.id} />
            <HireAction viewer="recruiter" jobId={job.id} seekerId={profile.id} />
          </>
        )}
      </div>
    </li>
  )
}

/** /ung-vien/:id — hồ sơ ứng viên nhà tuyển dụng được xem. Máy chủ quyết định phần nào được gửi về. */
export default function CandidateProfile() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading')
  // Vừa kết nối thì nạp lại để mở họ tên đầy đủ, số điện thoại, CV
  const connected = useConnectionStore((s) => s.connections.some((c) => c.seekerId === id))
  const companyId = useCompanyStore((s) => s.id)
  const allJobs = useCatalogStore((s) => s.jobs)
  const statusOf = usePairStatuses('recruiter')

  useEffect(() => {
    let alive = true
    fetchCandidateProfile(id)
      .then((p) => { if (alive) { setProfile(p); setState('ready') } })
      .catch((err: { response?: { status?: number } }) => { if (alive) setState(err.response?.status === 404 ? 'missing' : 'error') })
    return () => { alive = false }
  }, [id, connected])

  if (state === 'missing') {
    return <DetailNotFound title="Hồ sơ này không hiển thị" text="Ứng viên đã ẩn hồ sơ hoặc đường dẫn không còn đúng." />
  }
  if (state === 'error') {
    return <DetailNotFound title="Chưa tải được hồ sơ" text="Kết nối tới máy chủ đang có vấn đề, vui lòng thử lại sau." />
  }
  if (!profile) {
    return <p role="status" className="shell py-section-sm text-sm text-page-muted">Đang tải hồ sơ…</p>
  }

  // Tin còn nhận ứng viên, cùng những tin đã có quan hệ với người này dù nay đã ẩn
  const jobs = allJobs
    .filter((j) => j.companyId === companyId && (j.visible || statusOf(j.id, profile.id) !== 'none'))
    .map((job) => ({ job, score: scoreMatch(profile.criteria, job, profile.distanceKm).score }))
    .sort((a, b) => b.score - a.score)
  const typeLabels = profile.criteria.jobTypes.map((t) => JOB_TYPES.find((j) => j.value === t)?.label ?? t)

  const aside = (
    <>
      {profile.avatarUrl ? (
        <img src={profile.avatarUrl} alt={`Ảnh đại diện của ${profile.name}`} className="h-20 w-20 rounded-full border border-page-line object-cover" />
      ) : (
        <span aria-hidden="true" className="grid h-20 w-20 place-items-center rounded-full border border-page-line bg-page-surface font-display text-xl font-semibold">
          {personInitials(profile.name)}
        </span>
      )}
      {profile.summary && <p className="mt-5 max-w-sm text-base leading-relaxed md:text-lg">{profile.summary}</p>}
      <Facts
        rows={[
          ['Tình trạng', profile.working ? 'Đang đi làm' : 'Sẵn sàng'],
          ['Khu vực', profile.fullArea || profile.area || 'Chưa nêu'],
          ['Cách công ty', `${profile.distanceKm.toLocaleString('vi-VN')} km`],
          ['Lương mong muốn', `từ ${profile.criteria.salaryMinK}.000đ/giờ`],
          ['Đi làm trong', `${profile.criteria.maxDistanceKm} km`],
        ]}
      />
      <section aria-label="Liên hệ" className="mt-6">
        {profile.connected ? (
          <>
            <p className="text-sm text-page-muted">Số điện thoại</p>
            {profile.phone
              ? <a href={`tel:${profile.phone}`} className={`mt-1 inline-block rounded-control font-display text-lg font-semibold ${FOCUS}`}>{profile.phone}</a>
              : <p className="mt-1 text-sm">Ứng viên chưa cập nhật</p>}
            {profile.hasCv ? (
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" className={BTN_SECONDARY} onClick={() => void openCv(profile.id, false)}>
                  <FileText className="h-4 w-4" aria-hidden="true" />
                  Xem CV
                </button>
                <button type="button" className={BTN_SECONDARY} onClick={() => void openCv(profile.id, true)}>
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Tải CV
                </button>
              </div>
            ) : (
              <p className="mt-4 text-sm text-page-muted">Ứng viên chưa tải CV lên.</p>
            )}
          </>
        ) : (
          <p className="rounded-card border border-page-line p-4 text-sm text-page-muted">
            Họ tên đầy đủ, số điện thoại và CV sẽ hiện sau khi hai bên kết nối.
          </p>
        )}
      </section>
      <div className="mt-6"><ReportButton target="seeker" targetId={profile.id} name={profile.name} /></div>
    </>
  )

  return (
    <article className="pb-section-sm">
      <header className="shell pt-10 md:pt-14">
        <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/match'))} className={`inline-flex items-center gap-2 rounded-control text-sm text-page-muted transition-colors duration-300 hover:text-page-fg ${FOCUS}`}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Quay lại
        </button>
        <p className="eyebrow mt-8 flex text-page-muted">Hồ sơ ứng viên</p>
        <h1 className="mt-4 font-display text-display-sm font-semibold text-page-fg">{profile.name}</h1>
      </header>

      <DetailLayout aside={aside}>
        <TextBlock title="Phù hợp với tin của bạn">
          {jobs.length ? (
            <ul className="divide-y divide-page-line border-y border-page-line">
              {jobs.map(({ job }) => <JobRow key={job.id} job={job} profile={profile} />)}
            </ul>
          ) : (
            <EmptyNote invite={{ to: '/dang-tin', label: 'Đăng tin tuyển dụng' }}>Công ty chưa có tin đang hiển thị để so với hồ sơ này.</EmptyNote>
          )}
        </TextBlock>

        <TextBlock title="Về ứng viên">
          {profile.about
            ? <p className="whitespace-pre-line text-base leading-relaxed md:text-lg">{profile.about}</p>
            : <EmptyNote>Ứng viên chưa viết phần giới thiệu.</EmptyNote>}
        </TextBlock>

        <TextBlock title="Kỹ năng">
          {profile.criteria.skills.length ? <TagList items={profile.criteria.skills} /> : <EmptyNote>Ứng viên chưa nêu kỹ năng.</EmptyNote>}
        </TextBlock>

        <TextBlock title="Kinh nghiệm">
          {profile.experience.length ? (
            <ol className="space-y-4 border-l border-page-line pl-5">
              {profile.experience.map((e) => (
                <li key={e.id} className="relative">
                  <span aria-hidden="true" className="absolute -left-[25px] top-2 h-2 w-2 rounded-full bg-page-fg" />
                  <p className="font-medium">{e.title}</p>
                  <p className="text-sm text-page-muted">{[e.company, e.period].filter(Boolean).join(' · ')}</p>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyNote>Ứng viên chưa nêu kinh nghiệm.</EmptyNote>
          )}
        </TextBlock>

        <TextBlock title="Lịch rảnh trong tuần">
          <WeekGrid on={new Set(profile.criteria.slots)} />
        </TextBlock>

        <TextBlock title="Loại việc mong muốn">
          {typeLabels.length ? <TagList items={typeLabels} /> : <EmptyNote>Ứng viên chưa nêu loại việc.</EmptyNote>}
        </TextBlock>

        <SeekerReviews seekerId={profile.id} />

        <p className="text-sm text-page-muted">
          Tìm thêm người khác ở <Link to="/tuyen-dung/tim-ung-vien" className={`rounded-control text-page-fg underline underline-offset-4 ${FOCUS}`}>Tìm ứng viên</Link>.
        </p>
      </DetailLayout>
    </article>
  )
}
