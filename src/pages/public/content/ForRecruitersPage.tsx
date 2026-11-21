// /nha-tuyen-dung
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap, useGSAP } from '@utils/gsap'
import { CalendarCheck, Gauge, MessagesSquare, Zap } from 'lucide-react'
import { useAuthStore } from '@context/authStore'
import { BTN_ACCENT, BTN_PRIMARY, BTN_SECONDARY } from '@utils/ui'
import { Section, CtaRow } from './ContentPage'
import PageCover, { COVER_EDGE, COVER_GLASS, DarkPageBody } from '@components/common/PageCover'
import { FOCUS } from '@utils/focus'
import { cn } from '@utils/cn'

const BENEFITS = [
  { icon: CalendarCheck, title: 'Ứng viên đúng lịch', text: 'Người rảnh đúng ca làm của bạn được xếp lên đầu.' },
  { icon: Gauge, title: 'Điểm phù hợp rõ ràng', text: 'Biết vì sao một ứng viên được gợi ý.' },
  { icon: MessagesSquare, title: 'Kết nối hai chiều', text: 'Chỉ trò chuyện khi cả hai bên đã đồng ý.' },
  { icon: Zap, title: 'Đăng tin trong vài phút', text: 'Đăng tin tuyển người miễn phí.' },
]

const STEPS = [
  { title: 'Tạo hồ sơ công ty', text: 'Giới thiệu ngắn về nơi làm việc.' },
  { title: 'Đăng vị trí', text: 'Ghi ca làm, khu vực và mức lương.' },
  { title: 'Chọn ứng viên', text: 'Xem gợi ý, kết nối rồi hẹn phỏng vấn.' },
]

/**
 * "Quy trình" — một khoảnh khắc cuộn: khi hàng bước hiện vào khung nhìn, đường nối tô dần màu (cyan → ngà)
 * từ bước 1 → 2 → 3 và vòng số của từng bước "sáng" lên khi vạch tới nơi (ScrollTrigger scrub, 'top 80%' → 'top 40%').
 * Trạng thái mặc định của CSS đã là trạng thái hoàn chỉnh (vạch đầy, vòng sáng) nên giảm chuyển động / chưa có JS = đã xong.
 * Màn hẹp (< md) các bước xếp dọc: vạch nối dọc, tô từ trên xuống bằng scaleY; từ md vạch ngang tô bằng scaleX.
 * Chỉ ghi transform + opacity.
 */
