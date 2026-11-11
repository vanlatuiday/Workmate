// /nha-tuyen-dung
import { Link } from 'react-router-dom'
import { CalendarCheck, Gauge, MessagesSquare, Zap } from 'lucide-react'
import { useAuthStore } from '@context/authStore'
import { BTN_ACCENT, BTN_SECONDARY } from '@utils/ui'
import ContentPage, { CtaRow, Section, Steps } from './ContentPage'

const BENEFITS = [
  { icon: CalendarCheck, title: 'Ứng viên đúng lịch', text: 'Chỉ thấy người có giờ rảnh khớp ca làm của bạn.' },
  { icon: Gauge, title: 'Điểm phù hợp rõ ràng', text: 'Biết vì sao một ứng viên được gợi ý.' },
  { icon: MessagesSquare, title: 'Kết nối hai chiều', text: 'Chỉ trò chuyện khi cả hai bên đã đồng ý.' },
  { icon: Zap, title: 'Đăng tin nhanh', text: 'Tạo tin tuyển trong vài phút, không mất phí.' },
]

const STEPS = [
  { title: 'Tạo hồ sơ công ty', text: 'Giới thiệu ngắn về nơi làm việc.' },
  { title: 'Đăng vị trí', text: 'Ghi ca làm, khu vực và mức lương.' },
  { title: 'Chọn ứng viên', text: 'Xem gợi ý, kết nối rồi hẹn phỏng vấn.' },
]

export default function ForRecruitersPage() {
  const user = useAuthStore((s) => s.user)
  return (
    <ContentPage
      eyebrow="Nhà tuyển dụng"
      title="Tìm đúng người cho ca làm của bạn."
    >
      <Section title="Lợi ích">
        <ul className="grid gap-4 sm:grid-cols-2">
          {BENEFITS.map((b) => (
            <li key={b.title} className="rounded-card border border-page-line p-6 transition-colors duration-fast hover:border-page-fg">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-page-line text-page-fg">
                <b.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-page-fg">{b.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-page-muted">{b.text}</p>
            </li>
          ))}
        </ul>
      </Section>
      <Section title="Quy trình">
        <Steps items={STEPS} />
      </Section>
      <CtaRow>
        {!user ? (
          <>
            <Link to="/dang-ky?role=recruiter" className={BTN_ACCENT}>Đăng ký nhà tuyển dụng</Link>
            <Link to="/dang-nhap" className={BTN_SECONDARY}>Đã có tài khoản? Đăng nhập</Link>
          </>
        ) : user.role === 'recruiter' ? (
          <>
            <Link to="/dang-tin" className={BTN_ACCENT}>Đăng tin</Link>
            <Link to="/tuyen-dung" className={BTN_SECONDARY}>Vào khu tuyển dụng</Link>
          </>
        ) : (
          <Link to="/" className={BTN_SECONDARY}>Về trang chủ</Link>
        )}
      </CtaRow>
    </ContentPage>
  )
}
