import { useState } from 'react'
import PersonalArchive from '@components/archive/PersonalArchive'
import type { ArchiveEntry } from '@components/archive/types'
import { Facts, SampleNote } from '@components/discover/parts'
import { JOB_STATUS_LABELS, MOCK_JOBS } from '@pages/recruiter/mockData'
import PersonalIntro from './PersonalIntro'
import { COMPANY as C } from './companyData'
import { ActionNote, ActionPrimary, ActionText, Actions, PlainList, Section, TagList } from './parts'
import { Link } from 'react-router-dom'

type Opts = { owner: boolean }

const OPEN_JOBS = MOCK_JOBS.filter((j) => j.status === 'open')

/** Hành động cuối tấm: chủ → quản lý tin / hồ sơ công ty; người xem → quay lại việc làm */
function CompanyActions({ owner }: Opts) {
  return owner ? (
    <>
      <Actions>
        <ActionPrimary to="/tuyen-dung/tin-dang">Quản lý tin</ActionPrimary>
        <ActionText to="/tuyen-dung/ho-so-cong-ty">Hồ sơ công ty</ActionText>
      </Actions>
      <ActionNote>Phần chỉnh sửa hồ sơ công ty đang được xây trong khu tuyển dụng.</ActionNote>
    </>
  ) : (
    <Actions>
      <ActionText to="/viec-lam">Quay lại việc làm</ActionText>
    </Actions>
  )
}

/** Nút "Gửi lời nhắn" giả lập: chỉ báo chưa hoạt động, không giả vờ đã gửi */
function MessageDemo() {
  const [shown, setShown] = useState(false)
  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={() => setShown(true)}
        className="rounded-full border border-page-fg px-5 py-2.5 text-sm font-medium transition-colors duration-300 hover:bg-page-fg hover:text-page-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-page-fg focus-visible:ring-offset-2 focus-visible:ring-offset-page-bg"
      >
        Gửi lời nhắn
      </button>
      <p role="status" className="mt-2 text-sm text-page-muted">
        {shown ? 'Chức năng nhắn tin chưa hoạt động (bản demo).' : ''}
      </p>
    </div>
  )
}

/** Dựng 6 tấm doanh nghiệp; `owner` chỉ đổi hành động và đích của link vị trí. */
export function buildCompanyEntries({ owner }: Opts): ArchiveEntry[] {
  const actions = <CompanyActions owner={owner} />
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
          <p className="font-display text-xl font-semibold">{C.name}</p>
          <p className="mt-3 leading-relaxed">{C.intro}</p>
          <Facts
            rows={[
              ['Lĩnh vực', C.industry],
              ['Địa điểm', C.location],
              ['Người phụ trách tuyển dụng', `${C.recruiter.title} · ${C.recruiter.email}`],
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
            <PlainList items={C.environment} />
          </Section>
          <Section title="Cách tổ chức công việc">
            <PlainList items={C.workOrganization} />
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
            <p>{C.culture}</p>
          </Section>
          <Section title="Giá trị">
            <TagList items={C.values} />
          </Section>
          <Section title="Chính sách cho nhân viên">
            <PlainList items={C.policies} />
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
        <ul className="divide-y divide-page-line border-y border-page-line">
          {OPEN_JOBS.map((j) => (
            <li key={j.id} className="py-3">
              <Link
                to={owner ? `/vi-tri/${j.id}` : '/viec-lam'}
                className="link-underline rounded-control font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-page-fg focus-visible:ring-offset-2 focus-visible:ring-offset-page-bg"
              >
                {j.title}
              </Link>
              <p className="mt-1 text-sm text-page-muted">
                {JOB_STATUS_LABELS[j.status]} · {j.jobType} · {j.schedule} · {j.salary}
              </p>
            </li>
          ))}
        </ul>
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
        <>
          <Section title="Kỹ năng quan tâm">
            <TagList items={C.skillsWanted} />
          </Section>
          <Section title="Tiêu chí ưu tiên">
            <PlainList items={C.priorities} />
          </Section>
        </>
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
        <>
          <Facts rows={C.contacts} />
          <MessageDemo />
        </>
      ),
      actions,
    },
  ]
}

/** Nhà tuyển dụng: doanh nghiệp của tôi (owner) hoặc trang doanh nghiệp mẫu (người xem). */
export default function RecruiterPersonalView({ owner }: Opts) {
  return (
    <>
      <PersonalArchive
        entries={buildCompanyEntries({ owner })}
        label="Trang doanh nghiệp"
        eyebrow="Doanh nghiệp"
        intro={
          <PersonalIntro
            eyebrow="Phía sau doanh nghiệp"
            title={owner ? 'Doanh nghiệp của tôi' : C.name}
            text={
              owner
                ? 'Sáu phần mà người tìm việc sẽ thấy khi xem công ty bạn. Bấm từng tấm ảnh để xem.'
                : 'Sáu phần giới thiệu doanh nghiệp: con người, nơi làm việc và những vị trí đang mở.'
            }
            mode={owner ? 'Trang của bạn' : `Bạn đang xem trang công khai của ${C.name}`}
            back={owner ? undefined : { to: '/viec-lam', label: 'Quay lại việc làm' }}
          />
        }
      />
      <SampleNote>Thông tin doanh nghiệp là dữ liệu mẫu, sẽ thay bằng dữ liệu thật. Ảnh minh họa từ Unsplash.</SampleNote>
    </>
  )
}
