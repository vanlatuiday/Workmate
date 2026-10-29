import DiscoverGallery from '@components/discover/DiscoverGallery'
import { ClosingBand, DetailHead, Facts, GalleryIntro, PrimaryLink, SampleNote, TextLink } from '@components/discover/parts'
import type { GalleryItem } from '@components/discover/types'
import { JOB_STATUS_LABELS } from '@pages/recruiter/mockData'
import { POSITIONS, type Position } from './data'

type Item = GalleryItem & { position: Position }

/** Mọi trạng thái đều mở trang chi tiết vị trí; việc quản lý/sửa nằm ở "Quản lý tin" */
const targetOf = (p: Position) => `/vi-tri/${p.id}`

const ITEMS: Item[] = POSITIONS.map((p) => ({
  id: p.id,
  title: p.title,
  href: targetOf(p),
  photo: p.photo,
  cursor: 'Xem',
  linkLabel: `Xem chi tiết vị trí ${p.title}`,
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
            text="Mỗi ảnh là một tin tuyển dụng. Bấm vào ảnh để xem chi tiết tin và ứng viên phù hợp."
          />
        }
        renderDetail={({ position: p }) => (
          <>
            <DetailHead kicker={`${JOB_STATUS_LABELS[p.status]} · ${p.jobType}`} title={p.title} />
            <p className="mt-4 leading-relaxed">{p.need}</p>
            <Facts
              rows={[
                ['Lịch', p.schedule],
                ['Lương', p.salary],
                ['Lượt xem', p.views],
                ['Ứng viên gợi ý', p.suggested],
              ]}
            />
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              <PrimaryLink to={targetOf(p)} curtain={p.title} state={{ from: '/viec-lam' }}>
                Xem vị trí
              </PrimaryLink>
              <TextLink to="/tuyen-dung/tin-dang">Quản lý tin</TextLink>
            </div>
          </>
        )}
      />
      <ClosingBand
        title="Cần người cho một vị trí khác?"
        text="Đăng tin kèm lịch làm và tiêu chí bắt buộc, Workmate sẽ gợi ý ứng viên khớp lịch gần nơi làm."
      >
        <PrimaryLink to="/dang-tin">Đăng tin mới</PrimaryLink>
      </ClosingBand>
      <SampleNote>Tin tuyển dụng và số liệu trên trang này là dữ liệu mẫu, giống khu tuyển dụng. Ảnh minh họa từ Unsplash.</SampleNote>
    </>
  )
}
