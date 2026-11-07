type Props = {
  eyebrow: string
  title: string
  text: string
  /** Số liệu: [số, nhãn] — vd. [8, 'công ty'] */
  stats: [number, string][]
}

/**
 * Đầu trang /viec-lam — đã bỏ khối chữ hiển thị theo yêu cầu (trang mở thẳng vào ô tìm kiếm).
 * Vẫn giữ h1 + vùng số liệu `role="status"` dạng ẩn để trình đọc màn hình biết tên trang
 * và nghe được số kết quả khi bộ lọc đổi.
 */
export default function JobsHero({ eyebrow, title, text, stats }: Props) {
  return (
    <header className="sr-only">
      <p>{eyebrow}</p>
      <h1>{title}</h1>
      <p>{text}</p>
      <p role="status" aria-live="polite">
        {stats.map(([value, label]) => `${value} ${label}`).join(', ')}
      </p>
    </header>
  )
}
