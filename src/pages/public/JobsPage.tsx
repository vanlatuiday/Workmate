import { useEffect } from 'react'
import { useSmoothScroll } from '@hooks/useSmoothScroll'
import { ScrollTrigger } from '@utils/gsap'
import { useAuthStore } from '@context/authStore'
import CustomCursor from '@components/motion/CustomCursor'
import GuestJobs from './jobs/GuestJobs'
import JobseekerJobs from './jobs/JobseekerJobs'
import RecruiterJobs from './jobs/RecruiterJobs'

/**
 * /viec-lam — bộ sưu tập ảnh khám phá, khác nhau theo người xem:
 *   khách / quản trị  → các nơi đang tuyển (GuestJobs)
 *   người tìm việc    → công ty đang tuyển + việc tiêu biểu (JobseekerJobs)
 *   nhà tuyển dụng    → các vị trí của chính mình (RecruiterJobs)
 * Hệ thống ảnh + cuộn dùng chung ở components/discover; dữ liệu mẫu ở ./jobs/data.ts.
 */
export default function JobsPage() {
  useSmoothScroll()
  const role = useAuthStore((s) => s.user?.role)

  // Font display tải xong làm đổi chiều cao chữ → đo lại vị trí trigger
  useEffect(() => {
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
  }, [])

  return (
    <>
      <CustomCursor />
      {role === 'jobseeker' ? <JobseekerJobs /> : role === 'recruiter' ? <RecruiterJobs /> : <GuestJobs />}
    </>
  )
}
