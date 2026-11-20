// /cong-ty — lưới các công ty đang công khai
import CompanyLogo from '@components/common/CompanyLogo'
import { Link } from 'react-router-dom'
import { photoUrl } from '@components/discover/types'
import { FOCUS } from '@utils/focus'
import PageCover, { COVER_EDGE, IvoryPageBody } from '@components/common/PageCover'
import { useCatalogStore } from '@context/catalogStore'
import { SkeletonCards } from '@components/dashboard/Skeleton'
import FadeIn from '@components/motion/FadeIn'
import { CARD_HOVER } from '@utils/ui'
import { cn } from '@utils/cn'
import { jobsOfCompany } from './jobs/catalog'
import TaxValidBadge from '@components/common/TaxValidBadge'

export default function CompaniesPage() {
  // Danh mục công ty từ máy chủ (công ty demo vẫn không nằm trong lưới này như trước)
  const companies = useCatalogStore((s) => s.companies).filter((c) => !c.hidden)
  const settled = useCatalogStore((s) => s.settled)
  return (
    <>
      <PageCover
        level="md"
        sheet
        title="Nơi bạn có thể làm việc."
        fact={settled || companies.length > 0 ? `${companies.length} công ty đang tuyển tại Đà Nẵng` : 'Các công ty đang tuyển tại Đà Nẵng'}
      />
      <IvoryPageBody>
        <div className={cn('pb-section-sm pt-10 md:pt-12', COVER_EDGE)}>
      {companies.length === 0 && !settled ? (
        <SkeletonCards count={6} image className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3" label="Đang tải danh sách công ty…" />
      ) : (
      <FadeIn>
      <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {companies.map((c) => (
          <li key={c.id}>
            <Link to={`/cong-ty/${c.id}`} data-cursor="Xem" className={cn('group block rounded-card', CARD_HOVER, FOCUS)}>
              <div className="aspect-[4/3] overflow-hidden rounded-card border border-page-line bg-page-surface transition-colors duration-base ease-editorial group-hover:border-page-fg motion-reduce:transition-none">
                <img
                  src={photoUrl(c.cover.id, 640)}
                  alt={c.cover.alt}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mt-4 flex items-center gap-3">
                <CompanyLogo name={c.name} logoUrl={c.logoUrl} decorative className="h-10 w-10 text-xs" />
                <h2 className="min-w-0 font-display text-lg font-semibold text-page-fg">{c.name}</h2>
              </div>
              <p className="text-sm text-page-muted">{[c.industry, c.district].filter(Boolean).join(' · ')}</p>
              <TaxValidBadge valid={c.taxValid} className="mt-2 inline-block" />
              <p className="mt-2 text-sm leading-relaxed text-page-muted">{c.tagline}</p>
              <p className="mt-2 text-xs font-medium text-page-fg">{jobsOfCompany(c.id).length ? `${jobsOfCompany(c.id).length} vị trí đang tuyển` : 'Chưa có vị trí đang tuyển'}</p>
            </Link>
          </li>
        ))}
      </ul>
      </FadeIn>
      )}
        </div>
      </IvoryPageBody>
    </>
  )
}
