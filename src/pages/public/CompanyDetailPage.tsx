import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Building2, Mail, MapPin, Pencil, Phone, Star } from 'lucide-react'
import { useCompanyStore } from '@context/companyStore'
import { useAuthStore } from '@context/authStore'
import { useCatalogStore } from '@context/catalogStore'
import { useSettingsStore } from '@context/settingsStore'
import CompanyLogo from '@components/common/CompanyLogo'
import TaxValidBadge from '@components/common/TaxValidBadge'
import DetailNotFound from '@components/discover/detail/NotFound'
import DetailSkeleton from '@components/discover/detail/DetailSkeleton'
import BackLink from '@components/discover/detail/BackLink'
import { photoUrl } from '@components/discover/types'
import { CompanyReviews } from '@components/hire'
import { scrollToY } from '@hooks/useSmoothScroll'
import { BTN_ACCENT, BTN_SECONDARY, BTN_SM, LINK } from '@utils/ui'
import { cn } from '@utils/cn'
import cover from '@assets/images/personal-cover-preview.webp'
import backdrop from '@assets/images/page-bg-jobs-preview.webp'
import { Card } from './personal/personalPrototypeParts'
import CompanyProfileCards from './personal/CompanyProfileCards'
import { companyRecruitingJobs } from './personal/companyRecruitingJobs'
import './personal/personalPrototype.css'

