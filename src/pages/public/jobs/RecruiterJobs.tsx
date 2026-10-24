import DiscoverGallery from '@components/discover/DiscoverGallery'
import { ClosingBand, DetailHead, Facts, GalleryIntro, PrimaryLink, SampleNote, TextLink } from '@components/discover/parts'
import type { GalleryItem } from '@components/discover/types'
import { JOB_STATUS_LABELS } from '@pages/recruiter/mockData'
import { POSITIONS, type Position } from './data'

type Item = GalleryItem & { position: Position }

/** Tin nháp chưa có ứng viên gợi ý → dẫn về danh sách tin để hoàn thiện */
const targetOf = (p: Position) =>
  p.status === 'draft' ? '/tuyen-dung/tin-dang' : `/tuyen-dung/ung-vien-phu-hop?job=${p.id}`

const ITEMS: Item[] = POSITIONS.map((p) => ({
  id: p.id,
  title: p.title,
  href: targetOf(p),
  photo: p.photo,
  cursor: p.status === 'draft' ? 'Sửa' : 'Ứng viên',
  linkLabel: p.status === 'draft' ? `Hoàn thiện tin ${p.title}` : `Xem ứng viên phù hợp cho ${p.title}`,
  position: p,
}))

/**
 * Nhà tuyển dụng: các vị trí của chính mình dưới dạng ảnh ngành nghề.
 * Không hiện thông tin ứng viên ở đây — chỉ số lượng, chi tiết nằm trong khu tuyển dụng.
 */
export default function RecruiterJobs() {
  return (
    <>
      <DiscoverGallery
        items={ITEMS}
        label="Vị trí bạn đang tuyển"
        intro={
          <GalleryIntro
            eyebrow="Tin của bạn"
            title="Những vị trí bạn đang cần người"
            text="Mỗi ảnh là một tin tuyển dụng. Bấm vào ảnh để xem ứng viên phù hợp với tin đó."
          />
        }
        renderDetail={({ position: p }) => (
          <>
            <DetailHead kicker={`${JOB_STATUS_LABELS[p.status]} · ${p.jobType}`} title={p.title} />
            <p className="mt-4 text-lg leading-relaxed">{p.need}</p>
            <Facts
              rows={[
                ['Lịch', p.schedule],
                ['Lương', p.salary],
                ['Lượt xem', p.views],
                ['Ứng viên gợi ý', p.suggested],
              ]}
            />
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              <PrimaryLink to={targetOf(p)}>{p.status === 'draft' ? 'Hoàn thiện tin' : 'Ứng viên phù hợp'}</PrimaryLink>
              <TextLink to="/tuyen-dung/tin-dang">Quản lý tin</TextLink>
            </div>
          </>
        )}
      />
      <ClosingBand
        title="Cần người cho một vị trí khác?"
        text="Đăng tin kèm lịch làm và tiêu chí bắt buộc, Workmate sẽ gợi ý ứng viên khớp lịch gần nơi làm."
      >
        <PrimaryLink to="/tuyen-dung/dang-tin">Đăng tin mới</PrimaryLink>
      </ClosingBand>
      <SampleNote>Tin tuyển dụng và số liệu trên trang này là dữ liệu mẫu, giống khu tuyển dụng. Ảnh minh họa từ Unsplash.</SampleNote>
    </>
  )
}
