import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight, X } from 'lucide-react'

import { useAllJobs, useSeekerOutcomes } from '@pages/public/jobs/catalog'
import { companyOf, useCandidates, type MatchJob } from '@pages/public/match/data'
import { useSeekerCriteria } from '@context/profileStore'
import { useCompanyStore } from '@context/companyStore'
import { useCompanyJobs } from '@services/adminService'
import { expressInterest, ME, usePairStatuses } from '@services/connectionService'
import { photoSrcSet, photoUrl, type Photo } from '@components/discover/types'
import { Flip } from 'gsap/Flip'
import { JOB_TYPES } from '@constants/index'
import { gsap, ScrollTrigger, useGSAP } from '@utils/gsap'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { useMediaQuery } from '@hooks/useMediaQuery'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { PRESS } from '@utils/ui'
import { shiftBoardCopy as copy } from './content'
import { useHomeRole } from './homeData'
import { HOME_GLASS_DARK, LIGHT_CARD_VARS } from './homeBackground'
import { HOME_CATEGORIES, categoryOf, type HomeCategory } from './categories'
import { SESSION_HOURS, shiftsOf, timeRange, type ShiftRow } from './shiftBoard'

// Flip chỉ dùng ở bảng ca nên đăng ký tại chỗ (utils/gsap.ts chỉ giữ ScrollTrigger)
gsap.registerPlugin(Flip)

const PANEL =
  `${LIGHT_CARD_VARS} rounded-card border border-wm-ivory/70 bg-wm-ivory/80 text-page-fg ` +
  'shadow-[0_14px_32px_-20px_var(--wm-night)] backdrop-blur-xl backdrop-saturate-150'

/**
 * Một kiểu phủ chung cho mọi thẻ (chủ dự án 2026-11-20: "như thẻ hôm nay"): nửa dưới thẻ xanh rất đậm `abyss`
 * mờ dần lên trên để lộ ảnh, chữ ngà (≈ 15:1 trên abyss). Buổi của ca chỉ còn thể hiện ở nhãn SÁNG/CHIỀU/TỐI.
 */
const CARD_STYLE = {
  overlay: 'linear-gradient(to top, var(--wm-abyss) 0%, color-mix(in srgb, var(--wm-abyss) 92%, transparent) 40%, transparent 62%)',
  text: 'text-wm-ivory',
  badge: 'bg-wm-ivory text-wm-charcoal',
  fit: 'bg-wm-ivory/20 text-wm-ivory',
  action: 'border-wm-ivory bg-wm-ivory text-wm-charcoal',
}

const ACTION = cn(
  'inline-flex min-h-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-full border px-5 text-sm font-semibold hover:brightness-95 disabled:cursor-default disabled:opacity-70 disabled:hover:brightness-100',
  PRESS,
  FOCUS,
)

/** Nút/liên kết hành động cuối mỗi thẻ, theo vai trò (nổi trên liên kết phủ thẻ) */
function RowAction({ row, role, tone }: { row: ShiftRow; role: 'guest' | 'jobseeker' | 'recruiter'; tone: string }) {
  const status = usePairStatuses('seeker')(row.job.id, ME)
  const title = row.job.title
  if (role === 'recruiter') {
    return (
      <Link to={`/match?job=${encodeURIComponent(row.job.id)}`} className={cn(ACTION, tone)}>
        {copy.recruiter.candidates}
        <span className="sr-only"> cho {title}</span>
      </Link>
    )
  }
  if (role === 'jobseeker') {
    const applied = status !== 'none'
    return (
      <button type="button" disabled={applied} onClick={() => expressInterest('seeker', row.job.id, ME)} className={cn(ACTION, tone)}>
        {applied ? copy.jobseeker.applied : copy.jobseeker.apply}
        <span className="sr-only"> {title}</span>
      </button>
    )
  }
  return (
    <Link to="/dang-ky?role=jobseeker" state={{ from: `/viec-lam/${row.job.id}` }} className={cn(ACTION, tone)}>
      {copy.guest.apply}
      <span className="sr-only"> {title}</span>
    </Link>
  )
}

