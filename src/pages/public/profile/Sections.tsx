import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { JOB_TYPES } from '@constants/index'
import { DAY_SHORT, SESSIONS } from '@pages/jobseeker/mockData'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import ChapterShell from './ChapterShell'
import { fmtMoney, type ProfileApi } from './useProfileDraft'

const INPUT = `w-full rounded-control border border-page-edge bg-page-surface px-3 py-2 text-sm text-page-fg ${FOCUS}`

/** Khối ② — Lịch rảnh: lưới 7 ngày × 3 buổi. */
export function AvailabilityChapter({ api }: { api: ProfileApi }) {
  const { profile, toggleCell } = api
  return (
    <ChapterShell no="02" title="Lịch rảnh" area="lg:col-start-1 lg:col-span-4 lg:row-start-3 lg:row-span-4">
      {(editing) => (
        <div>
          <p className="mb-2 text-page-muted">
            {editing ? 'Bấm vào ô để bật/tắt ca bạn rảnh.' : `${profile.availability.length} ca rảnh mỗi tuần.`}
          </p>
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
                      type="button"
                      disabled={!editing}
                      aria-pressed={on}
                      aria-label={`${d} ${s}`}
                      onClick={() => toggleCell(key)}
                      className={`h-7 rounded-control border transition-colors duration-200 disabled:cursor-default ${FOCUS} ${
                        on ? 'border-page-fg bg-page-fg' : `border-page-line bg-page-surface ${editing ? 'hover:border-page-fg' : ''}`
                      }`}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </ChapterShell>
  )
}

/** Khối ③ — Kỹ năng. */
export function SkillsChapter({ api }: { api: ProfileApi }) {
  const { profile, addSkill, removeSkill } = api
  const [draft, setDraft] = useState('')
  const add = () => { addSkill(draft); setDraft('') }
  return (
    <ChapterShell no="03" title="Kỹ năng" area="lg:col-start-6 lg:col-span-3 lg:row-start-1 lg:row-span-2">
      {(editing) => (
        <div>
          <ul className="flex flex-wrap gap-2">
            {profile.skills.map((s) => (
              <li key={s} className="flex items-center gap-1 rounded-full border border-page-edge px-3 py-1 text-sm text-page-fg">
                {s}
                {editing && (
                  <button type="button" onClick={() => removeSkill(s)} aria-label={`Bỏ kỹ năng ${s}`} className={`-mr-1.5 rounded-full p-1 ${FOCUS}`}>
                    <X className="h-3.5 w-3.5" aria-hidden />
                  </button>
                )}
              </li>
            ))}
            {!profile.skills.length && <li className="text-page-muted">Chưa có kỹ năng nào.</li>}
          </ul>
          {editing && (
            <form className="mt-4 flex max-w-md gap-2" onSubmit={(e) => { e.preventDefault(); add() }}>
              <label htmlFor="pf-skill" className="sr-only">Thêm kỹ năng</label>
              <input id="pf-skill" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ví dụ: Thu ngân" className={INPUT} />
              <button type="submit" className={`flex shrink-0 items-center gap-1 rounded-full border border-page-edge px-4 text-sm text-page-fg hover:border-page-fg ${FOCUS}`}>
                <Plus className="h-4 w-4" aria-hidden />Thêm
              </button>
            </form>
          )}
        </div>
      )}
    </ChapterShell>
  )
}

/** Khối ④ — Kinh nghiệm: đường thời gian dọc. */
export function ExperienceChapter({ api }: { api: ProfileApi }) {
  const { profile, addExperience, updateExperience, removeExperience } = api
  return (
    <ChapterShell no="04" title="Kinh nghiệm" area="lg:col-start-9 lg:col-span-4 lg:row-start-1 lg:row-span-4">
      {(editing) => (
        <div>
          {/* Đường thời gian dọc: vạch + mốc */}
          <ol className="relative ml-2 space-y-5 pl-6">
            <span aria-hidden className="absolute bottom-2 left-0 top-2 w-px bg-page-line" />
            {profile.experience.map((e, i) => (
              <li key={e.id} className="relative">
                <span aria-hidden className="absolute -left-6 top-1.5 h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-page-fg bg-page-bg" />
                {editing ? (
                  <div className="grid max-w-xl gap-2 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label htmlFor={`kn-t-${i}`} className="sr-only">Chức danh</label>
                      <input id={`kn-t-${i}`} value={e.title} placeholder="Chức danh" onChange={(ev) => updateExperience(e.id, { title: ev.target.value })} className={INPUT} />
                    </div>
                    <div>
                      <label htmlFor={`kn-c-${i}`} className="sr-only">Nơi làm</label>
                      <input id={`kn-c-${i}`} value={e.company} placeholder="Nơi làm" onChange={(ev) => updateExperience(e.id, { company: ev.target.value })} className={INPUT} />
                    </div>
                    <div className="flex gap-2">
                      <label htmlFor={`kn-p-${i}`} className="sr-only">Thời gian</label>
                      <input id={`kn-p-${i}`} value={e.period} placeholder="Thời gian" onChange={(ev) => updateExperience(e.id, { period: ev.target.value })} className={INPUT} />
                      <button type="button" onClick={() => removeExperience(e.id)} aria-label={`Xóa mục ${e.title || 'kinh nghiệm'}`} className={`shrink-0 rounded-full border border-page-edge p-2 text-page-fg hover:border-page-fg ${FOCUS}`}>
                        <X className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-base font-semibold text-page-fg">{e.title || 'Chưa đặt tên'}</p>
                    <p className="text-page-muted">{[e.company, e.period].filter(Boolean).join(' · ')}</p>
                  </div>
                )}
              </li>
            ))}
            {!profile.experience.length && <li className="text-page-muted">Chưa có kinh nghiệm nào.</li>}
          </ol>
          {editing && (
            <button type="button" onClick={addExperience} className={`mt-5 flex items-center gap-1 rounded-full border border-page-edge px-4 py-1.5 text-sm text-page-fg hover:border-page-fg ${FOCUS}`}>
              <Plus className="h-4 w-4" aria-hidden />Thêm kinh nghiệm
            </button>
          )}
        </div>
      )}
    </ChapterShell>
  )
}

/** Khối ⑤ — Mong muốn: lương, khoảng cách, loại việc, khu vực. */
export function WantsChapter({ api }: { api: ProfileApi }) {
  const { profile, set, toggleJobType } = api
  return (
    <ChapterShell no="05" title="Mong muốn" area="lg:col-start-5 lg:col-span-4 lg:row-start-4 lg:row-span-3">
      {(editing) => (
        <div className="space-y-4">
          <div>
            <label htmlFor="pf-salary" className="mb-1 block text-page-muted">
              Lương tối thiểu: <span className="text-page-fg">{fmtMoney(profile.salaryMin)}/giờ</span>
            </label>
            <input id="pf-salary" type="range" min={0} max={100000} step={1000} disabled={!editing}
              value={profile.salaryMin} onChange={(e) => set('salaryMin', Number(e.target.value))}
              className={`w-full max-w-md accent-current ${FOCUS}`} />
          </div>
          <div>
            <label htmlFor="pf-dist" className="mb-1 block text-page-muted">
              Khoảng cách tối đa: <span className="text-page-fg">{profile.maxDistanceKm} km</span>
            </label>
            <input id="pf-dist" type="range" min={1} max={30} step={1} disabled={!editing}
              value={profile.maxDistanceKm} onChange={(e) => set('maxDistanceKm', Number(e.target.value))}
              className={`w-full max-w-md accent-current ${FOCUS}`} />
          </div>
          <div role="group" aria-label="Loại việc">
            <p className="mb-1 text-page-muted">Loại việc</p>
            <div className="flex flex-wrap gap-2">
              {JOB_TYPES.filter((t) => editing || profile.jobTypes.includes(t.value)).map((t) => {
                const on = profile.jobTypes.includes(t.value)
                return (
                  <button key={t.value} type="button" disabled={!editing} aria-pressed={on} onClick={() => toggleJobType(t.value)}
                    className={cn('rounded-full border px-3 py-1 text-sm transition-colors duration-200 disabled:cursor-default', FOCUS,
                      on ? 'border-page-fg bg-page-fg text-page-bg' : 'border-page-line text-page-fg hover:border-page-fg')}>
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label htmlFor="pf-area" className="mb-1 block text-page-muted">Khu vực mong muốn</label>
            {editing ? (
              <input id="pf-area" value={profile.area} onChange={(e) => set('area', e.target.value)} className={`${INPUT} max-w-md`} />
            ) : (
              <p id="pf-area" className="text-page-fg">{profile.area || 'Chưa chọn'}</p>
            )}
          </div>
        </div>
      )}
    </ChapterShell>
  )
}

/** Khối ⑥ — Giới thiệu thêm. */
export function AboutChapter({ api }: { api: ProfileApi }) {
  const { profile, set } = api
  return (
    <ChapterShell no="06" title="Giới thiệu thêm" area="lg:col-start-9 lg:col-span-4 lg:row-start-5 lg:row-span-2">
      {(editing) =>
        editing ? (
          <div>
            <label htmlFor="pf-about" className="sr-only">Giới thiệu thêm</label>
            <textarea id="pf-about" rows={8} value={profile.about} onChange={(e) => set('about', e.target.value)} className={INPUT} />
          </div>
        ) : (
          <p className="whitespace-pre-line leading-relaxed text-page-muted">{profile.about || 'Chưa có nội dung.'}</p>
        )
      }
    </ChapterShell>
  )
}
