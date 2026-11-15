// /xem-thu — trang XEM THỬ "giai đoạn 2" (chỉ có khi chạy trên máy, không có ở bản build thật).
// Mục đích: để chủ dự án nhìn dải đầu trang tối + nội dung trắng ấm + footer tối + popup mới trước khi áp dụng thật.
// Không trang nào khác dùng file này.
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link, useSearchParams } from 'react-router-dom'
import { Briefcase, ChevronRight, MapPin, Search, Clock, Wallet } from 'lucide-react'
import { useCatalogStore, type CatalogCompany, type CatalogJob } from '@context/catalogStore'
import CompanyLogo from '@components/common/CompanyLogo'
import DustField from '@components/motion/DustField'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { BTN_ACCENT, BTN_SECONDARY, BTN_SM, CHIP, CHIP_OFF, CHIP_ON } from '@utils/ui'

const SAMPLES = [
  { key: 'chi-tiet', label: 'Chi tiết việc làm' },
  { key: 'danh-sach', label: 'Danh sách việc làm' },
  { key: 'chu-a', label: 'Trang chữ dài — A: có dải đen' },
  { key: 'chu-b', label: 'Trang chữ dài — B: sáng toàn trang' },
] as const
type SampleKey = (typeof SAMPLES)[number]['key']

/** Thẻ trên nền tối / nền sáng (DESIGN.md → Hai nền) */
const CARD_DARK = 'rounded-card border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)]'
const CARD_LIGHT = 'rounded-card bg-white shadow-[0_1px_2px_rgba(10,15,13,0.04),0_12px_32px_-16px_rgba(10,15,13,0.18)]'
/** Dải đầu trang tối: kéo lên dưới header (header cố định cao 72px, main có pt-[72px]) → mt âm + pt bù đúng 72px */
const BAND = 'theme-night surface-dark relative isolate -mt-[72px] overflow-hidden bg-wm-night pt-[72px] text-page-fg'

const TERMS = [
  ['1. Chấp nhận điều khoản', 'Khi tạo tài khoản hoặc sử dụng Workmate, bạn đồng ý với các điều khoản dưới đây. Nếu không đồng ý với bất kỳ nội dung nào, vui lòng ngừng sử dụng dịch vụ. Chúng tôi có thể cập nhật điều khoản theo từng giai đoạn phát triển; phiên bản mới có hiệu lực kể từ ngày được ghi rõ ở đầu trang.'],
  ['2. Tài khoản và bảo mật', 'Bạn chịu trách nhiệm về thông tin đăng ký và việc giữ bí mật mật khẩu của mình. Mỗi người chỉ nên dùng một tài khoản cho một vai trò (người tìm việc hoặc nhà tuyển dụng). Khi phát hiện truy cập trái phép, hãy báo cho chúng tôi ngay để được hỗ trợ khóa và khôi phục tài khoản.'],
  ['3. Nội dung đăng tải', 'Tin tuyển dụng và hồ sơ phải trung thực, đầy đủ và không vi phạm pháp luật. Workmate có quyền ẩn hoặc gỡ nội dung có dấu hiệu lừa đảo, thu phí ứng viên, hoặc xúc phạm người khác. Nội dung bị gỡ sẽ kèm lý do để bạn chỉnh sửa và gửi lại.'],
  ['4. Kết nối và trao đổi', 'Việc nhắn tin chỉ mở khi cả hai bên đồng ý kết nối. Không dùng kênh nhắn tin để gửi quảng cáo, mời tham gia đa cấp hoặc yêu cầu chuyển tiền. Chúng tôi có thể xem xét các tin nhắn bị báo cáo để xử lý vi phạm.'],
  ['5. Quyền riêng tư', 'Cách chúng tôi thu thập và sử dụng dữ liệu cá nhân được mô tả trong trang Bảo mật. Bạn có thể xem, chỉnh sửa hoặc yêu cầu xóa hồ sơ của mình bất cứ lúc nào trong phần Cài đặt.'],
  ['6. Giới hạn trách nhiệm', 'Workmate là nền tảng kết nối, không phải bên ký hợp đồng lao động giữa người tìm việc và nhà tuyển dụng. Hai bên tự thỏa thuận về công việc, thù lao và thời gian; chúng tôi hỗ trợ giải quyết khiếu nại trong phạm vi có thể.'],
] as const

/* ---------------------------------------------------------------- popup */

