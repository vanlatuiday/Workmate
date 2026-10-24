// Form sửa các ô của hồ sơ ứng viên. Mỗi form giữ bản nháp cục bộ; chỉ ghi vào store khi Lưu hợp lệ.
import { useState } from 'react'
import { LEVEL_LABELS, WORK_MODE_LABELS, type Level, type SeekerProfile, type WorkMode } from './model'
import { useProfileStore } from './store'
import { newId, validate, type FieldErrors } from './logic'
import { Field, FormShell, ListEditor, mergeErrors, splitList, toNum } from './formKit'

type Props = { id: string; onClose: () => void }

const LEVEL_OPTIONS = ([1, 2, 3, 4, 5] as Level[]).map((l) => ({ value: String(l), text: `${l} — ${LEVEL_LABELS[l]}` }))

/** Chữ viết tắt từ họ tên: chữ cái đầu của hai từ cuối */
const initialsOf = (name: string) =>
  name.trim().split(/\s+/).filter(Boolean).slice(-2).map((w) => w[0]?.toUpperCase()).join('') || '?'

export default function SeekerForm({ id, onClose }: Props) {
  const seeker = useProfileStore((s) => s.seeker)
  const update = useProfileStore((s) => s.updateSeeker)
  switch (id) {
    case 'core':
      return <CoreForm p={seeker} save={update} onClose={onClose} />
    case 'skills':
      return <SkillsForm p={seeker} save={update} onClose={onClose} />
    case 'wishes':
      return <WishesForm p={seeker} save={update} onClose={onClose} />
    case 'experience':
      return <ExperienceForm p={seeker} save={update} onClose={onClose} />
    case 'projects':
      return <ProjectsForm p={seeker} save={update} onClose={onClose} />
    case 'education':
      return <EducationForm p={seeker} save={update} onClose={onClose} />
    default:
      return <ContactForm p={seeker} save={update} onClose={onClose} />
  }
}

type FormProps = { p: SeekerProfile; save: (patch: Partial<SeekerProfile>) => void; onClose: () => void }

function CoreForm({ p, save, onClose }: FormProps) {
  const [d, setD] = useState({ name: p.name, title: p.title, years: p.years, bio: p.bio, availableFrom: p.availableFrom, currentCompany: p.currentCompany })
  const set = (patch: Partial<typeof d>) => setD({ ...d, ...patch })
  return (
    <FormShell
      onClose={onClose}
      check={() => {
        const e: FieldErrors = {}
        validate.required(e, 'name', d.name, 'Họ tên')
        if (!Number.isFinite(d.years) || d.years < 0) e.years = 'Số năm kinh nghiệm phải là số không âm'
        return e
      }}
      save={() => save({ ...d, name: d.name.trim(), initials: initialsOf(d.name) })}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="name" label="Họ tên" value={d.name} onChange={(v) => set({ name: v })} />
        <Field name="title" label="Vị trí mong muốn" value={d.title} onChange={(v) => set({ title: v })} />
        <Field name="years" label="Số năm kinh nghiệm" type="number" value={d.years} onChange={(v) => set({ years: toNum(v) })} />
        <Field name="availableFrom" label="Sẵn sàng đi làm từ" type="date" value={d.availableFrom} onChange={(v) => set({ availableFrom: v })} />
        <Field name="currentCompany" label="Công ty hiện tại" value={d.currentCompany} onChange={(v) => set({ currentCompany: v })} hint="Bật/tắt hiển thị ngay trên trang." className="sm:col-span-2" />
        <Field name="bio" label="Câu giới thiệu" multiline value={d.bio} onChange={(v) => set({ bio: v })} className="sm:col-span-2" />
      </div>
    </FormShell>
  )
}

function SkillsForm({ p, save, onClose }: FormProps) {
  const [items, setItems] = useState(p.skills)
  return (
    <FormShell
      onClose={onClose}
      check={() => {
        const e: FieldErrors = {}
        items.forEach((s, i) => validate.required(e, `skills.${i}.name`, s.name, 'Tên kỹ năng'))
        return e
      }}
      save={() => save({ skills: items.map((s) => ({ ...s, name: s.name.trim() })) })}
    >
      <ListEditor
        legend="Kỹ năng"
        itemName="kỹ năng"
        items={items}
        onChange={setItems}
        make={() => ({ id: newId('s'), name: '', level: 3 as Level })}
        render={(s, i, set) => (
          <>
            <Field name={`skills.${i}.name`} label="Tên kỹ năng" value={s.name} onChange={(v) => set({ name: v })} />
            <Field name={`skills.${i}.level`} label="Mức thành thạo" value={String(s.level)} options={LEVEL_OPTIONS} onChange={(v) => set({ level: Number(v) as Level })} />
          </>
        )}
      />
    </FormShell>
  )
}

