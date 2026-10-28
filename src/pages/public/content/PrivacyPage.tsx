// /bao-mat — chữ mẫu, cần duyệt trước khi dùng thật
import ContentPage, { ProseBlock, Section } from './ContentPage'

const SECTIONS = [
  { title: '1. Dữ liệu chúng tôi thu thập', text: 'Thông tin hồ sơ, lịch rảnh, khu vực và cách bạn dùng nền tảng (mẫu).' },
  { title: '2. Mục đích sử dụng', text: 'Để gợi ý việc làm phù hợp và vận hành tài khoản của bạn.' },
  { title: '3. Chia sẻ dữ liệu', text: 'Hồ sơ chỉ hiển thị đầy đủ cho bên đã kết nối với bạn.' },
  { title: '4. Lưu trữ và bảo vệ', text: 'Dữ liệu được lưu có kiểm soát truy cập; thời hạn lưu sẽ ghi rõ khi chính thức.' },
  { title: '5. Quyền của bạn', text: 'Bạn có thể yêu cầu xem, sửa hoặc xóa dữ liệu qua email hỗ trợ.' },
  { title: '6. Liên hệ', text: 'Mọi câu hỏi về bảo mật xin gửi support@workmate.vn.' },
]

export default function PrivacyPage() {
  return (
    <ContentPage eyebrow="Pháp lý" title="Chính sách bảo mật." intro="Bản nháp — cần luật sư/chủ dự án duyệt trước khi dùng thật.">
      {SECTIONS.map((s) => (
        <Section key={s.title} title={s.title}>
          <ProseBlock>{s.text}</ProseBlock>
        </Section>
      ))}
    </ContentPage>
  )
}
