import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'

export type Area = 'jobseeker' | 'recruiter' | 'public'

/** Chuẩn hóa query: nhận 'c=1|2' hoặc '?c=1|2', trả '?c=1|2' (hoặc '' nếu rỗng) */
const withQuery = (path: string, query?: string) => (query ? `${path}${query.startsWith('?') ? '' : '?'}${query}` : path)

/**
 * Đường dẫn theo khu đang đứng, dựa trên tiền tố URL:
 *   /tim-viec/* → dashboard người tìm việc, /tuyen-dung/* → dashboard nhà tuyển dụng, còn lại → trang công khai.
 * Dùng cho mọi trang dashboard và các trang dùng chung (tin nhắn, lịch, thông báo, đăng tin)
 * để bấm trong dashboard thì vẫn ở trong dashboard, còn trang công khai giữ link công khai.
 * Lưu ý: dashboard nhà tuyển dụng chưa có trang chi tiết việc làm nên job() rơi về trang công khai.
 */
export function useAreaLinks() {
  const { pathname } = useLocation()
  const area: Area =
    pathname === '/tim-viec' || pathname.startsWith('/tim-viec/') ? 'jobseeker'
    : pathname === '/tuyen-dung' || pathname.startsWith('/tuyen-dung/') ? 'recruiter'
    : 'public'

  return useMemo(() => {
    const base = area === 'jobseeker' ? '/tim-viec' : area === 'recruiter' ? '/tuyen-dung' : ''
    return {
      area,
      /** Đang trong khung dashboard (bỏ phần trình bày riêng của trang công khai) */
      embedded: area !== 'public',
      job: (id: string) => (area === 'jobseeker' ? `/tim-viec/viec-lam/${id}` : `/viec-lam/${id}`),
      messages: (query?: string) => withQuery(`${base}/tin-nhan`, query),
      schedule: () => `${base}/lich-phong-van`,
      match: () => `${base}/match`,
      notifications: () => `${base}/thong-bao`,
      postJob: (query?: string) => withQuery(`${base}/dang-tin`, query),
    }
  }, [area])
}
