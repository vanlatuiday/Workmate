import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, m, useAnimationControls, useMotionValue, useSpring } from 'motion/react'
import { ArrowLeft, MapPin, Wallet } from 'lucide-react'
import { useCatalogStore } from '@context/catalogStore'
import { useAuthStore } from '@context/authStore'
import { canVisit } from '@constants/roles'
import { FOCUS } from '@utils/focus'
import { cn } from '@utils/cn'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { FINE_POINTER, useMediaQuery } from '@hooks/useMediaQuery'
import { usePageEnterDelay } from '@components/motion/PageTransition'
import { HomeBgLayers } from '@components/home/HomeBackdrop'
import { heroBgStyle } from '@components/home/homeBackground'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import ForgotForm from './ForgotForm'
import { OutlinePill } from './shared'
import { AUTH_PATHS, EASE, loginHome, MODE_ORDER, modeOfPath, type AuthFormProps, type AuthMode } from './authShared'

/*
 * Đăng nhập / Đăng ký / Quên mật khẩu — MỘT thẻ kính TỐI chia hai nửa (bố cục theo references/p11.mp4),
 * trên nền đen rêu #0A0F0D có hạt bụi (DESIGN.md → Hai nền; từ 2026-11-15, trước đó là kính sáng trên nền ngà).
 * Cả 3 route dùng cùng component này nên React giữ nguyên thẻ khi chuyển chế độ; PublicLayout
 * cũng không chạy hiệu ứng chuyển trang giữa 3 route này. Chế độ lấy từ đường dẫn, nên link
 * và nút Back của trình duyệt vẫn chạy.
 *
 *   đăng nhập : [ FORM    | chào mừng ]
 *   đăng ký   : [ chào mừng |    FORM ]    quên mật khẩu: giống đăng ký
 *
 * Ngoại lệ DESIGN.md (chủ dự án duyệt, chỉ cho 3 trang này): kính mờ tối, vệt sáng rất nhẹ
 * theo chuột, làm nhòe ngắn lúc hai nửa đổi chỗ. Mọi hiệu ứng đều có nhánh giảm chuyển động.
 * Mobile (< md): xếp dọc — thanh chào mừng gọn trên, form bên dưới trượt ngang khi đổi chế độ.
 */

type FormComponent = ComponentType<AuthFormProps>
const FORMS: Record<AuthMode, FormComponent> = { login: LoginForm, register: RegisterForm, forgot: ForgotForm }

const WELCOME: Record<AuthMode, { title: string; text: string; cta: string; to: AuthMode; back?: boolean }> = {
  login: {
    title: 'Xin chào!',
    text: 'Mới đến Workmate? Tạo tài khoản để tìm việc hoặc tuyển người trong vài phút.',
    cta: 'Tạo tài khoản',
    to: 'register',
  },
  register: {
    title: 'Chào mừng trở lại!',
    text: 'Đã có tài khoản? Đăng nhập để tiếp tục.',
    cta: 'Đăng nhập',
    to: 'login',
  },
  forgot: {
    title: 'Quên mật khẩu',
    text: 'Nhập email của tài khoản, Workmate sẽ gửi mã xác nhận để bạn đặt lại mật khẩu.',
    cta: 'Quay lại đăng nhập',
    to: 'login',
    back: true,
  },
}

/** Quãng trượt (px) của nội dung khi hai nửa đổi chỗ */
const SWAP_X = 28
/** Đường kính vệt sáng (px) */
const SHEEN = 520

/* ─── Trang ──────────────────────────────────────────────────────────────────── */

