import { Link, useParams } from 'react-router-dom'
import { useAuthStore } from '@context/authStore'
import { useSettingsStore } from '@context/settingsStore'
import { Facts, PrimaryLink, ProfileTag, TextLink } from '@components/discover/parts'
import { COMPANY_PUBLIC_HREF } from '@pages/public/personal/links'
import DetailHero from '@components/discover/detail/DetailHero'
import DetailLayout from '@components/discover/detail/DetailLayout'
import DetailNotFound from '@components/discover/detail/NotFound'
import BackLink from '@components/discover/detail/BackLink'
import ApplicantCard from '@components/discover/detail/ApplicantCard'
import JobLinks from '@components/discover/detail/JobLinks'
import { ImageBlock, TagList, TextBlock } from '@components/discover/detail/DetailBlocks'
import { CompanyReviews } from '@components/hire'
import Reveal from '@components/motion/Reveal'
import { applicantsOf, findCompany } from './jobs/data'
import { jobsOfCompany } from './jobs/catalog'
import { companyOf, DEMO_COMPANY } from './match/data'

/**
 * /cong-ty/:id — chi tiết công ty kiểu "case study" (dữ liệu mẫu).
 * Nội dung theo vai trò: khách/admin thấy xen kẽ công ty và người ứng tuyển ẩn danh;
 * người tìm việc và nhà tuyển dụng chỉ thấy phía công ty.
 */
export default function CompanyDetailPage() {
  const { id } = useParams()
  // Công ty của doanh nghiệp demo nằm ngoài COMPANIES: lấy qua companyOf để nhận cả phần đã sửa ở Hồ sơ công ty
  const company = findCompany(id) ?? (id === DEMO_COMPANY.id ? companyOf(id) : undefined)
  const role = useAuthStore((s) => s.user?.role)
  // Doanh nghiệp demo tắt "Công khai trang công ty": chỉ chính họ (và quản trị viên) còn xem được trang
  const companyHidden = useSettingsStore((s) => s.bySide.recruiter.visibility === 'hidden')
  const hiddenPage = company?.id === DEMO_COMPANY.id && companyHidden

  if (!company) {
    return (
      <DetailNotFound
        title="Không tìm thấy công ty"
        text="Công ty này không có trong dữ liệu mẫu hoặc đường dẫn đã thay đổi."
      />
    )
  }

  if (hiddenPage && role !== 'recruiter' && role !== 'admin') {
    return (
      <DetailNotFound
        title="Trang công ty này đang ẩn"
        text="Doanh nghiệp đã tạm ẩn trang giới thiệu. Các tin tuyển dụng của họ vẫn xem được ở mục Việc làm."
      />
    )
  }

  const jobs = jobsOfCompany(company.id)
  // Khách và admin xem như nhau: có phần người ứng tuyển
  const withApplicants = role !== 'jobseeker' && role !== 'recruiter'
  const applicants = withApplicants ? applicantsOf(company) : []

  const aside = (
    <>
      <p className="max-w-sm text-base md:text-lg leading-relaxed">{company.tagline}</p>
      <div className="mt-4">
        <ProfileTag to={COMPANY_PUBLIC_HREF}>Trang doanh nghiệp</ProfileTag>
      </div>
      <Facts
        rows={[
          ['Lĩnh vực', company.industry],
          ['Địa điểm', `${company.district}, Đà Nẵng`],
          ['Quy mô', `${company.size} người`],
          ['Đang tuyển', `${jobs.length} vị trí`],
          ...(withApplicants ? ([['Người ứng tuyển', `${applicants.length} hồ sơ mẫu`]] as [string, string][]) : []),
        ]}
      />
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
        {withApplicants && <PrimaryLink to="/dang-ky?role=jobseeker">Đăng ký để ứng tuyển</PrimaryLink>}
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
        {hiddenPage && (
          <p className="rounded-card border border-page-line p-4 text-sm text-page-muted">
            Trang này đang ẩn với người khác. <Link to="/tuyen-dung/cai-dat" className="text-page-fg underline underline-offset-4">Đổi trong Cài đặt</Link>
          </p>
        )}
        <TextBlock title="Về công ty">
          <p className="text-base md:text-lg leading-relaxed">{company.about}</p>
        </TextBlock>

        {applicants[0] && <ApplicantCard a={applicants[0]} />}

        <TextBlock title="Môi trường làm việc">
          <TagList items={company.environment} />
        </TextBlock>

        {company.more && <ImageBlock photo={company.more} />}

        {applicants[1] && <ApplicantCard a={applicants[1]} />}

        <TextBlock title="Việc đang tuyển">
          <JobLinks jobs={jobs} />
        </TextBlock>

        <TextBlock title="Đánh giá từ người đã làm">
          <CompanyReviews companyId={company.id} hideTitle />
        </TextBlock>

        {withApplicants && (
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
          Thông tin công ty, tin tuyển dụng và hồ sơ người ứng tuyển là dữ liệu mẫu. Ảnh minh họa từ Unsplash.
        </p>
      </DetailLayout>
    </article>
  )
}
