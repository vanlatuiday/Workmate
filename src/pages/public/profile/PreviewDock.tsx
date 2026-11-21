import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { gsap } from '@utils/gsap'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { BTN_ICON, BTN_SECONDARY, BTN_SM } from '@utils/ui'
import { useAuthStore } from '@context/authStore'
import { ScaledCv, toCvData } from '@components/cv/CvPanel'
import type { CvMode } from '@components/cv/CvSheet'
import type { ProfileApi } from './useProfileDraft'

/** Nút xem trước (mặc định "Xem bản nhà tuyển dụng thấy"): bấm thì nút lật 3D một vòng rồi mở khung có tờ CV. */
export default function PreviewDock({ api, mode = 'recruiter', label = 'Xem bản nhà tuyển dụng thấy', className }: { api: ProfileApi; mode?: CvMode; label?: string; className?: string }) {
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
        className={`${BTN_SECONDARY} ${BTN_SM} ${className ?? ''}`}
      >
        {label}
      </button>
      {open && (
        <PreviewModal api={api} mode={mode} reduced={reduced} onClosed={() => { setOpen(false); btnRef.current?.focus({ preventScroll: true }) }} />
      )}
    </>
  )
}

type ModalProps = { api: ProfileApi; mode: CvMode; reduced: boolean; onClosed: () => void }

/** Khung giữa màn hình chứa tờ CV (bản nhà tuyển dụng: không có SĐT/email). */
function PreviewModal({ api, mode, reduced, onClosed }: ModalProps) {
  const email = useAuthStore((s) => s.user?.email)
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

  return createPortal(
    <div ref={rootRef} data-lenis-prevent className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-14">
      <div data-pv-backdrop aria-hidden onClick={() => requestClose.current()} className="absolute inset-0 bg-wm-charcoal/40" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="theme-ivory relative max-h-[88svh] w-full max-w-xl overflow-y-auto rounded-card border border-page-line bg-wm-ivory p-5 text-wm-charcoal md:p-8"
      >
        <button ref={closeRef} type="button" onClick={() => requestClose.current()} aria-label="Đóng" className={`${BTN_ICON} absolute right-4 top-4`}>
          <X className="h-4 w-4" aria-hidden />
        </button>
        <p id={titleId} className="mb-4 pr-10 text-sm text-page-muted">{mode === 'recruiter' ? 'Bản nhà tuyển dụng nhìn thấy' : 'CV của bạn'}</p>
        <ScaledCv data={toCvData(api.profile, email)} mode={mode} />
      </div>
    </div>,
    document.body,
  )
}
