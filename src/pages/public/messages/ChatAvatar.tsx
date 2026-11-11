import { cn } from '@utils/cn'

type Props = {
  initials: string
  url?: string | null
  /** Logo công ty: giữ nguyên tỉ lệ, không cắt */
  contain?: boolean
  className: string
}

/** Vòng tròn đại diện cuộc trò chuyện: ảnh nếu có, không thì chữ tắt. Tên đã nằm cạnh nên ảnh để alt rỗng. */
export default function ChatAvatar({ initials, url, contain = false, className }: Props) {
  if (url) {
    return <img src={url} alt="" loading="lazy" className={cn('shrink-0 rounded-full border border-page-edge bg-page-bg', contain ? 'object-contain' : 'object-cover', className)} />
  }
  return (
    <span aria-hidden="true" className={cn('flex shrink-0 items-center justify-center rounded-full border border-page-edge font-medium text-page-fg', className)}>
      {initials}
    </span>
  )
}
