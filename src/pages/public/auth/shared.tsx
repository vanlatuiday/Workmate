import { forwardRef, type ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { motion } from 'motion/react'
import { AlertCircle, ArrowLeft, ArrowRight, Building2, Eye, EyeOff, Loader2, Search, type LucideIcon } from 'lucide-react'
import { FOCUS } from '@utils/focus'
import { cn } from '@utils/cn'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { EASE } from './authShared'

/** Nút chính dạng viên thuốc, rộng hết khung (nên chiều rộng không đổi khi hiện spinner) */
export const PRIMARY = cn(
  'w-full inline-flex items-center justify-center gap-2 rounded-full bg-page-fg text-page-bg px-8 py-3.5 text-sm font-medium',
  'transition-opacity duration-300 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed',
  FOCUS,
)

/** Nút chữ nhỏ có gạch chân (Gửi lại mã, Đổi email…) */
export const LINK_BTN = cn(
  'inline-flex items-center min-h-10 px-1 text-sm font-medium text-page-fg underline underline-offset-4 rounded-control',
  'disabled:text-page-muted disabled:no-underline disabled:cursor-not-allowed',
  FOCUS,
)

/** Link chữ có gạch chân ở cuối form */
export const TEXT_LINK = cn('font-medium text-page-fg underline underline-offset-4 rounded-control', FOCUS)

/** Nút gửi form: spinner + chữ; luôn rộng hết khung nên không nhảy khi đổi nhãn */
export function SubmitButton({ loading, idle, busy }: { loading: boolean; idle: string; busy: string }) {
  return (
    <button type="submit" disabled={loading} className={PRIMARY}>
      {loading && <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden />}
      {loading ? busy : idle}
    </button>
  )
}

/** Viên thuốc viền (outline) dẫn sang chế độ khác — nửa "chào mừng" và thanh gọn trên mobile */
export function OutlinePill({ children, back, small, ...props }: LinkProps & { back?: boolean; small?: boolean }) {
  const Arrow = back ? ArrowLeft : ArrowRight
  return (
    <Link
      {...props}
      className={cn(
        'group inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-page-fg text-page-fg font-medium',
        'transition-colors duration-300 hover:bg-page-fg hover:text-page-bg',
        small ? 'px-4 py-2 text-xs' : 'px-7 py-3.5 text-sm',
        FOCUS,
      )}
    >
      {back && <Arrow className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5 motion-reduce:transition-none" aria-hidden />}
      {children}
      {!back && <Arrow className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />}
    </Link>
  )
}

/** Lỗi nhỏ dưới ô nhập, gắn với ô qua aria-describedby */
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-danger">
      <AlertCircle className="w-4 h-4 shrink-0" aria-hidden />{message}
    </p>
  )
}

/** Hộp lỗi chung của form (đăng nhập sai, mã sai…) */
export function ErrorBox({ message }: { message: string }) {
  if (!message) return null
  return (
    <div role="alert" className="flex items-start gap-3 rounded-card border border-page-fg bg-page-surface p-3 text-sm font-medium text-danger">
      <AlertCircle className="w-5 h-5 shrink-0" aria-hidden />
      {message}
    </div>
  )
}

type FieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'id'> & {
  id: string
  label: string
  icon: LucideIcon
  value: string
  onChange: (value: string) => void
  /** Lỗi của riêng ô này (hiện dưới ô, role="alert") */
  error?: string
  /** Nút phụ nằm bên phải ô (hiện/ẩn mật khẩu) */
  trailing?: ReactNode
  /** Ghi chú nhỏ dưới ô khi không có lỗi */
  hint?: string
}

/**
 * Ô nhập chỉ có đường gạch chân + icon đầu dòng + nhãn nổi.
 * Nhãn nằm đúng chỗ placeholder, bay lên khi focus hoặc khi đã có chữ (chỉ dùng transform).
 * Lúc focus, một đường 2px chạy ra từ trái (scaleX) đè lên đường gạch chân mảnh.
 * `placeholder=" "` để CSS biết ô đang trống (:placeholder-shown).
 */
