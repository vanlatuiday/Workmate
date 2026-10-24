import DiscoverGallery from '@components/discover/DiscoverGallery'
import { ProfileTag, ClosingBand, DetailHead, Facts, GalleryIntro, PrimaryLink, SampleNote, TextLink } from '@components/discover/parts'
import type { GalleryItem } from '@components/discover/types'
import { COMPANY_PUBLIC_HREF } from '@pages/public/personal/links'
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

/** Khách: khám phá nơi làm việc — nhấn vào lý do đáng xem, mời đăng ký khi muốn ứng tuyển. */
export default function GuestJobs() {
  return (
    <>
      <DiscoverGallery
        items={ITEMS}
        label="Các nơi đang tuyển"
        intro={
          <GalleryIntro
            eyebrow="Khám phá"
            title="Những nơi đang tìm người"
            text="Các công ty ở Đà Nẵng. Cuộn để xem từng nơi. Xem công ty không cần tài khoản, ứng tuyển thì cần."
          />
        }
        renderDetail={({ company: c }) => (
          <>
            <DetailHead kicker={`${c.industry} · ${c.district}`} title={c.name} />
            <div className="mt-3">
              <ProfileTag to={COMPANY_PUBLIC_HREF}>Trang doanh nghiệp</ProfileTag>
            </div>
            <p className="mt-4 leading-relaxed">{c.why}</p>
            <p className="mt-2 text-sm leading-relaxed text-page-muted">{c.tagline}</p>
            <Facts
              rows={[
                ['Đang tuyển', `${jobsOf(c).length} vị trí`],
                ['Quy mô', `${c.size} người`],
              ]}
            />
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
              <PrimaryLink to={`/cong-ty/${c.id}`} state={{ from: '/viec-lam' }} curtain={c.name}>
                Xem công ty
              </PrimaryLink>
              <TextLink to="/dang-ky?role=jobseeker">Đăng ký để ứng tuyển</TextLink>
            </div>
          </>
        )}
      />
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
