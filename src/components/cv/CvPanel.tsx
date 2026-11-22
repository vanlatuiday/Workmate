import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Maximize2, Printer, X } from 'lucide-react'
import { cn } from '@utils/cn'
import { BTN_SECONDARY, BTN_SM } from '@utils/ui'
import CvSheet, { type CvData, type CvMode } from './CvSheet'
import type { SeekerProfile } from '@context/profileStore'

/** Hồ sơ của mình -> dữ liệu CV (`email` lấy từ tài khoản đăng nhập, hồ sơ không lưu email) */
export function toCvData(p: SeekerProfile & { avatarUrl: string | null }, email?: string): CvData {
  return { ...p, email, experience: p.experience.map((e) => ({ ...e, bullets: e.bullets ?? [] })) }
}

/** Chiều rộng tờ A4 (210mm) tính bằng px CSS — để tính tỉ lệ thu nhỏ */
const SHEET_PX = (210 / 25.4) * 96

/** Tờ CV thu nhỏ vừa chiều rộng khung chứa (transform scale: chữ vẫn sắc nét vì trình duyệt vẽ lại ở kích thước thật). */
export function ScaledCv({ data, mode, compact, contain }: { data: CvData; mode: CvMode; compact?: boolean; /** Vừa khít khung cha theo CẢ rộng lẫn cao (khung cha cần chiều cao xác định) — xem cả tờ không phải cuộn */ contain?: boolean }) {
  const boxRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0.5)
  const [h, setH] = useState(1123)

  useLayoutEffect(() => {
    const box = boxRef.current
    const sheet = sheetRef.current
    if (!box || !sheet) return
    const parent = box.parentElement
    const measure = () => {
      const sh = sheet.offsetHeight
      setH(sh)
      if (contain && parent) setScale(Math.min(parent.clientWidth / SHEET_PX, parent.clientHeight / sh))
      else setScale(box.clientWidth / SHEET_PX)
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(contain && parent ? parent : box)
    ro.observe(sheet)
    return () => ro.disconnect()
  }, [contain])

  return (
    <div
      ref={boxRef}
      className={cn('overflow-hidden rounded-card border border-page-line bg-white shadow-sm', contain ? 'mx-auto shrink-0' : 'w-full')}
      style={contain ? { width: SHEET_PX * scale, height: h * scale } : { height: h * scale }}
    >
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: '210mm' }}>
        <CvSheet ref={sheetRef} data={data} mode={mode} compact={compact} />
      </div>
    </div>
  )
}

/**
 * In CV thành PDF: dựng MỘT bản tờ CV ở cuối <body> (class cv-print-root) rồi gọi window.print();
 * stylesheet in (index.css) ẩn mọi thứ khác và đặt khổ A4. Tên tài liệu tạm đổi thành "CV – {tên}".
 */
function useCvPrint(data: CvData, mode: CvMode) {
  const [printing, setPrinting] = useState(false)
  const start = useCallback(() => setPrinting(true), [])

  useEffect(() => {
    if (!printing) return
    const prevTitle = document.title
    document.title = `CV – ${data.fullName.trim() || 'Workmate'}`
    const done = () => { document.title = prevTitle; setPrinting(false) }
    window.addEventListener('afterprint', done, { once: true })
    // Chờ bản in được vẽ xong rồi mới mở hộp thoại in
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => window.print()))
    return () => { cancelAnimationFrame(raf); window.removeEventListener('afterprint', done); document.title = prevTitle }
    // chỉ chạy khi bắt đầu/kết thúc in
  }, [printing])

  const portal = printing
    ? createPortal(<div className="cv-print-root"><CvSheet data={data} mode={mode} /></div>, document.body)
    : null
  return { start, portal }
}

/** Cột "CV của bạn": tiêu đề + công tắc xem như nhà tuyển dụng + nút tải PDF + tờ CV thu nhỏ. */
export default function CvPanel({ data }: { data: CvData }) {
  const [recruiter, setRecruiter] = useState(false)
  const mode: CvMode = recruiter ? 'recruiter' : 'owner'
  // Tải PDF luôn in bản chủ hồ sơ (có liên hệ) — đó là CV của chính họ
  const { start, portal } = useCvPrint(data, 'owner')
  const dlgRef = useRef<HTMLDialogElement>(null)
  return (
    <section aria-labelledby="cv-panel-title">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 id="cv-panel-title" className="text-sm font-medium text-page-fg">CV của bạn</h2>
        <button type="button" onClick={start} className={cn(BTN_SECONDARY, BTN_SM)}>
          <Printer className="h-4 w-4" aria-hidden />Tải CV (PDF)
        </button>
      </div>
      <label className="mb-3 flex cursor-pointer items-center gap-2 text-sm text-page-fg">
        <input type="checkbox" role="switch" checked={recruiter} onChange={(e) => setRecruiter(e.target.checked)} className="h-4 w-4 accent-page-fg" />
        Xem như nhà tuyển dụng
      </label>
      {/* Tờ CV thu nhỏ; bấm vào để phóng to trong khung xem lớn (<dialog>: có sẵn bẫy focus + Esc để đóng) */}
      <button
        type="button"
        onClick={() => { const d = dlgRef.current; if (!d) return; d.showModal(); requestAnimationFrame(() => { d.scrollTop = 0 }) }}
        aria-label="Phóng to CV"
        className="group relative block w-full cursor-zoom-in rounded-card text-left outline-none focus-visible:ring-2 focus-visible:ring-page-fg focus-visible:ring-offset-2"
      >
        <ScaledCv data={data} mode={mode} compact />
        <span aria-hidden className="pointer-events-none absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-wm-abyss/80 px-2.5 py-1 text-xs font-medium text-wm-ivory opacity-0 transition-opacity duration-base group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">
          <Maximize2 className="h-3.5 w-3.5" />Phóng to
        </span>
      </button>
      <dialog
        ref={dlgRef}
        aria-label="CV phóng to"
        onClick={(e) => { if (e.target === e.currentTarget) e.currentTarget.close() }}
        className="cv-zoom m-auto w-[min(860px,94vw)] max-h-[94svh] overflow-y-auto rounded-card bg-transparent p-0"
      >
        <div className="sticky top-0 z-10 flex justify-end gap-2 p-2">
          <button type="button" onClick={start} className={cn(BTN_SECONDARY, BTN_SM, 'bg-white')}>
            <Printer className="h-4 w-4" aria-hidden />Tải CV (PDF)
          </button>
          <button type="button" onClick={() => dlgRef.current?.close()} className={cn(BTN_SECONDARY, BTN_SM, 'bg-white')} aria-label="Đóng CV phóng to">
            <X className="h-4 w-4" aria-hidden />Đóng
          </button>
        </div>
        <ScaledCv data={data} mode={mode} />
      </dialog>
      {portal}
    </section>
  )
}
