import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'

import { photoSrcSet, photoUrl } from '@components/discover/types'
import { JOB_TYPES } from '@constants/index'
import { useAllJobs } from '@pages/public/jobs/catalog'
import { companyOf, type MatchJob } from '@pages/public/match/data'
import { useCompanyStore } from '@context/companyStore'
import { useCompanyJobs, useJobNumbers, type CompanyJobRow } from '@services/adminService'
import { gsap, ScrollTrigger, useGSAP } from '@utils/gsap'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { useMediaQuery } from '@hooks/useMediaQuery'
import { cn } from '@utils/cn'
import { homeSections, homeSectionsByRole } from './content'
import { useHomeRole } from './homeData'

const mine = homeSectionsByRole.recruiter.mine

/** Nhãn trạng thái của tin: kiểm duyệt của quản trị thắng, còn lại theo trạng thái đăng tuyển */
const statusOf = (r: CompanyJobRow) => (r.status === 'approved' ? mine.status[r.jobStatus] : mine.status[r.status])

/** Số ô tối thiểu trên vòng (nhân đôi danh sách việc cho vòng đầy như video) */
const MIN_SLOTS = 16 // 6 việc → 18 ô: vòng dày như video tham khảo (p9)
/** Độ xoay (độ) cho mỗi px deltaY của bánh xe chuột, và cho mỗi px kéo ngang */
const WHEEL_DEG = 0.15
const DRAG_DEG = 0.25
/** Sau chừng này ms không thao tác thì vòng tự căn về thẻ gần nhất (ms) */
const SNAP_IDLE_MS = 150
/** Cuộn chuột xoay tối đa một vòng (độ); hết vòng thì trang cuộn tiếp */
const WHEEL_RANGE = 360
/** Ô lệch dưới chừng này độ so với mặt trước mới tính là "ảnh đang hiện" để bắt cuộn chuột */
const WHEEL_HIT_DEG = 75

type Row = { job: MatchJob; href: string; status?: string; note?: string }

/** Dải chữ lớn chạy ngang: một "đơn vị" = cụm chữ + dấu ✱ (olive) */
function MarqueeUnit({ phrase, muted }: { phrase: string; muted?: boolean }) {
  return (
    <span className={cn('flex shrink-0 items-center gap-[0.35em] pr-[0.35em]', muted ? 'text-page-muted opacity-50' : 'text-page-fg')}>
      <span>{phrase}</span>
      <span aria-hidden className="text-wm-olive">
        ✱
      </span>
    </span>
  )
}

/** Nhãn nhỏ phía trên ảnh: "01 · BÁN THỜI GIAN" */
function Tag({ index, label }: { index: number; label: string }) {
  return (
    <p className="inline-block whitespace-nowrap rounded-full bg-page-fg px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-page-bg">
      {String(index + 1).padStart(2, '0')} · {label}
    </p>
  )
}

/** Ảnh dọc 4/5, góc vuông, viền olive 1px, viền giấy ngà bên trong */
function JobPhoto({ job, alt, className }: { job: MatchJob; alt: string; className?: string }) {
  return (
    <div className={cn('border border-wm-olive bg-wm-ivory p-1.5', className)}>
      <div className="relative aspect-[4/5] overflow-hidden bg-wm-mist">
        <img
          src={photoUrl(job.photo.id, 480)}
          srcSet={photoSrcSet(job.photo.id)}
          sizes="360px"
          alt={alt}
          width={480}
          height={600}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  )
}

/** Nhãn của thẻ: hình thức làm việc (ứng viên) hoặc trạng thái tin (nhà tuyển dụng) */
const tagOf = (row: Row) => row.status ?? JOB_TYPES.find((t) => t.value === row.job.jobType)?.label ?? row.job.district

/** Dòng thông tin của việc: công ty · lương · quận (+ ca, ghi chú quan tâm) */
function detailsOf(row: Row) {
  const { job } = row
  return [companyOf(job.companyId).name, job.salaryLabel, `${job.district}, Đà Nẵng`, job.shiftLabel, row.note].filter((d): d is string =>
    Boolean(d),
  )
}

/** Dòng thông tin dạng chữ liền; lương và giờ ca là số liệu → tnum + đậm hơn chữ quanh */
function Details({ row }: { row: Row }) {
  const { job } = row
  return (
    <>
      {detailsOf(row).map((d, i) => (
        <span key={i}>
          {i > 0 && ' · '}
          {d === job.salaryLabel || d === job.shiftLabel ? <span className="tnum font-semibold text-page-fg">{d}</span> : d}
        </span>
      ))}
    </>
  )
}

