import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { RefreshCw, X } from 'lucide-react'
import { ScoreRing } from './parts'
import { ScaledCv } from '@components/cv/CvPanel'
import { fetchCandidateProfile, type CandidateProfile } from '@services/candidateService'
import { BTN_ICON, BTN_SECONDARY, BTN_SM } from '@utils/ui'
import { cn } from '@utils/cn'
import { toCvDataFromCandidate } from './candidateCv'

type Props = {
  seekerId: string
  /** Tên viết tắt từ danh sách — hiện ngay trên thanh đầu khi hồ sơ đang nạp */
  name: string
  /** Điểm phù hợp; bỏ trống = không hiện vòng điểm */
  score?: number
  /** Thẻ vừa bấm — trả focus về đây khi đóng */
  origin: HTMLElement | null
  onClosed: () => void
  /** Hàng nút trạng thái (Quan tâm / Đồng ý kết nối / Nhắn tin…); `close(true)` đóng ngay sau hành động làm thẻ rời tab */
  actions: (close: (quick?: boolean) => void) => ReactNode
  /** Nút phụ ở cuối thanh đầu (vd. Báo cáo) */
  extra?: ReactNode
}

/**
 * CV của ứng viên (bản nhà tuyển dụng) trong khung nổi: thanh đầu có điểm phù hợp + nút trạng thái + Đóng,
 * dưới là tờ CV cuộn được. Nạp từ GET /recruiter/candidates/:id/profile — máy chủ đã rút gọn tên / giấu liên hệ
 * khi chưa kết nối. Esc / nền / Đóng để đóng; giữ focus trong khung và trả về thẻ gốc.
 */
export default function CandidateCvDialog({ seekerId, name, score, origin, onClosed, actions, extra }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const [profile, setProfile] = useState<CandidateProfile | null>(null)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let alive = true
    setProfile(null)
    setError(false)
    fetchCandidateProfile(seekerId).then(
      (p) => alive && setProfile(p),
      () => alive && setError(true),
    )
    return () => { alive = false }
  }, [seekerId, attempt])

  // Đóng có hiệu ứng: thêm data-closing (CSS chạy ~220ms) rồi mới gỡ khung; giảm chuyển động → đóng ngay
  const [closing, setClosing] = useState(false)
  const close = useCallback(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return onClosed()
    setClosing(true)
    window.setTimeout(onClosed, 220)
  }, [onClosed])

  // Esc, bẫy focus, khóa cuộn nền (bù thanh cuộn), trả focus về thẻ khi gỡ
  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true })
    const html = document.documentElement
    const gap = window.innerWidth - html.clientWidth
    const prev = { overflow: html.style.overflow, paddingRight: html.style.paddingRight }
    html.style.overflow = 'hidden'
    if (gap > 0) html.style.paddingRight = `${gap}px`
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); return }
      if (e.key !== 'Tab') return
      const items = panelRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])')
      if (!items?.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      html.style.overflow = prev.overflow
      html.style.paddingRight = prev.paddingRight
      if (origin?.isConnected) origin.focus({ preventScroll: true })
    }
  }, [close, origin])

  return createPortal(
    // data-lenis-prevent: Lenis không nuốt cuộn chuột trong khung này
    <div data-lenis-prevent data-closing={closing || undefined} className="cv-pop fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-6">
      <div aria-hidden onClick={close} className="cv-pop-fade absolute inset-0 bg-wm-abyss/45 backdrop-blur-sm" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="candidate-cv-title"
        className="relative flex h-[94svh] w-full max-w-[860px] flex-col gap-3 text-wm-charcoal"
      >
        {/* Khung ngoài trong suốt (chủ dự án 2026-11-22): chỉ còn thanh kính chứa tên + nút, tờ CV nằm ngay bên dưới */}
        <header className="cv-pop-head theme-day flex shrink-0 flex-wrap items-center gap-x-4 gap-y-3 rounded-card border border-wm-azure/35 bg-[color-mix(in_srgb,var(--wm-azure)_16%,var(--wm-day))] px-4 py-3 shadow-[0_12px_32px_-16px_color-mix(in_srgb,var(--wm-abyss)_40%,transparent)] backdrop-blur-xl sm:px-6">
          <div className="min-w-0 flex-1 basis-40">
            <p className="text-xs font-medium text-page-muted">CV ứng viên</p>
            <h2 id="candidate-cv-title" className="truncate font-display text-xl font-semibold text-page-fg">{profile?.name ?? name}</h2>
          </div>
          {score !== undefined && <ScoreRing value={Math.round(score)} />}
          <button ref={closeRef} type="button" onClick={close} aria-label="Đóng" className={cn(BTN_ICON, 'order-last sm:order-none')}>
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="flex basis-full flex-wrap items-center gap-2">
            {actions(() => close())}
            {extra}
          </div>
        </header>

        <div className="cv-pop-sheet flex min-h-0 flex-1 items-start justify-center">
          {profile ? (
            <ScaledCv data={toCvDataFromCandidate(profile)} mode="recruiter" contain />
          ) : error ? (
            <div role="alert" className="theme-ivory flex flex-col items-center gap-3 rounded-card bg-white px-8 py-12 text-center">
              <p className="text-sm text-page-muted">Không tải được CV của ứng viên này. Kiểm tra mạng rồi thử lại.</p>
              <button type="button" onClick={() => setAttempt((n) => n + 1)} className={cn(BTN_SECONDARY, BTN_SM)}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />Thử lại
              </button>
            </div>
          ) : (
            <div role="status" aria-label="Đang tải CV…" className="h-full animate-pulse">
              <div className="aspect-[210/297] h-full rounded-card bg-white/60" />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
