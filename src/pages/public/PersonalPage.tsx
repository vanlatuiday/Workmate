import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@context/authStore'
import GuestPersonalView from './personal/GuestPersonalView'
import JobseekerPersonalView from './personal/JobseekerPersonalView'
import RecruiterPersonalView from './personal/RecruiterPersonalView'

/**
 * Trang Cá nhân `/ca-nhan`. Giao diện chọn theo:
 * - ?xem=doanh-nghiep / ?xem=ung-vien → bản công khai chỉ xem, bất kể vai trò;
 * - không có `xem` → theo vai trò: người tìm việc, nhà tuyển dụng, còn lại là bản khách.
 */
export default function PersonalPage() {
  const [params] = useSearchParams()
  const role = useAuthStore((s) => s.user?.role)
  const xem = params.get('xem')

  const view =
    xem === 'doanh-nghiep' ? <RecruiterPersonalView owner={false} />
    : xem === 'ung-vien' ? <JobseekerPersonalView owner={false} />
    : role === 'jobseeker' ? <JobseekerPersonalView owner />
    : role === 'recruiter' ? <RecruiterPersonalView owner />
    : <GuestPersonalView admin={role === 'admin'} />

  // Mặt bàn tối (than chì) với các tấm ảnh in giấy sáng — theo tinh thần trang tham khảo,
  // vẫn trong bảng màu Workmate. Header/footer đổi theo ở PublicLayout.
  return (
    <div className="theme-charcoal min-h-full bg-page-bg text-page-fg">
      <div aria-hidden className="grain pointer-events-none fixed inset-0 z-30" />
      {view}
    </div>
  )
}
