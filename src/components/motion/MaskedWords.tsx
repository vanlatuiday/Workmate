import { Fragment } from 'react'

type Props = {
  text: string
  /** Thẻ bọc ngoài — mặc định là h2. */
  as?: 'h1' | 'h2' | 'h3' | 'p'
  className?: string
}

/**
 * Câu được tách thành từng từ nằm trong mặt nạ, mỗi từ gắn `data-word` để
 * GSAP điều khiển theo tiến trình cuộn (đảo ngược được khi cuộn lên).
 * Khác TextReveal — cái đó chạy một lần bằng motion khi cuộn tới.
 *
 * Bản thân component không animate gì: không có JS thì chữ hiện bình thường.
 */
export default function MaskedWords({ text, as: Tag = 'h2', className }: Props) {
  const words = text.split(' ')

  return (
    <Tag className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden>
        {words.map((word, i) => (
          <Fragment key={`${word}-${i}`}>
            {/* pb/-mb: nới đáy mặt nạ để dấu tiếng Việt không bị cắt */}
            <span className="inline-block overflow-hidden align-bottom pb-[0.12em] -mb-[0.12em]">
              <span data-word className="inline-block">
                {word}
              </span>
            </span>
            {/* Khoảng trắng ngoài mặt nạ — trong inline-block nó bị cắt bỏ */}
            {i < words.length - 1 && ' '}
          </Fragment>
        ))}
      </span>
    </Tag>
  )
}
