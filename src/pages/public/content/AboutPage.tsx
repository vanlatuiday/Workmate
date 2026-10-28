// /gioi-thieu — nội dung mẫu
import { Link } from 'react-router-dom'
import ContentPage, { CTA_PRIMARY, CTA_SECONDARY, CtaRow, ProseBlock, Section, Steps } from './ContentPage'

const STEPS = [
  { title: 'Tạo hồ sơ', text: 'Khai lịch rảnh, khu vực và mức lương mong muốn.' },
  { title: 'Xem điểm phù hợp', text: 'Mỗi việc có điểm khớp theo lịch, khoảng cách và lương.' },
  { title: 'Kết nối hai chiều', text: 'Cả hai bên cùng đồng ý rồi mới mở cuộc trò chuyện.' },
]

export default function AboutPage() {
  return (
    <ContentPage
      eyebrow="Giới thiệu"
      title="Việc làm linh hoạt, khớp với cuộc sống của bạn."
      intro="Nội dung mẫu — sẽ được chủ dự án viết lại."
    >
      <Section title="Workmate là gì">
        <ProseBlock>
          Workmate là nền tảng việc làm linh hoạt tại Đà Nẵng. Chúng tôi ghép người tìm việc với nhà tuyển
          dụng dựa trên lịch rảnh, khoảng cách và mức lương, để bạn không phải lọc từng tin một.
        </ProseBlock>
      </Section>
      <Section title="Cách hoạt động">
        <Steps items={STEPS} />
      </Section>
      <CtaRow>
        <Link to="/match" className={CTA_PRIMARY}>Xem kết nối</Link>
        <Link to="/dang-ky" className={CTA_SECONDARY}>Đăng ký</Link>
      </CtaRow>
    </ContentPage>
  )
}
