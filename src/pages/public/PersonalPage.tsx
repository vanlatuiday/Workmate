import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@context/authStore'
import GuestPersonalView from './personal/GuestPersonalView'
import JobseekerPersonalView from './personal/JobseekerPersonalView'
import RecruiterPersonalView from './personal/RecruiterPersonalView'
import PersonalProfilePrototype from './personal/PersonalProfilePrototype'

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
  if (xem === 'doanh-nghiep' && role !== 'recruiter') return <Navigate to="/viec-lam" replace />
  if (xem === 'ung-vien' && role !== 'jobseeker') return <Navigate to="/viec-lam" replace />

  // Chủ dự án đang duyệt bố cục mới cho cả hai vai trò; bản công khai giữ luồng hiện có.
  if (!xem) return <PersonalProfilePrototype />

  const view =
    xem === 'doanh-nghiep' ? <RecruiterPersonalView owner={false} />
    : xem === 'ung-vien' ? <JobseekerPersonalView owner={false} />
    : role === 'jobseeker' ? <JobseekerPersonalView owner />
    : role === 'recruiter' ? <RecruiterPersonalView owner />
    : <GuestPersonalView admin={role === 'admin'} />

  // Nền ngà phẳng như các trang khác; tem hồ sơ dùng bề mặt page-surface
  return <div className="theme-ivory relative min-h-full bg-page-bg text-page-fg">{view}</div>
}
