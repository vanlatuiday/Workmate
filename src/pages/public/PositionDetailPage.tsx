import { useParams } from 'react-router-dom'
import { JOB_STATUS_LABELS } from '@pages/recruiter/mockData'
import { Facts, PrimaryLink, TextLink } from '@components/discover/parts'
import DetailHero from '@components/discover/detail/DetailHero'
import DetailLayout from '@components/discover/detail/DetailLayout'
import DetailNotFound from '@components/discover/detail/NotFound'
import BackLink from '@components/discover/detail/BackLink'
import CandidateCard from '@components/discover/detail/CandidateCard'
import { TextBlock } from '@components/discover/detail/DetailBlocks'
import ReportButton from '@components/report/ReportButton'
import { candidatesOf, findPosition } from './jobs/data'

/** /vi-tri/:id — chi tiết một tin tuyển dụng, dành cho nhà tuyển dụng (dữ liệu mẫu). */
export default function PositionDetailPage() {
  const { id } = useParams()
  const position = findPosition(id)

  if (!position) {
    return (
      <DetailNotFound
        title="Không tìm thấy vị trí"
        text="Tin này không có trong dữ liệu mẫu hoặc đường dẫn đã thay đổi."
      />
    )
  }

  const p = position
  const candidates = p.status === 'draft' ? [] : candidatesOf(p.id)

  const aside = (
    <>
      <p className="max-w-sm text-base md:text-lg leading-relaxed">{p.need}</p>
      <Facts
        rows={[
          ['Trạng thái', JOB_STATUS_LABELS[p.status]],
          ['Loại việc', p.jobType],
          ['Lịch', p.schedule],
          ['Lương', p.salary],
          ['Lượt xem', p.views],
        ]}
      />
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
        <PrimaryLink to="/tuyen-dung/tin-dang">Quản lý tin</PrimaryLink>
        <TextLink to="/viec-lam">Các vị trí khác</TextLink>
      </div>
    </>
  )

  return (
    <article className="pb-section-sm">
      <DetailHero back={<BackLink />} eyebrow={`${JOB_STATUS_LABELS[p.status]} · ${p.jobType}`} title={p.title} photo={p.photo} />

      <DetailLayout aside={aside}>
        {candidates.length ? (
          <>
            <TextBlock title="Ứng viên gợi ý">
              <p className="leading-relaxed text-page-muted">
                {candidates.length} ứng viên khớp với tin này, xếp theo mức phù hợp. Tên viết tắt, thông tin liên hệ chỉ mở sau khi hai bên quan tâm nhau.
              </p>
            </TextBlock>
            {candidates.map((c) => (
              <CandidateCard key={c.id} c={c} jobId={p.id} />
            ))}
          </>
        ) : (
          <TextBlock title="Chưa có ứng viên gợi ý">
            <p className="max-w-xl text-base md:text-lg leading-relaxed">
              {p.status === 'draft'
                ? 'Tin này vẫn là bản nháp. Chốt lịch làm và mức lương, rồi đăng tin để Workmate bắt đầu gợi ý ứng viên.'
                : 'Chưa có ứng viên phù hợp với tin này. Thử mở rộng lịch làm hoặc nới tiêu chí không bắt buộc để có thêm gợi ý.'}
            </p>
            <div className="mt-6">
              <PrimaryLink to="/tuyen-dung/tin-dang">{p.status === 'draft' ? 'Hoàn thiện tin' : 'Chỉnh sửa tin'}</PrimaryLink>
            </div>
          </TextBlock>
        )}

        <p className="text-xs text-page-muted">Tin tuyển dụng và hồ sơ ứng viên là dữ liệu mẫu. Ảnh minh họa từ Unsplash.</p>
        <div><ReportButton target="job" targetId={p.id} name={p.title} /></div>
      </DetailLayout>
    </article>
  )
}
