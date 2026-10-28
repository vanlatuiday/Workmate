import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'
import TextReveal from '@components/motion/TextReveal'
import { usePageEnterDelay } from '@components/motion/PageTransition'
import { useCurtainNavigate } from '@components/motion/PageCurtain'
import { JOB_TYPES } from '@constants/index'
import { DAY_SHORT, SESSIONS } from '@pages/jobseeker/mockData'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import type { JobType } from '@/types'
import { CANDIDATES, MATCH_JOBS, type MatchPosition } from './match/data'
import { scoreMatch } from './match/score'
import { COMPANY } from './personal/companyData'
import ShiftGrid from './post/ShiftGrid'
import PostPreview from './post/PostPreview'

const DISTRICTS = ['Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn', 'Liên Chiểu', 'Cẩm Lệ']
const SUGGESTED = [...new Set(CANDIDATES.flatMap((c) => c.criteria.skills))].sort((a, b) => a.localeCompare(b, 'vi'))
const PHOTOS = MATCH_JOBS.slice(0, 6).map((j) => j.photo)
const MATCH_MIN = 60
const INPUT = `w-full rounded-control border border-page-edge bg-page-surface px-3 py-2 text-sm text-page-fg ${FOCUS}`
const chip = (on: boolean) =>
  cn(
    'rounded-full border px-4 py-2 text-sm transition-colors duration-200',
    on ? 'border-page-fg bg-page-fg text-page-bg' : 'border-page-line text-page-fg hover:border-page-fg',
    FOCUS,
  )

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-card border border-page-line p-5">
      <legend className="px-2 text-sm font-medium text-page-fg">{title}</legend>
      <div className="space-y-4">{children}</div>
    </fieldset>
  )
}

/** Tóm tắt ca: "T2 sáng+tối, T3 tối" */
function scheduleText(slots: string[]) {
  return DAY_SHORT.map((d, di) => {
    const ss = SESSIONS.filter((_, si) => slots.includes(`${di}-${si}`)).map((s) => s.toLowerCase())
    return ss.length ? `${d} ${ss.join('+')}` : ''
  }).filter(Boolean).join(', ')
}

