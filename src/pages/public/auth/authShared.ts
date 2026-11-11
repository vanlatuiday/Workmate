import { useCallback, useEffect, useState, type RefObject } from 'react'
import { IS_PRODUCTION } from '@utils/isProduction'

/** Easing chung của dự án (trùng `ease-editorial` trong tailwind.config.js) */
export const EASE = [0.22, 1, 0.36, 1] as const

export type AuthMode = 'login' | 'register' | 'forgot'

/** Đường dẫn của từng chế độ — cả 3 dùng chung MỘT trang (AuthPage) */
export const AUTH_PATHS: Record<AuthMode, string> = {
  login: '/dang-nhap',
  register: '/dang-ky',
  forgot: '/quen-mat-khau',
}

/** Đường dẫn có thuộc nhóm Đăng nhập / Đăng ký / Quên mật khẩu không (PublicLayout dùng để ẩn header + footer) */
export function isAuthPath(pathname: string): boolean {
  return Object.values(AUTH_PATHS).includes(pathname)
}

/** Chế độ ứng với đường dẫn; undefined nếu không thuộc nhóm */
export function modeOfPath(pathname: string): AuthMode | undefined {
  return (Object.keys(AUTH_PATHS) as AuthMode[]).find((m) => AUTH_PATHS[m] === pathname)
}

/** Thứ tự chế độ — để biết hướng trượt (tiến/lùi) trên mobile */
export const MODE_ORDER: Record<AuthMode, number> = { login: 0, register: 1, forgot: 2 }

/** Props chung của 3 form, do AuthPage cấp */
export interface AuthFormProps {
  /** Độ trễ (giây) trước khi các ô lần lượt hiện */
  delay: number
  /** Chuyển chế độ (không phải lần mở trang đầu) → dời focus vào ô đầu tiên của form mới */
  focus: boolean
  /** Rung thẻ khi có lỗi */
  shake: () => void
  /** Thẻ mờ đi khi thành công; chờ xong rồi mới chuyển trang */
  leave: () => Promise<void>
}

/** Dời focus vào ô nhập (hoặc phần tử có data-autofocus) đầu tiên trong `ref` khi bật `enabled` / đổi `key` */
export function useFocusFirst(ref: RefObject<HTMLElement>, enabled: boolean, key?: unknown) {
  useEffect(() => {
    if (!enabled) return
    ref.current?.querySelector<HTMLElement>('input, [data-autofocus]')?.focus({ preventScroll: true })
  }, [ref, enabled, key])
}

/* ─── Kiểm tra ô nhập (tiếng Việt, hiện dưới từng ô) ─────────────────────────── */

export const PASSWORD_MIN = 8
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Ngoài production, ô "Email" của đăng nhập / quên mật khẩu nhận cả tên ngắn của tài khoản demo */
export const loginEmailError = (value: string) => {
  const v = value.trim()
  if (!v) return 'Vui lòng nhập email'
  if (IS_PRODUCTION && !EMAIL_RE.test(v)) return 'Email không hợp lệ'
  return undefined
}

export const registerEmailError = (value: string) => {
  const v = value.trim()
  if (!v) return 'Vui lòng nhập email'
  return EMAIL_RE.test(v) ? undefined : 'Email không hợp lệ'
}

export const passwordMinError = (value: string) => {
  if (!value) return 'Vui lòng nhập mật khẩu'
  return value.length >= PASSWORD_MIN ? undefined : `Mật khẩu tối thiểu ${PASSWORD_MIN} ký tự`
}

export const confirmError = (value: string, password: string) => {
  if (!value) return 'Vui lòng nhập lại mật khẩu'
  return value === password ? undefined : 'Mật khẩu nhập lại không khớp'
}

/**
 * Theo dõi ô đã chạm / đã bấm gửi: lỗi chỉ hiện khi rời ô hoặc sau lần gửi đầu.
 * `submit(ids)` đánh dấu đã gửi và dời focus vào ô lỗi đầu tiên (theo thứ tự `ids`).
 */
export function useFieldTouch(root: RefObject<HTMLElement>) {
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [submitted, setSubmitted] = useState(false)
  const touch = useCallback((name: string) => setTouched((t) => (t[name] ? t : { ...t, [name]: true })), [])
  const show = (name: string, error: string | undefined) => (submitted || touched[name] ? error : undefined)
  /** Trả true nếu còn ô lỗi (đã dời focus vào ô đầu tiên) */
  const submit = (invalid: { id: string; error?: string }[]) => {
    setSubmitted(true)
    const first = invalid.find((f) => f.error)
    if (first) root.current?.querySelector<HTMLElement>(`#${first.id}`)?.focus()
    return !!first
  }
  return { touch, show, submit }
}
