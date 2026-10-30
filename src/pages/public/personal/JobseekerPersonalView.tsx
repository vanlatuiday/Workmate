import PersonalArchive from '@components/archive/PersonalArchive'
import type { ArchiveEntry } from '@components/archive/types'
import { SeekerReviews } from '@components/hire'
import { ME } from '@services/connectionService'
import { SampleNote } from '@components/discover/parts'
import { JOB_TYPES } from '@constants/index'
import { RECENT_APPLICATIONS } from '@pages/jobseeker/mockData'
import { useProfileStore, type SeekerProfile } from '@context/profileStore'
import PersonalIntro from './PersonalIntro'
import { ActionNote, ActionPrimary, ActionText, Actions, EmptyNote, Section, TagList, WeekGrid } from './parts'

const EDIT_HREF = '/tim-viec/ho-so'

type Opts = { owner: boolean }
type BuildOpts = Opts & { P: SeekerProfile }

/** Gợi ý bổ sung chỉ hiện với chủ hồ sơ */
const invite = (owner: boolean) => (owner ? { to: EDIT_HREF, label: 'Bổ sung trong hồ sơ' } : undefined)

/** Hành động cuối tấm: chủ → sang khu tìm việc để sửa; người xem → quay lại việc làm */
function SeekerActions({ owner }: Opts) {
  return owner ? (
    <>
      <Actions>
        <ActionPrimary to={EDIT_HREF}>Chỉnh sửa trong hồ sơ</ActionPrimary>
      </Actions>
      <ActionNote>Việc chỉnh sửa nằm ở khu tìm việc; trang này chỉ để xem.</ActionNote>
    </>
  ) : (
    <Actions>
      <ActionText to="/viec-lam">Quay lại việc làm</ActionText>
    </Actions>
  )
}

