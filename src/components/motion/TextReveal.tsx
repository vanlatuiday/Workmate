import { Fragment } from 'react'
import { motion } from 'motion/react'
import { useReducedMotion } from '@hooks/useReducedMotion'

type Props = {
  text: string
  className?: string
  delay?: number
  /** Thẻ bọc ngoài — mặc định là h2. */
  as?: 'h1' | 'h2' | 'h3' | 'p'
  /**
   * Chạy ngay khi mount thay vì đợi cuộn tới — dùng cho hero,
   * phần nằm sẵn trong khung nhìn nên `whileInView` không đáng tin.
   */
  immediate?: boolean
  /**
   * Giữ nguyên trạng thái ẩn cho tới khi thành `false`.
   * Dùng khi màn chờ còn che, để chữ không trượt lên sau tấm màn.
   */
  hold?: boolean
  /** id cho thẻ ngoài, vd. để aria-labelledby trỏ tới */
  id?: string
}

/**
 * Tách câu thành từng từ rồi cho trượt lên khỏi mặt nạ.
 * Giữ nguyên một thẻ heading duy nhất để screen reader đọc liền mạch.
 */
export default function TextReveal({
  text,
  className,
  delay = 0,
  as: Tag = 'h2',
  immediate = false,
  hold = false,
  id,
}: Props) {
  const reduced = useReducedMotion()
  const words = text.split(' ')

  if (reduced) return <Tag id={id} className={className}>{text}</Tag>

  // Thẻ ngoài theo dõi khung nhìn rồi truyền trạng thái xuống từng từ qua variants.
  // Không đặt whileInView trên từng từ: từ nằm dưới mặt nạ overflow-hidden nên
  // IntersectionObserver coi như vô hình — chỉ chạy được khi may mắn còn ló ra
  // một mép mỏng (phụ thuộc line-height), dòng cao hơn là chữ kẹt mãi không hiện.
  const MotionTag = motion[Tag]

  const trigger = hold
    ? { animate: 'hidden' }
    : immediate
      ? { animate: 'shown' }
      : {
          whileInView: 'shown',
          viewport: { once: true, margin: '-60px' } as const,
        }

  return (
    <MotionTag id={id} className={className} initial="hidden" {...trigger}>
      <span className="sr-only">{text}</span>
      <span aria-hidden className="inline">
        {words.map((word, i) => (
          <Fragment key={`${word}-${i}`}>
            {/* pb-[0.12em]/-mb-[0.12em]: nới đáy mặt nạ để dấu và nét thòng
                không bị overflow-hidden cắt mất, mà không làm giãn dòng. */}
            <span className="inline-block overflow-hidden align-bottom pb-[0.12em] -mb-[0.12em]">
              <motion.span
                className="inline-block"
                custom={i}
                variants={{
                  hidden: { y: '110%' },
                  shown: (index: number) => ({
                    y: 0,
                    transition: {
                      duration: 0.8,
                      delay: delay + index * 0.045,
                      ease: [0.22, 1, 0.36, 1],
                    },
                  }),
                }}
              >
                {word}
              </motion.span>
            </span>
            {/* Khoảng trắng nằm ngoài mặt nạ: đặt trong inline-block thì
                trình duyệt cắt bỏ khoảng trắng cuối và các từ dính liền nhau */}
            {i < words.length - 1 && ' '}
          </Fragment>
        ))}
      </span>
    </MotionTag>
  )
}
