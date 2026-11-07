import { useMemo } from 'react'
import { SearchX } from 'lucide-react'
import EmptyState from '@components/dashboard/EmptyState'
import { JOB_TYPES } from '@constants/index'
import { FOCUS } from '@utils/focus'
import DiscoverGallery from '@components/discover/DiscoverGallery'
import { ClosingBand, DetailHead, Facts, PrimaryLink, SampleNote, TextLink } from '@components/discover/parts'
import type { GalleryItem } from '@components/discover/types'
import { JOB_STATUS_LABELS } from '@pages/recruiter/mockData'
import { POSITIONS, type Position } from './data'
import JobsHero from './JobsHero'
import JobSearchBar from './JobSearchBar'
import { EMPTY_FILTERS, type JobFilters } from './catalog'
import { useJobFilters } from './useJobFilters'

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

/** Bỏ dấu + chữ thường để gõ "pha che" vẫn khớp "pha chế" */
const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase()

/** Lọc tin của nhà tuyển dụng: từ khóa khớp tên/lịch/loại việc; loại việc so theo nhãn tiếng Việt */
function matches({ position: p }: Item, f: JobFilters) {
  const typeLabel = JOB_TYPES.find((t) => t.value === f.type)?.label
  if (typeLabel && p.jobType !== typeLabel) return false
  const q = fold(f.q.trim())
  return !q || fold(`${p.title} ${p.schedule} ${p.jobType} ${p.need}`).includes(q)
}

/**
 * Nhà tuyển dụng: các vị trí của chính mình dưới dạng ảnh ngành nghề.
 * Không hiện thông tin ứng viên ở đây — chỉ số lượng, chi tiết nằm trong khu tuyển dụng.
 */
export default function RecruiterJobs() {
  const { filters, setFilters } = useJobFilters()
  const items = useMemo(() => ITEMS.filter((x) => matches(x, filters)), [filters])
  return (
    <>
      <JobsHero
        eyebrow="Tin của bạn"
        title="Những vị trí bạn đang cần người"
        text="Mỗi ảnh là một tin tuyển dụng. Bấm vào ảnh để xem chi tiết tin và ứng viên phù hợp."
        stats={[[items.length, 'vị trí']]}
      />
      <JobSearchBar filters={filters} onChange={setFilters} showDistrict={false} showSalary={false} placeholder="Tên vị trí, lịch làm…" />
      {items.length === 0 ? (
        <div className="shell py-section-sm">
          <EmptyState
            icon={SearchX}
            title="Không có tin nào khớp"
            description="Thử bỏ bớt điều kiện hoặc gõ từ khóa khác."
            action={
              <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className={`inline-flex rounded-full border border-page-line px-5 py-2.5 text-sm font-medium text-page-fg hover:border-page-fg ${FOCUS}`}>
                Xóa lọc
              </button>
            }
          />
        </div>
      ) : (
      <DiscoverGallery
        key={items.map((x) => x.id).join(',')}
        items={items}
        label="Vị trí bạn đang tuyển"
        layout="jobs"
        renderDetail={({ position: p }) => (
          <>
            <DetailHead kicker={`${JOB_STATUS_LABELS[p.status]} · ${p.jobType}`} title={p.title} />
            <p className="mt-3 text-sm leading-relaxed">{p.need}</p>
            <Facts
              dense
              rows={[
                ['Lịch', p.schedule],
                ['Lương', p.salary],
                ['Lượt xem', p.views],
                ['Ứng viên gợi ý', p.suggested],
              ]}
            />
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
              <PrimaryLink to={targetOf(p)} curtain={p.title} state={{ from: '/viec-lam' }}>
                Xem vị trí
              </PrimaryLink>
              <TextLink to="/tuyen-dung/tin-dang">Quản lý tin</TextLink>
            </div>
          </>
        )}
      />
      )}
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
