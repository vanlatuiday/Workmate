import { Link } from 'react-router-dom'
import DiscoverGallery from '@components/discover/DiscoverGallery'
import { ClosingBand, DetailHead, GalleryIntro, PrimaryLink, SampleNote } from '@components/discover/parts'
import type { GalleryItem } from '@components/discover/types'
import { COMPANIES, jobsOf, type DiscoverCompany } from './data'

type Item = GalleryItem & { company: DiscoverCompany }

const ITEMS: Item[] = COMPANIES.map((c) => ({
  id: c.id,
  title: c.name,
  href: `/cong-ty/${c.id}`,
  photo: c.cover,
  cursor: 'Xem',
  linkLabel: `Xem công ty ${c.name}`,
  company: c,
}))

/** Người tìm việc: mỗi ảnh là một công ty đang tuyển, kèm vài việc tiêu biểu để đi thẳng tới tin. */
export default function JobseekerJobs() {
  return (
    <>
      <DiscoverGallery
        items={ITEMS}
        label="Công ty đang tuyển"
        intro={
          <GalleryIntro
            eyebrow="Công ty đang tuyển"
            title="Chọn nơi làm trước, rồi chọn việc"
            text="Mỗi ảnh là một công ty. Bấm vào ảnh để xem công ty và các việc đang tuyển."
          />
        }
        renderDetail={({ company: c }) => <CompanyDetail company={c} />}
      />
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

function CompanyDetail({ company: c }: { company: DiscoverCompany }) {
  const jobs = jobsOf(c)
  return (
    <>
      <DetailHead kicker={`${c.industry} · ${c.district}`} title={c.name} />
      <p className="mt-4 leading-relaxed text-page-muted">{c.tagline}</p>

      <h3 className="mt-6 text-xs font-medium uppercase tracking-[0.18em] text-page-muted">Việc đang tuyển</h3>
      {jobs.length ? (
        <ul className="mt-2 divide-y divide-page-line border-y border-page-line">
          {jobs.slice(0, 2).map((j) => (
            <li key={j.id}>
              <Link
                to={`/viec-lam/${j.id}`}
                className="group block rounded-control py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-page-fg"
              >
                <span className="block font-medium transition-transform duration-500 ease-editorial group-hover:translate-x-1">
                  {j.title}
                </span>
                <span className="mt-0.5 block text-sm text-page-muted">
                  {j.salaryLabel} · {j.shift}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-page-muted">Chưa có tin đang mở.</p>
      )}

      <div className="mt-6">
        <PrimaryLink to={`/cong-ty/${c.id}`} state={{ from: '/viec-lam' }}>
          Xem công ty
        </PrimaryLink>
      </div>
    </>
  )
}
