// Tầng 1 — thông tin cốt lõi của ứng viên và doanh nghiệp (cùng khung, khác dữ liệu).
import { CalendarCheck, Clock, Briefcase } from 'lucide-react'
import { motion } from 'motion/react'
import type { CompanyProfile, PrivateField, SeekerProfile } from './model'
import { useProfileStore } from './store'
import { formatDate } from './logic'
import { Badge, EditButton, HiddenInfo, Switch } from './ui'
import ViewerActions from './ViewerActions'

/** Công tắc Hiện/Ẩn ghi thẳng vào store (ứng viên là chủ sở hữu) */
export function PrivacySwitch({ field, label }: { field: PrivateField; label: string }) {
  const visibility = useProfileStore((s) => s.seeker.visibility)
  const update = useProfileStore((s) => s.updateSeeker)
  return <Switch label={label} checked={visibility[field]} onChange={(v) => update({ visibility: { ...visibility, [field]: v } })} />
}

function CoreShell({
  mark,
  round,
  owner,
  label,
  reduced,
  onEdit,
  children,
  actions,
}: {
  mark: string
  round: boolean
  owner: boolean
  label: string
  reduced: boolean
  onEdit: () => void
  children: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <motion.section
      aria-label={label}
      initial={reduced ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-card border border-page-line bg-page-surface p-5 md:p-7"
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div
          aria-hidden
          className={`grid h-20 w-20 shrink-0 place-items-center border border-page-fg bg-page-bg font-display text-2xl font-semibold md:h-24 md:w-24 md:text-3xl ${round ? 'rounded-full' : 'rounded-card'}`}
        >
          {mark}
        </div>
        <div className="min-w-0 flex-1 space-y-3">{children}</div>
        {owner && <EditButton label="thông tin cốt lõi" onClick={onEdit} />}
      </div>
      {actions && <div className="mt-5">{actions}</div>}
    </motion.section>
  )
}

export function SeekerCore({ p, owner, reduced, onEdit }: { p: SeekerProfile; owner: boolean; reduced: boolean; onEdit: () => void }) {
  return (
    <CoreShell
      mark={p.initials}
      round
      owner={owner}
      reduced={reduced}
      label="Thông tin cốt lõi"
      onEdit={onEdit}
      actions={!owner && <ViewerActions kind="seeker" />}
    >
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{p.name}</h1>
        <p className="mt-1 text-base text-page-muted md:text-lg">
          {p.title} · {p.years} năm kinh nghiệm
        </p>
      </div>
      <p className="max-w-2xl text-sm leading-relaxed md:text-base">{p.bio}</p>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <Badge>
          <CalendarCheck className="h-3.5 w-3.5" aria-hidden />
          Sẵn sàng đi làm từ {formatDate(p.availableFrom)}
        </Badge>
        <div className="flex flex-wrap items-center gap-x-3 text-sm">
          <span className="text-page-muted">Công ty hiện tại:</span>
          {owner || p.visibility.currentCompany ? <span>{p.currentCompany || 'Chưa nhập'}</span> : <HiddenInfo />}
          {owner && <PrivacySwitch field="currentCompany" label="Công ty hiện tại" />}
        </div>
      </div>
    </CoreShell>
  )
}

export function CompanyCore({ c, owner, reduced, onEdit }: { c: CompanyProfile; owner: boolean; reduced: boolean; onEdit: () => void }) {
  return (
    <CoreShell
      mark={c.logoText}
      round={false}
      owner={owner}
      reduced={reduced}
      label="Thông tin cốt lõi"
      onEdit={onEdit}
      actions={!owner && <ViewerActions kind="company" />}
    >
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{c.name}</h1>
        <p className="mt-1 text-base text-page-muted md:text-lg">
          {c.industry} · {c.size} · Thành lập {c.founded}
        </p>
      </div>
      <p className="max-w-2xl text-sm leading-relaxed md:text-base">{c.mission}</p>
      <div className="flex flex-wrap gap-2">
        <Badge>
          <Briefcase className="h-3.5 w-3.5" aria-hidden />
          Đang tuyển {c.positions.length} vị trí
        </Badge>
        <Badge>
          <Clock className="h-3.5 w-3.5" aria-hidden />
          Thường phản hồi trong {c.responseDays} ngày
        </Badge>
      </div>
    </CoreShell>
  )
}