/** Nút "Xem chi tiết →" / "Quản lý tin →" của một việc */
function RowLink({ row, label }: { row: Row; label: string }) {
  return (
    <Link to={row.href} data-cursor="Xem" className="group inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-accent-ink">
      <span className="border-b border-transparent transition-colors duration-300 group-hover:border-accent-ink group-focus-visible:border-accent-ink">{label}</span>
      <ArrowRight
        className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
        aria-hidden
      />
    </Link>
  )
}

/**
 * Section ④ — vòng 3D (references/p9.mp4) dưới dải chữ chạy ngang, theo nội dung 6 việc nhân đôi
 * thành 12 ô. Khách / người tìm việc / quản trị: việc mới đăng (cuối danh mục, khác "tuyển gấp").
 * Nhà tuyển dụng: "Tin của bạn" — tin của công ty demo kèm trạng thái và số người quan tâm; chưa có
 * tin thì chỉ dải chữ + lời mời đăng tin.
 *
 * Không ghim, không tự quay, không gắn với cuộn trang. Ô k đặt ở rotateY(k·360/N) translateZ(R); cả
 * vòng lùi translateZ(-R) rồi rotateY(-góc) để thẻ ở trước nằm đúng mặt phẳng, to nhất; thẻ xa mép
 * thì xoay nghiêng, nhỏ theo phối cảnh, mờ dần theo góc, mặt sau ẩn. R ≈ 0.6 × bề rộng khung (đo lại
 * khi đổi cỡ) để vòng trải gần hết chiều ngang.
 * Chuột đặt TRÊN một ảnh đang hiện: cuộn chuột/trackpad cộng dồn vào góc đích (deltaY → độ), góc thật
 * đuổi theo bằng lerp trên gsap.ticker (quán tính), sự kiện bị nuốt (preventDefault + stopPropagation →
 * không tới Lenis ở window nên trang không cuộn). Cuộn chuột chỉ xoay trong khoảng 0 → 360° (một vòng):
 * tới đầu/cuối thì thả sự kiện cho trang cuộn tiếp. Chuột ở ngoài ảnh (hai bên, trên, dưới) → trang cuộn.
 * Kéo ngang bằng chuột/cảm ứng vẫn xoay tự do (touch-action: pan-y giữ cuộn dọc). Ngừng thao tác
 * ~150ms thì căn về ô gần nhất.
 * Phím ← →, nút trước/sau: một ô. Khối chữ của việc ở trước chuyển mờ chéo.
 * Điện thoại hoặc giảm chuyển động: dải chữ đứng yên + danh sách dọc.
 */