export const AuthField = forwardRef<HTMLInputElement, FieldProps>(function AuthField(
  { id, label, icon: Icon, value, onChange, error, trailing, hint, className, ...rest },
  ref,
) {
  const errId = `${id}-err`
  const hintId = `${id}-hint`
  return (
    <div>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-0 top-7 h-4 w-4 text-page-muted" aria-hidden />
        <input
          {...rest}
          ref={ref}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder=" "
          aria-invalid={error ? true : undefined}
          aria-errormessage={error ? errId : undefined}
          aria-describedby={error ? errId : hint ? hintId : undefined}
          className={cn(
            'peer block w-full bg-transparent pb-2 pl-7 pt-6 text-base text-page-fg',
            'rounded-none border-0 border-b border-[var(--auth-edge)] focus:outline-none',
            trailing ? 'pr-11' : 'pr-1',
            className,
          )}
        />
        <label
          htmlFor={id}
          className={cn(
            'pointer-events-none absolute left-7 top-6 origin-left text-base text-page-muted',
            'transition-transform duration-300 ease-editorial motion-reduce:transition-none',
            'peer-focus:-translate-y-[1.05rem] peer-focus:scale-[0.78]',
            'peer-[:not(:placeholder-shown)]:-translate-y-[1.05rem] peer-[:not(:placeholder-shown)]:scale-[0.78]',
          )}
        >
          {label}
        </label>
        {/* Đường nhấn khi focus: đậm 2px, chạy ra từ trái */}
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-page-fg',
            'transition-transform duration-300 ease-editorial peer-focus:scale-x-100 motion-reduce:transition-none',
          )}
        />
        {trailing}
      </div>
      <FieldError id={errId} message={error} />
      {!error && hint && <p id={hintId} className="mt-1.5 text-xs text-page-muted">{hint}</p>}
    </div>
  )
})

/**
 * Khối bao form: các `<Item>` bên trong lần lượt hiện (opacity + y 8px, cách nhau 0.06s).
 * Giảm chuyển động → hiện ngay, không lệch thời gian.
 */
export function Stagger({ delay = 0, className, children }: { delay?: number; className?: string; children: ReactNode }) {
  const reduced = useReducedMotion()
  return (
    <motion.div
      className={className}
      initial={reduced ? false : 'hidden'}
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: delay } } }}
    >
      {children}
    </motion.div>
  )
}

export function Item({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 8 },
        show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  )
}

/** Nút hiện/ẩn mật khẩu, nằm đè bên phải ô (truyền vào `trailing` của AuthField) */
export function ShowPassButton({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={shown ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
      className={cn(
        'absolute right-0 top-3 inline-flex h-10 w-10 items-center justify-center rounded-control text-page-muted transition-colors hover:text-page-fg',
        FOCUS,
      )}
    >
      {shown ? <EyeOff className="w-4 h-4" aria-hidden /> : <Eye className="w-4 h-4" aria-hidden />}
    </button>
  )
}

/* ─── Chọn vai trò (segmented control) — đăng nhập và đăng ký dùng chung ─────── */

export type AuthRole = 'jobseeker' | 'recruiter'
const ROLES: { value: AuthRole; label: string; icon: LucideIcon }[] = [
  { value: 'jobseeker', label: 'Người tìm việc', icon: Search },
  { value: 'recruiter', label: 'Nhà tuyển dụng', icon: Building2 },
]

export function RoleSwitch({ value, onChange }: { value: AuthRole; onChange: (r: AuthRole) => void }) {
  return (
    <div role="radiogroup" aria-label="Bạn là ai?" className="flex gap-2">
      {ROLES.map(({ value: v, label, icon: Icon }) => {
        const active = value === v
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(v)}
            className={cn(
              'inline-flex flex-1 items-center justify-center gap-2 rounded-full border px-3 py-2.5 text-sm font-medium transition-colors duration-300',
              FOCUS,
              active ? 'border-page-fg bg-page-fg text-page-bg' : 'border-page-edge text-page-fg hover:border-page-fg',
            )}
          >
            <Icon className="w-4 h-4 shrink-0" aria-hidden />
            {label}
          </button>
        )
      })}
    </div>
  )
}

/* ─── Độ mạnh mật khẩu ───────────────────────────────────────────────────────── */

const STRENGTH = [
  { label: 'Yếu', bar: 'bg-danger' },
  { label: 'Trung bình', bar: 'bg-warning' },
  { label: 'Mạnh', bar: 'bg-accent' },
] as const

/** 0 = yếu, 1 = trung bình, 2 = mạnh: theo độ dài + chữ hoa / số / ký tự đặc biệt */
export function passwordStrength(pw: string): 0 | 1 | 2 {
  if (pw.length < 8) return 0
  const kinds = [/[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) => re.test(pw)).length
  const points = kinds + (pw.length >= 12 ? 1 : 0)
  return points >= 3 ? 2 : points >= 1 ? 1 : 0
}

export function PasswordStrength({ password }: { password: string }) {
  const level = password ? passwordStrength(password) : -1
  return (
    <div className="mt-2 flex items-center gap-3" aria-live="polite">
      <div className="flex flex-1 gap-1" aria-hidden>
        {STRENGTH.map((s, i) => (
          <span key={s.label} className={cn('h-1 flex-1 rounded-full transition-colors duration-300', i <= level ? s.bar : 'bg-page-line')} />
        ))}
      </div>
      <span className="min-w-[5.5rem] text-right text-xs font-medium text-page-muted">
        {level >= 0 ? `Độ mạnh: ${STRENGTH[level as 0 | 1 | 2].label}` : ''}
      </span>
    </div>
  )
}