/** /dang-tin — NTD soạn tin, xem trước và số ứng viên phù hợp theo thời gian thực (dữ liệu mẫu, không lưu). */
export default function PostJobPage() {
  const delay = usePageEnterDelay()
  const curtainTo = useCurtainNavigate()
  const [title, setTitle] = useState('')
  const [jobType, setJobType] = useState<JobType | ''>('')
  const [district, setDistrict] = useState(DISTRICTS[0])
  const [headcount, setHeadcount] = useState(1)
  const [minK, setMinK] = useState(28)
  const [maxK, setMaxK] = useState(32)
  const [slots, setSlots] = useState<string[]>([])
  const [skills, setSkills] = useState<string[]>([])
  const [custom, setCustom] = useState('')
  const [radius, setRadius] = useState(8)
  const [desc, setDesc] = useState('')
  const [photoIndex, setPhotoIndex] = useState(0)
  const [posted, setPosted] = useState(false)
  const card = useRef<HTMLDivElement>(null)
  const timer = useRef<number>()
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const salaryLabel = minK === maxK ? `${minK}.000đ/giờ` : `${minK}.000–${maxK}.000đ/giờ`
  const typeLabel = JOB_TYPES.find((t) => t.value === jobType)?.label ?? ''
  const req = { skills, slots, salaryMinK: minK, salaryMaxK: maxK, jobType: (jobType || 'part-time') as JobType }

  const addSkill = (s: string) => {
    const v = s.trim()
    if (v && !skills.some((x) => x.toLowerCase() === v.toLowerCase())) setSkills([...skills, v])
  }

  // Chấm mọi ứng viên (bỏ trùng tên, bỏ người xa quá gấp đôi bán kính), đếm người từ 60%
  const { matched, total, top } = useMemo(() => {
    const seen = new Set<string>()
    const list = CANDIDATES.filter((c) => !seen.has(c.name) && seen.add(c.name) && c.distanceKm <= radius * 2).map((c) => ({
      name: c.name,
      score: scoreMatch(c.criteria, req, c.distanceKm).score,
    }))
    const ok = list.filter((x) => x.score >= MATCH_MIN).sort((a, b) => b.score - a.score)
    return { matched: ok.length, total: list.length, top: ok.slice(0, 3) }
  }, [skills, slots, minK, maxK, jobType, radius])

  const missing = [!title.trim() && 'tên vị trí', !jobType && 'hình thức', slots.length === 0 && 'ít nhất một ca', skills.length === 0 && 'ít nhất một kỹ năng'].filter(Boolean)
  const ready = missing.length === 0

  const submit = () => {
    if (!ready || posted) return
    const draft: MatchPosition = {
      id: 'draft',
      job: {
        id: 'draft', title: title.trim(), jobType: typeLabel, schedule: scheduleText(slots), salary: salaryLabel,
        postedAt: '', views: 0, suggested: 0, matches: 0, status: 'open',
      },
      req,
      radiusKm: radius,
    }
    setPosted(true)
    timer.current = window.setTimeout(() => curtainTo('/match', title.trim(), { draftPosition: draft }), 600)
  }

  return (
    <div className="shell py-section-sm">
      <p className="eyebrow text-page-muted"><span className="h-px w-8 bg-page-line" />Đăng tin</p>
      <TextReveal
        as="h1"
        immediate
        delay={delay}
        text="Tin mới, ứng viên hợp ngay khi bạn soạn"
        className="mt-6 max-w-[20ch] font-display text-display-md font-semibold text-page-fg"
      />
      <p className="mt-4 max-w-xl text-page-muted">Điền thông tin bên trái, bên phải cho thấy tin hiển thị ra sao và có bao nhiêu ứng viên đang hợp.</p>

      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        <form className="space-y-5 lg:col-span-7" onSubmit={(e) => { e.preventDefault(); submit() }}>
          <Group title="Thông tin chung">
            <div>
              <label htmlFor="pj-title" className="mb-1 block text-sm text-page-muted">Tên vị trí *</label>
              <input id="pj-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: Pha chế ca tối" className={INPUT} />
            </div>
            <div role="group" aria-label="Hình thức *">
              <p className="mb-2 text-sm text-page-muted">Hình thức *</p>
              <div className="flex flex-wrap gap-2">
                {JOB_TYPES.map((t) => (
                  <button key={t.value} type="button" aria-pressed={jobType === t.value} onClick={() => setJobType(t.value)} className={chip(jobType === t.value)}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="pj-district" className="mb-1 block text-sm text-page-muted">Khu vực</label>
                <select id="pj-district" value={district} onChange={(e) => setDistrict(e.target.value)} className={INPUT}>
                  {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="pj-count" className="mb-1 block text-sm text-page-muted">Số lượng cần (1–20)</label>
                <input id="pj-count" type="number" min={1} max={20} value={headcount} onChange={(e) => setHeadcount(Math.min(20, Math.max(1, Number(e.target.value) || 1)))} className={`${INPUT} tnum`} />
              </div>
            </div>
          </Group>

          <Group title="Mức lương">
            <p className="tnum text-sm text-page-fg">{salaryLabel}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm text-page-muted">
                Từ {minK}.000đ
                <input type="range" min={15} max={80} value={minK} onChange={(e) => { const v = Number(e.target.value); setMinK(v); if (v > maxK) setMaxK(v) }} className={`mt-2 w-full accent-page-fg ${FOCUS}`} />
              </label>
              <label className="block text-sm text-page-muted">
                Đến {maxK}.000đ
                <input type="range" min={15} max={80} value={maxK} onChange={(e) => { const v = Number(e.target.value); setMaxK(v); if (v < minK) setMinK(v) }} className={`mt-2 w-full accent-page-fg ${FOCUS}`} />
              </label>
            </div>
          </Group>

          <Group title="Ca làm *">
            <p className="text-sm text-page-muted">Bấm hoặc kéo để tô nhiều ô. Ô đậm là ca cần người.</p>
            <ShiftGrid value={slots} onChange={setSlots} />
          </Group>

          <Group title="Kỹ năng *">
            <div className="flex flex-wrap gap-2">
              {[...SUGGESTED, ...skills.filter((s) => !SUGGESTED.includes(s))].map((s) => {
                const on = skills.includes(s)
                return (
                  <button key={s} type="button" aria-pressed={on} onClick={() => setSkills(on ? skills.filter((x) => x !== s) : [...skills, s])} className={chip(on)}>
                    {s}
                    {on && !SUGGESTED.includes(s) && <X className="ml-1.5 inline h-3.5 w-3.5" aria-label="Bỏ kỹ năng" />}
                  </button>
                )
              })}
            </div>
            <div>
              <label htmlFor="pj-skill" className="mb-1 block text-sm text-page-muted">Thêm kỹ năng khác (Enter để thêm)</label>
              <input
                id="pj-skill"
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(custom); setCustom('') } }}
                className={INPUT}
              />
            </div>
          </Group>

          <Group title="Bán kính tuyển">
            <label className="block text-sm text-page-muted">
              Ứng viên trong vòng <span className="tnum text-page-fg">{radius}</span> km
              <input type="range" min={1} max={15} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className={`mt-2 w-full accent-page-fg ${FOCUS}`} />
            </label>
          </Group>

          <Group title="Mô tả ngắn">
            <label htmlFor="pj-desc" className="sr-only">Mô tả ngắn</label>
            <textarea id="pj-desc" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Tùy chọn: vài dòng về công việc, môi trường làm việc" className={INPUT} />
          </Group>

          <Group title="Ảnh minh họa">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {PHOTOS.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={photoIndex === i}
                  aria-label={`Chọn ảnh: ${p.alt}`}
                  onClick={() => setPhotoIndex(i)}
                  className={cn('aspect-square overflow-hidden rounded-control border-2 transition-colors', photoIndex === i ? 'border-page-fg' : 'border-transparent', FOCUS)}
                >
                  <img src={`https://images.unsplash.com/photo-${p.id}?w=200&q=70&auto=format&fit=crop`} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </Group>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!ready || posted}
              className={`rounded-full bg-page-fg px-8 py-4 text-sm font-medium text-page-bg transition-opacity disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`}
            >
              Đăng tin
            </button>
            <p className="mt-3 text-sm text-page-muted" aria-live="polite">
              {ready ? 'Sẵn sàng. Tin chỉ để xem thử, chưa được lưu.' : `Còn thiếu: ${missing.join(', ')}.`}
            </p>
          </div>
        </form>

        <aside className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start" aria-label="Xem trước tin">
          <PostPreview
            ref={card}
            photos={PHOTOS}
            photoIndex={photoIndex}
            title={title.trim()}
            subtitle={`${COMPANY.name || 'Công ty của bạn'} · ${district} · ${salaryLabel}${headcount > 1 ? ` · cần ${headcount} người` : ''}`}
            count={matched}
            total={total}
            top={top}
            posted={posted}
          />
        </aside>
      </div>
    </div>
  )
}
