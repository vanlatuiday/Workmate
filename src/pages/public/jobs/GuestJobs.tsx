import { useMemo } from 'react'
import { useCatalogStore } from '@context/catalogStore'
import { SkeletonCards } from '@components/dashboard/Skeleton'
import { SearchX } from 'lucide-react'
import EmptyState from '@components/dashboard/EmptyState'
import DiscoverGallery from '@components/discover/DiscoverGallery'
import { ProfileTag, ClosingBand, DetailHead, PrimaryLink, SampleNote, TextLink } from '@components/discover/parts'
import type { GalleryItem } from '@components/discover/types'
import { BTN_SECONDARY } from '@utils/ui'
import type { DiscoverCompany } from './data'
import { useAllJobs, companiesMatching, EMPTY_FILTERS, type MatchJob } from './catalog'
import JobSearchBar from './JobSearchBar'
import { LIGHT_CARD_VARS } from '@components/home/homeBackground'
import { DarkPageBody } from '@components/common/PageCover'
import JobsHero from './JobsHero'
import PositionChips from './PositionChips'
import { useJobFilters } from './useJobFilters'

type Item = GalleryItem & { company: DiscoverCompany; jobs: MatchJob[] }

/** Khách: khám phá nơi làm việc — nhấn vào lý do đáng xem, mời đăng ký khi muốn ứng tuyển. */
export default function GuestJobs() {
  const { filters, setFilters } = useJobFilters()
  // Quản trị viên duyệt/ẩn tin hoặc khóa công ty → tính lại danh sách
  const moderation = useCatalogStore((s) => s.jobs)
  const locked = useCatalogStore((s) => s.companies)
  const settled = useCatalogStore((s) => s.settled)
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
    // moderation/locked chỉ để kích tính lại
    [filters, moderation, locked],
  )
  const jobCount = items.reduce((n, x) => n + x.jobs.length, 0)
  const allJobs = useAllJobs()
  const companyCount = useCatalogStore((s) => s.companies.length)
  const fact = `${allJobs.length} việc đang tuyển · ${companyCount} công ty`

  return (
    <>
      <JobsHero title="Việc làm theo ca ở Đà Nẵng" fact={fact} stats={[[items.length, 'công ty'], [jobCount, 'việc']]}>
        <JobSearchBar filters={filters} onChange={setFilters} inCover />
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
        label="Các nơi đang tuyển"
        layout="jobs"
        renderDetail={({ company: c, jobs }) => (
          <>
            <DetailHead kicker={`${c.industry} · ${c.district}`} title={c.name} />
            <div className="mt-3">
              <ProfileTag to={`/cong-ty/${c.id}`}>Trang công ty</ProfileTag>
            </div>
            {/* Thẻ gọn (thấp hơn ảnh): chỉ giữ lý do đáng xem; mô tả, quy mô nằm ở trang công ty */}
            <p className="mt-3 text-sm leading-relaxed">{c.why}</p>
            <PositionChips jobs={jobs} max={2} more={false} moreHref={`/cong-ty/${c.id}`} heading={`Đang tuyển · ${jobs.length} vị trí`} className="mt-3" />
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
              <PrimaryLink to={`/cong-ty/${c.id}`} state={{ from: '/viec-lam' }} curtain={c.name}>
                Xem công ty
              </PrimaryLink>
              <TextLink to="/dang-ky?role=jobseeker">Đăng ký để ứng tuyển</TextLink>
            </div>
          </>
        )}
      />
      )}
      <ClosingBand
        title="Chọn vai trò để bắt đầu"
        text="Một tài khoản cho người tìm việc, một cho nơi cần người. Chọn đúng phía để Workmate gợi ý đúng thứ bạn cần."
      >
        <PrimaryLink to="/dang-ky?role=jobseeker">Tôi tìm việc</PrimaryLink>
        <TextLink to="/dang-ky?role=recruiter">Tôi cần tuyển người</TextLink>
      </ClosingBand>
      <SampleNote>Ảnh minh họa từ Unsplash.</SampleNote>
      </DarkPageBody>
    </>
  )
}