/** Một dòng doanh nghiệp trong thẻ nghề: ảnh/logo vuông bên trái, chi tiết bên phải */
function CompanyRow({ row, role, score, free }: { row: ShiftRow; role: 'guest' | 'jobseeker' | 'recruiter'; score?: number; free?: number }) {
  const { job } = row
  const company = companyOf(job.companyId)
  const chip = 'tnum whitespace-nowrap rounded-full bg-wm-ivory/15 px-2.5 py-0.5 text-xs font-medium'
  return (
    <li className="flex gap-3 rounded-card bg-wm-ivory/10 p-3">
      <img
        src={company.logoUrl || photoUrl(company.cover.id, 160)}
        alt={company.logoUrl ? `Logo ${company.name}` : company.cover.alt}
        width={56}
        height={56}
        loading="lazy"
        className="h-14 w-14 shrink-0 rounded-control object-cover"
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link to={`/viec-lam/${job.id}`} className={cn('w-fit rounded-control text-base font-bold leading-snug underline-offset-4 hover:underline', FOCUS)}>
          {job.title}
        </Link>
        <p className="text-sm font-medium">{company.name}</p>
        <p className="tnum text-sm">
          {job.salaryLabel} · {job.district} · {String(job.distanceKm).replace('.', ',')} km
        </p>
        <p className="flex flex-wrap gap-1.5">
          <span className={chip}>
            {row.dayLabel} · {SESSION_HOURS[row.session].name} {timeRange(row.session)}
          </span>
          <span className={chip}>{jobTypeLabel(job.jobType)}</span>
          {score !== undefined && <span className={chip}>{copy.fitLabel(Math.round(score))}</span>}
          {free !== undefined && <span className={chip}>{copy.freeLabel(free)}</span>}
        </p>
        <div className="mt-1">
          <RowAction row={row} role={role} tone={CARD_STYLE.action} />
        </div>
      </div>
    </li>
  )
}

/** Một nhóm nghề trên bảng: các ca trong 7 ngày tới + mỗi việc (doanh nghiệp) kèm ca sớm nhất */
interface CategoryGroup {
  cat: HomeCategory & { photo: Photo }
  shifts: number
  companies: number
  earliest: ShiftRow
  /** Mỗi việc một dòng, ca sớm nhất của việc đó */
  jobs: ShiftRow[]
}

const hhmm = (r: ShiftRow) => `${String(SESSION_HOURS[r.session].start).padStart(2, '0')}:00`
const jobTypeLabel = (v: string) => JOB_TYPES.find((t) => t.value === v)?.label ?? v
const DUR = 0.6
const EASE = 'power3.inOut'
/** Khoảng cách giữa các thẻ (px) = gap-4; dùng chung cho CSS và phép tính độ rộng */
const GAP = 16
/** Thẻ mở rộng bằng 2 thẻ + 1 khoảng cách, cộng thêm 12% */
const OPEN_GROW = 1.12
/** Thẻ mở từ độ rộng này (px) thì danh sách doanh nghiệp chia 2 cột */
const TWO_COL_MIN = 720
/** Điện thoại chỉ hiện sẵn ngần này nhóm, còn lại sau nút "Xem thêm nghề" */
const PHONE_FIRST = 6

