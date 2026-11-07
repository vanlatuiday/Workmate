import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from 'motion/react'
import { ArrowLeft } from 'lucide-react'
import { FOCUS } from '@utils/focus'
import { cn } from '@utils/cn'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { FINE_POINTER, useMediaQuery } from '@hooks/useMediaQuery'
import { usePageEnterDelay } from '@components/motion/PageTransition'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import ForgotForm from './ForgotForm'
import { OutlinePill } from './shared'
import { AUTH_PATHS, EASE, MODE_ORDER, modeOfPath, type AuthFormProps, type AuthMode } from './authShared'

/*
 * Đăng nhập / Đăng ký / Quên mật khẩu — MỘT thẻ kính sáng chia hai nửa, theo references/p11.mp4.
 * Cả 3 route dùng cùng component này nên React giữ nguyên thẻ khi chuyển chế độ; PublicLayout
 * cũng không chạy hiệu ứng chuyển trang giữa 3 route này. Chế độ lấy từ đường dẫn, nên link
 * và nút Back của trình duyệt vẫn chạy.
 *
 *   đăng nhập : [ FORM    | chào mừng ]
 *   đăng ký   : [ chào mừng |    FORM ]    quên mật khẩu: giống đăng ký
 *
 * Ngoại lệ DESIGN.md (chủ dự án duyệt, chỉ cho 3 trang này): kính mờ, vệt sáng trắng nhẹ
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
    title: 'Quên mật khẩu?',
    text: 'Đừng lo, chuyện này ai cũng gặp. Cho chúng tôi biết tài khoản của bạn, mã xác nhận sẽ giúp bạn đặt lại mật khẩu mới.',
    cta: 'Quay lại đăng nhập',
    to: 'login',
    back: true,
  },
}

/** Quãng trượt (px) của nội dung khi hai nửa đổi chỗ */
const SWAP_X = 28
/** Đường kính vệt sáng (px) */
const SHEEN = 520

/* ─── Nền: các khối hình học bằng code ───────────────────────────────────────── */

/**
 * Một tấm "phiến" nghiêng. Lớp ngoài chỉ chịu parallax (x, y, rotate nhẹ theo chuột, transform thuần);
 * lớp trong giữ góc nghiêng cố định. Mặt phiến + một dải mỏng bên dưới giả độ dày.
 */
function Slab({
  px,
  py,
  depth,
  position,
  face,
  tilt,
}: {
  px: MotionValue<number>
  py: MotionValue<number>
  /** Độ "gần" (0.3 xa → 1 gần): phiến gần dịch nhiều hơn */
  depth: number
  position: string
  face: string
  tilt: string
}) {
  const x = useTransform(px, [-0.5, 0.5], [-34 * depth, 34 * depth])
  const y = useTransform(py, [-0.5, 0.5], [-22 * depth, 22 * depth])
  const rotate = useTransform(px, [-0.5, 0.5], [-1.4 * depth, 1.4 * depth])
  return (
    <motion.div aria-hidden className={cn('absolute', position)} style={{ x, y, rotate }}>
      <div className={cn('relative h-full w-full border border-wm-ivory', face, tilt)}>
        <span className="absolute inset-x-0 top-full h-3 border border-t-0 border-wm-ivory bg-wm-sage/40" />
      </div>
    </motion.div>
  )
}

/* ─── Trang ──────────────────────────────────────────────────────────────────── */

