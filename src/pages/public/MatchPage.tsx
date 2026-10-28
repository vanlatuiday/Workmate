import { Link } from 'react-router-dom'
import { useAuthStore } from '@context/authStore'
import { FOCUS } from '@utils/focus'
import GuestMatch from './match/GuestMatch'
import JobseekerMatch from './match/JobseekerMatch'
import RecruiterMatch from './match/RecruiterMatch'

/**
 * /match — ghép việc và người theo tiêu chí, khác nhau theo người xem:
 *   khách            → xem thử mờ + lời mời đăng ký (GuestMatch)
 *   người tìm việc   → việc hợp với hồ sơ, tự xếp ưu tiên (JobseekerMatch)
 *   nhà tuyển dụng   → ứng viên hợp từng vị trí (RecruiterMatch)
 *   quản trị         → chỉ một lời nhắn, MATCH không dành cho quản trị
 * Trang yên tĩnh như dashboard: không cuộn mượt, không con trỏ tùy biến. Dữ liệu mẫu ở ./match/data.ts.
 */
export default function MatchPage() {
  const role = useAuthStore((s) => s.user?.role)

  if (role === 'jobseeker') return <JobseekerMatch />
  if (role === 'recruiter') return <RecruiterMatch />
  if (role === 'admin') {
    return (
      <section className="shell py-section-sm">
        <p className="max-w-xl font-display text-xl font-medium text-page-fg">
          Trang Kết nối dành cho người tìm việc và nhà tuyển dụng.
        </p>
        <Link to="/admin" className={`mt-4 inline-block rounded-control text-sm underline underline-offset-4 ${FOCUS}`}>
          Về khu quản trị
        </Link>
      </section>
    )
  }
  return <GuestMatch />
}
