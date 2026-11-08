import { useMemo } from 'react'
import { SearchX } from 'lucide-react'
import EmptyState from '@components/dashboard/EmptyState'
import { JOB_TYPES } from '@constants/index'
import { FOCUS } from '@utils/focus'
import DiscoverGallery from '@components/discover/DiscoverGallery'
import { ClosingBand, DetailHead, Facts, PrimaryLink, SampleNote, TextLink } from '@components/discover/parts'
import type { GalleryItem } from '@components/discover/types'
import { STATUS_LABEL } from '@components/admin/parts'
import { useCandidateStore } from '@context/candidateStore'
import { useCompanyStore } from '@context/companyStore'
import type { CatalogJob } from '@context/catalogStore'
import { JOB_STATUS_LABELS } from '@pages/recruiter/mockData'
import { fitCandidatesOf, useCompanyJobs } from '@services/adminService'
import JobsHero from './JobsHero'
import JobSearchBar from './JobSearchBar'
import { EMPTY_FILTERS, type JobFilters } from './catalog'
import { useJobFilters } from './useJobFilters'

type Item = GalleryItem & { position: CatalogJob; statusLabel: string; typeLabel: string }

/** Tin đang hiện trước, rồi tới tin đang chờ duyệt / tạm dừng */
const rank = (j: CatalogJob) => (j.visible ? 0 : j.moderation === 'pending' ? 1 : 2)

const toItem = (p: CatalogJob): Item => ({
  id: p.id,
  title: p.title,
  href: `/vi-tri/${p.id}`,
  photo: p.photo,
  cursor: 'Xem',
  linkLabel: `Xem chi tiết vị trí ${p.title}`,
  position: p,
  statusLabel: p.moderation === 'approved' ? JOB_STATUS_LABELS[p.status] : STATUS_LABEL[p.moderation],
  typeLabel: JOB_TYPES.find((t) => t.value === p.jobType)?.label ?? p.jobType,
})

/** Bỏ dấu + chữ thường để gõ "pha che" vẫn khớp "pha chế" */
const fold = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase()

/** Lọc tin của nhà tuyển dụng: từ khóa khớp tên/lịch/loại việc */
function matches({ position: p, typeLabel }: Item, f: JobFilters) {
  if (f.type && p.jobType !== f.type) return false
  const q = fold(f.q.trim())
  return !q || fold(`${p.title} ${p.shiftLabel} ${typeLabel} ${p.description}`).includes(q)
}

/**
 * Nhà tuyển dụng: các vị trí của chính mình dưới dạng ảnh ngành nghề.
 * Không hiện thông tin ứng viên ở đây — chỉ số lượng, chi tiết nằm trong khu tuyển dụng.
 */
export default function RecruiterJobs() {
  const { filters, setFilters } = useJobFilters()
  const rows = useCompanyJobs(useCompanyStore((s) => s.id))
  const candidates = useCandidateStore((s) => s.list)
  const all = useMemo(() => rows.map((r) => r.job).sort((a, b) => rank(a) - rank(b)).map(toItem), [rows])
  const items = useMemo(() => all.filter((x) => matches(x, filters)), [all, filters])
  // fitCandidatesOf đọc thẳng kho ứng viên: tính lại khi danh sách nạp xong
  const fitCount = useMemo(() => new Map(all.map((x) => [x.id, fitCandidatesOf(x.position).length])), [all, candidates])
  return (
    <>
      <JobsHero
        eyebrow="Tin của bạn"
        title="Những vị trí bạn đang cần người"
        text="Mỗi ảnh là một tin của công ty bạn. Bấm vào ảnh để xem chi tiết tin và ứng viên phù hợp."
        stats={[[items.length, 'vị trí']]}
      />
      <JobSearchBar filters={filters} onChange={setFilters} showDistrict={false} showSalary={false} placeholder="Tên vị trí, lịch làm…" />
      {all.length === 0 ? (
        <div className="shell py-section-sm">
          <EmptyState icon={SearchX} title="Chưa có tin nào" description="Đăng tin đầu tiên để Workmate gợi ý ứng viên khớp lịch gần nơi làm." />
        </div>
      ) : items.length === 0 ? (
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
        renderDetail={({ position: p, statusLabel, typeLabel, href }) => (
          <>
            <DetailHead kicker={`${statusLabel} · ${typeLabel}`} title={p.title} />
            {p.description && <p className="mt-3 line-clamp-3 text-sm leading-relaxed">{p.description}</p>}
            <Facts
              dense
              rows={[
                ['Lịch', p.shiftLabel],
                ['Lương', p.salaryLabel],
                ['Cần tuyển', `${p.quantity} người`],
                ['Ứng viên phù hợp', fitCount.get(p.id) ?? 0],
              ]}
            />
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
              <PrimaryLink to={href} curtain={p.title} state={{ from: '/viec-lam' }}>
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
      <SampleNote>Ảnh minh họa từ Unsplash.</SampleNote>
    </>
  )
}
