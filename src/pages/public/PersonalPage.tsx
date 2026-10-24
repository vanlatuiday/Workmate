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

  if (xem === 'doanh-nghiep') return <RecruiterPersonalView owner={false} />
  if (xem === 'ung-vien') return <JobseekerPersonalView owner={false} />
  if (role === 'jobseeker') return <JobseekerPersonalView owner />
  if (role === 'recruiter') return <RecruiterPersonalView owner />
  return <GuestPersonalView admin={role === 'admin'} />
}
