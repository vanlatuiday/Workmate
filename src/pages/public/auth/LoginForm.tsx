import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Building2, Lock, Mail, Search, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@context/authStore'
import { DEMO_ACCOUNTS } from '@constants/demoAccounts'
import { apiErrorMessage, authService } from '@services/authService'
import { canVisit } from '@constants/roles'
import { FOCUS } from '@utils/focus'
import { cn } from '@utils/cn'
import { BTN_SECONDARY, BTN_SM } from '@utils/ui'
import { AuthField, ErrorBox, Item, RoleSwitch, ShowPassButton, Stagger, SubmitButton, TEXT_LINK, type AuthRole } from './shared'
import { AUTH_PATHS, loginEmailError, useFieldTouch, useFocusFirst, type AuthFormProps } from './authShared'

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
  const [searchParams] = useSearchParams()
  // Vai trò chỉ chọn nhánh giao diện (link đăng ký đi kèm vai trò); API đăng nhập không cần vai trò
  const [role, setRole] = useState<AuthRole>(searchParams.get('role') === 'recruiter' ? 'recruiter' : 'jobseeker')
  const [form, setForm] = useState({ username: prefill ?? '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const root = useRef<HTMLDivElement>(null)
  useFocusFirst(root, focus)
  const { touch, show, submit } = useFieldTouch(root)
  const userErr = loginEmailError(form.username)
  const passErr = form.password ? undefined : 'Vui lòng nhập mật khẩu'

  const login = async (username: string, password: string) => {
    // Đăng nhập nhanh (demo) đi thẳng, đã có giá trị hợp lệ
    if (!username.trim() || !password) return
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
    if (submit([{ id: 'login-username', error: userErr }, { id: 'login-password', error: passErr }])) {
      setError('')
      shake()
      return
    }
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

        <Item className="mt-4">
          <RoleSwitch value={role} onChange={setRole} />
        </Item>

        <form onSubmit={handleSubmit} className="mt-3 space-y-3" noValidate>
          {error && <Item><ErrorBox message={error} /></Item>}

          <Item>
            <AuthField
              id="login-username"
              label="Email"
              icon={Mail}
              type="text"
              inputMode="email"
              autoComplete="username"
              required
              value={form.username}
              onChange={(username) => setForm({ ...form, username })}
              onBlur={() => touch('login-username')}
              error={show('login-username', userErr)}
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
              onBlur={() => touch('login-password')}
              error={show('login-password', passErr)}
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
        {import.meta.env.DEV && <Item className="mt-4">
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
                  className={cn(BTN_SECONDARY, BTN_SM)}
                >
                  <Icon className="w-3.5 h-3.5" aria-hidden />
                  {DEMO_LABELS[acc.role]}
                </button>
              )
            })}
          </div>
        </Item>}
        {/* DEMO-ONLY: xóa khi có backend — đăng nhập nhanh (kết thúc) */}

        <Item className="mt-4">
          <p className="text-sm text-page-muted text-center">
            Chưa có tài khoản?{' '}
            <Link to={`${AUTH_PATHS.register}?role=${role}`} state={location.state} className={TEXT_LINK}>Đăng ký</Link>
          </p>
        </Item>
      </div>
    </Stagger>
  )
}