function ProcessSteps({ items }: { items: { title: string; text: string }[] }) {
  const root = useRef<HTMLOListElement>(null)
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add({ motion: '(prefers-reduced-motion: no-preference)', wide: '(min-width: 768px)' }, (ctx) => {
        const { motion, wide } = ctx.conditions as { motion: boolean; wide: boolean }
        if (!motion) return
        const fills = gsap.utils.toArray<HTMLElement>('[data-fill]', root.current)
        const lits = gsap.utils.toArray<HTMLElement>('[data-lit]', root.current)
        const axis = wide ? 'scaleX' : 'scaleY'
        gsap.set(fills, { transformOrigin: wide ? 'left center' : 'center top', [axis]: 0 })
        gsap.set(lits, { opacity: 0 })
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: { trigger: root.current, start: 'top 80%', end: 'top 40%', scrub: 0.6 },
        })
        // Vị trí trên timeline: bước i sáng tại i, vạch i→i+1 chạy từ i đến i+1
        lits.forEach((el, i) => {
          tl.to(el, { opacity: 1, duration: 0.25 }, i)
          if (fills[i]) tl.to(fills[i], { [axis]: 1, duration: 1 }, i)
        })
        tl.to({}, { duration: 0.1 }) // nghỉ nhẹ ở cuối: bước 3 sáng xong mới hết đoạn cuộn
      })
      return () => mm.revert()
    },
    { scope: root },
  )
  return (
    <ol ref={root} className="grid gap-8 md:grid-cols-3 md:gap-6">
      {items.map((s, i) => (
        <li key={s.title} className="relative flex gap-4 md:block">
          {/* Đường nối tới bước kế: nền mờ + lớp tô (cyan → ngà) chồng lên */}
          {i < items.length - 1 && (
            <span
              aria-hidden="true"
              className="absolute left-5 top-12 -bottom-8 w-px bg-page-line md:-bottom-auto md:left-14 md:right-[-1.5rem] md:top-5 md:h-px md:w-auto"
            >
              <span
                data-fill
                className="absolute inset-0 bg-gradient-to-b from-wm-azure to-page-fg md:bg-gradient-to-r"
              />
            </span>
          )}
          <span className="tnum relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-page-edge bg-page-bg font-display text-base font-semibold text-page-fg">
            {i + 1}
            {/* Lớp "sáng": nền abyss, chữ day, quầng azure */}
            <span
              data-lit
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center rounded-full bg-page-fg text-page-bg ring-2 ring-wm-azure/40"
            >
              <span className="absolute -inset-1 -z-10 rounded-full bg-wm-azure/25 blur-md" />
              {i + 1}
            </span>
          </span>
          <div className="md:mt-5">
            <h3 className="font-display text-lg font-semibold text-page-fg">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-page-muted">{s.text}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

export default function ForRecruitersPage() {
  const user = useAuthStore((s) => s.user)
  const isRecruiter = user?.role === 'recruiter'
  return (
    <>
      <PageCover
        level="lg"
        label="Dành cho nhà tuyển dụng"
        title="Tuyển người theo ca làm ở Đà Nẵng"
        lead="Đăng tin trong vài phút, Workmate gợi ý ứng viên có giờ rảnh khớp ca của bạn."
        actions={
          !user ? (
            <>
              <Link to="/dang-ky?role=recruiter" className={BTN_ACCENT}>Đăng tin tuyển người</Link>
              <Link to="/dang-nhap" className={cn('link-underline rounded-control text-sm text-page-fg', FOCUS)}>Đăng nhập tài khoản</Link>
            </>
          ) : isRecruiter ? (
            <>
              <Link to="/dang-tin" className={BTN_ACCENT}>Đăng tin tuyển người</Link>
              <Link to="/tuyen-dung" className={cn('link-underline rounded-control text-sm text-page-fg', FOCUS)}>Vào khu tuyển dụng</Link>
            </>
          ) : (
            <Link to="/" className={cn('link-underline rounded-control text-sm text-page-fg', FOCUS)}>Về trang chủ</Link>
          )
        }
      />
      <DarkPageBody join>
        <div className={cn(COVER_EDGE, 'space-y-14 py-section-sm')}>
          <Section title="Lợi ích">
            <ul className="grid gap-4 sm:grid-cols-2">
              {BENEFITS.map((b) => (
                <li
                  key={b.title}
                  className={cn(
                    COVER_GLASS,
                    // Thẻ không phải link → không nhấc lên; chỉ viền sáng + vòng cyan + quầng góc + icon sáng
                    'pc-benefit group/b relative overflow-hidden rounded-card p-6 transition-[border-color,box-shadow] duration-[400ms] ease-out',
                    'hover:border-page-fg hover:ring-1 hover:ring-wm-azure/30 focus-within:border-page-fg focus-within:ring-1 focus-within:ring-wm-azure/30 motion-reduce:transition-none',
                  )}
                >
                  <span aria-hidden="true" className="pc-benefit-glow pointer-events-none absolute inset-0" />
                  <span className="relative flex h-10 w-10 items-center justify-center rounded-full border border-page-line text-page-fg ring-1 ring-transparent transition-[background-color,box-shadow,border-color] duration-[400ms] ease-out group-hover/b:border-transparent group-hover/b:bg-wm-azure/10 group-hover/b:ring-wm-azure/40 group-focus-within/b:border-transparent group-focus-within/b:bg-wm-azure/10 group-focus-within/b:ring-wm-azure/40 motion-reduce:transition-none">
                    <b.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="relative mt-4 font-display text-lg font-semibold text-page-fg">{b.title}</h3>
                  <p className="relative mt-2 text-sm leading-relaxed text-page-muted">{b.text}</p>
                </li>
              ))}
            </ul>
          </Section>
          <Section title="Quy trình">
            <ProcessSteps items={STEPS} />
          </Section>
          {/* Cuối trang: nút nhấn đã ở bìa nên ở đây dùng nút abyss/viền */}
          <CtaRow>
            {!user ? (
              <>
                <Link to="/dang-ky?role=recruiter" className={BTN_PRIMARY}>Đăng ký nhà tuyển dụng</Link>
                <Link to="/dang-nhap" className={BTN_SECONDARY}>Đăng nhập tài khoản</Link>
              </>
            ) : isRecruiter ? (
              <>
                <Link to="/dang-tin" className={BTN_PRIMARY}>Đăng tin tuyển người</Link>
                <Link to="/tuyen-dung" className={BTN_SECONDARY}>Vào khu tuyển dụng</Link>
              </>
            ) : (
              <Link to="/" className={BTN_SECONDARY}>Về trang chủ</Link>
            )}
          </CtaRow>
        </div>
      </DarkPageBody>
    </>
  )
}
