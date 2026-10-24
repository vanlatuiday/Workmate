import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { useCurtainDelay } from '@components/motion/PageCurtain'

/**
 * Lưới 12 cột: cột trái dính (sticky) dưới header, cột phải là dòng nội dung cuộn.
 * Mobile: cột trái xếp trên, nội dung dưới.
 */
export default function DetailLayout({ aside, children }: { aside: ReactNode; children: ReactNode }) {
  const reduced = useReducedMotion()
  const curtain = useCurtainDelay()

  return (
    <div className="shell mt-14 grid gap-12 md:mt-20 lg:grid-cols-12 lg:gap-16">
      <motion.aside
        className="lg:sticky lg:top-24 lg:col-span-4 lg:self-start"
        {...(reduced
          ? {}
          : {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: curtain + 0.5 },
            })}
      >
        {aside}
      </motion.aside>
      <div className="flex flex-col gap-14 md:gap-20 lg:col-span-8">{children}</div>
    </div>
  )
}
