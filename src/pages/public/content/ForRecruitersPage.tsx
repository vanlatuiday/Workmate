// /nha-tuyen-dung — nội dung mẫu
import { Link } from 'react-router-dom'
import ContentPage, { CTA_PRIMARY, CTA_SECONDARY, CtaRow, Section, Steps } from './ContentPage'

const BENEFITS = [
  { title: 'Ứng viên đúng lịch', text: 'Chỉ thấy người có giờ rảnh khớp ca làm của bạn.' },
  { title: 'Điểm phù hợp rõ ràng', text: 'Biết vì sao một ứng viên được gợi ý.' },
  { title: 'Kết nối hai chiều', text: 'Chỉ trò chuyện khi cả hai bên đã đồng ý.' },
  { title: 'Đăng tin nhanh', text: 'Tạo tin tuyển trong vài phút, không mất phí.' },
]

const STEPS = [
  { title: 'Tạo hồ sơ công ty', text: 'Giới thiệu ngắn về nơi làm việc.' },
  { title: 'Đăng vị trí', text: 'Ghi ca làm, khu vực và mức lương.' },
  { title: 'Chọn ứng viên', text: 'Xem gợi ý, kết nối rồi hẹn phỏng vấn.' },
]

export default function ForRecruitersPage() {
  return (
    <ContentPage
      eyebrow="Nhà tuyển dụng"
      title="Tìm đúng người cho ca làm của bạn."
      intro="Nội dung mẫu — sẽ được chủ dự án viết lại."
    >
      <Section title="Lợi ích">
        <ul className="grid gap-4 sm:grid-cols-2">
          {BENEFITS.map((b) => (
            <li key={b.title} className="rounded-card border border-page-line p-6">
              <h3 className="font-display text-lg font-semibold text-page-fg">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-page-muted">{b.text}</p>
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Quy trình">
        <Steps items={STEPS} />
      </Section>
      <CtaRow>
        <Link to="/dang-ky?role=recruiter" className={CTA_PRIMARY}>Đăng ký nhà tuyển dụng</Link>
        <Link to="/dang-nhap" className={CTA_SECONDARY}>Đã có tài khoản? Đăng nhập</Link>
      </CtaRow>
    </ContentPage>
  )
}