/** Popup thử: thẻ trắng ấm + bóng mềm trên màn phủ tối; Esc / bấm nền đóng, giữ focus trong khung, trả focus về nút mở */
function PreviewDialog({ onClose }: { onClose: () => void }) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const origin = useRef<HTMLElement | null>(document.activeElement as HTMLElement | null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    panelRef.current?.querySelector<HTMLElement>('button')?.focus({ preventScroll: true })
    const html = document.documentElement
    const prev = html.style.overflow
    html.style.overflow = 'hidden'
    const back = origin.current
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        closeRef.current()
      } else if (e.key === 'Tab') {
        const items = panelRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href]')
        if (!items?.length) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      html.style.overflow = prev
      if (back?.isConnected) back.focus({ preventScroll: true })
    }
  }, [])

  return createPortal(
    <div data-lenis-prevent className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-8">
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-wm-night/65 backdrop-blur-[3px]" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="theme-ivory relative w-full max-w-md rounded-card bg-wm-ivory p-6 text-page-fg shadow-[0_24px_64px_-16px_rgba(10,15,13,0.55)] md:p-8"
      >
        <h2 id={titleId} className="font-display text-xl font-semibold">Gửi hồ sơ cho Quán Gió Sông Hàn?</h2>
        <p className="mt-3 leading-relaxed text-page-muted">
          Nhà tuyển dụng sẽ nhận được hồ sơ và lịch rảnh của bạn. Bạn vẫn có thể rút lại trong mục Đơn ứng tuyển.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className={BTN_SECONDARY}>Để sau</button>
          <button type="button" onClick={onClose} className={BTN_ACCENT}>Gửi hồ sơ</button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function PopupButton({ dark }: { dark?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cn(BTN_SECONDARY, BTN_SM, dark && 'border-[rgba(255,255,255,0.2)]')}>
        Mở popup thử
      </button>
      {open && <PreviewDialog onClose={() => setOpen(false)} />}
    </>
  )
}

/* ---------------------------------------------------------------- khối dùng chung */

function DarkBand({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section data-surface="dark" className={cn(BAND, className)}>
      <DustField density="low" className="pointer-events-none absolute inset-0 -z-10 h-full w-full" />
      <div className="shell relative">{children}</div>
    </section>
  )
}

