import { useEffect, type RefObject } from 'react'

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
