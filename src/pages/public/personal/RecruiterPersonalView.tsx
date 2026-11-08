import PersonalArchive from '@components/archive/PersonalArchive'
import type { ArchiveEntry } from '@components/archive/types'
import { CompanyReviews } from '@components/hire'
import { useCompanyStore, type CompanyProfile } from '@context/companyStore'
import type { CatalogJob } from '@context/catalogStore'
import { useCompanyJobs } from '@services/adminService'
import { Facts, SampleNote } from '@components/discover/parts'
import { JOB_TYPES } from '@constants/index'
import PersonalIntro from './PersonalIntro'
import { ActionPrimary, ActionText, Actions, EmptyNote, PlainList, Section, TagList } from './parts'
import { Link } from 'react-router-dom'
import { FOCUS } from '@utils/focus'

type Opts = { owner: boolean }
type BuildOpts = Opts & { P: CompanyProfile; openJobs: CatalogJob[] }

const EDIT_HREF = '/tuyen-dung/ho-so-cong-ty'

/** Hành động cuối tấm: chủ → quản lý tin / hồ sơ công ty; người xem → quay lại việc làm */
function CompanyActions({ owner }: Opts) {
  return owner ? (
    <>
      <Actions>
        <ActionPrimary to="/tuyen-dung/tin-dang">Quản lý tin</ActionPrimary>
        <ActionText to={EDIT_HREF}>Hồ sơ công ty</ActionText>
      </Actions>
    </>
  ) : (
    <Actions>
      <ActionText to="/viec-lam">Quay lại việc làm</ActionText>
    </Actions>
  )
}

