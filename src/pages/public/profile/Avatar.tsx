import { initials } from './useProfileDraft'

type Props = { name: string; url: string | null; show?: boolean; className?: string }

/** Ảnh tròn; chưa có ảnh (hoặc không cho hiện) thì là vòng chữ viết tắt. */
export default function Avatar({ name, url, show = true, className = 'h-16 w-16 text-lg' }: Props) {
  if (url && show) {
    return <img src={url} alt="" className={`shrink-0 rounded-full border border-page-line object-cover ${className}`} />
  }
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full border border-page-edge font-display font-semibold text-page-fg ${className}`}
    >
      {initials(name)}
    </span>
  )
}
