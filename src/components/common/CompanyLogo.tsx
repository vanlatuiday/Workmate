import { cn } from '@utils/cn'

type Props = {
  name: string
  logoUrl?: string | null
  className?: string
  /** Tên công ty đã nằm ngay cạnh: ảnh để alt rỗng cho trình đọc màn hình khỏi đọc lặp */
  decorative?: boolean
}

/** Chữ tắt công ty: hai chữ cuối của tên, "Quán Gió Sông Hàn" → "SH" */
const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(-2).map((w) => w[0]).join('').toUpperCase()

/** Logo công ty (ô vuông bo tròn); chưa có logo thì là khối chữ viết tắt. Đặt kích thước qua className. */
export default function CompanyLogo({ name, logoUrl, className = 'h-12 w-12 text-sm', decorative = false }: Props) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={decorative ? '' : name}
        loading="lazy"
        className={cn('shrink-0 rounded-control border border-page-line bg-page-bg object-contain', className)}
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      className={cn('flex shrink-0 items-center justify-center rounded-control border border-page-line font-display font-semibold text-page-fg', className)}
    >
      {initialsOf(name)}
    </span>
  )
}
