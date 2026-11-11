import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Lock, X } from 'lucide-react'
import { gsap } from '@utils/gsap'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { useCurtainNavigate } from '@components/motion/PageCurtain'
import { JOB_TYPES } from '@constants/index'
import { DAY_SHORT, SESSIONS } from '@pages/jobseeker/mockData'
import { createJob, DURATION_DAYS, updateJob, type DurationDays } from '@services/catalogService'
import { apiErrorMessage } from '@services/authService'
import { useCatalogStore } from '@context/catalogStore'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import type { JobType } from '@/types'
import { CANDIDATES, MATCH_JOBS, useCandidates } from './match/data'
import { useCompanyStore } from '@context/companyStore'
import { scoreMatch } from './match/score'
import ShiftGrid from './post/ShiftGrid'
import CompletionRing from '@components/common/CompletionRing'
import PostPreview from './post/PostPreview'
import { BTN_ACCENT, BTN_LG, CHIP, CHIP_OFF, CHIP_ON } from '@utils/ui'

const DISTRICTS = ['Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn', 'Liên Chiểu', 'Cẩm Lệ']
const SUGGESTED = [...new Set(CANDIDATES.flatMap((c) => c.criteria.skills))].sort((a, b) => a.localeCompare(b, 'vi'))
const PHOTOS = MATCH_JOBS.slice(0, 6).map((j) => j.photo)
const MATCH_MIN = 60
// Ô nhập kính: nền ngà trong suốt + nhòe phía sau, viền giữ page-edge để đủ tương phản (WCAG 1.4.11)
const INPUT = `w-full rounded-control border border-page-edge bg-[color-mix(in_srgb,var(--wm-ivory)_55%,transparent)] backdrop-blur-md px-3 py-2 text-sm text-page-fg ${FOCUS}`
const chip = (on: boolean) => cn(CHIP, on ? CHIP_ON : CHIP_OFF)

/** Chip bật lên thì "nảy" nhẹ; giảm chuyển động thì bỏ qua */
function pop(el: HTMLElement, reduced: boolean) {
  if (reduced) return
  gsap.fromTo(el, { scale: 0.94 }, { scale: 1, duration: 0.3, ease: 'back.out(3)', overwrite: 'auto' })
}

