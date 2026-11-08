import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@context/authStore'
import GuestPersonalView from './personal/GuestPersonalView'
import JobseekerPersonalView from './personal/JobseekerPersonalView'
import RecruiterPersonalView from './personal/RecruiterPersonalView'

/**
 * Trang Cá nhân `/ca-nhan`. Giao diện chọn theo:
 * - ?xem=doanh-nghiep / ?xem=ung-vien → chủ trang xem thử bản chỉ xem;
 * - không có `xem` → theo vai trò: người tìm việc, nhà tuyển dụng, còn lại là bản khách.
 */
export default function PersonalPage() {
  const [params] = useSearchParams()
  const role = useAuthStore((s) => s.user?.role)
  const xem = params.get('xem')

  // ?xem=… chỉ để chủ trang xem thử bản người khác thấy; người khác sang trang thật của công ty / việc làm
  if (xem === 'doanh-nghiep' && role !== 'recruiter') return <Navigate to="/cong-ty" replace />
  if (xem === 'ung-vien' && role !== 'jobseeker') return <Navigate to="/viec-lam" replace />

  const view =
    xem === 'doanh-nghiep' ? <RecruiterPersonalView owner={false} />
    : xem === 'ung-vien' ? <JobseekerPersonalView owner={false} />
    : role === 'jobseeker' ? <JobseekerPersonalView owner />
    : role === 'recruiter' ? <RecruiterPersonalView owner />
    : <GuestPersonalView admin={role === 'admin'} />

  // Mặt bàn tối (than chì) với các tấm ảnh in giấy sáng — theo tinh thần trang tham khảo,
  // vẫn trong bảng màu Workmate. Header/footer đổi theo ở PublicLayout.
  return (
    <div className="theme-charcoal relative isolate min-h-full bg-page-bg text-page-fg">
      {/* Vệt kẻ chéo mảnh trên mặt bàn (dưới nội dung) + hạt nhiễu (trên nội dung, dưới header) */}
      <div aria-hidden className="desk-lines pointer-events-none fixed inset-0 -z-10" />
      <div aria-hidden className="grain pointer-events-none fixed inset-0 z-30" />
      {view}
    </div>
  )
}