export default function AuthPage() {
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

  /* Con trỏ (chỉ chuột thật, không giảm chuyển động): vệt sáng trên thẻ + parallax nền */
  const cardRef = useRef<HTMLDivElement>(null)
  const sheenX = useSpring(useMotionValue(0), { stiffness: 140, damping: 24, mass: 0.6 })
  const sheenY = useSpring(useMotionValue(0), { stiffness: 140, damping: 24, mass: 0.6 })
  const sheenOpacity = useSpring(0, { stiffness: 120, damping: 24 })
  const rawX = useMotionValue(0)
  const rawY = useMotionValue(0)
  const px = useSpring(rawX, { stiffness: 50, damping: 20, mass: 0.8 })
  const py = useSpring(rawY, { stiffness: 50, damping: 20, mass: 0.8 })

  useEffect(() => {
    if (!finePointer || !isDesktop) return
    const onMove = (e: PointerEvent) => {
      rawX.set(e.clientX / window.innerWidth - 0.5)
      rawY.set(e.clientY / window.innerHeight - 0.5)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [finePointer, isDesktop, rawX, rawY])

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
          <motion.div
            key={`${kind}-${mode}`}
            className="w-full"
            initial={{ opacity: 0, x: shift, filter: blur }}
            animate={{ opacity: 1, x: 0, filter: 'blur(0px)', transition: { ...swapTransition, duration: reduced ? 0 : 0.38 } }}
            exit={{ opacity: 0, x: shift, filter: blur, transition: swapTransition }}
          >
            {kind === 'form' ? <Form {...formProps} /> : <WelcomeBlock mode={mode} />}
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className="relative isolate flex min-h-screen items-center justify-center px-4 pb-10 pt-24 md:px-8">
      {/* Nền: phiến hình học màu nhạt (đá, sương, xô thơm, chút ô liu) — chỉ để lớp kính có thứ để làm mờ */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <Slab px={px} py={py} depth={0.5} position="left-[-8%] top-[6%] h-[34%] w-[52%]" face="bg-wm-stone" tilt="-rotate-[14deg] -skew-x-[14deg]" />
        <Slab px={px} py={py} depth={1} position="right-[-10%] bottom-[4%] h-[40%] w-[56%]" face="bg-wm-mist" tilt="-rotate-[10deg] skew-x-[16deg]" />
        <Slab px={px} py={py} depth={0.8} position="left-[6%] bottom-[-6%] h-[30%] w-[30%]" face="bg-wm-sage/45" tilt="rotate-[12deg] -skew-x-[18deg]" />
        <Slab px={px} py={py} depth={0.35} position="right-[8%] top-[4%] h-[20%] w-[26%]" face="bg-wm-olive/20" tilt="rotate-[8deg] skew-x-[14deg]" />
        <Slab px={px} py={py} depth={0.65} position="left-[34%] top-[44%] h-[7%] w-[44%]" face="bg-wm-stone/70" tilt="-rotate-[22deg] -skew-x-[10deg]" />
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

      <motion.div
        ref={cardRef}
        animate={controls}
        onPointerMove={finePointer && isDesktop ? onCardMove : undefined}
        onPointerLeave={finePointer && isDesktop ? () => sheenOpacity.set(0) : undefined}
        className="glass-light relative w-full max-w-[1040px] overflow-hidden rounded-card md:min-h-[620px]"
      >
        {/* Vệt sáng trắng nhẹ theo chuột — dời bằng transform, nằm dưới nội dung */}
        {finePointer && isDesktop && (
          <motion.div
            aria-hidden
            className="auth-sheen pointer-events-none absolute left-0 top-0 rounded-full"
            style={{ width: SHEEN, height: SHEEN, x: sheenX, y: sheenY, opacity: sheenOpacity }}
          />
        )}

        {isDesktop ? (
          <div className="relative grid min-h-[620px] grid-cols-2">
            {/* Đường chia nghiêng: nghiêng cố định, dời sang vị trí mới bằng transform khi hai nửa đổi chỗ */}
            <motion.div
              aria-hidden
              initial={false}
              animate={{ x: formLeft ? 28 : -28 }}
              transition={reduced ? { duration: 0 } : { duration: 0.65, ease: EASE }}
              style={{ rotate: 7 }}
              className="pointer-events-none absolute -top-[10%] left-1/2 z-0 h-[120%] w-[3px] border-l border-r border-l-page-line border-r-wm-ivory"
            />
            {half('left', formLeft ? 'form' : 'welcome')}
            {half('right', formLeft ? 'welcome' : 'form')}
          </div>
        ) : (
          <div className="relative z-10 px-6 py-6">
            <MobileWelcome mode={mode} />
            <AnimatePresence mode="wait" initial={false} custom={dir}>
              <motion.div
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
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  )
}

/* ─── Nửa "chào mừng" (desktop) và thanh gọn (mobile) ────────────────────────── */

function WelcomeBlock({ mode }: { mode: AuthMode }) {
  const w = WELCOME[mode]
  const { state } = useLocation()
  return (
    <div>
      <h2 className="font-display text-[clamp(2.25rem,4.2vw,3.5rem)] font-bold uppercase leading-[1.02] tracking-tight text-page-fg">
        {w.title}
      </h2>
      <p className="mt-5 max-w-[34ch] text-base text-page-muted">{w.text}</p>
      <div className="mt-8">
        <OutlinePill to={AUTH_PATHS[w.to]} state={state} back={w.back}>{w.cta}</OutlinePill>
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
      <p className="font-display text-lg font-bold uppercase leading-tight tracking-tight text-page-fg">{w.title}</p>
      <OutlinePill to={AUTH_PATHS[w.to]} state={state} back={w.back} small>{w.cta}</OutlinePill>
    </div>
  )
}