/** Trang cá nhân công khai của công ty trong danh mục, theo đúng id trên đường dẫn. */
export default function CompanyDetailPage() {
  const { id } = useParams()
  const companies = useCatalogStore((s) => s.companies)
  const catalogJobs = useCatalogStore((s) => s.jobs)
  const loaded = useCatalogStore((s) => s.loaded)
  const settled = useCatalogStore((s) => s.settled)
  const load = useCatalogStore((s) => s.load)
  const role = useAuthStore((s) => s.user?.role)
  const ownerId = useCompanyStore((s) => s.id)
  const isOwner = role === 'recruiter' && !!ownerId && ownerId === id
  const myPageHidden = useSettingsStore((s) => isOwner && s.bySide.recruiter.visibility === 'hidden')
  const [retrying, setRetrying] = useState(false)
  const company = companies.find((item) => item.id === id)

  useEffect(() => {
    document.documentElement.dataset.personalPreview = ''
    return () => { delete document.documentElement.dataset.personalPreview }
  }, [])

  if (!settled || retrying) return <DetailSkeleton label="Đang tải công ty…" />
  if (!loaded) {
    return (
      <section className="shell min-h-[60vh] py-section-sm">
        <BackLink />
        <h1 className="mt-10 font-display text-2xl font-semibold md:text-3xl">Chưa tải được công ty</h1>
        <p role="status" className="mt-4 max-w-xl text-page-muted">Không thể tải thông tin công ty và tin tuyển dụng. Vui lòng thử lại.</p>
        <button type="button" className={cn(BTN_SECONDARY, 'mt-6')} onClick={async () => {
          setRetrying(true)
          try { await load() } finally { setRetrying(false) }
        }}>Thử tải lại</button>
      </section>
    )
  }
  if (!company) {
    return <DetailNotFound title="Không tìm thấy công ty" text="Công ty này không có trên Workmate hoặc đường dẫn đã thay đổi." />
  }
  if (company.hidden && !isOwner && role !== 'admin') {
    return <DetailNotFound title="Trang công ty này đang ẩn" text="Công ty đã tạm ẩn trang giới thiệu. Các tin tuyển dụng của họ vẫn xem được ở mục Việc làm." />
  }

  const jobs = companyRecruitingJobs(catalogJobs, company.id)
  const area = company.district ? `${company.district}, Đà Nẵng` : 'Chưa cập nhật địa điểm'

  return (
    <article className="personal-preview theme-day relative isolate min-h-[calc(100svh-72px)] overflow-hidden text-page-fg" data-surface="light">
      <div aria-hidden className="personal-preview-backdrop pointer-events-none absolute inset-0 -z-10" style={{ backgroundImage: `url(${backdrop})` }} />
      <div className="mx-auto max-w-[1328px] px-4 pb-12 pt-6 sm:px-6 lg:px-10 lg:pt-7">
        <div className="mb-5"><BackLink /></div>
        <header className="personal-preview-cover relative overflow-hidden rounded-card">
          <img src={photoUrl(company.cover, 1800) || cover} alt="" width={1800} height={600} className="absolute inset-0 h-full w-full object-cover object-right" decoding="async" />
          <div aria-hidden className="personal-preview-cover-veil absolute inset-0" />
          <div className="relative flex flex-col items-center gap-5 px-6 py-7 text-center sm:flex-row sm:px-8 sm:text-left lg:gap-7 lg:py-8">
            <CompanyLogo name={company.name} logoUrl={company.logoUrl} decorative className="personal-preview-avatar h-28 w-28 rounded-full p-3 text-3xl lg:h-36 lg:w-36 lg:text-4xl" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 sm:justify-start">
                <h1 className="min-w-0 max-w-full break-words font-display text-2xl font-bold tracking-tight sm:text-3xl lg:text-[34px]">{company.name}</h1>
                <span className="personal-preview-chip">Nhà tuyển dụng</span>
              </div>
              <p className="mt-3 inline-flex items-center gap-2 text-sm"><MapPin aria-hidden className="h-4 w-4 shrink-0 text-wm-ocean" />{area}</p>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm sm:justify-start">
                {company.industry && <p className="flex items-center gap-2"><Building2 aria-hidden className="h-4 w-4 shrink-0 text-wm-ocean" />{company.industry}</p>}
                <TaxValidBadge valid={company.taxValid} />
                <span className="tnum text-page-muted">{jobs.length} việc đang tuyển</span>
              </div>
              {(company.email?.trim() || company.phone?.trim()) && <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm sm:justify-start">
                {company.email?.trim() && <p className="flex min-w-0 items-center gap-2"><Mail aria-hidden className="h-4 w-4 shrink-0 text-wm-ocean" /><span className="min-w-0 [overflow-wrap:anywhere]">{company.email}</span></p>}
                {company.phone?.trim() && <p className="flex min-w-0 items-center gap-2"><Phone aria-hidden className="h-4 w-4 shrink-0 text-wm-ocean" /><span className="min-w-0 [overflow-wrap:anywhere]">{company.phone}</span></p>}
              </div>}
              {company.tagline && <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-page-muted [overflow-wrap:anywhere]">{company.tagline}</p>}
            </div>
            <div className="flex max-w-full shrink-0 flex-wrap justify-center gap-2 self-center sm:flex-col sm:self-start">
              <a href="#viec-dang-tuyen" className={cn(BTN_ACCENT, BTN_SM)} onClick={(event) => {
                const target = document.getElementById('viec-dang-tuyen')
                if (!target) return
                event.preventDefault()
                scrollToY(window.scrollY + target.getBoundingClientRect().top - 112, !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
              }}>Xem việc đang tuyển</a>
              {isOwner && <Link to="/ca-nhan" className={cn(BTN_SECONDARY, BTN_SM, 'personal-preview-edit-link')}><Pencil aria-hidden className="h-3.5 w-3.5" />Chỉnh sửa hồ sơ</Link>}
            </div>
          </div>
        </header>

        {isOwner && (company.hidden || myPageHidden) && <p className="personal-preview-card mt-4 rounded-card text-sm text-page-muted">Trang này đang ẩn với người khác. <Link to="/tuyen-dung/cai-dat" className={LINK}>Đổi trong Cài đặt</Link></p>}

        <div className="personal-preview-grid mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.95fr)]">
          <CompanyProfileCards company={company} jobs={jobs} />
          <div className="min-w-0 lg:col-span-2">
            <Card title="Đánh giá từ người đã làm" icon={Star}>
              <CompanyReviews key={company.id} companyId={company.id} hideTitle className="mt-4" />
            </Card>
          </div>
        </div>
      </div>
    </article>
  )
}
