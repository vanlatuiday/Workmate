// /cong-ty — lưới công ty (dữ liệu mẫu từ jobs/data.ts)
import { Link } from 'react-router-dom'
import { photoUrl } from '@components/discover/types'
import { FOCUS } from '@utils/focus'
import ContentPage from './content/ContentPage'
import { COMPANIES, jobsOf } from './jobs/data'

export default function CompaniesPage() {
  return (
    <ContentPage eyebrow="Công ty" title="Nơi bạn có thể làm việc." intro="Các công ty đang tuyển tại Đà Nẵng (dữ liệu mẫu).">
      <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {COMPANIES.map((c) => (
          <li key={c.id}>
            <Link to={`/cong-ty/${c.id}`} data-cursor="Xem" className={`group block rounded-card ${FOCUS}`}>
              <div className="aspect-[4/3] overflow-hidden rounded-card border border-page-line bg-page-surface">
                <img
                  src={photoUrl(c.cover.id, 640)}
                  alt={c.cover.alt}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <h2 className="mt-4 font-display text-lg font-semibold text-page-fg">{c.name}</h2>
              <p className="text-sm text-page-muted">{c.industry} · {c.district}</p>
              <p className="mt-2 text-sm leading-relaxed text-page-muted">{c.tagline}</p>
              <p className="mt-2 text-xs font-medium text-page-fg">{jobsOf(c).length} vị trí đang tuyển</p>
            </Link>
          </li>
        ))}
      </ul>
    </ContentPage>
  )
}
