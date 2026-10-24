import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

type Props = {
  eyebrow: string
  title: string
  text: string
  /** Dải chế độ: "Trang của bạn" hoặc "Bạn đang xem …" */
  mode?: string
  /** Có → hiện link quay lại (chế độ người xem) */
  back?: { to: string; label: string }
}

/** Phần mở đầu trang Cá nhân (nằm trên lưới ảnh): dải chế độ, tiêu đề vừa phải, 1–2 câu. */
export default function PersonalIntro({ eyebrow, title, text, mode, back }: Props) {
  return (
    <div className="pt-section-sm">
      {(mode || back) && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-card border border-page-line bg-page-surface px-4 py-2.5 text-sm">
          <p role="status">{mode}</p>
          {back && (
            <Link
              to={back.to}
              className="link-underline inline-flex items-center gap-1.5 rounded-control text-page-muted hover:text-page-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-page-fg focus-visible:ring-offset-2 focus-visible:ring-offset-page-bg"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              {back.label}
            </Link>
          )}
        </div>
      )}
      <p className="eyebrow text-page-muted">
        <span className="h-px w-8 bg-page-line" />
        {eyebrow}
      </p>
      <h1 className="mt-5 max-w-[20ch] font-display text-display-sm font-semibold text-page-fg">{title}</h1>
      <p className="mt-4 max-w-xl leading-relaxed text-page-muted">{text}</p>
    </div>
  )
}
