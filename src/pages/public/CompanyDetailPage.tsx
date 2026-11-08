import { Link, useParams } from 'react-router-dom'
import { useCompanyStore } from '@context/companyStore'
import { useAuthStore } from '@context/authStore'
import { useCatalogStore } from '@context/catalogStore'
import { useSettingsStore } from '@context/settingsStore'
import { Facts, PrimaryLink, TextLink } from '@components/discover/parts'
import DetailHero from '@components/discover/detail/DetailHero'
import DetailLayout from '@components/discover/detail/DetailLayout'
import DetailNotFound from '@components/discover/detail/NotFound'
import BackLink from '@components/discover/detail/BackLink'
import JobLinks from '@components/discover/detail/JobLinks'
import { ImageBlock, TagList, TextBlock } from '@components/discover/detail/DetailBlocks'
import { CompanyReviews } from '@components/hire'
import Reveal from '@components/motion/Reveal'
import { findCompany } from './jobs/data'
import { jobsOfCompany } from './jobs/catalog'

/** /cong-ty/:id — chi tiết công ty kiểu "case study". Khách thấy thêm lời mời đăng ký. */
export default function CompanyDetailPage() {
  const { id } = useParams()
  useCatalogStore((s) => s.companies) // cập nhật khi danh mục nạp xong từ máy chủ
  const company = findCompany(id)
  const role = useAuthStore((s) => s.user?.role)
  const isOwner = useCompanyStore((s) => !!s.id && s.id === id)
  const myPageHidden = useSettingsStore((s) => isOwner && s.bySide.recruiter.visibility === 'hidden')
  const hiddenPage = !!useCatalogStore((s) => s.companies.find((c) => c.id === id)?.hidden) && !isOwner && role !== 'admin'

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
        text="Doanh nghiệp đã tạm ẩn trang giới thiệu. Các tin tuyển dụng của họ vẫn xem được ở mục Việc làm."
      />
    )
  }

  const jobs = jobsOfCompany(company.id)
  const isGuest = !role

  const aside = (
    <>
      <p className="max-w-sm text-base md:text-lg leading-relaxed">{company.tagline}</p>
      <Facts
        rows={[
          ['Lĩnh vực', company.industry],
          ['Địa điểm', `${company.district}, Đà Nẵng`],
          ['Quy mô', `${company.size} người`],
          ['Đang tuyển', `${jobs.length} vị trí`],
        ]}
      />
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
        {isGuest && <PrimaryLink to="/dang-ky?role=jobseeker">Đăng ký để ứng tuyển</PrimaryLink>}
        {role === 'jobseeker' && <PrimaryLink to="/tim-viec/phu-hop">Xem việc phù hợp với tôi</PrimaryLink>}
        <TextLink to="/viec-lam">Xem các công ty khác</TextLink>
      </div>
    </>
  )

  return (
    <article className="pb-section-sm">
      <DetailHero
        back={<BackLink />}
        eyebrow={`${company.industry} · ${company.district}`}
        title={company.name}
        photo={company.cover}
      />

      <DetailLayout aside={aside}>
        {myPageHidden && (
          <p className="rounded-card border border-page-line p-4 text-sm text-page-muted">
            Trang này đang ẩn với người khác. <Link to="/tuyen-dung/cai-dat" className="text-page-fg underline underline-offset-4">Đổi trong Cài đặt</Link>
          </p>
        )}
        <TextBlock title="Về công ty">
          <p className="text-base md:text-lg leading-relaxed">{company.about}</p>
        </TextBlock>

        <TextBlock title="Môi trường làm việc">
          <TagList items={company.environment} />
        </TextBlock>

        {company.more && <ImageBlock photo={company.more} />}

        <TextBlock title="Việc đang tuyển">
          <JobLinks jobs={jobs} />
        </TextBlock>

        <TextBlock title="Đánh giá từ người đã làm">
          <CompanyReviews companyId={company.id} hideTitle />
        </TextBlock>

        {isGuest && (
          <Reveal>
            <div className="rounded-card border border-page-line p-6 md:p-8">
              <h2 className="font-display text-xl md:text-2xl font-semibold leading-tight tracking-[-0.02em]">
                Bạn là người tìm việc hay người cần tuyển?
              </h2>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
                <PrimaryLink to="/dang-ky?role=jobseeker">Đăng ký để ứng tuyển</PrimaryLink>
                <TextLink to="/dang-ky?role=recruiter">Tôi cần tuyển người</TextLink>
              </div>
            </div>
          </Reveal>
        )}

        <p className="text-xs text-page-muted">
          Ảnh minh họa từ Unsplash.
        </p>
      </DetailLayout>
    </article>
  )
}
