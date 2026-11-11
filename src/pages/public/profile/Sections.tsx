import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { JOB_TYPES } from '@constants/index'
import { DAY_SHORT, SESSIONS } from '@pages/jobseeker/mockData'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { BTN_DANGER, BTN_SECONDARY, BTN_SM, CHIP_ON } from '@utils/ui'
import { isFutureStart, tomorrowIso } from '@utils/format'
import PeriodField from './PeriodField'
import { chip, Group, INPUT } from './ui'
import { fmtMoney, type ProfileApi } from './useProfileDraft'

/** Nhóm 02 — Kỹ năng: chip bỏ được + ô thêm. */
export function SkillsChapter({ api }: { api: ProfileApi }) {
  const { profile, addSkill, removeSkill } = api
  const [draft, setDraft] = useState('')
  const add = () => { addSkill(draft); setDraft('') }
  return (
    <Group title="Kỹ năng" index={2}>
      <ul className="flex flex-wrap gap-2">
        {profile.skills.map((s) => (
          <li key={s} className="flex items-center gap-1 rounded-full border border-page-edge py-1 pl-3 pr-1 text-sm text-page-fg">
            {s}
            <button type="button" onClick={() => removeSkill(s)} aria-label={`Bỏ kỹ năng ${s}`} className={`rounded-full p-1 ${FOCUS}`}>
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </li>
        ))}
        {!profile.skills.length && <li className="text-sm text-page-muted">Chưa có kỹ năng nào.</li>}
      </ul>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); add() }}>
        <label htmlFor="pf-skill" className="sr-only">Thêm kỹ năng</label>
        <input id="pf-skill" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ví dụ: Thu ngân (Enter để thêm)" className={INPUT} />
        <button type="submit" className={cn(BTN_SECONDARY, BTN_SM, 'shrink-0')}><Plus className="h-4 w-4" aria-hidden />Thêm</button>
      </form>
    </Group>
  )
}

/** Nhóm 03 — Kinh nghiệm: danh sách dòng sửa trực tiếp. */
export function ExperienceChapter({ api }: { api: ProfileApi }) {
  const { profile, addExperience, updateExperience, removeExperience } = api
  return (
    <Group title="Kinh nghiệm" index={3}>
      {!profile.experience.length && <p className="text-sm text-page-muted">Chưa có kinh nghiệm nào.</p>}
      <ul className="space-y-3">
        {profile.experience.map((e) => (
          <li key={e.id} className="grid gap-2 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor={`kn-t-${e.id}`} className="sr-only">Chức danh</label>
              <input id={`kn-t-${e.id}`} value={e.title} placeholder="Chức danh" onChange={(ev) => updateExperience(e.id, { title: ev.target.value })} className={INPUT} />
            </div>
            <div>
              <label htmlFor={`kn-c-${e.id}`} className="sr-only">Nơi làm</label>
              <input id={`kn-c-${e.id}`} value={e.company} placeholder="Nơi làm" onChange={(ev) => updateExperience(e.id, { company: ev.target.value })} className={INPUT} />
            </div>
            <div className="flex items-start sm:justify-end">
              <button type="button" onClick={() => removeExperience(e.id)} aria-label={`Xóa mục ${e.title || 'kinh nghiệm'}`} className={cn(BTN_DANGER, BTN_SM)}>
                <X className="h-4 w-4" aria-hidden />Xóa mục này
              </button>
            </div>
            <div className="sm:col-span-2">
              <PeriodField id={`kn-p-${e.id}`} value={e.period} onChange={(v) => updateExperience(e.id, { period: v })} />
            </div>
          </li>
        ))}
      </ul>
      <button id="pf-add-exp" type="button" onClick={addExperience} className={cn(BTN_SECONDARY, BTN_SM, 'shrink-0')}><Plus className="h-4 w-4" aria-hidden />Thêm kinh nghiệm</button>
    </Group>
  )
}

