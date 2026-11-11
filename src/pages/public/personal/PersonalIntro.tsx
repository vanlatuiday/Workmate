type Props = {
  eyebrow: string
  title: string
  text: string
  /** Chế độ xem: "Trang của bạn" hoặc "Bạn đang xem …" */
  mode?: string
  /** Chế độ người xem — vẫn giữ trong dữ liệu, hiện chưa hiển thị */
  back?: { to: string; label: string }
}

/** Phần mở đầu trang Cá nhân: nhãn nhỏ, tiêu đề trang (h1) và một câu dẫn. */
export default function PersonalIntro({ eyebrow, title, text, mode }: Props) {
  return (
    <div className="pt-section-sm">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-page-muted">{eyebrow}</p>
      <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-tight text-page-fg md:text-5xl">{title}</h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-page-muted md:text-lg">{text}</p>
      {mode && <p className="mt-3 text-sm text-page-muted">{mode}</p>}
    </div>
  )
}