/**
 * Bảng ca (như bảng giờ bay): các ca sắp tới đang cần người, lấy từ danh mục việc (`useAllJobs`) và
 * khóa ca `${ngày}-${buổi}` của từng việc. "Sắp tới" = buổi chưa kết thúc theo giờ máy trong 7 ngày tới (`now` tính một lần khi mở trang).
 * Khách / quản trị: mọi việc. Người tìm việc: chỉ ca nằm trong lịch rảnh hồ sơ, kèm % hợp (cùng điểm với /viec-lam).
 * Nhà tuyển dụng: ca của tin công ty mình, kèm số ứng viên có lịch rảnh phủ ca đó.
 * Hiển thị: mọi nhóm NGHỀ có ít nhất một ca (xếp việc vào nhóm theo tên việc bằng `categoryOf`), nhiều ca nhất đứng đầu.
 * ≥md: băng chuyền ngang (5 thẻ/≥lg, 3 thẻ/md), cuộn ngang gốc + snap, kéo chuột, nút trước/sau. Bấm một thẻ: thẻ đó nở
 * rộng (GSAP Flip trên hàng flex, các thẻ khác giữ độ rộng, băng chuyền dài ra), rồi băng chuyền cuộn mượt để thấy trọn thẻ.
 * Trong thẻ nở, ảnh trượt ra một bên và danh sách doanh nghiệp trượt vào từ bên kia (thẻ nằm nửa trái băng chuyền: ảnh sang
 * trái, danh sách từ phải; nửa phải ngược lại). <md: accordion dọc, hiện 6 nhóm đầu, còn lại sau nút "Xem thêm nghề".
 * Khoảnh khắc cuộn duy nhất: "ảnh hiện hình" — lần đầu vùng thẻ vào màn hình, ảnh chuyển từ bản in xám nhạt sang màu (1,6 s, một lần).
 * Giảm chuyển động: mở/đóng/cuộn tức thì.
 */