/** Nhóm 04 — Lịch rảnh: lưới 7 ngày × 3 buổi. */
export function AvailabilityChapter({ api }: { api: ProfileApi }) {
  const { profile, toggleCell, set } = api
  const later = isFutureStart(profile.availableFrom)
  return (
    <Group title="Lịch rảnh" index={4}>
      <p className="text-sm text-page-muted">Bấm vào ô để bật/tắt ca bạn rảnh. Hiện có {profile.availability.length} ca mỗi tuần.</p>
      <div className="grid grid-cols-[auto_repeat(3,1fr)] gap-1.5" role="group" aria-label="Lịch rảnh trong tuần">
        <span />
        {SESSIONS.map((s) => <span key={s} className="text-center text-xs text-page-muted">{s}</span>)}
        {DAY_SHORT.map((d, di) => (
          <div key={d} className="contents">
            <span className="flex items-center pr-2 text-xs text-page-muted">{d}</span>
            {SESSIONS.map((s, si) => {
              const key = `${di}-${si}`
              const on = profile.availability.includes(key)
              return (
                <button
                  key={key}
                  id={di === 0 && si === 0 ? 'pf-avail' : undefined}
                  type="button"
                  aria-pressed={on}
                  aria-label={`${d} ${s}`}
                  onClick={() => toggleCell(key)}
                  className={`h-8 rounded-control border transition-colors duration-fast motion-reduce:transition-none ${FOCUS} ${
                    on ? CHIP_ON : 'border-page-line bg-page-surface hover:border-page-fg'
                  }`}
                />
              )
            })}
          </div>
        ))}
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm text-page-muted">Có thể bắt đầu</legend>
        <div className="flex flex-wrap gap-2">
          <button type="button" aria-pressed={!later} onClick={() => set('availableFrom', null)} className={chip(!later)}>Bắt đầu ngay</button>
          <button type="button" aria-pressed={later} onClick={() => set('availableFrom', later ? profile.availableFrom : tomorrowIso())} className={chip(later)}>Từ ngày…</button>
        </div>
        {later && (
          <label className="block text-sm text-page-muted">
            <span className="sr-only">Ngày bắt đầu</span>
            <input type="date" min={tomorrowIso()} value={profile.availableFrom ?? ''}
              onChange={(e) => set('availableFrom', e.target.value || null)} className={`${INPUT} sm:w-auto`} />
          </label>
        )}
      </fieldset>
    </Group>
  )
}

/** Nhóm 05 — Mong muốn: lương, khoảng cách, loại việc, khu vực. */
export function WantsChapter({ api }: { api: ProfileApi }) {
  const { profile, set, toggleJobType } = api
  return (
    <Group title="Mong muốn" index={5}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-page-muted">
          Lương tối thiểu: <span className="tnum text-page-fg">{fmtMoney(profile.salaryMin)}/giờ</span>
          <input id="pf-salary" type="range" min={0} max={100000} step={1000} value={profile.salaryMin}
            onChange={(e) => set('salaryMin', Number(e.target.value))} className={`mt-2 w-full accent-page-fg ${FOCUS}`} />
        </label>
        <label className="block text-sm text-page-muted">
          Khoảng cách tối đa: <span className="tnum text-page-fg">{profile.maxDistanceKm} km</span>
          <input id="pf-distance" type="range" min={1} max={30} step={1} value={profile.maxDistanceKm}
            onChange={(e) => set('maxDistanceKm', Number(e.target.value))} className={`mt-2 w-full accent-page-fg ${FOCUS}`} />
        </label>
      </div>
      <div role="group" aria-label="Loại việc">
        <p className="mb-2 text-sm text-page-muted">Loại việc</p>
        <div className="flex flex-wrap gap-2">
          {JOB_TYPES.map((t, ti) => {
            const on = profile.jobTypes.includes(t.value)
            return <button key={t.value} id={ti === 0 ? 'pf-jobtype' : undefined} type="button" aria-pressed={on} onClick={() => toggleJobType(t.value)} className={chip(on)}>{t.label}</button>
          })}
        </div>
      </div>
      <div>
        <label htmlFor="pf-area" className="mb-1 block text-sm text-page-muted">Khu vực mong muốn</label>
        <input id="pf-area" value={profile.area} onChange={(e) => set('area', e.target.value)} className={INPUT} />
      </div>
    </Group>
  )
}

/** Nhóm 06 — Về bạn (giới thiệu thêm). */
export function AboutChapter({ api }: { api: ProfileApi }) {
  const { profile, set } = api
  return (
    <Group title="Về bạn" index={6}>
      <label htmlFor="pf-about" className="sr-only">Giới thiệu thêm</label>
      <textarea id="pf-about" rows={5} value={profile.about} onChange={(e) => set('about', e.target.value)} placeholder="Tùy chọn: vài dòng về bản thân, điều bạn mong muốn ở công việc" className={INPUT} />
    </Group>
  )
}
