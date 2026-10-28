import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { gsap } from '@utils/gsap'
import { JOB_TYPES } from '@constants/index'
import { DAY_SHORT, SESSIONS } from '@pages/jobseeker/mockData'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { FOCUS } from '@utils/focus'
import Avatar from './Avatar'
import { fmtMoney, type ProfileApi } from './useProfileDraft'

/** Nút "Xem bản doanh nghiệp thấy": bấm thì nút lật 3D một vòng rồi mở khung xem trước. */
export default function PreviewDock({ api }: { api: ProfileApi }) {
  const reduced = useReducedMotion()
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)

  const flip = (deg: number) => {
    if (reduced || !btnRef.current) return
    gsap.fromTo(btnRef.current, { rotateY: deg }, { rotateY: deg + 360, transformPerspective: 900, duration: 0.7, ease: 'power3.inOut' })
  }
  const openPreview = () => { setOpen(true); flip(0) }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={openPreview}
        aria-haspopup="dialog"
        data-cursor="Xem trước"
        className={`rounded-full border border-page-edge px-3.5 py-1 text-sm text-page-fg transition-colors duration-200 hover:border-page-fg ${FOCUS}`}
      >
        Xem bản doanh nghiệp thấy
      </button>
      {open && (
        <PreviewModal api={api} reduced={reduced} onClosed={() => { setOpen(false); btnRef.current?.focus({ preventScroll: true }) }} />
      )}
    </>
  )
}

type ModalProps = { api: ProfileApi; reduced: boolean; onClosed: () => void }

/** Khung lớn giữa màn hình — hồ sơ như doanh nghiệp thấy (không có SĐT/email). */
function PreviewModal({ api, reduced, onClosed }: ModalProps) {
  const { profile, percent } = api
  const titleId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const closing = useRef(false)
  // Giữ bản mới nhất của callback để effect không phải chạy lại
  const cbRef = useRef({ onClosed })
  cbRef.current = { onClosed }

  const requestClose = useRef(() => {})
  requestClose.current = () => {
    if (closing.current) return
    closing.current = true
    const done = () => cbRef.current.onClosed()
    if (reduced) gsap.to(rootRef.current, { opacity: 0, duration: 0.2, onComplete: done })
    else gsap.to(panelRef.current, { scale: 0.4, opacity: 0, duration: 0.45, ease: 'power3.in', onComplete: done })
    if (!reduced) gsap.to('[data-pv-backdrop]', { opacity: 0, duration: 0.45 })
  }

  useEffect(() => {
    if (reduced) gsap.fromTo(rootRef.current, { opacity: 0 }, { opacity: 1, duration: 0.2 })
    else {
      gsap.fromTo(panelRef.current, { scale: 0.4, opacity: 0, transformOrigin: '100% 100%' }, { scale: 1, opacity: 1, duration: 0.55, ease: 'power3.out' })
      gsap.fromTo('[data-pv-backdrop]', { opacity: 0 }, { opacity: 1, duration: 0.4 })
    }
    closeRef.current?.focus({ preventScroll: true })
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    // Esc đóng; Tab giữ trong khung
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { requestClose.current(); return }
      if (e.key !== 'Tab' || !panelRef.current) return
      const f = panelRef.current.querySelectorAll<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])')
      if (!f.length) return
      const first = f[0]
      const last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [])

  const jobTypeLabels = JOB_TYPES.filter((t) => profile.jobTypes.includes(t.value)).map((t) => t.label)

  return createPortal(
    <div ref={rootRef} data-lenis-prevent className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-14">
      <div data-pv-backdrop aria-hidden onClick={() => requestClose.current()} className="absolute inset-0 bg-wm-charcoal/40" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="theme-ivory relative max-h-[88svh] w-full max-w-2xl overflow-y-auto rounded-card border border-page-line bg-wm-ivory p-6 text-wm-charcoal md:p-10"
      >
        <button ref={closeRef} type="button" onClick={() => requestClose.current()} aria-label="Đóng" className={`absolute right-4 top-4 rounded-full border border-page-edge p-2 ${FOCUS}`}>
          <X className="h-4 w-4" aria-hidden />
        </button>
        <p className="text-xs uppercase tracking-widest text-page-muted">Bản doanh nghiệp nhìn thấy</p>
        <div className="mt-5 flex items-center gap-4">
          <Avatar name={profile.fullName} url={profile.avatarUrl} show={profile.showAvatar} className="h-20 w-20 text-2xl" />
          <div>
            <h2 id={titleId} className="font-display text-2xl font-semibold md:text-3xl">{profile.fullName || 'Chưa có tên'}</h2>
            <p className="text-sm text-page-muted">{profile.area} · {profile.published ? 'Đã công khai' : 'Chưa công khai'} · hoàn thiện {percent}%</p>
          </div>
        </div>
        {profile.intro && <p className="mt-6 leading-relaxed">{profile.intro}</p>}

        <h3 className="mt-8 text-sm font-medium text-page-muted">Lịch rảnh ({profile.availability.length} ca/tuần)</h3>
        <ul className="mt-2 flex flex-wrap gap-2">
          {DAY_SHORT.map((d, di) => {
            const ses = SESSIONS.filter((_, si) => profile.availability.includes(`${di}-${si}`))
            return ses.length ? <li key={d} className="rounded-full border border-page-edge px-3 py-1 text-sm">{d}: {ses.join(', ')}</li> : null
          })}
        </ul>

        <h3 className="mt-8 text-sm font-medium text-page-muted">Kỹ năng</h3>
        <ul className="mt-2 flex flex-wrap gap-2">
          {profile.skills.map((s) => <li key={s} className="rounded-full border border-page-edge px-3 py-1 text-sm">{s}</li>)}
        </ul>

        <h3 className="mt-8 text-sm font-medium text-page-muted">Kinh nghiệm</h3>
        <ul className="mt-2 space-y-2">
          {profile.experience.map((e) => (
            <li key={e.id}><span className="font-medium">{e.title}</span><span className="text-page-muted"> — {[e.company, e.period].filter(Boolean).join(', ')}</span></li>
          ))}
        </ul>

        <h3 className="mt-8 text-sm font-medium text-page-muted">Mong muốn</h3>
        <p className="mt-2 text-sm">
          Từ {fmtMoney(profile.salaryMin)}/giờ · trong {profile.maxDistanceKm} km · {jobTypeLabels.join(', ') || 'chưa chọn loại việc'}
        </p>

        {profile.about && (<><h3 className="mt-8 text-sm font-medium text-page-muted">Giới thiệu thêm</h3><p className="mt-2 text-sm leading-relaxed">{profile.about}</p></>)}

        <p className="mt-8 rounded-control border border-page-line px-4 py-3 text-sm text-page-muted">Liên hệ mở sau khi hai bên kết nối.</p>
      </div>
    </div>,
    document.body,
  )
}