/** Dựng 6 tấm hồ sơ người tìm việc; `owner` chỉ đổi hành động và thông tin nhạy cảm. */
function buildSeekerEntries({ owner, P }: BuildOpts): ArchiveEntry[] {
  const AVAILABLE = new Set(P.availability)
  const typeLabels = P.jobTypes.map((t) => JOB_TYPES.find((j) => j.value === t)?.label ?? t)
  const salaryText = `từ ${P.salaryMin.toLocaleString('vi-VN')}đ/giờ`
  const actions = <SeekerActions owner={owner} />
  const inv = invite(owner)
  return [
    {
      id: 'toi-la-ai',
      number: '01',
      title: 'Tôi là ai?',
      caption: 'Cuốn sổ ghi chú: những dòng đầu tiên giới thiệu một con người.',
      photo: { id: '1517842645767-c639042777db', alt: 'Cuốn sổ tay và cây bút đặt trên bàn' },
      cursor: 'Mở',
      content: (
        <>
          <Section title="Họ tên">
            <p className="font-display text-xl font-semibold">{P.fullName}</p>
          </Section>
          <Section title="Khu vực">
            <p>{P.area}</p>
          </Section>
          <Section title="Định hướng">
            <TagList items={typeLabels} />
          </Section>
          <Section title="Số điện thoại">
            {owner ? <p>{P.phone}</p> : <p className="text-page-muted">Thông tin được ẩn</p>}
          </Section>
          <Section title="Giới thiệu ngắn">
            <EmptyNote invite={inv}>Chưa có phần giới thiệu.</EmptyNote>
          </Section>
        </>
      ),
      actions,
    },
    {
      id: 'toi-lam-gi',
      number: '02',
      title: 'Tôi có thể làm gì?',
      caption: 'Dụng cụ xếp trên nền trắng: mỗi kỹ năng là một món nghề.',
      photo: { id: '1581783898377-1c85bf937427', alt: 'Bộ dụng cụ làm việc xếp trên nền trắng' },
      cursor: 'Mở',
      content: (
        <>
          <Section title="Kỹ năng">
            <TagList items={P.skills} />
          </Section>
          <Section title="Kỹ năng mềm, thế mạnh, điều muốn phát triển">
            <EmptyNote invite={inv}>Chưa có thông tin.</EmptyNote>
          </Section>
        </>
      ),
      actions,
    },
    {
      id: 'da-trai-qua',
      number: '03',
      title: 'Những gì tôi đã trải qua',
      caption: 'Bàn làm việc: nơi những công việc đã qua để lại dấu vết.',
      photo: { id: '1488190211105-8b0e65b80b4e', alt: 'Bàn làm việc với máy tính và sổ ghi chép' },
      cursor: 'Mở',
      content: (
        <>
          <Section title="Kinh nghiệm làm việc">
            <ol className="space-y-4 border-l border-page-line pl-5">
              {P.experience.map((e) => (
                <li key={e.id} className="relative">
                  <span aria-hidden className="absolute -left-[25px] top-2 h-2 w-2 rounded-full bg-page-fg" />
                  <p className="font-medium">{e.title}</p>
                  <p className="text-sm text-page-muted">
                    {e.company} · {e.period}
                  </p>
                </li>
              ))}
            </ol>
          </Section>
          <Section title="Dự án và thành tựu">
            <EmptyNote invite={inv}>Chưa có dự án hay thành tựu nào.</EmptyNote>
          </Section>
        </>
      ),
      actions,
    },
    {
      id: 'thoi-gian',
      number: '04',
      title: 'Thời gian của tôi',
      caption: 'Cuốn lịch: các buổi trong tuần tôi có thể đi làm.',
      photo: { id: '1435527173128-983b87201f4d', alt: 'Cuốn sổ lịch mở trên bàn làm việc' },
      cursor: 'Mở',
      content: (
        <>
          <Section title="Lịch rảnh trong tuần">
            <WeekGrid on={AVAILABLE} />
            <p className="mt-3 text-sm text-page-muted">
              Đây là dữ liệu quan trọng nhất để ghép việc theo ca: tin chỉ được gợi ý khi ca làm nằm trong các
              buổi rảnh.
            </p>
          </Section>
          <Section title="Loại việc mong muốn">
            <TagList items={typeLabels} />
          </Section>
        </>
      ),
      actions,
    },
    {
      id: 'dang-tim',
      number: '05',
      title: 'Công việc tôi đang tìm',
      caption: 'Bản đồ có ghim: nơi và mức thu nhập tôi hướng tới.',
      photo: { id: '1476973422084-e0fa66ff9456', alt: 'Bản đồ giấy cắm ghim đánh dấu địa điểm' },
      cursor: 'Mở',
      content: (
        <>
          <dl className="divide-y divide-page-line border-y border-page-line text-sm">
            {(
              [
                ['Khu vực', P.area],
                ['Bán kính tối đa', `${P.maxDistanceKm} km`],
                ['Mức lương', salaryText],
                ['Loại việc', typeLabels.join(', ')],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5">
                <dt className="text-page-muted">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>
          <Section title="Ưu tiên khác">
            <EmptyNote invite={inv}>Chưa có ưu tiên nào khác.</EmptyNote>
          </Section>
        </>
      ),
      actions,
    },
    {
      id: 'ho-so-thanh-tuu',
      number: '06',
      title: 'Hồ sơ và thành tựu',
      caption: 'Giấy tờ đang được ký: những gì có thể đưa ra làm bằng chứng.',
      photo: { id: '1450101499163-c8848c66ca85', alt: 'Người đang ký lên một tập giấy tờ' },
      cursor: 'Mở',
      content: (
        <>
          <Section title="CV, học vấn, chứng chỉ">
            <EmptyNote invite={inv}>Chưa có CV, học vấn hay chứng chỉ.</EmptyNote>
          </Section>
          {owner && (
            <Section title="Đơn đã ứng tuyển gần đây">
              <p>{RECENT_APPLICATIONS.length} đơn</p>
            </Section>
          )}
        </>
      ),
      actions,
    },
  ]
}

/** Người tìm việc: hồ sơ của tôi (owner) hoặc bản công khai (người xem). */
export default function JobseekerPersonalView({ owner }: Opts) {
  const P = useProfileStore((s) => s.profile)
  return (
    <>
      <PersonalArchive
        entries={buildSeekerEntries({ owner, P })}
        label="Hồ sơ người tìm việc"
        eyebrow="Hồ sơ cá nhân"
        intro={
          <PersonalIntro
            eyebrow="Hồ sơ cá nhân"
            title={owner ? 'Câu chuyện của tôi' : `Hồ sơ của ${P.fullName}`}
            text={
              owner
                ? 'Sáu phần hồ sơ mà nhà tuyển dụng sẽ thấy. Bấm từng tấm ảnh để xem; phần nào còn trống thì bổ sung trong hồ sơ.'
                : 'Sáu phần hồ sơ công khai. Thông tin liên hệ được ẩn cho tới khi hai bên kết nối.'
            }
            mode={owner ? 'Trang của bạn' : `Bạn đang xem hồ sơ công khai của ${P.fullName}`}
            back={owner ? undefined : { to: '/viec-lam', label: 'Quay lại việc làm' }}
          />
        }
      />
      <div className="shell pb-section-sm">
        <SeekerReviews seekerId={ME} className="mx-auto max-w-2xl" />
      </div>
      <SampleNote>Hồ sơ trên trang này là dữ liệu mẫu, dùng chung với khu tìm việc. Ảnh minh họa từ Unsplash.</SampleNote>
    </>
  )
}
