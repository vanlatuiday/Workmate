import CompanyLogo from '@components/common/CompanyLogo'
import { Link, useParams } from 'react-router-dom'
import { useCompanyStore } from '@context/companyStore'
import { useAuthStore } from '@context/authStore'
import { useCatalogStore } from '@context/catalogStore'
import { useSettingsStore } from '@context/settingsStore'
import { Star } from 'lucide-react'
import { BTN_ACCENT, BTN_SECONDARY } from '@utils/ui'
import { reviewStats, useCompanyReviews } from '@services/connectionService'
import { Facts, PrimaryLink, TextLink } from '@components/discover/parts'
import DetailHero from '@components/discover/detail/DetailHero'
import DetailLayout from '@components/discover/detail/DetailLayout'
import DetailNotFound from '@components/discover/detail/NotFound'
import DetailSkeleton from '@components/discover/detail/DetailSkeleton'
import BackLink from '@components/discover/detail/BackLink'
import JobLinks from '@components/discover/detail/JobLinks'
import { CheckList, ImageBlock, TextBlock } from '@components/discover/detail/DetailBlocks'
import { CompanyReviews } from '@components/hire'
import Reveal from '@components/motion/Reveal'
import { findCompany } from './jobs/data'
import { jobsOfCompany } from './jobs/catalog'
import TaxValidBadge from '@components/common/TaxValidBadge'

/** /cong-ty/:id — chi tiết công ty kiểu "case study". Khách thấy thêm lời mời đăng ký. */
export default function CompanyDetailPage() {
  const { id } = useParams()
  useCatalogStore((s) => s.companies) // cập nhật khi danh mục nạp xong từ máy chủ
  const company = findCompany(id)
  const role = useAuthStore((s) => s.user?.role)
  const isOwner = useCompanyStore((s) => !!s.id && s.id === id)
  const myPageHidden = useSettingsStore((s) => isOwner && s.bySide.recruiter.visibility === 'hidden')
  const hiddenPage = !!useCatalogStore((s) => s.companies.find((c) => c.id === id)?.hidden) && !isOwner && role !== 'admin'

  const rating = reviewStats(useCompanyReviews(id ?? ''))
  const taxValid = useCatalogStore((s) => s.companies.find((c) => c.id === id)?.taxValid)
  const catalogSettled = useCatalogStore((s) => s.settled)

  // Danh mục chưa về từ máy chủ: khung chờ, không báo "không tìm thấy" sớm
  if (!company && !catalogSettled) return <DetailSkeleton label="Đang tải công ty…" />
  if (!company) {
    return (
      <DetailNotFound
        title="Không tìm thấy công ty"
        text="Công ty này không có trên Workmate hoặc đường dẫn đã thay đổi."
      />
    )
  }

  if (hiddenPage) {
    return (
      <DetailNotFound
        title="Trang công ty này đang ẩn"
        text="Công ty đã tạm ẩn trang giới thiệu. Các tin tuyển dụng của họ vẫn xem được ở mục Việc làm."
      />
    )
  }

  const jobs = jobsOfCompany(company.id)
  const isGuest = !role

  const sizeLabel = `${company.size.replace(/(\d)-(\d)/g, '$1–$2')} người`
  const toJobs = () => {
    const el = document.getElementById('viec-dang-tuyen')
    if (!el) return
    el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
  }

  const aside = (
    <div className="day-card rounded-card border border-page-line p-5">
      <div className="flex items-center gap-3">
        <CompanyLogo name={company.name} logoUrl={company.logoUrl} className="h-10 w-10 shrink-0 text-sm" />
        <p className="min-w-0 font-display text-base font-semibold leading-tight">{company.name}</p>
      </div>
      <Facts
        dense
        rows={[
          ['Lĩnh vực', company.industry],
          ['Địa điểm', `${company.district}, Đà Nẵng`],
          ['Quy mô', sizeLabel],
        ]}
      />
      <div className="mt-5 flex flex-col items-start gap-4">
        {jobs.length > 0 ? (
          <button type="button" onClick={toJobs} className={BTN_ACCENT}>
            Xem {jobs.length} việc đang tuyển
          </button>
        ) : (
          <Link to="/viec-lam" className={BTN_SECONDARY}>Xem việc làm khác</Link>
        )}
        {role === 'jobseeker' && <TextLink to="/tim-viec/phu-hop">Xem việc phù hợp với tôi</TextLink>}
        {jobs.length > 0 && <TextLink to="/viec-lam">Xem việc làm khác</TextLink>}
      </div>
    </div>
  )

  return (
    <article className="pb-10 md:pb-14">
      <DetailHero
        back={<BackLink />}
        eyebrow={`${company.industry} · ${company.district}`}
        title={company.name}
        tagline={company.tagline}
        facts={
          <>
            <TaxValidBadge valid={taxValid} />
            {jobs.length > 0 && <span className="text-page-muted">{jobs.length} việc đang tuyển</span>}
            {rating.count > 0 && (
              <span className="tnum inline-flex items-center gap-1 text-page-muted">
                <Star className="h-3.5 w-3.5 fill-current text-page-fg" aria-hidden="true" />
                {rating.average.toFixed(1).replace('.', ',')} ({rating.count} đánh giá)
              </span>
            )}
          </>
        }
        photo={company.cover}
      />

      <DetailLayout aside={aside}>
        {myPageHidden && (
          <p className="day-card rounded-card border border-page-line p-4 text-sm text-page-muted">
            Trang này đang ẩn với người khác. <Link to="/tuyen-dung/cai-dat" className="text-page-fg underline underline-offset-4">Đổi trong Cài đặt</Link>
          </p>
        )}
        <TextBlock title="Về công ty">
          <p className="text-base md:text-lg leading-relaxed">{company.about}</p>
        </TextBlock>

        <TextBlock title="Môi trường làm việc">
          <CheckList items={company.environment} />
        </TextBlock>

        {company.more && <ImageBlock photo={company.more} />}

        <TextBlock title={`Việc đang tuyển (${jobs.length})`} id="viec-dang-tuyen">
          <JobLinks jobs={jobs} />
        </TextBlock>

        <TextBlock title="Đánh giá từ người đã làm">
          <CompanyReviews companyId={company.id} hideTitle />
        </TextBlock>

        {isGuest && (
          <Reveal>
            <div className="day-card rounded-card border border-page-line p-6 md:p-8">
              <h2 className="font-display text-xl md:text-2xl font-semibold leading-tight tracking-[-0.02em]">
                Chọn vai trò để bắt đầu
              </h2>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
                <PrimaryLink to="/dang-ky?role=jobseeker">Đăng ký để ứng tuyển</PrimaryLink>
                <TextLink to="/dang-ky?role=recruiter">Tôi cần tuyển người</TextLink>
              </div>
            </div>
          </Reveal>
        )}
      </DetailLayout>
    </article>
  )
}
