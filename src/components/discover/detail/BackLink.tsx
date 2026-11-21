import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { FOCUS } from '@utils/focus'

const CLASS = `inline-flex items-center gap-2 rounded-control text-sm text-page-muted transition-colors duration-fast hover:text-page-fg ${FOCUS}`

/** Nhãn theo nơi người dùng đến; trang gọi truyền `state={{ from }}` khi điều hướng. */
const LABELS: Record<string, string> = {
  '/viec-lam': 'Quay lại việc làm',
  '/cong-ty': 'Quay lại danh sách công ty',
  '/match': 'Quay lại kết nối',
}

/** Nút quay lại: biết nơi đến thì lùi lịch sử (giữ đúng chỗ đang xem), ngược lại là link về /viec-lam. */
export default function BackLink() {
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from
  const label = from ? LABELS[from] : undefined

  return label ? (
    <button type="button" onClick={() => navigate(-1)} className={CLASS}>
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  ) : (
    <Link to="/viec-lam" className={CLASS}>
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Quay lại
    </Link>
  )
}
