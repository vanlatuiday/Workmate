import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, Building2, Eye, EyeOff, Loader2, Search, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@context/authStore'
import { DEMO_ACCOUNTS, buildDemoUser, findDemoAccount } from '@constants/demoAccounts'
import { canVisit } from '@constants/roles'

/*
 * Đăng nhập — tạm dùng 3 tài khoản demo (xem constants/demoAccounts.ts).
 * Trang này nằm trong PublicLayout, layout đã cấp theme ngà (.theme-ivory) nên
 * các class bg-page-* / text-page-* ra đúng màu.
 */
const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-page-fg focus-visible:ring-offset-2 focus-visible:ring-offset-page-bg'
const INPUT = `w-full rounded-control border border-page-edge bg-page-surface px-4 py-3 text-base text-page-fg placeholder:text-page-edge ${FOCUS}`

const ICONS = { jobseeker: Search, recruiter: Building2, admin: ShieldCheck } as const

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  // Trang đang xem trước khi bị yêu cầu đăng nhập (ProtectedRoute gửi sang)
  const from = (useLocation().state as { from?: string } | null)?.from

  // TODO: thay bằng authService.login khi có backend
  const login = async (username: string, password: string) => {
    setError('')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600)) // độ trễ giả
    const account = findDemoAccount(username, password)
    if (!account) {
      setError('Tên đăng nhập hoặc mật khẩu không đúng.')
      setLoading(false)
      return
    }
    setUser(buildDemoUser(account), 'mock-token')
    // Quay lại trang đang xem dở nếu vai trò này được vào; còn lại về trang chủ (khu làm việc chỉ là nơi tổng hợp)
    navigate(from && canVisit(account.role, from) ? from : '/', { replace: true })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    void login(form.username, form.password)
  }

  // Đăng nhập nhanh: điền form rồi đăng nhập luôn
  const quickLogin = (username: string, password: string) => {
    if (loading) return
    setForm({ username, password })
    void login(username, password)
  }

  return (
    <div className="min-h-[calc(100vh-64px)] text-page-fg flex items-start justify-center px-6 py-12 md:py-16">
      <div className="w-full max-w-md">
        <h1 className="font-display text-display-sm font-semibold text-page-fg">Đăng nhập</h1>
        <p className="text-base text-page-muted mt-3">
          Chưa có tài khoản?{' '}
          <Link to="/dang-ky" className={`font-medium text-page-fg underline underline-offset-4 rounded-control ${FOCUS}`}>
            Đăng ký miễn phí
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
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
            <label htmlFor="login-username" className="block text-sm font-medium mb-2">Tên đăng nhập</label>
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Tên đăng nhập của bạn"
              className={INPUT}
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium mb-2">Mật khẩu</label>
            <div className="relative">
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Nhập mật khẩu"
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

          <button
            type="submit"
            disabled={loading}
            className={`w-full inline-flex items-center justify-center gap-2 rounded-full bg-page-fg text-page-bg px-8 py-4 text-sm font-medium
                        transition-opacity duration-300 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed ${FOCUS}`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden />}
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        {/* Đăng nhập nhanh bằng tài khoản demo */}
        <section aria-labelledby="demo-title" className="mt-10 pt-8 border-t border-page-line">
          <h2 id="demo-title" className="eyebrow text-page-muted">Đăng nhập nhanh — tài khoản demo</h2>
          <div className="mt-4 grid gap-3">
            {DEMO_ACCOUNTS.map((acc) => {
              const Icon = ICONS[acc.role]
              return (
                <button
                  key={acc.username}
                  type="button"
                  disabled={loading}
                  onClick={() => quickLogin(acc.username, acc.password)}
                  className={`group flex items-center gap-3 rounded-card border border-page-line bg-page-surface p-4 text-left
                              transition-colors duration-300 hover:border-page-fg disabled:opacity-60 disabled:cursor-not-allowed ${FOCUS}`}
                >
                  <Icon className="w-5 h-5 shrink-0" aria-hidden />
                  <span>
                    <span className="block text-sm font-medium">{acc.label} · {acc.username}</span>
                    <span className="block text-xs text-page-muted mt-1">Mật khẩu: {acc.password}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
