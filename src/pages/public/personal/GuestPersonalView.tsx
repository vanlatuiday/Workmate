import PersonalArchive from '@components/archive/PersonalArchive'
import type { ArchiveEntry } from '@components/archive/types'
import { SampleNote } from '@components/discover/parts'
import PersonalIntro from './PersonalIntro'
import { ActionNote, ActionPrimary, ActionText, Actions, PlainList, Section, WeekGrid } from './parts'

/** Ví dụ lưới tuần cho khách: vài buổi tối và cuối tuần */
const SAMPLE = new Set(['0-2', '2-2', '5-0', '6-1'])

/** Hành động cho khách; admin xem bản khách nhưng không có nút đăng ký/đăng nhập. */
function GuestActions({ admin }: { admin: boolean }) {
  if (admin) return null
  return (
    <>
      <Actions>
        <ActionPrimary to="/dang-ky?role=jobseeker">Tạo tài khoản người tìm việc</ActionPrimary>
        <ActionText to="/dang-ky?role=recruiter">Đăng ký nhà tuyển dụng</ActionText>
        <ActionText to="/dang-nhap">Đăng nhập</ActionText>
      </Actions>
      <ActionNote>Bạn chưa có hồ sơ nào, nên trang này chỉ giới thiệu những gì sẽ có.</ActionNote>
    </>
  )
}

function buildGuestEntries(admin: boolean): ArchiveEntry[] {
  const actions = <GuestActions admin={admin} />
  return [
    {
      id: 'cau-chuyen',
      number: '01',
      title: 'Câu chuyện của bạn',
      caption: 'Một người đang viết: hồ sơ bắt đầu từ vài dòng về chính bạn.',
      photo: { id: '1434030216411-0b793f4b4173', alt: 'Người đang viết tay vào cuốn sổ trên bàn gỗ' },
      cursor: 'Mở',
      content: (
        <>
          <Section title="Hồ sơ cá nhân trên Workmate">
            <p>
              Bạn kể ngắn gọn mình là ai, ở khu vực nào và muốn làm loại việc gì. Nhà tuyển dụng đọc cùng một
              hồ sơ ấy, nên bạn chỉ cần viết một lần.
            </p>
          </Section>
          <Section title="Bạn sẽ điền">
            <PlainList items={['Họ tên, khu vực sinh sống', 'Định hướng công việc', 'Vài dòng giới thiệu bản thân']} />
          </Section>
        </>
      ),
      actions,
    },
    {
      id: 'dieu-co-the-lam',
      number: '02',
      title: 'Điều bạn có thể làm',
      caption: 'Giá dụng cụ gọn gàng: mỗi kỹ năng là một món bạn có thể cầm lên làm.',
      photo: { id: '1530124566582-a618bc2615dc', alt: 'Giá treo dụng cụ làm việc xếp ngay ngắn' },
      cursor: 'Mở',
      content: (
        <>
          <Section title="Kỹ năng và kinh nghiệm">
            <p>
              Workmate đọc kỹ năng và những nơi bạn từng làm để gợi ý việc hợp với bạn, kể cả khi bạn chưa biết
              mình hợp việc nào.
            </p>
          </Section>
          <Section title="Bạn sẽ thêm">
            <PlainList items={['Kỹ năng chuyên môn và kỹ năng mềm', 'Các công việc đã làm, kể cả việc thời vụ', 'Điều bạn muốn học thêm']} />
          </Section>
        </>
      ),
      actions,
    },
    {
      id: 'nhip-song',
      number: '03',
      title: 'Nhịp sống của bạn',
      caption: 'Đồng hồ cát: thời gian rảnh của bạn được tính theo từng buổi.',
      photo: { id: '1501139083538-0139583c060f', alt: 'Chiếc đồng hồ cát đặt trên mặt bàn' },
      cursor: 'Mở',
      content: (
        <>
          <Section title="Lịch rảnh theo buổi">
            <p>
              Bạn đánh dấu buổi nào trong tuần mình rảnh. Việc theo ca được đối chiếu với lịch này, nên bạn ít
              phải nhận những ca không làm được.
            </p>
          </Section>
          <div className="mt-5">
            <WeekGrid on={SAMPLE} sample />
            <p className="mt-2 text-xs text-page-muted">Đây chỉ là ví dụ, không phải lịch của ai.</p>
          </div>
        </>
      ),
      actions,
    },
    {
      id: 'co-hoi',
      number: '04',
      title: 'Cơ hội dành cho bạn',
      caption: 'Một nhóm đang họp: hồ sơ đầy đủ là bước đầu để hai bên gặp nhau.',
      photo: { id: '1521737604893-d14cc237f11d', alt: 'Nhóm người cùng họp quanh một chiếc bàn' },
      cursor: 'Mở',
      content: (
        <>
          <Section title="Hồ sơ đầy đủ giúp được gì">
            <p>
              Khi hồ sơ rõ ràng, điểm phù hợp với từng tin chính xác hơn. Khi bạn quan tâm một tin và nhà tuyển
              dụng cũng quan tâm bạn, hai bên có MATCH và mới mở được thông tin liên hệ.
            </p>
          </Section>
          <Section title="Bạn chủ động">
            <PlainList items={['Bạn quyết định điều gì hiển thị', 'Số điện thoại chỉ mở sau MATCH', 'Bạn chỉnh hồ sơ bất cứ lúc nào']} />
          </Section>
        </>
      ),
      actions,
    },
  ]
}

/** Khách (và admin): giới thiệu trang Cá nhân, không tạo hồ sơ giả. */
export default function GuestPersonalView({ admin }: { admin: boolean }) {
  return (
    <>
      <PersonalArchive
        entries={buildGuestEntries(admin)}
        label="Giới thiệu trang cá nhân"
        eyebrow="Trang cá nhân"
        intro={
          <PersonalIntro
            eyebrow="Trang cá nhân"
            title="Một nơi kể về bạn"
            text="Mỗi tấm ảnh là một phần của hồ sơ. Bấm vào để xem Workmate sẽ giúp bạn kể phần đó như thế nào."
          />
        }
      />
      <SampleNote>Nội dung trên trang này là giới thiệu chung, chưa có dữ liệu của ai. Ảnh minh họa từ Unsplash.</SampleNote>
    </>
  )
}
