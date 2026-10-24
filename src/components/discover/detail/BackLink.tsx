import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const FOCUS =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-page-fg focus-visible:ring-offset-2 focus-visible:ring-offset-page-bg'
const CLASS = `inline-flex items-center gap-2 rounded-control text-sm text-page-muted transition-colors duration-300 hover:text-page-fg ${FOCUS}`

/** Nút quay lại: đến từ /viec-lam thì lùi lịch sử (giữ đúng chỗ đang xem), ngược lại là link về /viec-lam. */
export default function BackLink() {
  const navigate = useNavigate()
  const location = useLocation()
  const fromGallery = (location.state as { from?: string } | null)?.from === '/viec-lam'

  return fromGallery ? (
    <button type="button" onClick={() => navigate(-1)} className={CLASS}>
      <ArrowLeft className="h-4 w-4" />
      Quay lại khám phá
    </button>
  ) : (
    <Link to="/viec-lam" className={CLASS}>
      <ArrowLeft className="h-4 w-4" />
      Khám phá
    </Link>
  )
}
