import { useMemo } from 'react'
import { useAdmin } from '@services/adminService'
import { Link } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import EmptyState from '@components/dashboard/EmptyState'
import DiscoverGallery from '@components/discover/DiscoverGallery'
import { ProfileTag, ClosingBand, DetailHead, Facts, GalleryIntro, PrimaryLink, SampleNote, TextLink } from '@components/discover/parts'
import type { GalleryItem } from '@components/discover/types'
import { COMPANY_PUBLIC_HREF } from '@pages/public/personal/links'
import { FOCUS } from '@utils/focus'
import type { DiscoverCompany } from './data'
import { companiesMatching, EMPTY_FILTERS, hasFilters, type MatchJob } from './catalog'
import JobSearchBar from './JobSearchBar'
import { useJobFilters } from './useJobFilters'

type Item = GalleryItem & { company: DiscoverCompany; jobs: MatchJob[] }

/** Khách: khám phá nơi làm việc — nhấn vào lý do đáng xem, mời đăng ký khi muốn ứng tuyển. */
export default function GuestJobs() {
  const { filters, setFilters } = useJobFilters()
  // Quản trị viên duyệt/ẩn tin hoặc khóa công ty → tính lại danh sách
  const moderation = useAdmin((s) => s.moderation)
  const locked = useAdmin((s) => s.lockedCompanies)
  const filtered = hasFilters(filters)
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
      <JobSearchBar filters={filters} onChange={setFilters} companies={items.length} jobs={jobCount} />
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
        label="Các nơi đang tuyển"
        intro={
          <GalleryIntro
            eyebrow="Khám phá"
            title="Những nơi đang tìm người"
            text="Các công ty ở Đà Nẵng. Cuộn để xem từng nơi. Xem công ty không cần tài khoản, ứng tuyển thì cần."
          />
        }
        renderDetail={({ company: c, jobs }) => (
          <>
            <DetailHead kicker={`${c.industry} · ${c.district}`} title={c.name} />
            <div className="mt-3">
              <ProfileTag to={COMPANY_PUBLIC_HREF}>Trang doanh nghiệp</ProfileTag>
            </div>
            <p className="mt-4 leading-relaxed">{c.why}</p>
            <p className="mt-2 text-sm leading-relaxed text-page-muted">{c.tagline}</p>
            <Facts
              rows={[
                ['Đang tuyển', `${jobs.length} vị trí`],
                ['Quy mô', `${c.size} người`],
              ]}
            />
            {filtered && (
              <ul className="mt-4 divide-y divide-page-line border-y border-page-line text-sm">
                {jobs.slice(0, 3).map((j) => (
                  <li key={j.id}>
                    <Link to={`/viec-lam/${j.id}`} className={`block rounded-control py-2.5 ${FOCUS}`}>
                      <span className="block font-medium">{j.title}</span>
                      <span className="block text-page-muted">{j.salaryLabel} · {j.shiftLabel}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
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
        title="Bạn đứng ở phía nào?"
        text="Một tài khoản cho người tìm việc, một cho nơi cần người. Chọn đúng phía để Workmate gợi ý đúng thứ bạn cần."
      >
        <PrimaryLink to="/dang-ky?role=jobseeker">Tôi tìm việc</PrimaryLink>
        <TextLink to="/dang-ky?role=recruiter">Tôi cần tuyển người</TextLink>
      </ClosingBand>
      <SampleNote>Công ty và tin tuyển dụng trên trang này là dữ liệu mẫu. Ảnh minh họa từ Unsplash.</SampleNote>
    </>
  )
}
