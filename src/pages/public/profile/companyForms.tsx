// Form sửa các ô của trang doanh nghiệp. Bản nháp cục bộ; chỉ ghi vào store khi Lưu hợp lệ.
import { useState } from 'react'
import { BENEFIT_ICON_LABELS, WORK_MODE_LABELS, type BenefitIcon, type CompanyProfile, type WorkMode } from './model'
import { useProfileStore } from './store'
import { newId, validate, type FieldErrors } from './logic'
import { Field, FormShell, ListEditor, mergeErrors, splitList, toNum } from './formKit'

type FormProps = { c: CompanyProfile; save: (patch: Partial<CompanyProfile>) => void; onClose: () => void }

const MODE_OPTIONS = (Object.keys(WORK_MODE_LABELS) as WorkMode[]).map((m) => ({ value: m, text: WORK_MODE_LABELS[m] }))
const ICON_OPTIONS = (Object.keys(BENEFIT_ICON_LABELS) as BenefitIcon[]).map((i) => ({ value: i, text: BENEFIT_ICON_LABELS[i] }))

export default function CompanyForm({ id, onClose }: { id: string; onClose: () => void }) {
  const company = useProfileStore((s) => s.company)
  const update = useProfileStore((s) => s.updateCompany)
  const props = { c: company, save: update, onClose }
  switch (id) {
    case 'core':
      return <CoreForm {...props} />
    case 'positions':
      return <PositionsForm {...props} />
    case 'benefits':
      return <BenefitsForm {...props} />
    case 'culture':
      return <CultureForm {...props} />
    case 'day':
      return <DayForm {...props} />
    default:
      return <ContactForm {...props} />
  }
}

function CoreForm({ c, save, onClose }: FormProps) {
  const [d, setD] = useState({ name: c.name, logoText: c.logoText, industry: c.industry, size: c.size, founded: c.founded, mission: c.mission, responseDays: c.responseDays })
  const set = (patch: Partial<typeof d>) => setD({ ...d, ...patch })
  return (
    <FormShell
      onClose={onClose}
      check={() => {
        const e: FieldErrors = {}
        validate.required(e, 'name', d.name, 'Tên công ty')
        validate.required(e, 'logoText', d.logoText, 'Chữ trong logo')
        if (!Number.isFinite(d.founded) || d.founded < 1800) e.founded = 'Năm thành lập chưa hợp lệ'
        if (!Number.isFinite(d.responseDays) || d.responseDays < 0) e.responseDays = 'Số ngày phản hồi phải là số không âm'
        return e
      }}
      save={() => save({ ...d, name: d.name.trim(), logoText: d.logoText.trim().slice(0, 3) })}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="name" label="Tên công ty" value={d.name} onChange={(v) => set({ name: v })} className="sm:col-span-2" />
        <Field name="logoText" label="Chữ trong logo" value={d.logoText} onChange={(v) => set({ logoText: v })} hint="Tối đa 3 ký tự." />
        <Field name="industry" label="Lĩnh vực" value={d.industry} onChange={(v) => set({ industry: v })} />
        <Field name="size" label="Quy mô" value={d.size} onChange={(v) => set({ size: v })} />
        <Field name="founded" label="Năm thành lập" type="number" value={d.founded} onChange={(v) => set({ founded: toNum(v) })} />
        <Field name="responseDays" label="Thường phản hồi trong (ngày)" type="number" value={d.responseDays} onChange={(v) => set({ responseDays: toNum(v) })} />
        <Field name="mission" label="Sứ mệnh" multiline value={d.mission} onChange={(v) => set({ mission: v })} className="sm:col-span-2" />
      </div>
    </FormShell>
  )
}

function PositionsForm({ c, save, onClose }: FormProps) {
  // kỹ năng giữ dạng chuỗi trong bản nháp để gõ dấu phẩy thoải mái
  const [items, setItems] = useState(c.positions.map((p) => ({ ...p, skills: p.skills.join(', ') })))
  return (
    <FormShell
      onClose={onClose}
      check={() => {
        const e: FieldErrors = {}
        items.forEach((p, i) => {
          const one: FieldErrors = {}
          validate.required(one, 'title', p.title, 'Tên vị trí')
          validate.salaryRange(one, p.salaryMin, p.salaryMax)
          mergeErrors(e, `pos.${i}.`, one)
        })
        return e
      }}
      save={() => save({ positions: items.map((p) => ({ ...p, title: p.title.trim(), skills: splitList(p.skills) })) })}
    >
      <ListEditor
        legend="Vị trí đang tuyển"
        itemName="vị trí"
        items={items}
        onChange={setItems}
        make={() => ({ id: newId('v'), title: '', skills: '', salaryMin: 10, salaryMax: 15, mode: 'onsite' as WorkMode, location: 'Đà Nẵng' })}
        render={(p, i, set) => (
          <>
            <Field name={`pos.${i}.title`} label="Tên vị trí" value={p.title} onChange={(v) => set({ title: v })} className="sm:col-span-2" />
            <Field name={`pos.${i}.skills`} label="Kỹ năng yêu cầu" value={p.skills} onChange={(v) => set({ skills: v })} hint="Ngăn cách bằng dấu phẩy." className="sm:col-span-2" />
            <Field name={`pos.${i}.salaryMin`} label="Lương tối thiểu (triệu/tháng)" type="number" value={p.salaryMin} onChange={(v) => set({ salaryMin: toNum(v) })} />
            <Field name={`pos.${i}.salaryMax`} label="Lương tối đa (triệu/tháng)" type="number" value={p.salaryMax} onChange={(v) => set({ salaryMax: toNum(v) })} />
            <Field name={`pos.${i}.mode`} label="Hình thức" value={p.mode} options={MODE_OPTIONS} onChange={(v) => set({ mode: v as WorkMode })} />
            <Field name={`pos.${i}.location`} label="Địa điểm" value={p.location} onChange={(v) => set({ location: v })} />
          </>
        )}
      />
    </FormShell>
  )
}

