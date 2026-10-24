type Props = {
  eyebrow: string
  title: string
  text: string
  /** Chế độ xem: "Trang của bạn" hoặc "Bạn đang xem …" */
  mode?: string
  /** Chế độ người xem — vẫn giữ trong dữ liệu, hiện chưa hiển thị */
  back?: { to: string; label: string }
}

/**
 * Phần mở đầu trang Cá nhân. Theo yêu cầu chủ dự án, trên màn hình chỉ còn các tấm ảnh —
 * tiêu đề và chế độ xem giữ lại ở dạng ẩn cho trình đọc màn hình (trang vẫn cần một h1).
 */
export default function PersonalIntro({ eyebrow, title, text, mode }: Props) {
  return (
    <div className="pt-section-sm">
      <h1 className="sr-only">
        {eyebrow}: {title}
      </h1>
      <p className="sr-only">
        {mode ? `${mode}. ` : ''}
        {text}
      </p>
    </div>
  )
}
