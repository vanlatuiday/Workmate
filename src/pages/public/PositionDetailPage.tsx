import { Eye } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { STATUS_LABEL } from '@components/admin/parts'
import { Facts, PrimaryLink, TextLink } from '@components/discover/parts'
import DetailHero from '@components/discover/detail/DetailHero'
import DetailLayout from '@components/discover/detail/DetailLayout'
import DetailNotFound from '@components/discover/detail/NotFound'
import DetailSkeleton from '@components/discover/detail/DetailSkeleton'
import BackLink from '@components/discover/detail/BackLink'
import CandidateCard from '@components/discover/detail/CandidateCard'
import { TextBlock } from '@components/discover/detail/DetailBlocks'
import { JOB_TYPES } from '@constants/index'
import { useCandidateStore } from '@context/candidateStore'
import { useCatalogStore } from '@context/catalogStore'
import { useCompanyStore } from '@context/companyStore'
import { JOB_STATUS_LABELS } from '@pages/recruiter/mockData'
import { FIT_MIN_SCORE, fitCandidatesOf } from '@services/adminService'

const MAX_SHOWN = 20

/** /vi-tri/:id — chi tiết một tin của công ty mình, kèm ứng viên phù hợp. */
export default function PositionDetailPage() {
  const { id } = useParams()
  const companyId = useCompanyStore((s) => s.id)
  const job = useCatalogStore((s) => s.jobs.find((j) => j.id === id))
  const catalogSettled = useCatalogStore((s) => s.settled)
  useCandidateStore((s) => s.list) // fitCandidatesOf đọc thẳng kho; đăng ký để tính lại khi nạp xong

  if (!companyId || (!job && !catalogSettled)) return <DetailSkeleton label="Đang tải vị trí…" />
  if (!job || job.companyId !== companyId) {
    return <DetailNotFound title="Không tìm thấy vị trí" text="Tin này không thuộc công ty của bạn hoặc đường dẫn đã thay đổi." />
  }

  const candidates = fitCandidatesOf(job)
  const statusLabel = job.moderation === 'approved' ? JOB_STATUS_LABELS[job.status] : STATUS_LABEL[job.moderation]
  const typeLabel = JOB_TYPES.find((t) => t.value === job.jobType)?.label ?? job.jobType

  const aside = (
    <>
      {job.description && <p className="max-w-sm whitespace-pre-line text-base leading-relaxed md:text-lg">{job.description}</p>}
      <Facts
        rows={[
          ['Trạng thái', statusLabel],
          ['Loại việc', typeLabel],
          ['Lịch', job.shiftLabel],
          ['Lương', job.salaryLabel],
          ['Cần tuyển', `${job.quantity} người`],
          ...(job.views !== undefined ? [['Lượt xem', <span key="v" className="tnum inline-flex items-center gap-1.5"><Eye className="h-4 w-4" aria-hidden="true" />{job.views.toLocaleString('vi-VN')} lượt xem</span>] as [string, React.ReactNode]] : []),
        ]}
      />
      {job.moderationReason && <p className="mt-4 text-sm text-page-muted">Lý do từ quản trị viên: {job.moderationReason}</p>}
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
        <PrimaryLink accent to="/tuyen-dung/tin-dang">Quản lý tin</PrimaryLink>
        <TextLink to="/viec-lam">Các vị trí khác</TextLink>
      </div>
    </>
  )

  return (
    <article className="pb-section-sm">
      <DetailHero back={<BackLink />} eyebrow={`${statusLabel} · ${typeLabel}`} title={job.title} photo={job.photo} />

      <DetailLayout aside={aside}>
        {!job.visible && (
          <p className="rounded-card border border-page-line p-4 text-sm text-page-muted">
            Tin này chưa hiển thị với người tìm việc nên chưa thể quan tâm ứng viên cho tin này.
          </p>
        )}
        {candidates.length ? (
          <>
            <TextBlock title="Ứng viên phù hợp">
              <p className="leading-relaxed text-page-muted">
                {candidates.length} ứng viên đạt từ {FIT_MIN_SCORE}% với tin này, xếp theo mức phù hợp. Họ tên đầy đủ và liên hệ chỉ mở sau khi hai bên kết nối.
              </p>
            </TextBlock>
            {candidates.slice(0, MAX_SHOWN).map(({ c, score }) => (
              <CandidateCard key={c.id} c={c} score={score} slots={job.slots} jobId={job.id} />
            ))}
          </>
        ) : (
          <TextBlock title="Chưa có ứng viên phù hợp">
            <p className="max-w-xl text-base leading-relaxed md:text-lg">
              Chưa có ai đạt từ {FIT_MIN_SCORE}% với tin này. Thử mở rộng lịch làm hoặc nới yêu cầu kỹ năng để có thêm người phù hợp.
            </p>
            <div className="mt-6">
              <PrimaryLink to="/tuyen-dung/tin-dang">Chỉnh sửa tin</PrimaryLink>
            </div>
          </TextBlock>
        )}
      </DetailLayout>
    </article>
  )
}
