import { useId, useState, type FormEvent } from 'react'
import { Plus, X } from 'lucide-react'
import { JOB_TYPES } from '@constants/index'
import { MockNotice, PageHeader, Panel } from '@components/dashboard'
import { cn } from '@utils/cn'
import type { JobType } from '@/types'
import { useProfileStore } from '@context/profileStore'
import { completeness } from '@pages/public/profile/useProfileDraft'
import { DAY_SHORT, SESSIONS } from './mockData'
import { FOCUS } from '@utils/focus'

const FIELD = `w-full rounded-control border border-page-edge bg-page-surface px-3 py-2 text-sm text-page-fg ${FOCUS}`
const LEGEND = 'mb-4 font-display text-lg font-medium text-page-fg'
const DAY_FULL = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']

/** Ô nhập có nhãn gắn htmlFor */
function Field({ label, value, onChange, type = 'text', inputMode, min }: {
  label: string
  value: string | number
  onChange: (v: string) => void
  type?: string
  inputMode?: 'numeric' | 'tel'
  min?: number
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-page-muted">{label}</label>
      <input id={id} type={type} inputMode={inputMode} min={min} value={value} onChange={(e) => onChange(e.target.value)} className={FIELD} />
    </div>
  )
}

export default function Profile() {
  // Form lưu tường minh: state cục bộ khởi tạo từ profileStore, bấm "Lưu hồ sơ" mới ghi vào store
  const P = useProfileStore.getState().profile
  const update = useProfileStore((s) => s.update)
  const [fullName, setFullName] = useState(P.fullName)
  const [phone, setPhone] = useState(P.phone)
  const [area, setArea] = useState(P.area)
  const [jobTypes, setJobTypes] = useState<JobType[]>(P.jobTypes)
  const [salaryMin, setSalaryMin] = useState(String(P.salaryMin))
  const [maxKm, setMaxKm] = useState(String(P.maxDistanceKm))
  const [slots, setSlots] = useState<Set<string>>(new Set(P.availability))
  const [skills, setSkills] = useState(P.skills)
  const [newSkill, setNewSkill] = useState('')
  const [experience, setExperience] = useState(P.experience)
  const [saved, setSaved] = useState(false)
  const [skillDup, setSkillDup] = useState(false)
  const skillId = useId()

  // Mức hoàn thiện: cùng cách tính với trang /ho-so (completeness), theo hồ sơ đã lưu + ảnh đại diện
  const stored = useProfileStore((s) => s.profile)
  const avatarUrl = useProfileStore((s) => s.avatarUrl)
  const percent = completeness({ ...stored, avatarUrl })

  // Mọi thay đổi xóa dòng "Đã lưu" để người dùng biết cần lưu lại
  const touch = <T,>(setter: (v: T) => void) => (v: T) => {
    setSaved(false)
    setter(v)
  }

  const toggleSlot = (key: string) => {
    setSaved(false)
    setSlots((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleType = (t: JobType) => {
    setSaved(false)
    setJobTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]))
  }

  const addSkill = () => {
    const s = newSkill.trim()
    if (!s) return
    // So khớp không phân biệt hoa/thường để không thêm trùng
    if (skills.some((x) => x.toLowerCase() === s.toLowerCase())) {
      setSkillDup(true)
      return
    }
    setSkillDup(false)
    setSaved(false)
    setSkills([...skills, s])
    setNewSkill('')
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    update({
      fullName: fullName.trim(),
      phone: phone.trim(),
      area: area.trim(),
      jobTypes,
      salaryMin: Math.max(0, Number(salaryMin) || 0),
      maxDistanceKm: Math.max(0, Number(maxKm) || 0),
      availability: [...slots],
      skills,
      experience,
    })
    setSaved(true)
  }

  return (
    <form onSubmit={onSubmit}>
      <PageHeader title="Hồ sơ cá nhân" description="Hồ sơ càng đầy đủ, hệ thống càng gợi ý được việc sát với bạn." />

      <Panel className="mb-6">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm text-page-muted" id="profile-progress-label">Mức hoàn thiện hồ sơ</span>
          <span className="tnum font-display text-2xl font-medium text-page-fg">{percent}%</span>
        </div>
        <div
          role="progressbar"
          aria-labelledby="profile-progress-label"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="mt-3 h-1 overflow-hidden rounded-full bg-page-line"
        >
          <div className="h-full rounded-full bg-page-fg" style={{ width: `${percent}%` }} />
        </div>
      </Panel>

      <div className="space-y-6">
        <Panel>
          <fieldset className="min-w-0">
            <legend className={LEGEND}>Thông tin cơ bản</legend>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Họ và tên" value={fullName} onChange={touch(setFullName)} />
              <Field label="Số điện thoại" value={phone} onChange={touch(setPhone)} type="tel" inputMode="tel" />
              <div className="sm:col-span-2">
                <Field label="Khu vực sinh sống" value={area} onChange={touch(setArea)} />
              </div>
            </div>
          </fieldset>
        </Panel>

        <Panel>
          <fieldset className="min-w-0">
            <legend className={LEGEND}>Mong muốn</legend>
            <p className="mb-2 text-sm text-page-muted">Loại việc quan tâm</p>
            <div className="flex flex-wrap gap-2">
              {JOB_TYPES.map((t) => {
                const on = jobTypes.includes(t.value)
                return (
                  <button
                    key={t.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleType(t.value)}
                    className={cn(
                      'rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-300',
                      on ? 'border-page-fg bg-page-fg text-page-bg' : 'border-page-line text-page-fg hover:border-page-fg',
                      FOCUS,
                    )}
                  >
                    {t.label}
                  </button>
                )
              })}
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field label="Mức lương tối thiểu (đồng/giờ)" value={salaryMin} onChange={touch(setSalaryMin)} type="number" inputMode="numeric" min={0} />
              <Field label="Khoảng cách tối đa (km)" value={maxKm} onChange={touch(setMaxKm)} type="number" inputMode="numeric" min={0} />
            </div>
          </fieldset>
        </Panel>

        <Panel>
          <fieldset className="min-w-0">
            <legend className={LEGEND}>Lịch rảnh trong tuần</legend>
            <p className="mb-4 break-words text-sm text-page-muted">
              Bấm vào ô để bật hoặc tắt buổi bạn có thể đi làm. Hệ thống dùng lịch này để chọn việc không trùng giờ.
            </p>
            {/* Lưới có thể cuộn ngang trên màn hình hẹp, nằm trong khung có nhãn */}
            <div className="relative overflow-x-auto" role="group" aria-label="Lịch rảnh theo thứ và buổi" tabIndex={0}>
              <table className="w-full min-w-[420px] border-separate border-spacing-1.5 text-sm">
                <thead>
                  <tr>
                    <td><span className="sr-only">Buổi</span></td>
                    {DAY_SHORT.map((d, i) => (
                      <th key={d} scope="col" abbr={DAY_FULL[i]} className="pb-1 text-center font-medium text-page-muted">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {SESSIONS.map((s, si) => (
                    <tr key={s}>
                      <th scope="row" className="pr-2 text-left font-medium text-page-muted">{s}</th>
                      {DAY_SHORT.map((_, di) => {
                        const key = `${di}-${si}`
                        const on = slots.has(key)
                        return (
                          <td key={key}>
                            <button
                              type="button"
                              aria-pressed={on}
                              aria-label={`${DAY_FULL[di]} buổi ${s.toLowerCase()}`}
                              onClick={() => toggleSlot(key)}
                              className={cn(
                                'h-10 w-full rounded-control border text-xs transition-colors duration-300',
                                on ? 'border-page-fg bg-page-fg text-page-bg' : 'border-page-line text-page-muted hover:border-page-fg',
                                FOCUS,
                              )}
                            >
                              {on ? 'Rảnh' : ''}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="tnum mt-3 text-xs text-page-muted">Đã chọn {slots.size} / 21 buổi</p>
          </fieldset>
        </Panel>

        <Panel>
          <fieldset className="min-w-0">
            <legend className={LEGEND}>Kỹ năng</legend>
            <ul className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <li key={s} className="inline-flex items-center gap-1 rounded-full border border-page-line py-1 pl-3.5 pr-1.5 text-sm text-page-fg">
                  {s}
                  <button
                    type="button"
                    aria-label={`Xóa kỹ năng ${s}`}
                    onClick={() => { setSaved(false); setSkills(skills.filter((x) => x !== s)) }}
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-page-muted transition-colors duration-300 hover:text-page-fg ${FOCUS}`}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-2">
              <div className="min-w-0 flex-1">
                <label htmlFor={skillId} className="sr-only">Thêm kỹ năng</label>
                <input
                  id={skillId}
                  value={newSkill}
                  placeholder="Ví dụ: Chụp ảnh"
                  onChange={(e) => { setNewSkill(e.target.value); setSkillDup(false) }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                  className={FIELD}
                />
              </div>
              <button
                type="button"
                onClick={addSkill}
                className={`inline-flex items-center gap-1.5 rounded-full border border-page-line px-4 py-2 text-sm font-medium text-page-fg transition-colors duration-300 hover:border-page-fg ${FOCUS}`}
              >
                <Plus className="h-4 w-4" aria-hidden="true" /> Thêm
              </button>
            </div>
            <p role="status" className="mt-2 text-xs text-page-muted">{skillDup ? 'Kỹ năng đã có' : ''}</p>
          </fieldset>
        </Panel>

        <Panel>
          <fieldset className="min-w-0">
            <legend className={LEGEND}>Kinh nghiệm</legend>
            {experience.length === 0 ? (
              <p className="text-sm text-page-muted">Chưa có kinh nghiệm nào. Không sao, bạn vẫn có thể ứng tuyển việc phổ thông.</p>
            ) : (
              <ul className="divide-y divide-page-line">
                {experience.map((x) => (
                  <li key={x.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="font-medium text-page-fg">{x.title}</p>
                      <p className="text-sm text-page-muted">{x.company} · {x.period}</p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Xóa kinh nghiệm ${x.title} tại ${x.company}`}
                      onClick={() => { setSaved(false); setExperience(experience.filter((e) => e !== x)) }}
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-page-muted transition-colors duration-300 hover:text-page-fg ${FOCUS}`}
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>
        </Panel>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button type="submit" className={`rounded-full bg-page-fg px-5 py-2.5 text-sm font-medium text-page-bg ${FOCUS}`}>
          Lưu hồ sơ
        </button>
        <p role="status" className="text-sm text-page-muted">{saved ? 'Đã lưu trên trình duyệt này' : ''}</p>
      </div>
      <div className="mt-4"><MockNotice /></div>
    </form>
  )
}
