// Các ô bento (tóm tắt + chi tiết) của hồ sơ ứng viên.
import { Download, Mail, MapPin, Phone } from 'lucide-react'
import { useView, type CellDef } from './context'
import { WORK_MODE_LABELS, type SeekerProfile } from './model'
import { formatMonth, formatSalary } from './logic'
import { PrivacySwitch } from './Cores'
import { Btn, HiddenInfo, LevelBar, More, Row, Tags, Timeline } from './ui'

/** Ô Mong muốn: tóm tắt và chi tiết dùng chung một thân */
function WishesBody({ p, owner }: { p: SeekerProfile; owner: boolean }) {
  const { salaryMin, salaryMax, locations, modes } = p.wishes
  const showSalary = owner || p.visibility.salary
  return (
    <div className="space-y-3">
      <Row label="Mức lương mong muốn">
        <div className="flex flex-wrap items-center gap-x-3">
          {showSalary ? formatSalary(salaryMin, salaryMax) : <HiddenInfo />}
          {owner && <PrivacySwitch field="salary" label="Mức lương mong muốn" />}
        </div>
      </Row>
      <Row label="Địa điểm">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          {locations.length ? locations.join(', ') : 'Chưa nhập'}
        </span>
      </Row>
      <Row label="Hình thức làm việc">{modes.length ? modes.map((m) => WORK_MODE_LABELS[m]).join(', ') : 'Chưa chọn'}</Row>
    </div>
  )
}

/** Ô Liên hệ + nút Tải CV */
function ContactBody({ p, owner }: { p: SeekerProfile; owner: boolean }) {
  const { notify } = useView()
  const line = (icon: React.ReactNode, text: string, field: 'email' | 'phone', label: string) => (
    <div className="flex flex-wrap items-center gap-x-3 text-sm">
      <span className="inline-flex items-center gap-2">
        {icon}
        {owner || p.visibility[field] ? text || 'Chưa nhập' : <HiddenInfo />}
      </span>
      {owner && <PrivacySwitch field={field} label={label} />}
    </div>
  )
  return (
    <div className="space-y-2">
      {line(<Mail className="h-4 w-4 shrink-0" aria-hidden />, p.contact.email, 'email', 'Email')}
      {line(<Phone className="h-4 w-4 shrink-0" aria-hidden />, p.contact.phone, 'phone', 'Số điện thoại')}
      <div className="pt-1">
        <Btn onClick={() => notify('Tải CV (demo) — chưa có tệp thật')}>
          <Download className="h-4 w-4" aria-hidden />
          Tải CV
        </Btn>
      </div>
    </div>
  )
}

const span = (a: string, b: string) => `${a} – ${b}`

export function seekerCells(p: SeekerProfile, owner: boolean): CellDef[] {
  const skillsShown = p.skills.slice(0, 3)
  const skillRows = (list: typeof p.skills, labels: boolean) => (
    <ul className="space-y-2">
      {list.map((s) => (
        <li key={s.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <span className="text-sm font-medium">{s.name}</span>
          <LevelBar level={s.level} showLabel={labels} />
        </li>
      ))}
    </ul>
  )
  const empty = (text: string) => <p className="text-sm text-page-muted">{text}</p>
  const expItems = (list: typeof p.experience, withText: boolean) => (
    <Timeline
      items={list.map((e) => ({
        key: e.id,
        when: span(formatMonth(e.start), formatMonth(e.end)),
        title: `${e.role} · ${e.company}`,
        text: withText ? e.summary : undefined,
      }))}
    />
  )
  const projects = (list: typeof p.projects, full: boolean) => (
    <ul className="space-y-3">
      {list.map((x) => (
        <li key={x.id} className="space-y-1.5">
          <p className="text-sm font-medium">{x.name}</p>
          {full && <p className="text-sm text-page-muted">{x.summary}</p>}
          <Tags items={x.tech} />
        </li>
      ))}
    </ul>
  )
  const edu = (full: boolean) => (
    <div className="space-y-4">
      {p.education.length === 0 && p.certificates.length === 0 && empty('Chưa có học vấn hoặc chứng chỉ.')}
      <ul className="space-y-2">
        {(full ? p.education : p.education.slice(0, 1)).map((e) => (
          <li key={e.id} className="text-sm">
            <span className="font-medium">{e.degree}</span>
            <span className="block text-page-muted">{e.school} · {e.year}</span>
          </li>
        ))}
      </ul>
      {full ? (
        p.certificates.length > 0 && (
          <div>
            <p className="mb-2 text-xs text-page-muted">Chứng chỉ</p>
            <ul className="space-y-2">
              {p.certificates.map((c) => (
                <li key={c.id} className="text-sm">
                  <span className="font-medium">{c.name}</span>
                  <span className="block text-page-muted">{c.issuer} · {c.year}</span>
                </li>
              ))}
            </ul>
          </div>
        )
      ) : (
        p.certificates.length > 0 && <p className="text-sm text-page-muted">{p.certificates.length} chứng chỉ</p>
      )}
    </div>
  )

  return [
    {
      id: 'skills',
      slot: 'A',
      label: 'Kỹ năng',
      summary: (
        <>
          {p.skills.length ? skillRows(skillsShown, true) : empty('Chưa có kỹ năng nào.')}
          <More count={p.skills.length - skillsShown.length} unit="kỹ năng" />
        </>
      ),
      detail: p.skills.length ? skillRows(p.skills, true) : empty('Chưa có kỹ năng nào.'),
    },
    {
      id: 'wishes',
      slot: 'B',
      label: 'Mong muốn',
      summary: <WishesBody p={p} owner={owner} />,
      detail: <WishesBody p={p} owner={owner} />,
    },
    {
      id: 'experience',
      slot: 'C',
      label: 'Kinh nghiệm',
      summary: (
        <>
          {p.experience.length ? expItems(p.experience.slice(0, 2), false) : empty('Chưa có kinh nghiệm.')}
          <More count={p.experience.length - 2} unit="vị trí" />
        </>
      ),
      detail: p.experience.length ? expItems(p.experience, true) : empty('Chưa có kinh nghiệm.'),
    },
    {
      id: 'projects',
      slot: 'D',
      label: 'Dự án tiêu biểu',
      summary: (
        <>
          {p.projects.length ? projects(p.projects.slice(0, 2), false) : empty('Chưa có dự án.')}
          <More count={p.projects.length - 2} unit="dự án" />
        </>
      ),
      detail: p.projects.length ? projects(p.projects, true) : empty('Chưa có dự án.'),
    },
    { id: 'education', slot: 'E', label: 'Học vấn & chứng chỉ', summary: edu(false), detail: edu(true) },
    {
      id: 'contact',
      slot: 'F',
      label: 'Liên hệ',
      summary: <ContactBody p={p} owner={owner} />,
      detail: <ContactBody p={p} owner={owner} />,
    },
  ]
}