export default function ShiftBoardSection() {
  const role = useHomeRole()
  const text = copy[role]
  const reduced = useReducedMotion()
  const isCarousel = useMediaQuery('(min-width: 768px)')
  const isLg = useMediaQuery('(min-width: 1024px)')
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [now] = useState(() => new Date())
  const [edges, setEdges] = useState({ prev: false, next: false })
  const [trackW, setTrackW] = useState(0)
  const rootRef = useRef<HTMLElement>(null)
  const lastOpen = useRef<string | null>(null)
  const gridRef = useRef<HTMLUListElement>(null)
  /** Hướng ảnh trượt của thẻ đang/vừa mở: -1 = ảnh sang trái (thẻ nằm nửa trái băng chuyền) */
  const dirRef = useRef<-1 | 1>(-1)
  /** Trạng thái Flip chụp trước khi đổi thẻ mở; `animate` = lần đổi này do người dùng bấm (có chuyển động) */
  const flipRef = useRef<{ state: ReturnType<typeof Flip.getState> | null; animate: boolean; focus: 'list' | 'face' | null }>({ state: null, animate: false, focus: null })
  const dragRef = useRef({ moved: false, startX: 0, startLeft: 0, timer: 0 })

  const all = useAllJobs()
  const companyId = useCompanyStore((s) => s.id)
  const companyRows = useCompanyJobs(companyId)
  const seekerSlots = useSeekerCriteria().slots
  const candidates = useCandidates()
  const { outcomeOf } = useSeekerOutcomes()

  const jobs: MatchJob[] = useMemo(
    () => (role === 'recruiter' ? companyRows.filter((r) => r.job.visible).map((r) => r.job) : all),
    [role, companyRows, all],
  )
  const allowed = useMemo(() => (role === 'jobseeker' ? new Set(seekerSlots) : undefined), [role, seekerSlots])
  // Gom các ca trong 7 ngày tới theo nhóm nghề; nhóm nhiều ca hơn đứng trước (hòa thì nhóm có ca sớm hơn)
  const groups = useMemo<CategoryGroup[]>(() => {
    const rows = shiftsOf(jobs, now, allowed)
    const byCat = new Map<string, ShiftRow[]>()
    for (const r of rows) {
      const c = categoryOf(r.job)
      byCat.set(c.key, [...(byCat.get(c.key) ?? []), r])
    }
    return HOME_CATEGORIES.filter((c) => byCat.has(c.key))
      .map<CategoryGroup>((cat) => {
        const list = byCat.get(cat.key)!
        const perJob = new Map<string, ShiftRow>()
        for (const r of list) if (!perJob.has(r.job.id)) perJob.set(r.job.id, r) // rows đã xếp theo giờ nên dòng đầu là ca sớm nhất
        // Nhóm không có ảnh riêng lấy ảnh của việc sớm nhất trong nhóm
        const photo = cat.photo ?? list[0].job.photo
        return { cat: { ...cat, photo }, shifts: list.length, companies: new Set(list.map((r) => r.job.companyId)).size, earliest: list[0], jobs: [...perJob.values()] }
      })
      .sort((a, b) => b.shifts - a.shifts || a.earliest.start.getTime() - b.earliest.start.getTime())
  }, [jobs, now, allowed])
  // Điện thoại: 6 nhóm đầu, "Xem thêm nghề" mở nốt; băng chuyền (≥md) luôn đủ
  const shown = isCarousel || showAll ? groups : groups.slice(0, PHONE_FIRST)
  const groupsSig = shown.map((g) => g.cat.key).join('|')

  // Độ rộng thẻ theo băng chuyền: w = (rộng − (n−1)·gap)/n; thẻ mở = (2w + gap)·1.12
  const perView = isLg ? 5 : 3
  const cardW = trackW > 0 ? (trackW - (perView - 1) * GAP) / perView : 0
  const openW = (2 * cardW + GAP) * OPEN_GROW
  const twoCols = isCarousel && openW >= TWO_COL_MIN

  /** Số ứng viên sẵn sàng đi làm có ca này trong lịch rảnh */
  const freeCount = (slot: string) => candidates.filter((c) => c.availability.kind === 'ready' && c.criteria.slots.includes(slot)).length

  /** Cập nhật nút trước/sau (hết đầu/cuối) và độ rộng băng chuyền */
  const updateEdges = useCallback(() => {
    const el = gridRef.current
    if (!el || !window.matchMedia('(min-width: 768px)').matches) {
      setEdges((e) => (e.prev || e.next ? { prev: false, next: false } : e))
      return
    }
    const prev = el.scrollLeft > 2
    const next = el.scrollLeft + el.clientWidth < el.scrollWidth - 2
    setEdges((e) => (e.prev === prev && e.next === next ? e : { prev, next }))
    setTrackW(el.clientWidth)
  }, [])

  useEffect(() => {
    const el = gridRef.current
    if (!el) return
    updateEdges()
    const ro = new ResizeObserver(updateEdges)
    ro.observe(el)
    return () => ro.disconnect()
  }, [updateEdges, groupsSig, isCarousel])

  /** Vị trí bắt đầu (offsetLeft) của từng thẻ trong băng chuyền */
  const starts = () => Array.from(gridRef.current?.querySelectorAll<HTMLElement>('[data-cat-card]') ?? [], (c) => c.offsetLeft)
  const scrollTo = (left: number) => gridRef.current?.scrollTo({ left, behavior: reduced ? 'auto' : 'smooth' })

  /** Nút trước/sau: nhảy 3 thẻ (≥lg) hoặc 2 thẻ (md), luôn dừng đúng đầu thẻ */
  const step = (dir: -1 | 1) => {
    const el = gridRef.current
    if (!el) return
    const pts = starts()
    const i0 = Math.max(0, pts.findIndex((p) => p >= el.scrollLeft - 4))
    const jump = isLg ? 3 : 2
    scrollTo(pts[Math.min(pts.length - 1, Math.max(0, i0 + dir * jump))] ?? 0)
  }

  /** Kéo chuột để cuộn ngang (chỉ chuột thật; kéo > 6px thì hủy cú bấm). Thả ra thì dừng ở đầu thẻ gần nhất */
  const onPointerDown = (e: PointerEvent<HTMLUListElement>) => {
    const el = gridRef.current
    if (!el || !isCarousel || e.pointerType !== 'mouse' || e.button !== 0 || (e.target as HTMLElement).closest('[data-cat-list]')) return
    const d = dragRef.current
    window.clearTimeout(d.timer)
    d.moved = false
    d.startX = e.clientX
    d.startLeft = el.scrollLeft
    const move = (ev: globalThis.PointerEvent) => {
      const dx = ev.clientX - d.startX
      if (!d.moved) {
        if (Math.abs(dx) <= 6) return
        d.moved = true
        el.style.scrollSnapType = 'none'
        el.style.cursor = 'grabbing'
      }
      el.scrollLeft = d.startLeft - dx
    }
    const up = () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      if (!d.moved) return
      el.style.cursor = ''
      const pts = starts()
      const near = pts.reduce((best, p) => (Math.abs(p - el.scrollLeft) < Math.abs(best - el.scrollLeft) ? p : best), pts[0] ?? 0)
      el.scrollTo({ left: near, behavior: reduced ? 'auto' : 'smooth' })
      // Trả snap sau khi cuộn mượt xong; cú click (nếu có) đến ngay sau pointerup nên giữ cờ `moved` tới lúc đó
      d.timer = window.setTimeout(() => {
        el.style.scrollSnapType = ''
        d.moved = false
      }, reduced ? 0 : 450)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }
  const onClickCapture = (e: MouseEvent) => {
    if (dragRef.current.moved) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  /** Mở/đóng một thẻ nghề. Chụp trạng thái bố cục TRƯỚC khi đổi để Flip nội suy sang bố cục mới */
  const toggle = (key: string | null, focus: 'list' | 'face') => {
    const grid = gridRef.current
    flipRef.current = {
      state: isCarousel && !reduced && grid ? Flip.getState(grid.querySelectorAll('[data-cat-card]')) : null,
      animate: !reduced,
      focus,
    }
    // Hướng trượt theo tâm thẻ so với tâm vùng nhìn băng chuyền lúc bấm
    if (key && key !== openKey && grid) {
      const card = grid.querySelector<HTMLElement>(`[data-cat-key="${key}"]`)
      if (card) {
        const c = card.getBoundingClientRect()
        const g = grid.getBoundingClientRect()
        dirRef.current = c.left + c.width / 2 < g.left + g.width / 2 ? -1 : 1
      }
    }
    setOpenKey(key)
  }
  const pick = (key: string) => toggle(openKey === key ? null : key, openKey === key ? 'face' : 'list')

  // Mở/đóng thẻ nghề. ≥md: Flip đổi độ rộng thẻ + ảnh/danh sách trượt ngược chiều + cuộn băng chuyền; <md: nở chiều cao danh sách.
  useGSAP(
    () => {
      const grid = gridRef.current
      if (!grid) return
      const { state, animate, focus } = flipRef.current
      flipRef.current = { state: null, animate: false, focus: null }
      const cards = gsap.utils.toArray<HTMLElement>('[data-cat-card]', grid)
      const motion = animate && !reduced
      if (motion && state) Flip.from(state, { duration: DUR, ease: EASE, absolute: false })
      const dir = dirRef.current
      cards.forEach((card) => {
        const open = card.dataset.catKey === openKey
        const photo = card.querySelector<HTMLElement>('[data-photo-layer]')
        const list = card.querySelector<HTMLElement>('[data-cat-list]')
        const face = card.querySelector<HTMLElement>('[data-cat-face]')
        if (!photo || !list || !face) return
        const opts = { duration: DUR, ease: EASE, overwrite: 'auto' as const }
        if (open) gsap.set(list, { visibility: 'visible' })
        if (isCarousel) {
          const t = { photo: { xPercent: open ? dir * 100 : 0 }, list: { xPercent: open ? 0 : -dir * 100, autoAlpha: open ? 1 : 0 }, face: { autoAlpha: open ? 0 : 1 } }
          if (motion) {
            gsap.to(photo, { ...t.photo, ...opts })
            gsap.to(list, { ...t.list, ...opts })
            gsap.to(face, { ...t.face, ...opts, duration: DUR * 0.5 })
          } else {
            gsap.set(photo, { ...t.photo, clearProps: open ? '' : 'transform' })
            gsap.set(list, { ...t.list, height: '' })
            gsap.set(face, t.face)
          }
        } else {
          // Điện thoại: accordion, ảnh đứng yên, danh sách nở chiều cao
          gsap.set(photo, { clearProps: 'transform' })
          gsap.set(face, { clearProps: 'opacity,visibility' })
          const t = { height: open ? 'auto' : 0, autoAlpha: open ? 1 : 0, xPercent: 0 }
          if (motion) gsap.to(list, { ...t, duration: 0.4, ease: 'power2.out', overwrite: 'auto' })
          else gsap.set(list, t)
        }
      })
      // Mở thẻ (người dùng bấm): cuộn băng chuyền để thấy trọn thẻ. Bố cục cuối đã có sẵn nên đo offsetLeft được ngay;
      // đích luôn là đầu một thẻ (khớp snap): thẻ ngay trước nó nếu thẻ mở bị cắt bên phải, để còn thấy một thẻ lân cận.
      if (isCarousel && openKey && focus === 'list') {
        const card = cards.find((c) => c.dataset.catKey === openKey)
        if (card) {
          const left = card.offsetLeft
          const right = left + openW
          const view = grid.scrollLeft + grid.clientWidth
          let target: number | null = null
          if (left < grid.scrollLeft - 1) target = left
          else if (right > view + 1) target = card.previousElementSibling instanceof HTMLElement ? (card.previousElementSibling as HTMLElement).offsetLeft : left
          if (target !== null) grid.scrollTo({ left: target, behavior: motion ? 'smooth' : 'auto' })
        }
      }
      if (focus === 'list') grid.querySelector<HTMLElement>(`[data-cat-key="${openKey}"] [data-cat-heading]`)?.focus({ preventScroll: true })
      else if (focus === 'face') (document.getElementById(`shift-face-${lastOpen.current}`) as HTMLElement | null)?.focus({ preventScroll: true })
      lastOpen.current = openKey
      updateEdges()
    },
    { scope: rootRef, dependencies: [openKey, isCarousel, groupsSig, reduced] },
  )

  // Ảnh hiện hình: một lần khi vùng thẻ vào màn hình; chỉ chạy khi không giảm chuyển động
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const grid = gridRef.current
        if (!grid) return
        const photos = gsap.utils.toArray<HTMLElement>('[data-shift-photo]', grid)
        const veils = gsap.utils.toArray<HTMLElement>('[data-shift-veil]', grid)
        if (photos.length === 0) return
        gsap.set(photos, { filter: 'grayscale(1) contrast(0.82) brightness(1.18)' })
        gsap.set(veils, { opacity: 0.55 })
        ScrollTrigger.create({
          trigger: grid,
          start: 'top 75%',
          once: true,
          onEnter: () => {
            const live = gsap.utils.toArray<HTMLElement>('[data-shift-photo]', grid).slice(0, 5)
            const liveVeils = gsap.utils.toArray<HTMLElement>('[data-shift-veil]', grid).slice(0, 5)
            gsap.to(live, { filter: 'none', duration: 1.6, ease: 'power2.out', stagger: 0.12, clearProps: 'filter' })
            gsap.to(liveVeils, { opacity: 1, duration: 1.6, ease: 'power2.out', stagger: 0.12, clearProps: 'opacity' })
            // Ảnh ngoài 5 thẻ đầu (phần băng chuyền chưa cuộn tới, danh sách dọc điện thoại) hiện bình thường
            gsap.set(photos.filter((p) => !live.includes(p)), { clearProps: 'filter' })
            gsap.set(veils.filter((v) => !liveVeils.includes(v)), { clearProps: 'opacity' })
          },
        })
      })
      return () => mm.revert()
    },
    { scope: rootRef },
  )

  const emptyText = role === 'jobseeker' ? copy.emptyJobseeker : copy.emptyText
  const emptyLink = role === 'recruiter' ? { label: copy.recruiter.emptyLink, href: copy.recruiter.emptyHref } : { label: text.emptyLink, href: '/viec-lam' }
  const arrow = cn(HOME_GLASS_DARK, 'inline-flex h-11 w-11 items-center justify-center rounded-full text-wm-ivory hover:bg-wm-ivory/15 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent', PRESS, FOCUS)

  return (
    <section ref={rootRef} onKeyDown={(e) => e.key === 'Escape' && openKey && toggle(null, 'face')} data-theme="night" aria-labelledby="shift-board-title" className="relative z-10 flex min-h-[calc(100svh-4rem)] flex-col justify-center py-section-sm">
      {/* Tiêu đề thẳng mép với băng chuyền (cùng lề ngang, không theo `shell`) */}
      <div className="flex w-full flex-col gap-4 px-4 md:flex-row md:items-end md:justify-between md:px-[max(16px,2.5vw)]">
        <div className="min-w-0">
          <h2 id="shift-board-title" className="font-display text-display-sm font-semibold text-page-fg">
            {text.title}
          </h2>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {groups.length > 0 && (
            <div className="hidden items-center gap-2 md:flex">
              <button type="button" aria-label={copy.prevLabel} disabled={!edges.prev} onClick={() => step(-1)} className={arrow}>
                <ChevronLeft className="h-5 w-5" aria-hidden />
              </button>
              <button type="button" aria-label={copy.nextLabel} disabled={!edges.next} onClick={() => step(1)} className={arrow}>
                <ChevronRight className="h-5 w-5" aria-hidden />
              </button>
            </div>
          )}
          <Link to={text.link.href} className={cn('inline-flex min-h-11 items-center gap-1.5 rounded-control text-sm font-medium text-wm-ivory underline-offset-4 hover:underline', FOCUS)}>
            {text.link.label}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>

      {/* Băng chuyền kéo gần sát hai mép màn hình (không theo bề rộng tối đa của `shell`) */}
      <div className="mt-6 min-w-0 px-4 md:px-[max(16px,2.5vw)]">
        {groups.length === 0 ? (
          <div className={cn(PANEL, 'flex flex-col items-start gap-2 px-4 py-10 md:items-center')}>
            <p className="text-base">{emptyText}</p>
            <Link to={emptyLink.href} className={cn('inline-flex min-h-11 items-center rounded-control text-sm font-semibold underline underline-offset-4', FOCUS)}>
              {emptyLink.label}
            </Link>
          </div>
        ) : (
          <>
            <ul
              ref={gridRef}
              role="list"
              aria-label={copy.carouselLabel}
              onScroll={updateEdges}
              onPointerDown={onPointerDown}
              onClickCapture={onClickCapture}
              style={{ '--w': `calc((100% - ${(perView - 1) * GAP}px) / ${perView})`, '--wopen': `calc((2 * var(--w) + ${GAP}px) * ${OPEN_GROW})` } as CSSProperties}
              className="relative -my-4 flex select-none flex-col gap-4 py-4 md:snap-x md:snap-mandatory md:flex-row md:overflow-x-auto md:overscroll-x-contain md:[scrollbar-width:none] md:[&::-webkit-scrollbar]:hidden"
            >
              {shown.map((g) => {
                const open = g.cat.key === openKey
                const listId = `shift-list-${g.cat.key}`
                return (
                  <li
                    key={g.cat.key}
                    data-shift-row
                    data-cat-card
                    data-cat-key={g.cat.key}
                    className={cn('min-w-0 md:shrink-0 md:grow-0 md:snap-start', open ? 'md:basis-[var(--wopen)]' : 'md:basis-[var(--w)]')}
                  >
                    <article className="relative flex flex-col overflow-hidden rounded-card bg-wm-abyss text-wm-ivory ring-1 ring-wm-ivory/40 shadow-[0_18px_40px_-22px_var(--wm-night)] md:h-[min(68svh,620px)]">
                      <div data-photo-layer className="relative h-[38svh] min-h-60 shrink-0 md:absolute md:inset-0 md:h-auto md:min-h-0">
                        <img
                          data-shift-photo
                          src={photoUrl(g.cat.photo.id, 640)}
                          srcSet={photoSrcSet(g.cat.photo.id)}
                          sizes="(min-width: 1024px) 20vw, (min-width: 768px) 33vw, 100vw"
                          alt={g.cat.photo.alt}
                          width={640}
                          height={800}
                          loading="lazy"
                          draggable={false}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                        <div aria-hidden data-shift-veil className="pointer-events-none absolute inset-0" style={{ backgroundImage: CARD_STYLE.overlay }} />
                      </div>

                      {/* Mặt thẻ: nút bật/tắt phủ lên ảnh (≥md ẩn khi thẻ mở, đã có nút Đóng trong danh sách) */}
                      <div data-cat-face className="absolute inset-x-0 top-0 h-[38svh] min-h-60 md:inset-0 md:h-auto md:min-h-0">
                        <button
                          type="button"
                          id={`shift-face-${g.cat.key}`}
                          aria-expanded={open}
                          aria-controls={listId}
                          onClick={() => pick(g.cat.key)}
                          className={cn('flex h-full w-full flex-col justify-end gap-2 p-5 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-wm-ivory')}
                        >
                          <span className="font-display text-3xl font-semibold leading-tight">{g.cat.label}</span>
                          <span className="tnum text-sm">{copy.catStats(g.shifts, g.companies)}</span>
                          <span className="flex flex-wrap items-center gap-2">
                            <span className="tnum rounded-full bg-wm-ivory px-2.5 py-0.5 text-xs font-semibold text-wm-charcoal">
                              {copy.catEarliest(`${g.earliest.dayLabel} · ${SESSION_HOURS[g.earliest.session].name} ${hhmm(g.earliest)}`)}
                            </span>
                            <span className="inline-flex items-center gap-1 text-sm font-medium underline underline-offset-4">
                              {copy.catHint}
                              <ArrowRight className="h-4 w-4" aria-hidden />
                            </span>
                          </span>
                        </button>
                      </div>

                      {/* Danh sách doanh nghiệp: ≥md phủ cả thẻ (trượt vào từ phía đối diện ảnh), <md nằm dưới ảnh và nở chiều cao */}
                      <div
                        id={listId}
                        data-cat-list
                        role="region"
                        aria-labelledby={`${listId}-title`}
                        className="invisible h-0 select-text overflow-hidden bg-wm-abyss md:absolute md:inset-0 md:h-auto"
                      >
                        <div className="flex max-h-[60svh] flex-col gap-3 p-4 md:h-full md:max-h-none md:p-5">
                          <div className="flex items-start justify-between gap-3">
                            <h3 id={`${listId}-title`} data-cat-heading tabIndex={-1} className="font-display text-xl font-semibold leading-tight outline-none">
                              {copy.listTitle(g.cat.label)}
                            </h3>
                            <button
                              type="button"
                              onClick={() => toggle(null, 'face')}
                              aria-label={copy.closeLabel(g.cat.label)}
                              className={cn('inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-wm-ivory/50 px-4 text-sm font-semibold hover:bg-wm-ivory/15', PRESS, FOCUS)}
                            >
                              <X className="h-4 w-4" aria-hidden />
                              {copy.close}
                            </button>
                          </div>
                          <ul role="list" className={cn('min-h-0 flex-1 gap-3 overflow-y-auto overscroll-contain pr-1', twoCols ? 'grid grid-cols-2 content-start' : 'flex flex-col')}>
                            {g.jobs.slice(0, 6).map((row) => (
                              <CompanyRow
                                key={row.job.id}
                                row={row}
                                role={role}
                                score={role === 'jobseeker' ? outcomeOf(row.job)?.score : undefined}
                                free={role === 'recruiter' ? freeCount(row.slot) : undefined}
                              />
                            ))}
                          </ul>
                        </div>
                      </div>
                    </article>
                  </li>
                )
              })}
            </ul>
            {!isCarousel && !showAll && groups.length > PHONE_FIRST && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className={cn(HOME_GLASS_DARK, 'mt-4 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full border border-wm-ivory/30 px-5 text-sm font-semibold text-wm-ivory hover:bg-wm-ivory/15', PRESS, FOCUS)}
              >
                {copy.moreLabel}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  )
}