function Group({ title, index, children }: { title: string; index: number; children: ReactNode }) {
  return (
    // Thẻ kính; legend thả nổi (float) để nằm trong thẻ thay vì cắt ngang viền
    <fieldset className="glass-liquid min-w-0 rounded-card p-5 [--glass-alpha:40%]">
      {/* Số thứ tự mờ ở góc phải, chỉ để trang trí */}
      <span aria-hidden="true" className="pointer-events-none absolute right-4 top-2 select-none font-display text-5xl font-semibold leading-none text-page-line">
        {String(index).padStart(2, '0')}
      </span>
      <legend className="float-left mb-4 w-full pr-16 text-sm font-medium text-page-fg">{title}</legend>
      <div className="clear-both space-y-4">{children}</div>
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

/** /dang-tin — NTD soạn tin, xem trước và số ứng viên phù hợp theo thời gian thực (tin gửi đi chờ quản trị viên duyệt). */
export default function PostJobPage() {
  const curtainTo = useCurtainNavigate()
  // Chế độ sửa: /dang-tin?sua=<id>, chỉ nhận tin đã đăng của công ty demo; id lạ hoặc tin có sẵn thì rơi về đăng tin mới
  const editId = useSearchParams()[0].get('sua')
  const [editing] = useState(() =>
    editId ? useCatalogStore.getState().jobs.find((j) => j.id === editId && j.companyId === useCompanyStore.getState().id) : undefined,
  )
  const [title, setTitle] = useState(editing?.title ?? '')
  const [jobType, setJobType] = useState<JobType | ''>(editing?.jobType ?? '')
  const [district, setDistrict] = useState(editing?.district ?? DISTRICTS[0])
  const [headcount, setHeadcount] = useState(editing?.quantity ?? 1)
  const [minK, setMinK] = useState(editing?.salaryMinK ?? 28)
  const [maxK, setMaxK] = useState(editing?.salaryMaxK ?? 32)
  const [slots, setSlots] = useState<string[]>(editing?.slots ?? [])
  const [skills, setSkills] = useState<string[]>(editing?.skills ?? [])
  // Kỹ năng bắt buộc chỉ tính những cái còn được chọn
  const [requiredPick, setRequiredPick] = useState<string[]>(editing?.requiredSkills ?? [])
  const requiredSkills = skills.filter((s) => requiredPick.includes(s))
  const [requireAllSlots, setRequireAllSlots] = useState(editing?.requireAllSlots ?? false)
  const [custom, setCustom] = useState('')
  // Bán kính mặc định lấy từ Cấu hình hệ thống
  const [radius, setRadius] = useState(() => editing?.radiusKm ?? useCatalogStore.getState().config.defaultRadiusKm)
  // Sửa tin: mặc định giữ hạn cũ (0); chọn số ngày = gia hạn tính từ hôm nay
  const [duration, setDuration] = useState<DurationDays | 0>(editing ? 0 : 30)
  const [desc, setDesc] = useState(editing?.description ?? '')
  const [photoIndex, setPhotoIndex] = useState(() => Math.max(0, PHOTOS.findIndex((p) => p.id === editing?.photo.id)))
  const [posted, setPosted] = useState(false)
  const card = useRef<HTMLDivElement>(null)
  const timer = useRef<number>()
  const reduced = useReducedMotion()
  const submitBtn = useRef<HTMLButtonElement>(null)
  const wasReady = useRef<boolean | null>(null)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const salaryLabel = minK === maxK ? `${minK}.000đ/giờ` : `${minK}.000–${maxK}.000đ/giờ`
  const req = { skills, requiredSkills, requireAllSlots, slots, salaryMinK: minK, salaryMaxK: maxK, jobType: (jobType || 'part-time') as JobType }

  // Bỏ chọn một kỹ năng thì bỏ luôn dấu bắt buộc, để chọn lại không tự thành bắt buộc
  const removeSkill = (s: string) => {
    setSkills(skills.filter((x) => x !== s))
    setRequiredPick(requiredPick.filter((x) => x !== s))
  }

  const addSkill = (s: string) => {
    const v = s.trim()
    if (v && !skills.some((x) => x.toLowerCase() === v.toLowerCase())) setSkills([...skills, v])
  }

  const candidates = useCandidates()
  const companyName = useCompanyStore((s) => s.profile.name)
  // Chấm mọi ứng viên (bỏ trùng tên, bỏ người xa quá gấp đôi bán kính), đếm người từ 60%
  const { matched, total, top } = useMemo(() => {
    const seen = new Set<string>()
    const list = candidates.filter((c) => !seen.has(c.name) && seen.add(c.name) && c.distanceKm <= radius * 2).map((c) => ({
      name: c.name,
      score: scoreMatch(c.criteria, req, c.distanceKm).score,
    }))
    const ok = list.filter((x) => x.score >= MATCH_MIN).sort((a, b) => b.score - a.score)
    return { matched: ok.length, total: list.length, top: ok.slice(0, 3) }
  }, [candidates, skills, requiredPick, requireAllSlots, slots, minK, maxK, jobType, radius])

  const missing = [!title.trim() && 'tên vị trí', !jobType && 'hình thức', slots.length === 0 && 'ít nhất một ca', skills.length === 0 && 'ít nhất một kỹ năng'].filter(Boolean)
  const ready = missing.length === 0
  const filled = 4 - missing.length

  // Vừa đủ 4 mục bắt buộc thì nút gửi nảy một lần (không nảy khi mở trang đã đủ sẵn)
  useEffect(() => {
    const was = wasReady.current
    wasReady.current = ready
    if (!ready || was !== false || reduced || !submitBtn.current) return
    const t = gsap.fromTo(submitBtn.current, { scale: 1 }, { keyframes: { scale: [1, 1.07, 1] }, duration: 0.5, ease: 'power2.out' })
    return () => { t.kill() }
  }, [ready, reduced])

  const submit = async () => {
    if (!ready || posted) return
    setPosted(true)
    // Thẻ xem trước nhấc lên; dùng y/scale để không đụng tween x của con dấu
    if (!reduced && card.current) gsap.to(card.current, { y: -12, scale: 1.02, duration: 0.4, ease: 'power2.out', overwrite: false })
    // Gửi lên máy chủ (khoảng cách do máy chủ tính theo quận)
    const fields = {
      title: title.trim(), district, salaryLabel, shiftLabel: scheduleText(slots),
      skills, requiredSkills, requireAllSlots, slots, salaryMinK: minK, salaryMaxK: maxK, jobType: req.jobType, photo: PHOTOS[photoIndex],
      description: desc.trim(), quantity: headcount, radiusKm: radius,
      ...(duration ? { durationDays: duration } : {}),
    }
    // Sửa tin: lưu đè, tin quay lại hàng chờ duyệt rồi về danh sách tin (không sang /match)
    // Máy chủ từ chối (thiếu quyền, dữ liệu sai…) → báo lỗi, cho bấm lại
    const fail = (err: unknown) => {
      if (card.current) gsap.to(card.current, { y: 0, scale: 1, duration: reduced ? 0 : 0.3 })
      toast.error(apiErrorMessage(err, 'Chưa gửi được tin, vui lòng thử lại.'))
      setPosted(false)
    }
    if (editing) {
      try {
        await updateJob(editing.id, { ...fields, jobType: fields.jobType as JobType })
      } catch (err) {
        fail(err)
        return
      }
      toast.success('Đã lưu, tin chờ quản trị viên duyệt lại')
      timer.current = window.setTimeout(() => curtainTo('/tuyen-dung/tin-dang', 'Tin tuyển dụng'), 600)
      return
    }
    // Gửi vào hàng chờ duyệt của quản trị viên; tin chỉ hiện công khai sau khi được duyệt
    try {
      await createJob({ ...fields, jobType: fields.jobType as JobType })
    } catch (err) {
      fail(err)
      return
    }
    toast.success('Tin đã gửi, chờ quản trị viên duyệt')
    timer.current = window.setTimeout(() => curtainTo('/tuyen-dung/tin-dang', 'Tin tuyển dụng'), 600)
  }

  return (
    <div className="shell py-section-sm">
      <h1 className="mb-8 font-display text-display-sm font-semibold text-page-fg">
        {editing ? 'Sửa tin tuyển dụng' : 'Đăng tin tuyển dụng'}
      </h1>

      <div className="relative isolate grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Ánh màu của ảnh minh họa đang chọn, nhòe mạnh sau cột form → kính có thứ để "lọc" */}
        <img
          src={`https://images.unsplash.com/photo-${PHOTOS[photoIndex].id}?w=160&q=60&auto=format&fit=crop`}
          alt=""
          aria-hidden
          className="pointer-events-none absolute left-0 top-24 -z-10 h-[70%] w-full object-cover opacity-30 blur-[90px] saturate-150 lg:w-[58%]"
        />
        <form className="space-y-5 lg:col-span-7 lg:grid lg:grid-cols-[4.5rem_minmax(0,1fr)] lg:gap-6 lg:space-y-0" onSubmit={(e) => { e.preventDefault(); submit() }}>
          {/* Vòng tiến độ: cột trái riêng ở lg (dính, không đè form); mobile nằm đầu cột, không dính */}
          <CompletionRing value={filled} max={4} label="Số mục bắt buộc đã điền" center={`${filled}/4`} caption="mục bắt buộc" rowText={`Đã điền ${filled}/4 mục bắt buộc`} />
          <div className="min-w-0 space-y-5">

          <Group title="Thông tin chung" index={1}>
            <div>
              <label htmlFor="pj-title" className="mb-1 block text-sm text-page-muted">Tên vị trí *</label>
              <input id="pj-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: Pha chế ca tối" className={INPUT} />
            </div>
            <div role="group" aria-label="Hình thức *">
              <p className="mb-2 text-sm text-page-muted">Hình thức *</p>
              <div className="flex flex-wrap gap-2">
                {JOB_TYPES.map((t) => (
                  <button key={t.value} type="button" aria-pressed={jobType === t.value} onClick={(e) => { if (jobType !== t.value) pop(e.currentTarget, reduced); setJobType(t.value) }} className={chip(jobType === t.value)}>
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

          <Group title="Mức lương" index={2}>
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

          <Group title="Ca làm *" index={3}>
            <p className="text-sm text-page-muted">Bấm hoặc kéo để tô nhiều ô. Ô đậm là ca cần người.</p>
            <ShiftGrid value={slots} onChange={setSlots} />
            <label className="flex items-start gap-2.5 text-sm text-page-fg">
              <input
                type="checkbox"
                checked={requireAllSlots}
                onChange={(e) => setRequireAllSlots(e.target.checked)}
                className={`mt-0.5 h-4 w-4 accent-page-fg ${FOCUS}`}
              />
              <span>
                Bắt buộc rảnh đủ mọi ca
                <span className="block text-page-muted">Ứng viên thiếu ca nào sẽ bị xếp ở mức chưa phù hợp.</span>
              </span>
            </label>
          </Group>

          <Group title="Kỹ năng *" index={4}>
            <div className="flex flex-wrap gap-2">
              {[...SUGGESTED, ...skills.filter((s) => !SUGGESTED.includes(s))].map((s) => {
                const on = skills.includes(s)
                return (
                  <button key={s} type="button" aria-pressed={on} onClick={(e) => { if (!on) pop(e.currentTarget, reduced); if (on) removeSkill(s); else setSkills([...skills, s]) }} className={chip(on)}>
                    {s}
                    {on && !SUGGESTED.includes(s) && <X className="ml-1.5 inline h-3.5 w-3.5" aria-label="Bỏ kỹ năng" />}
                  </button>
                )
              })}
            </div>
            {skills.length > 0 && (
              <div role="group" aria-labelledby="pj-required">
                <p id="pj-required" className="mb-2 text-sm text-page-muted">
                  Kỹ năng nào là bắt buộc? Bấm để đánh dấu — ứng viên thiếu sẽ bị xếp ở mức chưa phù hợp (tối đa 39%). Còn lại là ưu tiên, thiếu chỉ bị trừ điểm.
                </p>
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => {
                    const on = requiredSkills.includes(s)
                    return (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={on}
                        onClick={() => setRequiredPick(on ? requiredPick.filter((x) => x !== s) : [...requiredPick, s])}
                        className={cn(CHIP, 'min-h-11 py-1.5 text-xs', on ? CHIP_ON : cn(CHIP_OFF, 'border-dashed border-page-edge'))}
                      >
                        {on && <Lock className="h-3 w-3" aria-hidden="true" />}
                        {s}
                        <span className="sr-only">{on ? ' (bắt buộc)' : ' (ưu tiên)'}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
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

          <Group title="Bán kính & thời hạn" index={5}>
            <label className="block text-sm text-page-muted">
              Ứng viên trong vòng <span className="tnum text-page-fg">{radius}</span> km
              <input type="range" min={1} max={15} value={radius} onChange={(e) => setRadius(Number(e.target.value))} className={`mt-2 w-full accent-page-fg ${FOCUS}`} />
            </label>
            <div>
              <label htmlFor="pj-duration" className="mb-1 block text-sm text-page-muted">Nhận ứng viên trong</label>
              <select id="pj-duration" value={duration} onChange={(e) => setDuration(Number(e.target.value) as DurationDays | 0)} className={INPUT}>
                {editing && (
                  <option value={0}>
                    {editing.expiresAt ? `Giữ hạn hiện tại (${new Date(editing.expiresAt).toLocaleDateString('vi-VN')})` : 'Giữ nguyên (không hết hạn)'}
                  </option>
                )}
                {DURATION_DAYS.map((d) => <option key={d} value={d}>{d} ngày{editing ? ' kể từ hôm nay' : ''}</option>)}
              </select>
              <p className="mt-1 text-xs text-page-muted">Hết hạn thì tin tự đóng. Mở lại tin trong mục Tin tuyển dụng để gia hạn thêm 30 ngày.</p>
            </div>
          </Group>

          <Group title="Mô tả ngắn" index={6}>
            <label htmlFor="pj-desc" className="sr-only">Mô tả ngắn</label>
            <textarea id="pj-desc" rows={3} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Tùy chọn: vài dòng về công việc, môi trường làm việc" className={INPUT} />
          </Group>

          <Group title="Ảnh minh họa" index={7}>
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
              ref={submitBtn}
              disabled={!ready || posted}
              className={cn(BTN_ACCENT, BTN_LG)}
            >
              {editing ? 'Lưu thay đổi' : 'Đăng tin'}
            </button>
            {editing && <p className="mt-3 text-sm text-page-muted">Sau khi sửa, tin sẽ chờ quản trị viên duyệt lại.</p>}
            <p className="mt-3 text-sm text-page-muted" aria-live="polite">
              {ready ? (editing ? 'Sẵn sàng lưu.' : 'Sẵn sàng. Tin sẽ được gửi cho quản trị viên duyệt trước khi hiện công khai.') : `Còn thiếu: ${missing.join(', ')}.`}
            </p>
          </div>
          </div>
        </form>

        <aside className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start" aria-label="Xem trước tin">
          <PostPreview
            ref={card}
            photos={PHOTOS}
            photoIndex={photoIndex}
            title={title.trim()}
            subtitle={`${companyName || 'Công ty của bạn'} · ${district} · ${salaryLabel}${headcount > 1 ? ` · cần ${headcount} người` : ''}`}
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