/** Footer tối — bản xem thử của footer thật (cùng nội dung, nền night) */
function PreviewFooter() {
  const link = `link-underline rounded-control hover:text-page-fg ${FOCUS}`
  return (
    <footer data-preview-footer data-surface="dark" className="theme-night border-t border-page-line bg-wm-night text-page-fg">
      <div className="shell py-section-sm">
        <p className="mb-6 text-xs font-medium uppercase tracking-[0.18em] text-page-muted">Footer tối (xem thử)</p>
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className={cn('mb-3 inline-flex items-center gap-2 rounded-control font-display text-lg font-semibold', FOCUS)}>
              <Briefcase className="h-5 w-5" aria-hidden="true" />
              Workmate
            </Link>
            <p className="text-sm leading-relaxed text-page-muted">Nền tảng kết nối việc làm linh hoạt dành cho sinh viên và người lao động.</p>
          </div>
          {[
            ['Tìm việc', ['Part-time', 'Full-time', 'Gần tôi']],
            ['Nhà tuyển dụng', ['Dành cho nhà tuyển dụng', 'Đăng tin miễn phí', 'Quản lý tuyển dụng']],
            ['Hỗ trợ', ['Câu hỏi thường gặp', 'Cẩm nang', 'Liên hệ']],
          ].map(([h, items]) => (
            <div key={h as string}>
              <h4 className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-page-muted">{h as string}</h4>
              <ul className="space-y-3 text-sm text-page-muted">
                {(items as string[]).map((t) => <li key={t}><Link to="/viec-lam" className={link}>{t}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 flex flex-col items-center justify-between gap-3 border-t border-page-line pt-8 text-xs text-page-muted sm:flex-row">
          <p>© 2026 Workmate. All rights reserved.</p>
          <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            {['Giới thiệu', 'Công ty', 'Điều khoản', 'Bảo mật'].map((t) => <li key={t}><Link to="/viec-lam" className={link}>{t}</Link></li>)}
          </ul>
        </div>
      </div>
    </footer>
  )
}

function Chip({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className={cn(CARD_DARK, 'inline-flex items-center gap-2 px-4 py-2.5 text-sm text-page-fg')}>
      <span className="text-page-muted" aria-hidden="true">{icon}</span>
      {children}
    </span>
  )
}

/* ---------------------------------------------------------------- mẫu 1: chi tiết */

function JobDetailSample({ job, company }: { job?: CatalogJob; company?: CatalogCompany }) {
  if (!job) return <div className="shell py-section-sm text-page-muted">Đang tải danh mục việc làm…</div>
  return (
    <>
      <DarkBand className="min-h-[40vh] pb-10 md:pb-14">
        <div className="flex min-h-[calc(40vh-4rem)] flex-col justify-end pt-10">
          <nav aria-label="Đường dẫn" className="flex items-center gap-1 text-sm text-page-muted">
            <Link to="/viec-lam" className={cn('rounded-control hover:text-page-fg', FOCUS)}>Việc làm</Link>
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
            <span className="truncate">{job.district}</span>
          </nav>
          <h1 className="mt-4 max-w-[24ch] font-display text-display-sm font-semibold">{job.title}</h1>
          <div className="mt-4 flex items-center gap-3">
            <CompanyLogo name={company?.name ?? ''} logoUrl={company?.logoUrl} decorative className="h-10 w-10 text-xs" />
            <p className="text-page-muted">{company?.name}</p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Chip icon={<Wallet className="h-4 w-4" />}><span className="font-medium tnum">{job.salaryLabel}</span></Chip>
            <Chip icon={<Clock className="h-4 w-4" />}>{job.shiftLabel}</Chip>
            <Chip icon={<MapPin className="h-4 w-4" />}>{job.district}</Chip>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button type="button" className={cn(BTN_ACCENT, 'px-8 py-4')}>Ứng tuyển ngay</button>
            <button type="button" className={cn(BTN_SECONDARY, 'px-8 py-4')}>Lưu</button>
            <PopupButton dark />
          </div>
        </div>
      </DarkBand>

      <div data-surface="light" className="shell grid gap-10 py-section-sm lg:grid-cols-[1fr_22rem] lg:gap-16">
        <div className="min-w-0 space-y-10">
          <section>
            <h2 className="font-display text-xl font-semibold">Mô tả công việc</h2>
            <p className="mt-4 max-w-[68ch] leading-relaxed text-page-muted">{job.description}</p>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold">Kỹ năng</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {job.skills.map((s) => (
                <li key={s} className="rounded-full border border-page-line px-3 py-1.5 text-sm text-page-muted">{s}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="font-display text-xl font-semibold">Lịch làm việc</h2>
            <p className="mt-4 text-page-muted">{job.shiftLabel} · cần {job.quantity} người</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {job.slots.map((s) => (
                <li key={s} className={cn(CARD_LIGHT, 'px-3 py-1.5 text-sm tnum')}>{s}</li>
              ))}
            </ul>
          </section>
        </div>
        <aside className="lg:pt-1">
          <div className={cn(CARD_LIGHT, 'p-6')}>
            <div className="flex items-center gap-3">
              <CompanyLogo name={company?.name ?? ''} logoUrl={company?.logoUrl} decorative className="h-12 w-12 text-sm" />
              <div className="min-w-0">
                <p className="truncate font-display font-semibold">{company?.name}</p>
                <p className="text-sm text-page-muted">{company?.industry} · {company?.district}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-page-muted">{company?.tagline}</p>
            <Link to={company ? `/cong-ty/${company.id}` : '/cong-ty'} className={cn(BTN_SECONDARY, 'mt-5 w-full')}>Xem trang công ty</Link>
          </div>
        </aside>
      </div>
    </>
  )
}

/* ---------------------------------------------------------------- mẫu 2: danh sách */

function JobListSample({ jobs, companies }: { jobs: CatalogJob[]; companies: CatalogCompany[] }) {
  const [filter, setFilter] = useState('Tất cả')
  const filters = ['Tất cả', 'Part-time', 'Gần tôi', 'Cuối tuần', 'Lương cao']
  return (
    <>
      <DarkBand className="pb-10 md:pb-14">
        <div className="pt-12 md:pt-16">
          <h1 className="font-display text-display-sm font-semibold">Việc làm</h1>
          <p className="mt-3 max-w-[56ch] text-page-muted">Việc linh hoạt quanh trường và nơi bạn ở — lọc theo ca, khu vực và mức lương.</p>
          <label className={cn(CARD_DARK, 'mt-8 flex max-w-xl items-center gap-3 px-4 focus-within:border-accent')}>
            <Search className="h-5 w-5 shrink-0 text-page-muted" aria-hidden="true" />
            <span className="sr-only">Tìm việc</span>
            <input type="search" placeholder="Tìm theo vị trí, công ty, khu vực" className="h-12 min-w-0 flex-1 bg-transparent text-page-fg outline-none placeholder:text-page-muted" />
          </label>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Bộ lọc">
            {filters.map((f) => (
              <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}
                className={cn(CHIP, filter === f ? CHIP_ON : 'border-[rgba(255,255,255,0.14)] text-page-fg hover:border-page-fg')}>
                {f}
              </button>
            ))}
          </div>
          <div className="mt-6"><PopupButton dark /></div>
        </div>
      </DarkBand>

      <div data-surface="light" className="shell py-section-sm">
        <p className="mb-6 text-sm text-page-muted">Trang thật /viec-lam vẫn giữ thư viện cuộn (scroll gallery) bên dưới dải đầu trang; mẫu này chỉ minh họa dải tối đặt trên một danh sách sáng.</p>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.slice(0, 6).map((j) => {
            const c = companies.find((x) => x.id === j.companyId)
            return (
              <li key={j.id} className={cn(CARD_LIGHT, 'p-6')}>
                <div className="flex items-center gap-3">
                  <CompanyLogo name={c?.name ?? ''} logoUrl={c?.logoUrl} decorative className="h-10 w-10 text-xs" />
                  <p className="truncate text-sm text-page-muted">{c?.name}</p>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold leading-snug">{j.title}</h3>
                <p className="mt-2 font-medium tnum">{j.salaryLabel}</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-page-muted"><MapPin className="h-4 w-4" aria-hidden="true" />{j.district}</p>
              </li>
            )
          })}
        </ul>
      </div>
    </>
  )
}

/* ---------------------------------------------------------------- mẫu 3 + 4: trang chữ dài */

function Prose() {
  return (
    <div data-surface="light" className="shell py-section-sm">
      <div className="max-w-[68ch] space-y-10">
        {TERMS.map(([t, body]) => (
          <section key={t}>
            <h2 className="font-display text-xl font-semibold">{t}</h2>
            <p className="mt-3 leading-relaxed text-page-muted">{body}</p>
          </section>
        ))}
        <PopupButton />
      </div>
    </div>
  )
}

function LongTextSample({ dark }: { dark: boolean }) {
  return dark ? (
    <>
      <DarkBand className="pb-10 md:pb-14">
        <div className="pt-12 md:pt-16">
          <p className="eyebrow text-page-muted">Pháp lý</p>
          <h1 className="mt-4 font-display text-display-sm font-semibold">Điều khoản sử dụng.</h1>
          <p className="mt-3 text-page-muted">Cập nhật lần cuối: 15/11/2026</p>
        </div>
      </DarkBand>
      <Prose />
    </>
  ) : (
    <>
      <div data-surface="light" className="shell pb-2 pt-12 md:pt-16">
        <p className="eyebrow text-page-muted">Pháp lý</p>
        <h1 className="mt-4 font-display text-display-sm font-semibold">Điều khoản sử dụng.</h1>
        <p className="mt-3 text-page-muted">Cập nhật lần cuối: 15/11/2026</p>
      </div>
      <Prose />
    </>
  )
}

/* ---------------------------------------------------------------- trang */

export default function PreviewPage() {
  const [params, setParams] = useSearchParams()
  const jobs = useCatalogStore((s) => s.jobs)
  const companies = useCatalogStore((s) => s.companies)
  const current = (SAMPLES.find((s) => s.key === params.get('mau'))?.key ?? 'chi-tiet') as SampleKey
  const visible = jobs.filter((j) => j.visible)
  // Ưu tiên tin có mô tả để mẫu chi tiết không bị trống
  const job = visible.find((j) => j.description.trim().length > 80) ?? visible[0]
  const company = companies.find((c) => c.id === job?.companyId)

  return (
    <div>
      {/* Chỉ trên route này: ẩn footer sáng thật để chỗ đó là footer tối xem thử */}
      <style>{'body footer:not([data-preview-footer]){display:none}'}</style>

      {/* Thanh chọn mẫu cố định ở đáy màn hình: không chiếm chỗ đầu trang, để dải tối trải được dưới header */}
      <div className="theme-ivory fixed inset-x-3 bottom-3 z-50 mx-auto max-w-fit rounded-card bg-wm-ivory px-3 py-3 text-page-fg shadow-[0_8px_32px_-8px_rgba(10,15,13,0.45)]">
        <nav aria-label="Chọn mẫu" className="flex max-w-full gap-2 overflow-x-auto">
          {SAMPLES.map((s) => (
            <button key={s.key} type="button" aria-pressed={current === s.key}
              onClick={() => setParams({ mau: s.key }, { replace: true })}
              className={cn(CHIP, current === s.key ? CHIP_ON : CHIP_OFF)}>
              {s.label}
            </button>
          ))}
        </nav>
        <p className="mt-2 text-xs text-page-muted">Trang xem thử — chỉ có trên máy, không phải trang thật.</p>
      </div>

      {current === 'chi-tiet' && <JobDetailSample job={job} company={company} />}
      {current === 'danh-sach' && <JobListSample jobs={visible} companies={companies} />}
      {current === 'chu-a' && <LongTextSample dark />}
      {current === 'chu-b' && <LongTextSample dark={false} />}

      <PreviewFooter />
    </div>
  )
}
