import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Building2, KeyRound, Lock, Mail, Search, User } from 'lucide-react'
import { useAuthStore } from '@context/authStore'
import { useCatalogStore } from '@context/catalogStore'
import { apiErrorMessage, authService } from '@services/authService'
import { FOCUS } from '@utils/focus'
import { cn } from '@utils/cn'
import { AuthField, ErrorBox, Item, ShowPassButton, Stagger, SubmitButton, TEXT_LINK } from './shared'
import { AUTH_PATHS, useFocusFirst, type AuthFormProps } from './authShared'

/*
 * Đăng ký — gọi backend thật (authService.register), thành công thì đăng nhập luôn.
 * Là nửa "form" của AuthPage.
 */
type Role = 'jobseeker' | 'recruiter'

const ROLES: { value: Role; label: string; icon: typeof Search }[] = [
  { value: 'jobseeker', label: 'Tìm việc', icon: Search },
  { value: 'recruiter', label: 'Tuyển dụng', icon: Building2 },
]

export default function RegisterForm({ delay, focus, shake, leave }: AuthFormProps) {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  // Chỉ chấp nhận 2 vai trò hợp lệ, còn lại mặc định người tìm việc
  const defaultRole: Role = searchParams.get('role') === 'recruiter' ? 'recruiter' : 'jobseeker'

  const [role, setRole] = useState<Role>(defaultRole)
  const [form, setForm] = useState({ email: '', password: '', confirm: '', fullName: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const root = useRef<HTMLDivElement>(null)
  useFocusFirst(root, focus)

  // Quản trị viên có thể tạm dừng đăng ký (Cấu hình hệ thống)
  const registrationOpen = useCatalogStore((s) => s.config.registrationOpen)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    if (form.password !== form.confirm) {
      setError('Mật khẩu xác nhận không khớp.')
      shake()
      return
    }
    setError('')
    setLoading(true)
    let res
    try {
      res = (await authService.register({ email: form.email.trim(), password: form.password, role, name: form.fullName.trim() })).data
    } catch (err) {
      setError(apiErrorMessage(err, 'Không tạo được tài khoản, vui lòng thử lại.'))
      setLoading(false)
      shake()
      return
    }
    // Thẻ mờ đi xong mới đổi trang
    await leave()
    setUser(res.user, res.token)
    navigate('/')
  }

  if (!registrationOpen) {
    return (
      <Stagger delay={delay}>
        <div ref={root}>
          <Item>
            <h1 className="font-display text-2xl font-semibold text-page-fg">Workmate tạm dừng đăng ký tài khoản mới</h1>
          </Item>
          <Item>
            <p className="text-base text-page-muted mt-3">
              Vui lòng quay lại sau. Nếu đã có tài khoản,{' '}
              <Link to={AUTH_PATHS.login} className={TEXT_LINK}>đăng nhập tại đây</Link>.
            </p>
          </Item>
        </div>
      </Stagger>
    )
  }

  return (
    <Stagger delay={delay}>
      <div ref={root}>
        <Item>
          <h1 className="font-display text-3xl font-semibold text-page-fg">Tạo tài khoản</h1>
        </Item>

        {/* Chọn vai trò */}
        <Item className="mt-4">
          <div role="radiogroup" aria-label="Bạn là ai?" className="flex gap-2">
            {ROLES.map(({ value, label, icon: Icon }) => {
              const active = role === value
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setRole(value)}
                  className={cn(
                    'inline-flex flex-1 items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors duration-300',
                    FOCUS,
                    active ? 'border-page-fg bg-page-fg text-page-bg' : 'border-page-edge text-page-fg hover:border-page-fg',
                  )}
                >
                  <Icon className="w-4 h-4" aria-hidden />
                  {label}
                </button>
              )
            })}
          </div>
        </Item>

        <form onSubmit={handleSubmit} className="mt-3 space-y-2">
          {error && <Item><ErrorBox message={error} /></Item>}

          <Item>
            <AuthField
              id="reg-name"
              label={role === 'recruiter' ? 'Tên người liên hệ' : 'Họ và tên'}
              icon={User}
              type="text"
              autoComplete="name"
              required
              value={form.fullName}
              onChange={(fullName) => setForm({ ...form, fullName })}
            />
          </Item>

          <Item>
            <AuthField
              id="reg-email"
              label="Email"
              icon={Mail}
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(email) => setForm({ ...form, email })}
            />
          </Item>

          <Item>
            <AuthField
              id="reg-password"
              label="Mật khẩu (tối thiểu 8 ký tự)"
              icon={Lock}
              type={showPass ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              value={form.password}
              onChange={(password) => setForm({ ...form, password })}
              trailing={<ShowPassButton shown={showPass} onToggle={() => setShowPass(!showPass)} />}
            />
          </Item>

          <Item>
            <AuthField
              id="reg-confirm"
              label="Xác nhận mật khẩu"
              icon={KeyRound}
              type={showPass ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={form.confirm}
              onChange={(confirm) => setForm({ ...form, confirm })}
            />
          </Item>

          <Item className="pt-2">
            <SubmitButton loading={loading} idle="Đăng ký" busy="Đang tạo tài khoản..." />
          </Item>
        </form>

        <Item className="mt-3">
          <p className="text-xs text-page-muted">
            Bằng cách đăng ký, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.
          </p>
        </Item>

        <Item className="mt-3">
          <p className="text-sm text-page-muted">
            Đã có tài khoản?{' '}
            <Link to={AUTH_PATHS.login} state={location.state} className={TEXT_LINK}>Đăng nhập</Link>
          </p>
        </Item>
      </div>
    </Stagger>
  )
}
