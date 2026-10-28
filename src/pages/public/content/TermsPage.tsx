// /dieu-khoan — chữ mẫu, cần duyệt trước khi dùng thật
import ContentPage, { ProseBlock, Section } from './ContentPage'

const SECTIONS = [
  { title: '1. Chấp nhận điều khoản', text: 'Khi sử dụng Workmate, bạn đồng ý với các điều khoản mẫu dưới đây.' },
  { title: '2. Tài khoản', text: 'Bạn chịu trách nhiệm về thông tin đăng ký và bảo mật tài khoản của mình.' },
  { title: '3. Nội dung đăng tải', text: 'Tin tuyển dụng và hồ sơ phải trung thực, không vi phạm pháp luật.' },
  { title: '4. Kết nối và trao đổi', text: 'Việc nhắn tin chỉ mở khi cả hai bên đồng ý kết nối.' },
  { title: '5. Giới hạn trách nhiệm', text: 'Workmate là nền tảng kết nối, không phải bên ký hợp đồng lao động.' },
  { title: '6. Thay đổi điều khoản', text: 'Điều khoản có thể được cập nhật; ngày hiệu lực sẽ được ghi rõ.' },
]

export default function TermsPage() {
  return (
    <ContentPage eyebrow="Pháp lý" title="Điều khoản sử dụng." intro="Bản nháp — cần luật sư/chủ dự án duyệt trước khi dùng thật.">
      {SECTIONS.map((s) => (
        <Section key={s.title} title={s.title}>
          <ProseBlock>{s.text}</ProseBlock>
        </Section>
      ))}
    </ContentPage>
  )
}
