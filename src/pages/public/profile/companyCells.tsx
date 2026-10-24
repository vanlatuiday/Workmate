// Các ô bento (tóm tắt + chi tiết) của trang doanh nghiệp.
import { Gift, GraduationCap, HeartPulse, Laptop, Mail, MapPin, Phone, Globe, Users, Utensils, Wifi, Plane, type LucideIcon } from 'lucide-react'
import { useView, type CellDef } from './context'
import { BENEFIT_ICON_LABELS, WORK_MODE_LABELS, type BenefitIcon, type CompanyProfile } from './model'
import { formatSalary } from './logic'
import { Btn, More, Row, Tags, Timeline } from './ui'

const BENEFIT_ICONS: Record<BenefitIcon, LucideIcon> = {
  health: HeartPulse,
  laptop: Laptop,
  learning: GraduationCap,
  bonus: Gift,
  vacation: Plane,
  remote: Wifi,
  meal: Utensils,
  team: Users,
}

/** Danh sách vị trí; ở chi tiết có thêm nút Ứng tuyển cho người xem */
function Positions({ c, owner, limit, full }: { c: CompanyProfile; owner: boolean; limit?: number; full: boolean }) {
  const { notify } = useView()
  const list = c.positions.slice(0, limit)
  if (!c.positions.length) return <p className="text-sm text-page-muted">Chưa có vị trí đang tuyển.</p>
  return (
    <>
      <ul className="space-y-4">
        {list.map((v) => (
          <li key={v.id} className="space-y-1.5">
            <p className="text-sm font-medium">{v.title}</p>
            <p className="text-sm text-page-muted">
              {formatSalary(v.salaryMin, v.salaryMax)} · {WORK_MODE_LABELS[v.mode]}
              {full && ` · ${v.location}`}
            </p>
            <Tags items={full ? v.skills : v.skills.slice(0, 3)} />
            {full && !owner && (
              <Btn variant="primary" className="mt-1 !py-1.5" onClick={() => notify(`Đã gửi hồ sơ ứng tuyển "${v.title}" (demo)`)}>
                Ứng tuyển
              </Btn>
            )}
          </li>
        ))}
      </ul>
      {!full && <More count={c.positions.length - list.length} unit="vị trí" />}
    </>
  )
}

function Benefits({ c, limit }: { c: CompanyProfile; limit?: number }) {
  const list = c.benefits.slice(0, limit)
  if (!list.length) return <p className="text-sm text-page-muted">Chưa có phúc lợi.</p>
  return (
    <>
      <ul className="space-y-2.5">
        {list.map((b) => {
          const Icon = BENEFIT_ICONS[b.icon]
          return (
            <li key={b.id} className="flex items-start gap-3 text-sm">
              <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-label={BENEFIT_ICON_LABELS[b.icon]} role="img" />
              {b.label}
            </li>
          )
        })}
      </ul>
      {limit !== undefined && <More count={c.benefits.length - list.length} unit="phúc lợi" />}
    </>
  )
}

function ContactBody({ c }: { c: CompanyProfile }) {
  const line = (icon: React.ReactNode, text: string) => (
    <p className="flex items-center gap-2 text-sm">
      {icon}
      {text || 'Chưa nhập'}
    </p>
  )
  return (
    <div className="space-y-2">
      {line(<Mail className="h-4 w-4 shrink-0" aria-hidden />, c.contact.email)}
      {line(<Phone className="h-4 w-4 shrink-0" aria-hidden />, c.contact.phone)}
      {line(<Globe className="h-4 w-4 shrink-0" aria-hidden />, c.contact.website)}
    </div>
  )
}

export function companyCells(c: CompanyProfile, owner: boolean): CellDef[] {
  const empty = (text: string) => <p className="text-sm text-page-muted">{text}</p>
  const culture = (limit?: number) => {
    const list = c.culture.slice(0, limit)
    if (!list.length) return empty('Chưa có nội dung văn hóa.')
    return (
      <>
        <ul className="space-y-3">
          {list.map((x) => (
            <li key={x.id}>
              <p className="text-sm font-medium">{x.title}</p>
              <p className="text-sm text-page-muted">{x.text}</p>
            </li>
          ))}
        </ul>
        {limit !== undefined && <More count={c.culture.length - list.length} unit="điều" />}
      </>
    )
  }
  const day = (limit?: number) => {
    const list = c.day.slice(0, limit)
    if (!list.length) return empty('Chưa có mô tả một ngày làm việc.')
    return (
      <>
        <Timeline items={list.map((d) => ({ key: d.id, when: d.time, title: d.text }))} />
        {limit !== undefined && <More count={c.day.length - list.length} unit="mốc" />}
      </>
    )
  }
  const address = (
    <Row label="Văn phòng">
      <span className="inline-flex items-start gap-1.5">
        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        {c.address || 'Chưa nhập'}
      </span>
    </Row>
  )

  return [
    {
      id: 'positions',
      slot: 'A',
      label: 'Vị trí đang tuyển',
      summary: <Positions c={c} owner={owner} limit={2} full={false} />,
      detail: <Positions c={c} owner={owner} full />,
    },
    { id: 'benefits', slot: 'B', label: 'Phúc lợi', summary: <Benefits c={c} limit={3} />, detail: <Benefits c={c} /> },
    { id: 'culture', slot: 'C', label: 'Văn hóa & môi trường', summary: culture(2), detail: culture() },
    { id: 'day', slot: 'D', label: 'Một ngày làm việc', summary: day(3), detail: day() },
    // Địa chỉ nằm chung form với Liên hệ (id 'contact'), khớp với gợi ý hoàn thiện hồ sơ
    { id: 'address', slot: 'E', label: 'Địa chỉ văn phòng', editId: 'contact', summary: address, detail: address },
    { id: 'contact', slot: 'F', label: 'Liên hệ', summary: <ContactBody c={c} />, detail: <ContactBody c={c} /> },
  ]
}
