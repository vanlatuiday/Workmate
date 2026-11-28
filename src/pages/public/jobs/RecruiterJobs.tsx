import { useMemo } from 'react'
import { SearchX } from 'lucide-react'
import EmptyState from '@components/dashboard/EmptyState'
import { JOB_TYPES } from '@constants/index'
import { BTN_SECONDARY } from '@utils/ui'
import DiscoverGallery from '@components/discover/DiscoverGallery'
import { ClosingBand, PrimaryLink, TextLink } from '@components/discover/parts'
import type { GalleryItem } from '@components/discover/types'
import { STATUS_LABEL } from '@components/admin/parts'
import { useCandidateStore } from '@context/candidateStore'
import { useCompanyStore } from '@context/companyStore'
import { useCatalogStore, type CatalogJob } from '@context/catalogStore'
import { SkeletonCards } from '@components/dashboard/Skeleton'
import { JOB_STATUS_LABELS } from '@pages/recruiter/mockData'
import { fitCandidatesOf, useCompanyJobs } from '@services/adminService'
import { useCandidateMatches } from '@services/matchingService'
import { LIGHT_CARD_VARS } from '@components/home/homeBackground'
import { DarkPageBody } from '@components/common/PageCover'
import JobsHero from './JobsHero'
import JobSearchBar from './JobSearchBar'
import { EMPTY_FILTERS, type JobFilters } from './catalog'
import { useJobFilters } from './useJobFilters'
import { categoryGroups, groupPhoto, type CategoryGroup } from './categoryEntries'
import { PostsCard, OwnRow } from './CategoryPosts'
import { initialStep } from './useCategoryItems'
import { foldVi as fold } from '@utils/text'

type GroupItem = GalleryItem & { group: CategoryGroup<CatalogJob> }
type Item = GalleryItem & { position: CatalogJob; statusLabel: string; typeLabel: string }

/** Tin đang hiện trước, rồi tới tin đang chờ duyệt / tạm dừng */
const rank = (j: CatalogJob) => (j.visible ? 0 : j.moderation === 'pending' ? 1 : 2)

const toItem = (p: CatalogJob): Item => ({
  id: p.id,
  title: p.title,
  href: `/vi-tri/${p.id}`,
  photo: p.photo,
  cursor: 'Xem',
  linkLabel: `Mở vị trí ${p.title}`,
  position: p,
  statusLabel: p.moderation === 'approved' ? JOB_STATUS_LABELS[p.status] : STATUS_LABEL[p.moderation],
  typeLabel: JOB_TYPES.find((t) => t.value === p.jobType)?.label ?? p.jobType,
})

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
  const settled = useCatalogStore((s) => s.settled)
  const all = useMemo(() => rows.map((r) => r.job).sort((a, b) => rank(a) - rank(b)).map(toItem), [rows])
  const matched = useMemo(() => all.filter((x) => matches(x, filters)), [all, filters])
  // Mỗi nhóm có tin khớp là một bước: ảnh = tin mới nhất của nhóm, thẻ phải liệt kê các tin của nhóm
  const byId = useMemo(() => new Map(matched.map((x) => [x.id, x])), [matched])
  const items = useMemo<GroupItem[]>(
    () =>
      categoryGroups(matched.map((x) => x.position)).map((group) => ({
        id: group.cat.key,
        title: group.cat.label,
        href: `/vi-tri/${group.newest.id}`,
        photo: groupPhoto(group),
        cursor: 'Xem tin',
        linkLabel: `Xem tin mới nhất nhóm ${group.cat.label}: ${group.newest.title}`,
        group,
      })),
    [matched],
  )
  // fitCandidatesOf đọc thẳng kho ứng viên: tính lại khi danh sách nạp xong
  const { outcomeOf } = useCandidateMatches(all.map((x) => x.id)) // điểm máy chủ; outcomeOf đổi khi điểm đổi
  const fitCount = useMemo(() => new Map(all.map((x) => [x.id, fitCandidatesOf(x.position).length])), [all, candidates, outcomeOf])
  const fact = `${all.length} tin tuyển dụng`
  return (
    <>
      <JobsHero
        title="Tin tuyển dụng của bạn"
        fact={fact}
        stats={[[matched.length, 'vị trí']]}
        category={filters.category}
      >
        <JobSearchBar filters={filters} onChange={setFilters} showDistrict={false} showSalary={false} placeholder="Tên vị trí, lịch làm…" inCover />
      </JobsHero>
      <DarkPageBody>
      {all.length === 0 && !settled ? (
        <div className="shell py-section-sm">
          <SkeletonCards count={3} label="Đang tải tin tuyển dụng…" />
        </div>
      ) : all.length === 0 ? (
        <div className={`shell py-section-sm ${LIGHT_CARD_VARS}`}>
          <EmptyState icon={SearchX} title="Chưa có tin nào" description="Đăng tin đầu tiên để Workmate gợi ý ứng viên khớp lịch gần nơi làm." />
        </div>
      ) : matched.length === 0 ? (
        <div className={`shell py-section-sm ${LIGHT_CARD_VARS}`}>
          <EmptyState
            icon={SearchX}
            title="Không có tin nào khớp"
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
        label="Vị trí bạn đang tuyển theo nhóm"
        layout="jobs"
        initialIndex={initialStep(items, filters.category)}
        renderDetail={({ group }) => (
          <>
            <PostsCard label={group.cat.label} count={group.jobs.length} unit="vị trí" footer={<TextLink to="/tuyen-dung/tin-dang">Quản lý tin</TextLink>}>
              {group.jobs.map((p) => {
                const it = byId.get(p.id)
                return (
                  <OwnRow
                    key={p.id}
                    id={p.id}
                    title={p.title}
                    status={it?.statusLabel ?? ''}
                    meta={[it?.typeLabel, p.shiftLabel, p.salaryLabel].filter(Boolean).join(' · ')}
                    fit={fitCount.get(p.id) ?? 0}
                  />
                )
              })}
            </PostsCard>
          </>
        )}
      />
      )}
      <ClosingBand
        title="Đăng thêm một vị trí"
        text="Đăng tin kèm lịch làm và tiêu chí bắt buộc, Workmate sẽ gợi ý ứng viên khớp lịch gần nơi làm."
      >
        <PrimaryLink to="/dang-tin">Đăng tin mới</PrimaryLink>
      </ClosingBand>
      </DarkPageBody>
    </>
  )
}
