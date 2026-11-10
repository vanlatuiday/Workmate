import toast from 'react-hot-toast'
import { Hourglass } from 'lucide-react'
import { considerApplication, useApplicationStage } from '@services/connectionService'

type Props = {
  jobId: string
  seekerId: string
  /** Kiểu nút của nơi đặt (mỗi trang có kiểu nút phụ riêng) */
  className: string
  /** Chữ ẩn cho trình đọc màn hình, vd. tên ứng viên */
  srLabel?: string
}

/**
 * Doanh nghiệp báo ứng viên "đang cân nhắc" đơn ứng tuyển — chưa đồng ý kết nối nhưng cũng chưa bỏ qua.
 * Đã báo rồi thì chỉ còn nhãn (không rút lại, để ứng viên không nhận tin trái chiều).
 */
export default function ConsiderButton({ jobId, seekerId, className, srLabel }: Props) {
  const stage = useApplicationStage(jobId, seekerId)
  if (!stage) return null
  if (stage === 'considering') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-page-line px-3 py-1 text-xs text-page-muted">
        <Hourglass className="h-3.5 w-3.5" aria-hidden="true" />
        Đã báo đang cân nhắc
      </span>
    )
  }
  return (
    <button
      type="button"
      className={className}
      title="Ứng viên sẽ thấy đơn đang được cân nhắc"
      onClick={() => {
        void considerApplication(jobId, seekerId).then((ok) => {
          if (ok) toast.success('Đã báo ứng viên: hồ sơ đang được cân nhắc')
        })
      }}
    >
      Đang cân nhắc{srLabel && <span className="sr-only"> {srLabel}</span>}
    </button>
  )
}