/** Dựng 6 tấm doanh nghiệp; `owner` chỉ đổi hành động và đích của link vị trí. */
function buildCompanyEntries({ owner, P, openJobs }: BuildOpts): ArchiveEntry[] {
  const actions = <CompanyActions owner={owner} />
  const inv = owner ? { to: EDIT_HREF, label: 'Bổ sung trong hồ sơ công ty' } : undefined
  const list = (items: string[], empty: string) => (items.length ? <PlainList items={items} /> : <EmptyNote invite={inv}>{empty}</EmptyNote>)
  // Kỹ năng thật sự đang cần: gom từ các tin đang mở
  const skillsWanted = [...new Set(openJobs.flatMap((j) => j.skills))]
  return [
    {
      id: 'chung-toi-la-ai',
      number: '01',
      title: 'Chúng tôi là ai?',
      caption: 'Một toà nhà: nơi công việc của chúng tôi bắt đầu mỗi ngày.',
      photo: { id: '1486406146926-c627a92ad1ab', alt: 'Toà nhà văn phòng nhìn từ bên ngoài' },
      cursor: 'Mở',
      content: (
        <>
          <p className="font-display text-xl font-semibold">{P.name}</p>
          {P.about ? <p className="mt-3 whitespace-pre-line leading-relaxed">{P.about}</p> : <div className="mt-3"><EmptyNote invite={inv}>Chưa có phần giới thiệu.</EmptyNote></div>}
          <Facts
            rows={[
              ['Lĩnh vực', P.industry || 'Chưa nêu'],
              ['Địa điểm', P.district ? `${P.district}, Đà Nẵng` : 'Chưa nêu'],
              ['Quy mô', `${P.size} người`],
            ]}
          />
        </>
      ),
      actions,
    },
    {
      id: 'khong-gian',
      number: '02',
      title: 'Không gian làm việc',
      caption: 'Một văn phòng sáng: cách chúng tôi sắp xếp chỗ và giờ làm.',
      photo: { id: '1497366216548-37526070297c', alt: 'Không gian văn phòng sáng sủa với bàn ghế' },
      cursor: 'Mở',
      content: (
        <>
          <Section title="Môi trường làm việc">
            {list(P.environment, 'Chưa mô tả môi trường làm việc.')}
          </Section>
        </>
      ),
      actions,
    },
    {
      id: 'con-nguoi',
      number: '03',
      title: 'Con người của chúng tôi',
      caption: 'Một nhóm đang trò chuyện: cách chúng tôi làm việc cùng nhau.',
      photo: { id: '1543269865-cbf427effbad', alt: 'Nhóm người đang trò chuyện cùng nhau' },
      cursor: 'Mở',
      content: (
        <>
          <Section title="Văn hóa">
            {P.culture ? <p>{P.culture}</p> : <EmptyNote invite={inv}>Chưa mô tả văn hóa.</EmptyNote>}
          </Section>
          <Section title="Giá trị">
            {P.values.length ? <TagList items={P.values} /> : <EmptyNote invite={inv}>Chưa nêu giá trị.</EmptyNote>}
          </Section>
          <Section title="Chính sách cho nhân viên">
            {list(P.policies, 'Chưa nêu chính sách.')}
          </Section>
        </>
      ),
      actions,
    },
    {
      id: 'co-hoi',
      number: '04',
      title: 'Cơ hội đang mở',
      caption: 'Một danh sách đang viết: những vị trí chúng tôi cần người.',
      photo: { id: '1484480974693-6ca0a78fb36b', alt: 'Người đang viết danh sách công việc vào sổ' },
      cursor: 'Mở',
      content: (
        openJobs.length ? (
          <ul className="divide-y divide-page-line border-y border-page-line">
            {openJobs.map((j) => (
              <li key={j.id} className="py-3">
                <Link to={owner ? `/vi-tri/${j.id}` : `/viec-lam/${j.id}`} className={`link-underline rounded-control font-medium ${FOCUS}`}>
                  {j.title}
                </Link>
                <p className="mt-1 text-sm text-page-muted">
                  {JOB_TYPES.find((t) => t.value === j.jobType)?.label ?? j.jobType} · {j.shiftLabel} · {j.salaryLabel}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyNote invite={owner ? { to: '/dang-tin', label: 'Đăng tin tuyển dụng' } : undefined}>Hiện chưa có vị trí đang mở.</EmptyNote>
        )
      ),
      actions,
    },
    {
      id: 'tim-ai',
      number: '05',
      title: 'Chúng tôi tìm kiếm ai?',
      caption: 'Một cái bắt tay: sự tin cậy giữa hai bên khi làm việc cùng.',
      photo: { id: '1521791136064-7986c2920216', alt: 'Hai người bắt tay nhau trong buổi gặp' },
      cursor: 'Mở',
      content: (
        <Section title="Kỹ năng đang cần">
          {skillsWanted.length ? <TagList items={skillsWanted} /> : <EmptyNote>Kỹ năng lấy từ các tin đang mở; hiện chưa có tin nào.</EmptyNote>}
        </Section>
      ),
      actions,
    },
    {
      id: 'ket-noi',
      number: '06',
      title: 'Kết nối với chúng tôi',
      caption: 'Cây bút viết thư: nơi bắt đầu một cuộc trò chuyện.',
      photo: { id: '1455390582262-044cdead277a', alt: 'Cây bút đang viết thư trên giấy' },
      cursor: 'Mở',
      content: (
        <Facts rows={[['Email', P.email || 'Chưa nêu'], ['Điện thoại', P.phone || 'Chưa nêu']]} />
      ),
      actions,
    },
  ]
}

/** Nhà tuyển dụng: doanh nghiệp của tôi (owner) hoặc xem thử bản người tìm việc thấy. */
export default function RecruiterPersonalView({ owner }: Opts) {
  const myCompanyId = useCompanyStore((s) => s.id)
  const P = useCompanyStore((s) => s.profile)
  const openJobs = useCompanyJobs(myCompanyId).map((r) => r.job).filter((j) => j.visible)
  return (
    <>
      <PersonalArchive
        entries={buildCompanyEntries({ owner, P, openJobs })}
        label="Trang doanh nghiệp"
        eyebrow="Doanh nghiệp"
        intro={
          <PersonalIntro
            eyebrow="Phía sau doanh nghiệp"
            title={owner ? 'Doanh nghiệp của tôi' : P.name}
            text={
              owner
                ? 'Sáu phần mà người tìm việc sẽ thấy khi xem công ty bạn. Bấm từng tấm ảnh để xem.'
                : 'Sáu phần giới thiệu doanh nghiệp: con người, nơi làm việc và những vị trí đang mở.'
            }
            mode={owner ? 'Trang của bạn' : `Bạn đang xem trang công khai của ${P.name}`}
            back={owner ? undefined : { to: '/viec-lam', label: 'Quay lại việc làm' }}
          />
        }
      />
      <div className="shell pb-section-sm">
        <CompanyReviews companyId={myCompanyId} className="mx-auto max-w-2xl" />
      </div>
      <SampleNote>Ảnh minh họa từ Unsplash.</SampleNote>
    </>
  )
}
