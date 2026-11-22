import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@utils/cn'

export function Card({ title, icon: Icon, children, className, action }: {
  title: string; icon: LucideIcon; children: ReactNode; className?: string; action?: ReactNode
}) {
  return (
    <section className={cn('personal-preview-card rounded-card', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="personal-preview-heading"><Icon aria-hidden className="h-5 w-5 shrink-0" />{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function Detail({ icon: Icon, label, value = 'Chưa cập nhật' }: { icon: LucideIcon; label: string; value?: string }) {
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-wm-ocean" />
      <dt className="text-page-muted">{label}</dt>
      <dd className="ml-auto text-right text-page-muted">{value}</dd>
    </div>
  )
}
