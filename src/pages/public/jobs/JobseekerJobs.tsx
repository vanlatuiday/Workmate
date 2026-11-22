import { useMemo } from 'react'
import { useCatalogStore } from '@context/catalogStore'
import { SkeletonCards } from '@components/dashboard/Skeleton'
import { SearchX } from 'lucide-react'
import EmptyState from '@components/dashboard/EmptyState'
import DiscoverGallery from '@components/discover/DiscoverGallery'
import { ClosingBand, PrimaryLink, SampleNote } from '@components/discover/parts'
import { BTN_SECONDARY } from '@utils/ui'
import { useSeekerCriteria } from '@context/profileStore'
import { ALL_CATEGORIES, useAllJobs, useSeekerOutcomes, EMPTY_FILTERS } from './catalog'
import JobSearchBar from './JobSearchBar'
import { LIGHT_CARD_VARS } from '@components/home/homeBackground'
import { DarkPageBody } from '@components/common/PageCover'
import JobsHero from './JobsHero'
import { useJobFilters } from './useJobFilters'
import CategoryPicker from './CategoryPicker'
import { categoryEntries } from './categoryEntries'
import { useCategoryItems, initialStep, type CategoryItem } from './useCategoryItems'
import { PostsCard, JobRow } from './CategoryPosts'

/** Người tìm việc: mỗi ảnh là một công ty đang tuyển, kèm vài việc tiêu biểu để đi thẳng tới tin. */
export default function JobseekerJobs() {
  const { filters, setFilters, setCategory } = useJobFilters()
  // Quản trị viên duyệt/ẩn tin hoặc khóa công ty → tính lại danh sách
  const moderation = useCatalogStore((s) => s.jobs)
  const locked = useCatalogStore((s) => s.companies)
  const settled = useCatalogStore((s) => s.settled)
  const criteria = useSeekerCriteria() // bộ lọc "gần tôi" dùng khoảng cách tối đa trong hồ sơ
  // Mỗi nhóm có việc khớp là một bước của bộ sưu tập; đổi danh sách nhóm thì remount cho sạch
  const allJobs = useAllJobs()
  const items = useCategoryItems(allJobs, filters, [moderation, locked, criteria])
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
        {picking ? undefined : <JobSearchBar filters={filters} onChange={setFilters} showNearMe inCover />}
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
        renderDetail={({ group }) => <SeekerPosts group={group} />}
      />
      )}
      </>}
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

/** Thẻ danh sách tin của một nhóm: tin có điểm phù hợp cao lên trước, kèm % khi máy chủ đã tính */
function SeekerPosts({ group }: { group: CategoryItem['group'] }) {
  const { outcomeOf } = useSeekerOutcomes()
  const rows = group.jobs
    .map((job) => ({ job, score: outcomeOf(job)?.score }))
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1)) // sort ổn định: cùng điểm giữ thứ tự mới nhất trước
  return (
    <PostsCard label={group.cat.label} count={group.jobs.length}>
      {rows.map(({ job, score }) => <JobRow key={job.id} job={job} score={score} />)}
    </PostsCard>
  )
}
