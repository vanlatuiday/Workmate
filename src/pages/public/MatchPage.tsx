import { Link } from 'react-router-dom'
import { useAuthStore } from '@context/authStore'
import { FOCUS } from '@utils/focus'
import PageCover, { DarkPageBody } from '@components/common/PageCover'
import GuestMatch from './match/GuestMatch'
import JobseekerMatch from './match/JobseekerMatch'
import RecruiterMatch from './match/RecruiterMatch'

/**
 * /match — ghép việc và người theo tiêu chí, khác nhau theo người xem:
 *   khách            → xem thử mờ + lời mời đăng ký (GuestMatch)
 *   người tìm việc   → việc hợp với hồ sơ, tự xếp ưu tiên (JobseekerMatch)
 *   nhà tuyển dụng   → ứng viên hợp từng vị trí (RecruiterMatch)
 *   quản trị         → chỉ một lời nhắn, MATCH không dành cho quản trị
 * Trang yên tĩnh như dashboard: không cuộn mượt, không con trỏ tùy biến.
 */
export default function MatchPage() {
  const role = useAuthStore((s) => s.user?.role)

  if (role === 'jobseeker') return <JobseekerMatch />
  if (role === 'recruiter') return <RecruiterMatch />
  if (role === 'admin') {
    return (
      <>
        <PageCover level="md" title="Trang Kết nối dành cho người tìm việc và nhà tuyển dụng." />
        <DarkPageBody>
          <section className="shell py-section-sm">
            <Link to="/admin" className={`inline-block rounded-control text-sm underline underline-offset-4 ${FOCUS}`}>
              Về khu quản trị
            </Link>
          </section>
        </DarkPageBody>
      </>
    )
  }
  return <GuestMatch />
}
