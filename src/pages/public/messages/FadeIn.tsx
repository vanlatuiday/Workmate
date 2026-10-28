import { useEffect, useState, type ReactNode } from 'react'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { cn } from '@utils/cn'

/** Hiện dần khi vừa gắn vào (chỉ opacity/transform); giảm chuyển động thì hiện ngay. */
export default function FadeIn({ children, rise = false, className }: { children: ReactNode; rise?: boolean; className?: string }) {
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(id)
  }, [])
  const on = shown || reduced
  return (
    <div
      className={cn(
        !reduced && 'transition-[opacity,transform] duration-[250ms] ease-out',
        on ? 'translate-y-0 opacity-100' : cn('opacity-0', rise && 'translate-y-2'),
        className,
      )}
    >
      {children}
    </div>
  )
}