/** Đã đăng nhập mà vào /dang-nhap, /dang-ky → về đích như sau khi đăng nhập (state.from nếu được phép, không thì trang chủ) */
export default function AuthPage() {
  const user = useAuthStore((s) => s.user)
  const token = useAuthStore((s) => s.token)
  const { pathname, state } = useLocation()
  if (user && token && (pathname === AUTH_PATHS.login || pathname === AUTH_PATHS.register)) {
    const from = (state as { from?: string } | null)?.from
    // Người dùng mới vừa xác nhận email ở /dang-ky: nhà tuyển dụng vào form bắt đầu, người tìm việc vào trình viết CV. Phải xử lý ở đây vì
    // setUser làm trang này render lại và chuyển hướng TRƯỚC lệnh navigate() trong RegisterForm
    const fallback = pathname !== AUTH_PATHS.register ? loginHome(user.role)
      : user.role === 'recruiter' ? '/tuyen-dung/bat-dau'
      : user.role === 'jobseeker' ? '/ho-so' : '/'
    return <Navigate to={from && canVisit(user.role, from) ? from : fallback} replace />
  }
  return <AuthCard />
}

function AuthCard() {
  const { pathname } = useLocation()
  const reduced = useReducedMotion()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const finePointer = useMediaQuery(FINE_POINTER)
  const enter = usePageEnterDelay()

  // Chế độ lấy từ đường dẫn. Khi rời nhóm 3 route (trang đang mờ dần) thì giữ chế độ cuối,
  // nếu không thẻ sẽ nháy sang "đăng nhập" ngay trước mắt người dùng.
  const pathMode = modeOfPath(pathname)
  const [mode, setMode] = useState<AuthMode>(pathMode ?? 'login')
  const [dir, setDir] = useState<1 | -1>(1)
  if (pathMode && pathMode !== mode) {
    setDir(MODE_ORDER[pathMode] > MODE_ORDER[mode] ? 1 : -1)
    setMode(pathMode)
  }

  // Đã chuyển chế độ ít nhất một lần → form mới nhận focus + các ô hiện sớm hơn
  const [switched, setSwitched] = useState(false)
  const prevMode = useRef(mode)
  useEffect(() => {
    if (prevMode.current !== mode) {
      prevMode.current = mode
      setSwitched(true)
    }
  }, [mode])

  /* Rung / mờ đi của cả thẻ */
  const controls = useAnimationControls()
  const shake = useCallback(() => {
    if (reduced) return
    void controls.start({ x: [0, -8, 8, -5, 5, 0], transition: { duration: 0.4 } })
  }, [controls, reduced])
  const leave = useCallback(async () => {
    if (reduced) return
    await controls.start({ opacity: 0, scale: 0.98, transition: { duration: 0.35, ease: EASE } })
  }, [controls, reduced])

  /* Con trỏ (chỉ chuột thật, không giảm chuyển động): vệt sáng trên thẻ */
  const cardRef = useRef<HTMLDivElement>(null)
  const sheenX = useSpring(useMotionValue(0), { stiffness: 140, damping: 24, mass: 0.6 })
  const sheenY = useSpring(useMotionValue(0), { stiffness: 140, damping: 24, mass: 0.6 })
  const sheenOpacity = useSpring(0, { stiffness: 120, damping: 24 })
  const onCardMove = (e: React.PointerEvent) => {
    const r = cardRef.current?.getBoundingClientRect()
    if (!r) return
    sheenX.set(e.clientX - r.left - SHEEN / 2)
    sheenY.set(e.clientY - r.top - SHEEN / 2)
    sheenOpacity.set(1)
  }

  const Form = FORMS[mode]
  const formLeft = mode === 'login'
  // Lần mở trang đầu: chờ trang vào chỗ; các lần chuyển chế độ: chờ nội dung mới bắt đầu hiện
  const formProps: AuthFormProps = { delay: switched ? 0.12 : enter + 0.1, focus: switched, shake, leave }
  const swapTransition = reduced ? { duration: 0 } : { duration: 0.32, ease: EASE }

  /** Nội dung của một nửa; `side` quyết định nó trượt về phía nào khi rời / đến từ phía nào */
  const half = (side: 'left' | 'right', kind: 'form' | 'welcome') => {
    const shift = reduced ? 0 : side === 'left' ? SWAP_X : -SWAP_X
    const blur = reduced ? 'blur(0px)' : 'blur(8px)'
    return (
      <div className={cn('relative z-10 flex items-center px-10 py-9 lg:px-14', 'justify-start')}>
        {/* popLayout: nội dung cũ được tách ra (absolute) và mờ đi CÙNG LÚC nội dung mới hiện lên
            → hai lớp nhòe chồng nhau, không có khoảnh khắc thẻ trống như mode="wait" */}
        <AnimatePresence mode="popLayout" initial={false}>
          <m.div
            key={`${kind}-${mode}`}
            className="w-full"
            initial={{ opacity: 0, x: shift, filter: blur }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)', transition: { ...swapTransition, duration: reduced ? 0 : 0.38 } }}
            exit={{ opacity: 0, x: shift, filter: blur, transition: swapTransition }}
          >
            {kind === 'form' ? <Form {...formProps} /> : <WelcomeBlock mode={mode} />}
          </m.div>
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="auth-brand theme-night relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 pb-10 pt-24 md:px-8">
      {/* Nền giống hero trang chủ (2026-11-20, chủ dự án yêu cầu "trùng màu trang chủ"): ảnh tia sáng xanh,
          cam ở đáy, tia sáng "thở" (HomeBgLayers) — cũng là thứ để lớp kính làm mờ */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <HomeBgLayers style={heroBgStyle} />
        <div className="home-hero-orange absolute inset-0 opacity-60" />
        {/* Trầm hơn trang chủ (chủ dự án 2026-11-20): phủ xanh rất đậm để nền lùi lại, thẻ form nổi lên */}
        <div className="absolute inset-0 bg-wm-abyss/55" />
      </div>

      {/* Về trang chủ (logo Workmate ở góc trái do PublicLayout vẽ) */}
      <Link
        to="/"
        className={cn(
          'absolute right-4 top-5 z-40 inline-flex items-center gap-1.5 rounded-control px-2 py-2 text-sm font-medium text-page-fg md:right-10',
          FOCUS,
        )}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Về trang chủ
      </Link>

      <m.div
        ref={cardRef}
        animate={controls}
        onPointerMove={finePointer && isDesktop ? onCardMove : undefined}
        onPointerLeave={finePointer && isDesktop ? () => sheenOpacity.set(0) : undefined}
        className="glass-dark relative w-full max-w-[1040px] overflow-hidden rounded-card bg-wm-abyss/65 shadow-[0_30px_80px_-40px_var(--wm-night)] md:min-h-[620px]"
      >
        {/* Vệt sáng trắng nhẹ theo chuột — dời bằng transform, nằm dưới nội dung */}
        {finePointer && isDesktop && (
          <m.div
            aria-hidden
            className="auth-sheen pointer-events-none absolute left-0 top-0 rounded-full"
            style={{ width: SHEEN, height: SHEEN, x: sheenX, y: sheenY, opacity: sheenOpacity }}
          />
        )}

        {isDesktop ? (
          <div className="relative grid min-h-[620px] grid-cols-2">
            {/* Đường chia nghiêng: nghiêng cố định, dời sang vị trí mới bằng transform khi hai nửa đổi chỗ */}
            <m.div
              aria-hidden
              initial={false}
              animate={{ x: formLeft ? 28 : -28 }}
              transition={reduced ? { duration: 0 } : { duration: 0.65, ease: EASE }}
              style={{ rotate: 7 }}
              className="pointer-events-none absolute -top-[10%] left-1/2 z-0 h-[120%] w-[3px] border-l border-r border-l-page-line border-r-transparent"
            />
            {/* Hai nửa khác vai trò nên khác bề mặt (frontend-design: tương phản có chủ đích): nửa form giữ kính tối
                trầm để nhập liệu; nửa chào mừng là một tấm sáng hơn — xanh biển có tia sáng xanh ngọc và ánh cam ở đáy
                như hero trang chủ. Tấm này trượt sang nửa kia cùng nhịp với đường chia khi hai nửa đổi chỗ. */}
            <m.div
              aria-hidden
              initial={false}
              animate={{ x: formLeft ? '100%' : '0%' }}
              transition={reduced ? { duration: 0 } : { duration: 0.65, ease: EASE }}
              className="auth-welcome-panel pointer-events-none absolute inset-y-0 left-0 z-0 w-1/2"
            />
            {half('left', formLeft ? 'form' : 'welcome')}
            {half('right', formLeft ? 'welcome' : 'form')}
          </div>
        ) : (
          <div className="relative z-10 px-6 py-6">
            <div aria-hidden className="auth-welcome-panel pointer-events-none absolute inset-x-0 top-0 -z-10 h-24" />
            <MobileWelcome mode={mode} />
            <AnimatePresence mode="wait" initial={false} custom={dir}>
              <m.div
                key={mode}
                custom={dir}
                variants={{
                  enter: (d: number) => ({ opacity: 0, x: reduced ? 0 : 40 * d }),
                  center: { opacity: 1, x: 0 },
                  exit: (d: number) => ({ opacity: 0, x: reduced ? 0 : -40 * d }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={reduced ? { duration: 0 } : { duration: 0.3, ease: EASE }}
                className="mt-6"
              >
                <Form {...formProps} />
              </m.div>
            </AnimatePresence>
          </div>
        )}
      </m.div>
    </div>
  )
}

/* ─── Nửa "chào mừng" (desktop) và thanh gọn (mobile) ────────────────────────── */

function WelcomeBlock({ mode }: { mode: AuthMode }) {
  const w = WELCOME[mode]
  const { state } = useLocation()
  return (
    <div>
      <h2 className="font-display text-[clamp(2.25rem,4.2vw,3.5rem)] font-bold leading-[1.02] tracking-tight text-page-fg">
        {w.title}
      </h2>
      <p className="mt-5 max-w-[34ch] text-base text-page-muted">{w.text}</p>
      <div className="mt-8">
        <OutlinePill to={AUTH_PATHS[w.to]} state={state} back={w.back}>{w.cta}</OutlinePill>
      </div>
      {mode !== 'forgot' && <LiveJobs />}
    </div>
  )
}

/** Số liệu thật từ danh mục + một tin đang tuyển (không có dữ liệu thì không vẽ gì) */
function LiveJobs() {
  const jobs = useCatalogStore((s) => s.jobs)
  const companies = useCatalogStore((s) => s.companies)
  const open = jobs.filter((j) => j.visible)
  const sample = open[0]
  if (!sample) return null
  const company = companies.find((c) => c.id === sample.companyId)
  return (
    <div className="mt-10 max-w-[34ch]">
      <p className="tnum text-sm font-medium text-page-fg">
        {open.length} việc làm đang tuyển{companies.length > 0 && <span className="text-page-muted"> · {companies.length} công ty</span>}
      </p>
      <div className="mt-3 rounded-card border border-wm-ivory/20 bg-wm-night/30 p-4 backdrop-blur-md">
        <p className="eyebrow text-page-muted">Việc đang tuyển</p>
        <p className="mt-2 font-display text-base font-semibold text-page-fg">{sample.title}</p>
        {company && <p className="mt-0.5 text-sm text-page-muted">{company.name}</p>}
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-page-muted">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{sample.district}</span>
          <span className="tnum inline-flex items-center gap-1"><Wallet className="h-3.5 w-3.5" aria-hidden />{sample.salaryLabel}</span>
        </p>
      </div>
    </div>
  )
}

/** Mobile: chỉ một dòng tiêu đề nhỏ + nút chuyển, nằm trên form */
function MobileWelcome({ mode }: { mode: AuthMode }) {
  const w = WELCOME[mode]
  const { state } = useLocation()
  return (
    <div className="flex items-center justify-between gap-3 border-b border-page-line pb-4">
      <p className="font-display text-lg font-bold leading-tight tracking-tight text-page-fg">{w.title}</p>
      <OutlinePill to={AUTH_PATHS[w.to]} state={state} back={w.back} small>{w.cta}</OutlinePill>
    </div>
  )
}