function WishesForm({ p, save, onClose }: FormProps) {
  const w = p.wishes
  const [d, setD] = useState({ salaryMin: w.salaryMin, salaryMax: w.salaryMax, locations: w.locations.join(', '), modes: w.modes })
  const toggleMode = (m: WorkMode) =>
    setD({ ...d, modes: d.modes.includes(m) ? d.modes.filter((x) => x !== m) : [...d.modes, m] })
  return (
    <FormShell
      onClose={onClose}
      check={() => {
        const e: FieldErrors = {}
        validate.salaryRange(e, d.salaryMin, d.salaryMax)
        return e
      }}
      save={() => save({ wishes: { salaryMin: d.salaryMin, salaryMax: d.salaryMax, locations: splitList(d.locations), modes: d.modes } })}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="salaryMin" label="Lương tối thiểu (triệu/tháng)" type="number" value={d.salaryMin} onChange={(v) => setD({ ...d, salaryMin: toNum(v) })} />
        <Field name="salaryMax" label="Lương tối đa (triệu/tháng)" type="number" value={d.salaryMax} onChange={(v) => setD({ ...d, salaryMax: toNum(v) })} />
        <Field name="locations" label="Địa điểm" value={d.locations} onChange={(v) => setD({ ...d, locations: v })} hint="Ngăn cách bằng dấu phẩy." className="sm:col-span-2" />
      </div>
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Hình thức làm việc</legend>
        <div className="flex flex-wrap gap-4">
          {(Object.keys(WORK_MODE_LABELS) as WorkMode[]).map((m) => (
            <label key={m} className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={d.modes.includes(m)} onChange={() => toggleMode(m)} className="h-4 w-4 accent-[var(--page-fg)]" />
              {WORK_MODE_LABELS[m]}
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-page-muted">Bật/tắt hiển thị mức lương ngay trên trang.</p>
      </fieldset>
    </FormShell>
  )
}

function ExperienceForm({ p, save, onClose }: FormProps) {
  const [items, setItems] = useState(p.experience)
  return (
    <FormShell
      onClose={onClose}
      check={() => {
        const e: FieldErrors = {}
        items.forEach((x, i) => {
          validate.required(e, `exp.${i}.company`, x.company, 'Tên công ty')
          validate.required(e, `exp.${i}.role`, x.role, 'Vị trí')
          validate.required(e, `exp.${i}.start`, x.start, 'Thời gian bắt đầu')
          if (x.start && x.end && x.end < x.start) e[`exp.${i}.end`] = 'Thời gian kết thúc phải sau thời gian bắt đầu'
        })
        return e
      }}
      save={() => save({ experience: items.map((x) => ({ ...x, end: x.end || undefined })) })}
    >
      <ListEditor
        legend="Kinh nghiệm"
        itemName="kinh nghiệm"
        items={items}
        onChange={setItems}
        make={() => ({ id: newId('e'), company: '', role: '', start: '', end: undefined as string | undefined, summary: '' })}
        render={(x, i, set) => (
          <>
            <Field name={`exp.${i}.company`} label="Công ty" value={x.company} onChange={(v) => set({ company: v })} />
            <Field name={`exp.${i}.role`} label="Vị trí" value={x.role} onChange={(v) => set({ role: v })} />
            <Field name={`exp.${i}.start`} label="Bắt đầu" type="month" value={x.start} onChange={(v) => set({ start: v })} />
            <Field name={`exp.${i}.end`} label="Kết thúc" type="month" value={x.end ?? ''} onChange={(v) => set({ end: v })} hint="Để trống nếu đang làm." />
            <Field name={`exp.${i}.summary`} label="Mô tả" multiline value={x.summary} onChange={(v) => set({ summary: v })} className="sm:col-span-2" />
          </>
        )}
      />
    </FormShell>
  )
}

function ProjectsForm({ p, save, onClose }: FormProps) {
  // tech giữ dạng chuỗi trong bản nháp để gõ dấu phẩy thoải mái
  const [items, setItems] = useState(p.projects.map((x) => ({ ...x, tech: x.tech.join(', ') })))
  return (
    <FormShell
      onClose={onClose}
      check={() => {
        const e: FieldErrors = {}
        items.forEach((x, i) => validate.required(e, `prj.${i}.name`, x.name, 'Tên dự án'))
        return e
      }}
      save={() => save({ projects: items.map((x) => ({ ...x, name: x.name.trim(), tech: splitList(x.tech) })) })}
    >
      <ListEditor
        legend="Dự án tiêu biểu"
        itemName="dự án"
        items={items}
        onChange={setItems}
        make={() => ({ id: newId('p'), name: '', summary: '', tech: '' })}
        render={(x, i, set) => (
          <>
            <Field name={`prj.${i}.name`} label="Tên dự án" value={x.name} onChange={(v) => set({ name: v })} className="sm:col-span-2" />
            <Field name={`prj.${i}.summary`} label="Mô tả" multiline value={x.summary} onChange={(v) => set({ summary: v })} className="sm:col-span-2" />
            <Field name={`prj.${i}.tech`} label="Công nghệ" value={x.tech} onChange={(v) => set({ tech: v })} hint="Ngăn cách bằng dấu phẩy." className="sm:col-span-2" />
          </>
        )}
      />
    </FormShell>
  )
}

function EducationForm({ p, save, onClose }: FormProps) {
  const [edu, setEdu] = useState(p.education)
  const [certs, setCerts] = useState(p.certificates)
  return (
    <FormShell
      onClose={onClose}
      check={() => {
        const e: FieldErrors = {}
        const a: FieldErrors = {}
        edu.forEach((x, i) => {
          validate.required(a, `${i}.school`, x.school, 'Tên trường')
          validate.required(a, `${i}.degree`, x.degree, 'Bằng cấp')
        })
        mergeErrors(e, 'edu.', a)
        const b: FieldErrors = {}
        certs.forEach((x, i) => validate.required(b, `${i}.name`, x.name, 'Tên chứng chỉ'))
        mergeErrors(e, 'cert.', b)
        return e
      }}
      save={() => save({ education: edu, certificates: certs })}
    >
      <ListEditor
        legend="Học vấn"
        itemName="học vấn"
        items={edu}
        onChange={setEdu}
        make={() => ({ id: newId('ed'), school: '', degree: '', year: new Date().getFullYear() })}
        render={(x, i, set) => (
          <>
            <Field name={`edu.${i}.school`} label="Trường" value={x.school} onChange={(v) => set({ school: v })} />
            <Field name={`edu.${i}.degree`} label="Bằng cấp / ngành" value={x.degree} onChange={(v) => set({ degree: v })} />
            <Field name={`edu.${i}.year`} label="Năm tốt nghiệp" type="number" value={x.year} onChange={(v) => set({ year: toNum(v) })} />
          </>
        )}
      />
      <ListEditor
        legend="Chứng chỉ"
        itemName="chứng chỉ"
        items={certs}
        onChange={setCerts}
        make={() => ({ id: newId('c'), name: '', issuer: '', year: new Date().getFullYear() })}
        render={(x, i, set) => (
          <>
            <Field name={`cert.${i}.name`} label="Tên chứng chỉ" value={x.name} onChange={(v) => set({ name: v })} />
            <Field name={`cert.${i}.issuer`} label="Đơn vị cấp" value={x.issuer} onChange={(v) => set({ issuer: v })} />
            <Field name={`cert.${i}.year`} label="Năm" type="number" value={x.year} onChange={(v) => set({ year: toNum(v) })} />
          </>
        )}
      />
    </FormShell>
  )
}

function ContactForm({ p, save, onClose }: FormProps) {
  const [d, setD] = useState(p.contact)
  return (
    <FormShell
      onClose={onClose}
      check={() => {
        const e: FieldErrors = {}
        validate.email(e, 'email', d.email)
        return e
      }}
      save={() => save({ contact: { email: d.email.trim(), phone: d.phone.trim() } })}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="email" label="Email" type="email" value={d.email} onChange={(v) => setD({ ...d, email: v })} />
        <Field name="phone" label="Số điện thoại" type="tel" value={d.phone} onChange={(v) => setD({ ...d, phone: v })} />
      </div>
      <p className="text-xs text-page-muted">Bật/tắt hiển thị email và số điện thoại ngay trên trang.</p>
    </FormShell>
  )
}
