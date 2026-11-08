import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Building2, Lock, Search, ShieldCheck, User } from 'lucide-react'
import { useAuthStore } from '@context/authStore'
import { DEMO_ACCOUNTS } from '@constants/demoAccounts'
import { apiErrorMessage, authService } from '@services/authService'
import { canVisit } from '@constants/roles'
import { FOCUS } from '@utils/focus'
import { cn } from '@utils/cn'
import { AuthField, ErrorBox, Item, ShowPassButton, Stagger, SubmitButton, TEXT_LINK } from './shared'
import { AUTH_PATHS, useFocusFirst, type AuthFormProps } from './authShared'

/*
 * Đăng nhập — gọi backend thật (authService.login); chỉ còn 3 nút đăng nhập nhanh là của bản demo.
 * Là nửa "form" của AuthPage; thẻ kính, tiêu đề lớn bên kia và chuyển động do AuthPage lo.
 */

// DEMO-ONLY: xóa khi có backend — biểu tượng / nhãn ngắn của 3 nút đăng nhập nhanh
const DEMO_ICONS = { jobseeker: Search, recruiter: Building2, admin: ShieldCheck } as const
const DEMO_LABELS = { jobseeker: 'Người tìm việc', recruiter: 'Nhà tuyển dụng', admin: 'Admin' } as const
// DEMO-ONLY: xóa khi có backend — hết

export default function LoginForm({ delay, focus, shake, leave }: AuthFormProps) {
  const location = useLocation()
  const navState = location.state as { username?: string; from?: string } | null
  // Có thể nhận sẵn tên đăng nhập từ trang đặt lại mật khẩu
  const prefill = navState?.username
  // Trang đang xem trước khi bị yêu cầu đăng nhập (ProtectedRoute gửi sang)
  const from = navState?.from
  const [form, setForm] = useState({ username: prefill ?? '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const root = useRef<HTMLDivElement>(null)
  useFocusFirst(root, focus)

  const login = async (username: string, password: string) => {
    if (!username.trim() || !password) {
      setError('Nhập tên đăng nhập và mật khẩu')
      shake()
      return
    }
    setError('')
    setLoading(true)
    let res
    try {
      res = (await authService.login(username.trim(), password)).data
    } catch (err) {
      setError(apiErrorMessage(err, 'Không đăng nhập được, vui lòng thử lại.'))
      setLoading(false)
      shake()
      return
    }
    // Thẻ mờ đi xong mới đổi trang
    await leave()
    setUser(res.user, res.token)
    // Quay lại trang đang xem dở nếu vai trò này được vào; còn lại về trang chủ (khu làm việc chỉ là nơi tổng hợp)
    navigate(from && canVisit(res.user.role, from) ? from : '/', { replace: true })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    void login(form.username, form.password)
  }

  // DEMO-ONLY: xóa khi có backend — đăng nhập nhanh: điền form rồi đăng nhập luôn
  const quickLogin = (username: string, password: string) => {
    if (loading) return
    setForm({ username, password })
    void login(username, password)
  }

  return (
    <Stagger delay={delay}>
      <div ref={root}>
        <Item>
          <h1 className="font-display text-3xl font-semibold text-page-fg">Đăng nhập</h1>
        </Item>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3" noValidate>
          {error && <Item><ErrorBox message={error} /></Item>}

          <Item>
            <AuthField
              id="login-username"
              label="Tên đăng nhập"
              icon={User}
              type="text"
              autoComplete="username"
              required
              value={form.username}
              onChange={(username) => setForm({ ...form, username })}
            />
          </Item>

          <Item>
            <AuthField
              id="login-password"
              label="Mật khẩu"
              icon={Lock}
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(password) => setForm({ ...form, password })}
              trailing={<ShowPassButton shown={showPass} onToggle={() => setShowPass(!showPass)} />}
            />
            <div className="mt-1 flex justify-end">
              <Link
                to={AUTH_PATHS.forgot}
                className={cn('inline-flex items-center min-h-9 px-1 text-sm text-page-muted underline underline-offset-4 hover:text-page-fg rounded-control', FOCUS)}
              >
                Quên mật khẩu?
              </Link>
            </div>
          </Item>

          <Item>
            <SubmitButton loading={loading} idle="Đăng nhập" busy="Đang đăng nhập..." />
          </Item>
        </form>

        {/* DEMO-ONLY: xóa khi có backend — đăng nhập nhanh bằng tài khoản demo (bắt đầu) */}
        <Item className="mt-4">
          <div role="group" aria-label="Đăng nhập nhanh bằng tài khoản demo" className="flex flex-wrap items-center justify-center gap-2">
            {DEMO_ACCOUNTS.map((acc) => {
              const Icon = DEMO_ICONS[acc.role]
              const password = acc.password
              return (
                <button
                  key={acc.username}
                  type="button"
                  disabled={loading}
                  onClick={() => quickLogin(acc.username, password)}
                  title={`${acc.label} · ${acc.username} · mật khẩu ${password}`}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border border-page-edge px-3 py-2 text-xs font-medium text-page-fg',
                    'transition-colors duration-300 hover:border-page-fg hover:bg-page-surface disabled:opacity-60 disabled:cursor-not-allowed',
                    FOCUS,
                  )}
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden />
                  {DEMO_LABELS[acc.role]}
                </button>
              )
            })}
          </div>
        </Item>
        {/* DEMO-ONLY: xóa khi có backend — đăng nhập nhanh (kết thúc) */}

        <Item className="mt-4">
          <p className="text-sm text-page-muted text-center">
            Chưa có tài khoản?{' '}
            <Link to={AUTH_PATHS.register} state={location.state} className={TEXT_LINK}>Đăng ký</Link>
          </p>
        </Item>
      </div>
    </Stagger>
  )
}
