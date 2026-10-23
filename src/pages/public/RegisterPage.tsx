import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertCircle, Building2, Eye, EyeOff, Loader2, Search } from 'lucide-react'
import { useAuthStore } from '@context/authStore'
import { buildDemoUser, getDemoAccountByRole } from '@constants/demoAccounts'

/*
 * Đăng ký — chưa có backend nên sau khi gửi form sẽ đăng nhập vào tài khoản demo
 * tương ứng vai trò (xem constants/demoAccounts.ts). Giao diện cùng hệ với LoginPage.
 */
type Role = 'jobseeker' | 'recruiter'

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-page-fg focus-visible:ring-offset-2 focus-visible:ring-offset-page-bg'
const INPUT = `w-full rounded-control border border-page-edge bg-page-surface px-4 py-3 text-base text-page-fg placeholder:text-page-edge ${FOCUS}`

const ROLES: { value: Role; label: string; icon: typeof Search }[] = [
  { value: 'jobseeker', label: 'Tìm việc', icon: Search },
  { value: 'recruiter', label: 'Tuyển dụng', icon: Building2 },
]

export default function RegisterPage() {
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

  const demo = getDemoAccountByRole(role)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    if (form.password !== form.confirm) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }
    setError('')
    setLoading(true)
    // TODO: thay bằng authService.register khi có backend. Tạm thời vào tài khoản demo.
    await new Promise((r) => setTimeout(r, 600))
    setUser(buildDemoUser(demo), 'mock-token')
    navigate('/')
  }

  return (
    <div className="min-h-[calc(100vh-64px)] text-page-fg flex items-start justify-center px-6 py-12 md:py-16">
      <div className="w-full max-w-md">
        <h1 className="font-display text-display-sm font-semibold text-page-fg">Tạo tài khoản</h1>
        <p className="text-base text-page-muted mt-3">
          Đã có tài khoản?{' '}
          <Link to="/dang-nhap" className={`font-medium text-page-fg underline underline-offset-4 rounded-control ${FOCUS}`}>
            Đăng nhập
          </Link>
        </p>

        {/* Chọn vai trò */}
        <div role="radiogroup" aria-label="Bạn là ai?" className="grid grid-cols-2 gap-3 mt-8">
          {ROLES.map(({ value, label, icon: Icon }) => {
            const active = role === value
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setRole(value)}
                className={`flex flex-col items-center gap-2 rounded-card border p-4 transition-colors duration-300 ${FOCUS}
                            ${active
                              ? 'border-page-fg bg-page-fg text-page-bg'
                              : 'border-page-line bg-page-surface text-page-fg hover:border-page-fg'}`}
              >
                <Icon className="w-5 h-5" aria-hidden />
                <span className="text-sm font-medium">{label}</span>
              </button>
            )
          })}
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-card border border-page-fg bg-page-surface p-4 text-sm font-medium text-page-fg"
            >
              <AlertCircle className="w-5 h-5 shrink-0" aria-hidden />
              {error}
            </div>
          )}

          <div>
            <label htmlFor="reg-name" className="block text-sm font-medium mb-2">
              {role === 'recruiter' ? 'Tên người liên hệ' : 'Họ và tên'}
            </label>
            <input
              id="reg-name"
              type="text"
              autoComplete="name"
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              placeholder="Nguyễn Văn A"
              className={INPUT}
            />
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium mb-2">Email</label>
            <input
              id="reg-email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="ban@example.com"
              className={INPUT}
            />
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium mb-2">Mật khẩu</label>
            <div className="relative">
              <input
                id="reg-password"
                type={showPass ? 'text' : 'password'}
                autoComplete="new-password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Tối thiểu 8 ký tự"
                className={`${INPUT} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-control text-page-muted hover:text-page-fg transition-colors ${FOCUS}`}
              >
                {showPass ? <EyeOff className="w-4 h-4" aria-hidden /> : <Eye className="w-4 h-4" aria-hidden />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="reg-confirm" className="block text-sm font-medium mb-2">Xác nhận mật khẩu</label>
            <input
              id="reg-confirm"
              type={showPass ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="Nhập lại mật khẩu"
              className={INPUT}
            />
          </div>

          <p className="text-xs text-page-muted">
            Bằng cách đăng ký, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.
          </p>

          <button
            type="submit"
            disabled={loading}
            className={`w-full inline-flex items-center justify-center gap-2 rounded-full bg-page-fg text-page-bg px-8 py-4 text-sm font-medium
                        transition-opacity duration-300 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed ${FOCUS}`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden />}
            {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </button>

          <p className="text-xs text-page-muted border-t border-page-line pt-4">
            Bản demo: tài khoản sẽ vào {demo.label.toLowerCase()} ({demo.username}), chưa lưu thông tin bạn nhập.
          </p>
        </form>
      </div>
    </div>
  )
}