export default function NewJobsSection() {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const wide = useMediaQuery('(min-width: 768px)')
  const finePointer = useMediaQuery('(pointer: fine)')
  const areaRef = useRef<HTMLDivElement>(null)
  const stepRef = useRef<((dir: number) => void) | null>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const role = useHomeRole()
  const recruiter = role === 'recruiter'
  const jobs = useAllJobs().slice(-6)
  const rows = useCompanyJobs(useCompanyStore((s) => s.id)).slice(0, 6)
  const numbers = useJobNumbers(rows.map((r) => r.job))
  const copy = recruiter ? mine : homeSections.fresh
  const phrase = `${copy.title.toUpperCase()}`

  const items: Row[] = recruiter
    ? rows.map((r) => ({
        job: r.job,
        href: `/viec-lam/${r.job.id}`, // trang chi tiết tin trên web, không vào dashboard
        status: statusOf(r),
        note: r.status === 'approved' ? mine.interested(numbers[r.job.id]?.interested ?? 0) : undefined,
      }))
    : jobs.map((job) => ({ job, href: `/viec-lam/${job.id}` }))
  const count = items.length
  const empty = recruiter && rows.length === 0
  const linkLabel = recruiter ? 'Quản lý tin' : 'Xem chi tiết'
  // Dựng bánh xe ghim hay danh sách tĩnh
  const wheel = wide && !reduced && !empty && count >= 2

  // Dải chữ chạy ngang + nhích tốc độ theo vận tốc cuộn
  useGSAP(
    () => {
      const root = ref.current
      const track = root?.querySelector<HTMLElement>('[data-marquee]')
      if (!root || !track || reduced) return

      const loop = gsap.to(track, { xPercent: -50, duration: 40, ease: 'none', repeat: -1 })
      let kick: gsap.core.Tween | undefined
      const st = ScrollTrigger.create({
        trigger: root,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: (self) => {
          kick?.kill()
          loop.timeScale(1 + Math.min(Math.abs(self.getVelocity()) / 300, 5))
          kick = gsap.to(loop, { timeScale: 1, duration: 0.8, ease: 'power2.out' })
        },
      })
      return () => {
        kick?.kill()
        st.kill()
      }
    },
    { scope: ref, dependencies: [reduced, role] },
  )

  // Vòng 3D: góc đích `target` (cộng dồn từ chuột/kéo/phím), góc thật `cur` đuổi theo bằng lerp mỗi khung
  useGSAP(
    () => {
      const area = areaRef.current
      const ring = ringRef.current
      if (!area || !ring || !wheel) return
      const slots = gsap.utils.toArray<HTMLElement>('[data-slot]', ring)
      const N = slots.length
      if (N < 2) return
      const step = 360 / N
      const mod = (v: number, m: number) => ((v % m) + m) % m

      let target = 0
      let cur = 0
      let front = -1
      let running = false
      let snapTimer: number | undefined
      // Ô nào đang hiện đủ rõ để tính là "chuột trên ảnh" khi cuộn
      const visible: boolean[] = new Array(N).fill(false)

      // Đặt transform của vòng + độ mờ / bắt chuột của từng ô theo góc lệch so với mặt trước
      const render = () => {
        const R = parseFloat(area.style.getPropertyValue('--R')) || 600
        ring.style.transform = `translateZ(${-R}px) rotateY(${-cur}deg)`
        slots.forEach((el, k) => {
          const d = mod(k * step - cur + 180, 360) - 180
          const ad = Math.abs(d)
          visible[k] = ad < WHEEL_HIT_DEG
          el.style.opacity = ad >= 90 ? '0' : String(1 - 0.75 * (ad / 90))
          el.style.pointerEvents = ad < step / 2 ? 'auto' : 'none'
        })
        const f = mod(Math.round(cur / step), N)
        if (f !== front) {
          front = f
          setActive(f % count)
        }
      }

      const tick = () => {
        cur += (target - cur) * 0.12
        if (Math.abs(target - cur) < 0.02) {
          cur = target
          gsap.ticker.remove(tick)
          running = false
        }
        render()
      }
      const kick = () => {
        if (running) return
        running = true
        gsap.ticker.add(tick)
      }
      const snapSoon = () => {
        window.clearTimeout(snapTimer)
        snapTimer = window.setTimeout(() => {
          target = Math.round(target / step) * step
          kick()
        }, SNAP_IDLE_MS)
      }
      const rotateBy = (dir: number) => {
        target = (Math.round(target / step) + dir) * step
        window.clearTimeout(snapTimer)
        kick()
      }
      stepRef.current = rotateBy

      // Đo R theo bề rộng khung rồi vẽ lại
      const measure = () => {
        // Phải có đơn vị px: translateZ(var(--R)) với số trơn là transform không hợp lệ → mọi ô dồn về giữa
        area.style.setProperty('--R', `${Math.round(area.clientWidth * 0.6)}px`)
        render()
      }
      measure()
      const ro = new ResizeObserver(measure)
      ro.observe(area)

      // Chuột có nằm trong dải ảnh đang hiện không: khung bao chung của các ô đang hiện (sau khi xoay 3D),
      // tính cả khe giữa hai ảnh — nếu không, lúc vòng đang quay con trỏ rơi vào khe là trang trôi mất
      const overImage = (x: number, y: number) => {
        let l = Infinity, r = -Infinity, t = Infinity, b = -Infinity
        slots.forEach((el, k) => {
          if (!visible[k]) return
          const box = el.getBoundingClientRect()
          l = Math.min(l, box.left)
          r = Math.max(r, box.right)
          t = Math.min(t, box.top)
          b = Math.max(b, box.bottom)
        })
        return x >= l && x <= r && y >= t && y <= b
      }

      // Cuộn chuột trên ảnh: xoay trong khoảng 0 → 360°, nuốt sự kiện (không nổi bọt tới Lenis ở window).
      // Ngoài ảnh, hoặc đã tới đầu/cuối vòng theo chiều đang cuộn → để trang cuộn bình thường.
      const onWheel = (e: WheelEvent) => {
        const raw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY
        if (!raw || !overImage(e.clientX, e.clientY)) return
        // Kéo tay / nút bấm có thể đưa góc ra ngoài 0..360 — quy về trong khoảng (vòng đối xứng nên trông y hệt)
        if (target < 0 || target > WHEEL_RANGE) {
          const shift = Math.floor(target / WHEEL_RANGE) * WHEEL_RANGE
          target -= shift
          cur -= shift
        }
        const delta = (e.deltaMode === 1 ? raw * 16 : raw) * WHEEL_DEG
        if ((delta > 0 && target >= WHEEL_RANGE - 0.01) || (delta < 0 && target <= 0.01)) return
        e.preventDefault()
        e.stopPropagation()
        target = Math.min(WHEEL_RANGE, Math.max(0, target + delta))
        kick()
        snapSoon()
      }
      if (finePointer) area.addEventListener('wheel', onWheel, { passive: false })

      // Kéo ngang (chuột / cảm ứng): kéo sang phải = quay về ô trước
      let dragX: number | null = null
      let moved = 0
      const onDown = (e: PointerEvent) => {
        dragX = e.clientX
        moved = 0
        window.clearTimeout(snapTimer)
      }
      const onMove = (e: PointerEvent) => {
        if (dragX === null) return
        const dx = e.clientX - dragX
        dragX = e.clientX
        moved += Math.abs(dx)
        if (moved > 6 && !area.hasPointerCapture(e.pointerId)) area.setPointerCapture(e.pointerId)
        target -= dx * DRAG_DEG
        kick()
      }
      const onUp = () => {
        if (dragX === null) return
        dragX = null
        snapSoon()
      }
      // Sau khi kéo thì nuốt cú click để không mở nhầm trang chi tiết
      const onClickCapture = (e: MouseEvent) => {
        if (moved > 6) {
          e.preventDefault()
          e.stopPropagation()
          moved = 0
        }
      }
      area.addEventListener('pointerdown', onDown)
      area.addEventListener('pointermove', onMove)
      area.addEventListener('pointerup', onUp)
      area.addEventListener('pointercancel', onUp)
      area.addEventListener('click', onClickCapture, true)

      return () => {
        window.clearTimeout(snapTimer)
        gsap.ticker.remove(tick)
        ro.disconnect()
        area.removeEventListener('wheel', onWheel)
        area.removeEventListener('pointerdown', onDown)
        area.removeEventListener('pointermove', onMove)
        area.removeEventListener('pointerup', onUp)
        area.removeEventListener('pointercancel', onUp)
        area.removeEventListener('click', onClickCapture, true)
        stepRef.current = null
      }
    },
    // count/role đổi (đăng nhập/xuất, quản trị duyệt tin) → dựng lại cho bộ thẻ mới
    { scope: ref, dependencies: [wheel, count, role, finePointer] },
  )

  // Các ô trên vòng: danh sách việc lặp lại cho đủ MIN_SLOTS (số ô chia hết cho số việc)
  const slotCount = count > 0 ? count * Math.ceil(MIN_SLOTS / count) : 0
  const slots = Array.from({ length: slotCount }, (_, k) => ({ row: items[k % count], k }))

  return (
    <section
      ref={ref}
      data-theme="ivory"
      className="relative z-10 overflow-hidden pt-section-sm pb-section-sm"
      aria-labelledby="home-new-title"
    >
      <h2 id="home-new-title" className="sr-only">
        {copy.title}
      </h2>

      {/* Dải chữ lớn — trang trí, tiêu đề thật là h2 ẩn ở trên */}
      <div aria-hidden className={'select-none overflow-hidden'}>
        <div
          data-marquee
          className="flex w-max whitespace-nowrap font-display text-[clamp(2.5rem,6vw,5.5rem)] font-semibold uppercase leading-[1.05] tracking-[-0.04em]"
        >
          {[0, 1].map((g) => (
            <div key={g} className="flex shrink-0">
              <MarqueeUnit phrase={phrase} />
              <MarqueeUnit phrase={phrase} muted />
            </div>
          ))}
        </div>
      </div>

      {/* Hàng phụ: nhãn dữ liệu minh họa + liên kết xem tất cả */}
      <div className="shell mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p className="inline-block rounded-full border border-page-line px-3 py-1.5 text-xs text-page-muted">{homeSections.sampleNote}</p>
        <Link to={copy.all.href} className="group inline-flex min-h-11 items-center gap-2 text-sm font-medium text-page-fg underline-offset-4 hover:underline focus-visible:underline">
          {copy.all.label}
          <ArrowRight className="h-4 w-4 transition-transform duration-500 ease-editorial group-hover:translate-x-1" aria-hidden />
        </Link>
      </div>

      {empty ? (
        <div className="shell">
          <div className="mt-8 flex flex-col items-start gap-5 rounded-card border border-page-line bg-page-surface p-8">
            <p className="max-w-md text-base text-page-muted">{mine.empty.body}</p>
            <Link
              to={mine.empty.cta.href}
              className="inline-flex min-h-11 items-center rounded-full bg-accent px-8 py-3.5 text-sm font-semibold text-accent-fg transition-[filter,transform] duration-300 hover:brightness-110 active:scale-[0.97] motion-reduce:active:scale-100"
            >
              {mine.empty.cta.label}
            </Link>
          </div>
        </div>
      ) : wheel ? (
        <>
          {/* Vòng 3D tràn hết bề ngang; chỉ vùng này nuốt cuộn chuột / kéo ngang */}
          <div
            ref={areaRef}
            tabIndex={0}
            role="group"
            aria-roledescription="carousel"
            aria-label={copy.title}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') {
                e.preventDefault()
                stepRef.current?.(1)
              } else if (e.key === 'ArrowLeft') {
                e.preventDefault()
                stepRef.current?.(-1)
              }
            }}
            style={{ height: 'min(60vh, 520px)', perspective: '1400px', touchAction: 'pan-y' }}
            className="relative mt-6 select-none outline-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-page-fg"
          >
            <div ref={ringRef} className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
              {slots.map(({ row, k }) => (
                <Link
                  key={k}
                  data-slot
                  to={row.href}
                  tabIndex={-1}
                  aria-hidden
                  draggable={false}
                  data-cursor="Xem"
                  style={{
                    width: 'min(18vw, 260px)',
                    transform: `translate(-50%, -50%) rotateY(${(k * 360) / slotCount}deg) translateZ(var(--R, 600px))`,
                    backfaceVisibility: 'hidden',
                  }}
                  className="absolute left-1/2 top-1/2 flex flex-col items-center gap-2"
                >
                  <Tag index={k % count} label={tagOf(row)} />
                  <JobPhoto job={row.job} alt="" className="w-full" />
                </Link>
              ))}
            </div>
          </div>

          {/* Chữ của việc ở trước vòng: mờ chéo khi đổi; nút xoay một ô */}
          <div className="shell mt-6 text-center">
            <div aria-live="polite" className="relative mx-auto grid max-w-lg">
              {items.map((row, i) => (
                <div
                  key={row.job.id}
                  aria-hidden={i !== active}
                  className={cn(
                    'col-start-1 row-start-1 flex flex-col items-center transition-[opacity,visibility] duration-300 motion-reduce:transition-none',
                    i === active ? 'visible opacity-100' : 'invisible opacity-0',
                  )}
                >
                  <h3 className="font-display text-2xl font-semibold leading-snug text-page-fg lg:text-3xl">{row.job.title}</h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-page-muted"><Details row={row} /></p>
                  <div className="mt-1">
                    <RowLink row={row} label={linkLabel} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center justify-center gap-4">
              <button
                type="button"
                aria-label="Việc trước"
                onClick={() => stepRef.current?.(-1)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-page-line text-page-fg transition-[border-color,transform] hover:border-page-fg active:scale-[0.97] motion-reduce:active:scale-100"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </button>
              <span className="tnum text-xs text-page-muted">
                {String(active + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
              </span>
              <button
                type="button"
                aria-label="Việc sau"
                onClick={() => stepRef.current?.(1)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-page-line text-page-fg transition-[border-color,transform] hover:border-page-fg active:scale-[0.97] motion-reduce:active:scale-100"
              >
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Điện thoại / giảm chuyển động: danh sách dọc, vạch phân cách mảnh */
        <div className="shell">
          <ul role="list" className="mt-8 border-t border-page-line">
            {items.map((row, i) => (
              <li key={row.job.id} className="flex flex-col items-center border-b border-page-line py-10 text-center">
                <Tag index={i} label={tagOf(row)} />
                <JobPhoto job={row.job} alt={row.job.photo.alt} className="mt-4 w-44" />
                <h3 className="mt-6 font-display text-2xl font-semibold leading-snug text-page-fg">{row.job.title}</h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-page-muted"><Details row={row} /></p>
                <div className="mt-2">
                  <RowLink row={row} label={linkLabel} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