function BenefitsForm({ c, save, onClose }: FormProps) {
  const [items, setItems] = useState(c.benefits)
  return (
    <FormShell
      onClose={onClose}
      check={() => {
        const e: FieldErrors = {}
        items.forEach((b, i) => validate.required(e, `ben.${i}.label`, b.label, 'Nội dung phúc lợi'))
        return e
      }}
      save={() => save({ benefits: items.map((b) => ({ ...b, label: b.label.trim() })) })}
    >
      <ListEditor
        legend="Phúc lợi"
        itemName="phúc lợi"
        items={items}
        onChange={setItems}
        make={() => ({ id: newId('b'), icon: 'bonus' as BenefitIcon, label: '' })}
        render={(b, i, set) => (
          <>
            <Field name={`ben.${i}.icon`} label="Biểu tượng" value={b.icon} options={ICON_OPTIONS} onChange={(v) => set({ icon: v as BenefitIcon })} />
            <Field name={`ben.${i}.label`} label="Nội dung" value={b.label} onChange={(v) => set({ label: v })} />
          </>
        )}
      />
    </FormShell>
  )
}

function CultureForm({ c, save, onClose }: FormProps) {
  const [items, setItems] = useState(c.culture)
  return (
    <FormShell
      onClose={onClose}
      check={() => {
        const e: FieldErrors = {}
        items.forEach((x, i) => validate.required(e, `cul.${i}.title`, x.title, 'Tiêu đề'))
        return e
      }}
      save={() => save({ culture: items.map((x) => ({ ...x, title: x.title.trim() })) })}
    >
      <ListEditor
        legend="Văn hóa & môi trường"
        itemName="điều"
        items={items}
        onChange={setItems}
        make={() => ({ id: newId('cu'), title: '', text: '' })}
        render={(x, i, set) => (
          <>
            <Field name={`cul.${i}.title`} label="Tiêu đề" value={x.title} onChange={(v) => set({ title: v })} className="sm:col-span-2" />
            <Field name={`cul.${i}.text`} label="Mô tả" multiline value={x.text} onChange={(v) => set({ text: v })} className="sm:col-span-2" />
          </>
        )}
      />
    </FormShell>
  )
}

function DayForm({ c, save, onClose }: FormProps) {
  const [items, setItems] = useState(c.day)
  return (
    <FormShell
      onClose={onClose}
      check={() => {
        const e: FieldErrors = {}
        items.forEach((x, i) => {
          validate.required(e, `day.${i}.time`, x.time, 'Giờ')
          validate.required(e, `day.${i}.text`, x.text, 'Nội dung')
        })
        return e
      }}
      save={() => save({ day: items })}
    >
      <ListEditor
        legend="Một ngày làm việc"
        itemName="mốc"
        items={items}
        onChange={setItems}
        make={() => ({ id: newId('d'), time: '', text: '' })}
        render={(x, i, set) => (
          <>
            <Field name={`day.${i}.time`} label="Giờ" type="text" value={x.time} onChange={(v) => set({ time: v })} hint="Ví dụ 09:00" />
            <Field name={`day.${i}.text`} label="Nội dung" value={x.text} onChange={(v) => set({ text: v })} />
          </>
        )}
      />
    </FormShell>
  )
}

/** Form Liên hệ gộp cả địa chỉ văn phòng (ô Địa chỉ cũng mở form này) */
function ContactForm({ c, save, onClose }: FormProps) {
  const [d, setD] = useState({ address: c.address, ...c.contact })
  return (
    <FormShell
      onClose={onClose}
      check={() => {
        const e: FieldErrors = {}
        validate.email(e, 'email', d.email)
        return e
      }}
      save={() => save({ address: d.address.trim(), contact: { email: d.email.trim(), phone: d.phone.trim(), website: d.website.trim() } })}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="address" label="Địa chỉ văn phòng" value={d.address} onChange={(v) => setD({ ...d, address: v })} className="sm:col-span-2" />
        <Field name="email" label="Email liên hệ" type="email" value={d.email} onChange={(v) => setD({ ...d, email: v })} />
        <Field name="phone" label="Số điện thoại" type="tel" value={d.phone} onChange={(v) => setD({ ...d, phone: v })} />
        <Field name="website" label="Website" value={d.website} onChange={(v) => setD({ ...d, website: v })} className="sm:col-span-2" />
      </div>
    </FormShell>
  )
}
