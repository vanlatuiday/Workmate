import { useMemo } from 'react'
import { useCatalogStore } from '@context/catalogStore'
import { SkeletonCards } from '@components/dashboard/Skeleton'
import { SearchX } from 'lucide-react'
import EmptyState from '@components/dashboard/EmptyState'
import DiscoverGallery from '@components/discover/DiscoverGallery'
import { ClosingBand, PrimaryLink, SampleNote, TextLink } from '@components/discover/parts'
import { BTN_SECONDARY } from '@utils/ui'
import { ALL_CATEGORIES, useAllJobs, EMPTY_FILTERS } from './catalog'
import JobSearchBar from './JobSearchBar'
import { LIGHT_CARD_VARS } from '@components/home/homeBackground'
import { DarkPageBody } from '@components/common/PageCover'
import JobsHero from './JobsHero'
import { useJobFilters } from './useJobFilters'
import CategoryPicker from './CategoryPicker'
import { categoryEntries } from './categoryEntries'
import { useCategoryItems, initialStep, type CategoryItem } from './useCategoryItems'
import { PostsCard, CompanyBlock, groupByCompany } from './CategoryPosts'

/** Khách: khám phá nơi làm việc — nhấn vào lý do đáng xem, mời đăng ký khi muốn ứng tuyển. */
export default function GuestJobs() {
  const { filters, setFilters, setCategory } = useJobFilters()
  // Quản trị viên duyệt/ẩn tin hoặc khóa công ty → tính lại danh sách
  const moderation = useCatalogStore((s) => s.jobs)
  const locked = useCatalogStore((s) => s.companies)
  const settled = useCatalogStore((s) => s.settled)
  // Mỗi nhóm có việc khớp là một bước của bộ sưu tập; đổi danh sách nhóm thì remount cho sạch
  const allJobs = useAllJobs()
  const items = useCategoryItems(allJobs, filters, [moderation, locked])
  const jobCount = items.reduce((n, x) => n + x.group.jobs.length, 0)
  const companyCount = useCatalogStore((s) => s.companies.length)
  const fact = `${allJobs.length} việc đang tuyển · ${companyCount} công ty`
  // Chưa chọn nhóm: chỉ hiện bộ chọn nhóm; các nhóm có việc theo danh sách việc người xem thấy
  const picking = filters.category === '' && allJobs.length > 0
  const entries = useMemo(() => categoryEntries(allJobs), [allJobs])

  return (
    <>
      <JobsHero
        title="Việc làm theo ca ở Đà Nẵng"
        fact={fact}
        stats={picking ? [[entries.length, 'nhóm công việc']] : [[items.length, 'nhóm'], [jobCount, 'việc']]}
        picker={picking}
        category={filters.category}
        back={picking ? undefined : () => setCategory('')}
      >
        {picking ? undefined : <JobSearchBar filters={filters} onChange={setFilters} inCover />}
      </JobsHero>
      <DarkPageBody>
      {picking ? (
        <CategoryPicker entries={entries} total={allJobs.length} onPick={(k) => setCategory(k ?? ALL_CATEGORIES)} />
      ) : null}
      {picking ? null : <>
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
              <button type="button" onClick={() => setFilters({ ...EMPTY_FILTERS, category: filters.category })} className={BTN_SECONDARY}>
                Xóa bộ lọc
              </button>
            }
          />
        </div>
      ) : (
      <DiscoverGallery
        key={items.map((x) => x.id).join(',')}
        items={items}
        label="Việc đang tuyển theo nhóm"
        layout="jobs"
        initialIndex={initialStep(items, filters.category)}
        renderDetail={({ group }) => (
          <>
            <GuestPosts group={group} />
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
              <TextLink to="/dang-ky?role=jobseeker">Đăng ký để ứng tuyển</TextLink>
            </div>
          </>
        )}
      />
      )}
      </>}
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

/** Thẻ danh sách tin của một nhóm: gom theo công ty, công ty nhiều tin lên trước */
function GuestPosts({ group }: { group: CategoryItem['group'] }) {
  const companies = groupByCompany(group.jobs)
  return (
    <PostsCard label={group.cat.label} count={group.jobs.length} companies={companies.map((c) => ({ id: c.companyId }))}>
      {companies.map((c) => <CompanyBlock key={c.companyId} group={c} />)}
    </PostsCard>
  )
}
