import type { ReactNode } from 'react'
import { m } from 'motion/react'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { useCurtainDelay } from '@components/motion/PageCurtain'
import { photoSrcSet, photoUrl, type Photo } from '../types'

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Đầu trang chi tiết: một khối căn trái cùng mép với nội dung bên dưới
 * (quay lại → nhãn nhỏ → tên → mô tả một dòng → hàng thông tin nhanh),
 * rồi ảnh bìa thấp hơn kèm chú thích nguồn ảnh. Độ trễ cộng thêm thời gian màn chuyển cảnh.
 */
export default function DetailHero({
  back,
  eyebrow,
  title,
  tagline,
  facts,
  photo,
}: {
  back: ReactNode
  eyebrow: string
  title: string
  /** Mô tả ngắn một dòng dưới tên */
  tagline?: string
  /** Hàng huy hiệu/số liệu nhỏ dưới mô tả */
  facts?: ReactNode
  photo: Photo
}) {
  const reduced = useReducedMotion()
  const curtain = useCurtainDelay()

  return (
    <header>
      <div className="shell pt-8 md:pt-10">
        <m.div
          {...(reduced
            ? {}
            : {
                initial: { opacity: 0 },
                animate: { opacity: 1 },
                transition: { duration: 0.8, ease: EASE, delay: curtain + 0.3 },
              })}
        >
          <div>{back}</div>
          <p className="eyebrow mt-6 text-page-muted">
            {/* Gạch trang trí: ẩn ở mobile vì nhãn dài xuống dòng sẽ làm gạch lệch giữa khối chữ */}
            <span className="hidden h-px w-8 flex-shrink-0 bg-page-line sm:block" />
            {eyebrow}
          </p>
        </m.div>

        {/* leading ≥ 1.05 để không cắt dấu tiếng Việt */}
        <m.h1
          className="mt-4 max-w-[22ch] break-words pb-2 text-left font-display text-display-md font-semibold leading-[1.08] tracking-[-0.03em]"
          {...(reduced
            ? {}
            : {
                initial: { opacity: 0, y: 24 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 1, ease: EASE, delay: curtain },
              })}
        >
          {title}
        </m.h1>

        {(tagline || facts) && (
          <m.div
            className="mt-3"
            {...(reduced
              ? {}
              : {
                  initial: { opacity: 0 },
                  animate: { opacity: 1 },
                  transition: { duration: 0.8, ease: EASE, delay: curtain + 0.4 },
                })}
          >
            {tagline && <p className="max-w-2xl text-base leading-relaxed md:text-lg">{tagline}</p>}
            {facts && <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">{facts}</div>}
          </m.div>
        )}
      </div>

      <div className="shell mt-6 md:mt-8">
        <div className="overflow-hidden rounded-control bg-page-surface">
          <m.img
            src={photoUrl(photo, 1400)}
            srcSet={photoSrcSet(photo)}
            sizes="(min-width: 1440px) 1312px, 92vw"
            alt={photo.alt}
            className="aspect-[16/9] w-full object-cover lg:aspect-[21/9]"
            {...(reduced
              ? {}
              : {
                  initial: { opacity: 0, y: 60 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 1, ease: EASE, delay: curtain + 0.15 },
                })}
          />
        </div>
      </div>
    </header>
  )
}
