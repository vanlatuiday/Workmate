import { useMemo } from 'react'
import { useAdmin } from '@services/adminService'
import { Link } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import EmptyState from '@components/dashboard/EmptyState'
import DiscoverGallery from '@components/discover/DiscoverGallery'
import { ProfileTag, ClosingBand, DetailHead, GalleryIntro, PrimaryLink, SampleNote } from '@components/discover/parts'
import type { GalleryItem } from '@components/discover/types'
import MatchScore from '@components/dashboard/MatchScore'
import { COMPANY_PUBLIC_HREF } from '@pages/public/personal/links'
import { FOCUS } from '@utils/focus'
import type { DiscoverCompany } from './data'
import { bestJobOf, companiesMatching, EMPTY_FILTERS, hasFilters, type MatchJob } from './catalog'
import JobSearchBar from './JobSearchBar'
import { useJobFilters } from './useJobFilters'

type Item = GalleryItem & { company: DiscoverCompany; jobs: MatchJob[] }

/** Người tìm việc: mỗi ảnh là một công ty đang tuyển, kèm vài việc tiêu biểu để đi thẳng tới tin. */
export default function JobseekerJobs() {
  const { filters, setFilters } = useJobFilters()
  // Quản trị viên duyệt/ẩn tin hoặc khóa công ty → tính lại danh sách
  const moderation = useAdmin((s) => s.moderation)
  const locked = useAdmin((s) => s.lockedCompanies)
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

  return (
    <>
      <JobSearchBar filters={filters} onChange={setFilters} companies={items.length} jobs={jobCount} showNearMe />
      {items.length === 0 ? (
        <div className="shell py-section-sm">
          <EmptyState
            icon={SearchX}
            title="Không có việc nào khớp"
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
        label="Công ty đang tuyển"
        intro={
          <GalleryIntro
            eyebrow="Công ty đang tuyển"
            title="Chọn nơi làm trước, rồi chọn việc"
            text="Mỗi ảnh là một công ty. Bấm vào ảnh để xem công ty và các việc đang tuyển."
          />
        }
        renderDetail={({ company: c, jobs }) => <CompanyDetail company={c} jobs={jobs} filtered={hasFilters(filters)} />}
      />
      )}
      <ClosingBand
        title="Muốn xem việc theo lịch của bạn?"
        text="Trang Việc phù hợp xếp tin theo lịch rảnh, khoảng cách và mức lương bạn đã khai trong hồ sơ."
      >
        <PrimaryLink to="/tim-viec/phu-hop">Xem việc phù hợp</PrimaryLink>
      </ClosingBand>
      <SampleNote>Công ty và tin tuyển dụng trên trang này là dữ liệu mẫu. Ảnh minh họa từ Unsplash.</SampleNote>
    </>
  )
}

function CompanyDetail({ company: c, jobs, filtered }: { company: DiscoverCompany; jobs: MatchJob[]; filtered: boolean }) {
  // Độ phù hợp của công ty = việc hợp nhất với hồ sơ người đang xem (cách tính chung ở catalog.ts)
  const best = bestJobOf(c.id)
  return (
    <>
      <DetailHead kicker={`${c.industry} · ${c.district}`} title={c.name} />
      <div className="mt-3">
        <ProfileTag to={COMPANY_PUBLIC_HREF}>Trang doanh nghiệp</ProfileTag>
      </div>
      <p className="mt-4 leading-relaxed text-page-muted">{c.tagline}</p>

      {best && (
        <>
          <h3 className="mt-6 text-xs font-medium uppercase tracking-[0.18em] text-page-muted">Độ phù hợp với bạn</h3>
          <div className="mt-3">
            <MatchScore score={best.outcome.score} />
          </div>
          <p className="mt-2 text-xs text-page-muted">Theo hồ sơ của bạn, với việc “{best.job.title}”.</p>
        </>
      )}

      <h3 className="mt-6 text-xs font-medium uppercase tracking-[0.18em] text-page-muted">{filtered ? 'Việc khớp' : 'Việc đang tuyển'}</h3>
      {jobs.length ? (
        <ul className="mt-2 divide-y divide-page-line border-y border-page-line">
          {jobs.slice(0, filtered ? 3 : 2).map((j) => (
            <li key={j.id}>
              <Link
                to={`/viec-lam/${j.id}`}
                className="group block rounded-control py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-page-fg"
              >
                <span className="block font-medium transition-transform duration-500 ease-editorial group-hover:translate-x-1">
                  {j.title}
                </span>
                <span className="mt-0.5 block text-sm text-page-muted">
                  {j.salaryLabel} · {j.shiftLabel}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-page-muted">Chưa có tin đang mở.</p>
      )}

      <div className="mt-6">
        <PrimaryLink to={`/cong-ty/${c.id}`} state={{ from: '/viec-lam' }} curtain={c.name}>
          Xem công ty
        </PrimaryLink>
      </div>
    </>
  )
}
