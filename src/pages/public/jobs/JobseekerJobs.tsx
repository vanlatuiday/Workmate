import { useMemo } from 'react'
import { useCatalogStore } from '@context/catalogStore'
import { SkeletonCards } from '@components/dashboard/Skeleton'
import { SearchX } from 'lucide-react'
import EmptyState from '@components/dashboard/EmptyState'
import DiscoverGallery from '@components/discover/DiscoverGallery'
import { ClosingBand, DetailHead, PrimaryLink, SampleNote } from '@components/discover/parts'
import type { GalleryItem } from '@components/discover/types'
import MatchScore from '@components/dashboard/MatchScore'
import { BTN_SECONDARY } from '@utils/ui'
import type { DiscoverCompany } from './data'
import { useSeekerCriteria } from '@context/profileStore'
import { bestJobOf, useAllJobs, useSeekerOutcomes, companiesMatching, EMPTY_FILTERS, hasFilters, type MatchJob } from './catalog'
import JobSearchBar from './JobSearchBar'
import { LIGHT_CARD_VARS } from '@components/home/homeBackground'
import { DarkPageBody } from '@components/common/PageCover'
import JobsHero from './JobsHero'
import PositionChips from './PositionChips'
import { useJobFilters } from './useJobFilters'

type Item = GalleryItem & { company: DiscoverCompany; jobs: MatchJob[] }

/** Người tìm việc: mỗi ảnh là một công ty đang tuyển, kèm vài việc tiêu biểu để đi thẳng tới tin. */
export default function JobseekerJobs() {
  const { filters, setFilters } = useJobFilters()
  // Quản trị viên duyệt/ẩn tin hoặc khóa công ty → tính lại danh sách
  const moderation = useCatalogStore((s) => s.jobs)
  const locked = useCatalogStore((s) => s.companies)
  const settled = useCatalogStore((s) => s.settled)
  const criteria = useSeekerCriteria() // bộ lọc "gần tôi" dùng khoảng cách tối đa trong hồ sơ
  // Chỉ giữ công ty có việc khớp; đổi danh sách thì remount bộ sưu tập cho sạch
  const items = useMemo<Item[]>(
    () =>
      companiesMatching(filters).map(({ company: c, jobs }) => ({
        id: c.id,
        title: c.name,
        href: `/cong-ty/${c.id}`,
        photo: c.cover,
        cursor: 'Xem',
        linkLabel: `Xem công ty ${c.name}`,
        company: c,
        jobs,
      })),
    // moderation/locked/criteria chỉ để kích tính lại
    [filters, moderation, locked, criteria],
  )
  const jobCount = items.reduce((n, x) => n + x.jobs.length, 0)
  const allJobs = useAllJobs()
  const companyCount = useCatalogStore((s) => s.companies.length)
  const fact = `${allJobs.length} việc đang tuyển · ${companyCount} công ty`

  return (
    <>
      <JobsHero title="Việc làm theo ca ở Đà Nẵng" fact={fact} stats={[[items.length, 'công ty'], [jobCount, 'việc']]}>
        <JobSearchBar filters={filters} onChange={setFilters} showNearMe inCover />
      </JobsHero>
      <DarkPageBody>
      {items.length === 0 && !settled ? (
        <div className="shell py-section-sm">
          <SkeletonCards count={6} image label="Đang tải danh sách công ty…" />
        </div>
      ) : items.length === 0 ? (
        <div className={`shell py-section-sm ${LIGHT_CARD_VARS}`}>
          <EmptyState
            icon={SearchX}
            title="Không có việc nào khớp"
            description="Thử bỏ bớt điều kiện hoặc gõ từ khóa khác."
            action={
              <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className={BTN_SECONDARY}>
                Xóa bộ lọc
              </button>
            }
          />
        </div>
      ) : (
      <DiscoverGallery
        key={items.map((x) => x.id).join(',')}
        items={items}
        label="Công ty đang tuyển"
        layout="jobs"
        renderDetail={({ company: c, jobs }) => <CompanyDetail company={c} jobs={jobs} filtered={hasFilters(filters)} />}
      />
      )}
      <ClosingBand
        title="Xem việc khớp lịch rảnh của bạn"
        text="Trang Việc phù hợp xếp tin theo kỹ năng, lịch rảnh, mức lương, khoảng cách và loại việc bạn đã khai trong hồ sơ."
      >
        <PrimaryLink to="/tim-viec/phu-hop">Xem việc phù hợp</PrimaryLink>
      </ClosingBand>
      <SampleNote>Ảnh minh họa từ Unsplash.</SampleNote>
      </DarkPageBody>
    </>
  )
}

function CompanyDetail({ company: c, jobs, filtered }: { company: DiscoverCompany; jobs: MatchJob[]; filtered: boolean }) {
  // Độ phù hợp của công ty = việc hợp nhất với hồ sơ người đang xem (cách tính chung ở catalog.ts)
  const { outcomeOf } = useSeekerOutcomes()
  const best = bestJobOf(c.id, outcomeOf)
  return (
    <>
      <DetailHead kicker={`${c.industry} · ${c.district}`} title={c.name} />
      {/* Thẻ gọn (thấp hơn ảnh): mô tả công ty nằm ở trang công ty; độ phù hợp gói trong một hàng */}
      {best && (
        <div className="mt-4 flex items-center justify-between gap-4" title={`Theo hồ sơ của bạn, với việc “${best.job.title}”`}>
          <h3 className="text-sm font-medium text-page-muted">Độ phù hợp</h3>
          <MatchScore score={best.outcome.score} size="sm" />
        </div>
      )}

      <PositionChips jobs={jobs} max={2} more={false} moreHref={`/cong-ty/${c.id}`} heading={`${filtered ? 'Việc khớp' : 'Đang tuyển'} · ${jobs.length} vị trí`} className="mt-4" />

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
        <PrimaryLink to={`/cong-ty/${c.id}`} state={{ from: '/viec-lam' }} curtain={c.name}>
          Xem công ty
        </PrimaryLink>
      </div>
    </>
  )
}
