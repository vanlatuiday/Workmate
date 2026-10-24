import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { useCurtainDelay } from '@components/motion/PageCurtain'
import { photoSrcSet, photoUrl, type Photo } from '../types'

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Màn đầu trang chi tiết: tên rất lớn ở cuối màn đầu, căn phải, trượt vào từ bên phải;
 * ảnh bìa trồi lên từ dưới, trễ hơn một nhịp. Mọi độ trễ cộng thêm thời gian màn chuyển cảnh.
 */
export default function DetailHero({
  back,
  eyebrow,
  title,
  photo,
}: {
  back: ReactNode
  eyebrow: string
  title: string
  photo: Photo
}) {
  const reduced = useReducedMotion()
  const curtain = useCurtainDelay()

  return (
    // overflow-x-clip: tên đang trượt từ ngoài mép phải không làm trang cuộn ngang
    <header className="overflow-x-clip">
      <div className="shell flex min-h-[calc(44svh-4rem)] flex-col justify-between pt-8 md:pt-10">
        <motion.div
          {...(reduced
            ? {}
            : {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                transition: { duration: 0.8, ease: EASE, delay: curtain + 0.3 },
              })}
        >
          <div>{back}</div>
          <p className="eyebrow mt-8 text-page-muted">
            <span className="h-px w-8 bg-page-line" />
            {eyebrow}
          </p>
        </motion.div>

        {/* leading ≥ 1.05 để không cắt dấu tiếng Việt */}
        <motion.h1
          className="ml-auto mt-12 max-w-full break-words pb-4 text-right font-display text-display-md font-semibold leading-[1.08] tracking-[-0.03em] md:max-w-[16ch]"
          {...(reduced
            ? {}
            : {
                initial: { opacity: 0, x: '12vw' },
                animate: { opacity: 1, x: 0 },
                transition: { duration: 1, ease: EASE, delay: curtain },
              })}
        >
          {title}
        </motion.h1>
      </div>

      <div className="shell mt-4 md:mt-6">
        <div className="overflow-hidden rounded-control bg-page-surface">
          <motion.img
            src={photoUrl(photo.id, 1400)}
            srcSet={photoSrcSet(photo.id)}
            sizes="(min-width: 1440px) 1312px, 92vw"
            alt={photo.alt}
            className="aspect-[4/3] w-full object-cover md:aspect-[21/9]"
            {...(reduced
              ? {}
              : {
                  initial: { opacity: 0, y: 120 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 1, ease: EASE, delay: curtain + 0.15 },
                })}
          />
        </div>
      </div>
    </header>
  )
}
