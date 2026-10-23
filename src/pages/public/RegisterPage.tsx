import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Briefcase, Eye, EyeOff, Loader2, Search, Building2 } from 'lucide-react'
import { useAuthStore } from '@context/authStore'

type Role = 'jobseeker' | 'recruiter'

export default function RegisterPage() {
  const [searchParams] = useSearchParams()
  const defaultRole = (searchParams.get('role') as Role) ?? 'jobseeker'

  const [role, setRole] = useState<Role>(defaultRole)
  const [form, setForm] = useState({ email: '', password: '', confirm: '', fullName: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { setUser } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirm) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }
    setError('')
    setLoading(true)
    try {
      // TODO: call authService.register
      await new Promise((r) => setTimeout(r, 800))
      setUser({ id: '1', email: form.email, role, createdAt: new Date().toISOString() }, 'mock-token')
      navigate(role === 'recruiter' ? '/tuyen-dung/ho-so-cong-ty' : '/tim-viec/ho-so')
    } catch {
      setError('Đã xảy ra lỗi. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-600 font-bold text-xl">
            <Briefcase className="w-6 h-6" />
            Workmate
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Tạo tài khoản</h1>
          <p className="text-sm text-gray-500 mt-1">
            Đã có tài khoản?{' '}
            <Link to="/dang-nhap" className="text-primary-600 font-medium hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setRole('jobseeker')}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
              role === 'jobseeker'
                ? 'border-primary-500 bg-primary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Search className={`w-6 h-6 ${role === 'jobseeker' ? 'text-primary-600' : 'text-gray-400'}`} />
            <span className={`text-sm font-medium ${role === 'jobseeker' ? 'text-primary-700' : 'text-gray-600'}`}>
              Tìm việc
            </span>
          </button>
          <button
            type="button"
            onClick={() => setRole('recruiter')}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
              role === 'recruiter'
                ? 'border-secondary-500 bg-secondary-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Building2 className={`w-6 h-6 ${role === 'recruiter' ? 'text-secondary-600' : 'text-gray-400'}`} />
            <span className={`text-sm font-medium ${role === 'recruiter' ? 'text-secondary-700' : 'text-gray-600'}`}>
              Tuyển dụng
            </span>
          </button>
        </div>

        <div className="card p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {role === 'recruiter' ? 'Tên người liên hệ' : 'Họ và tên'}
              </label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Nguyễn Văn A"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Tối thiểu 8 ký tự"
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu</label>
              <input
                type="password"
                required
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                placeholder="Nhập lại mật khẩu"
                className="input"
              />
            </div>

            <p className="text-xs text-gray-400">
              Bằng cách đăng ký, bạn đồng ý với{' '}
              <a href="#" className="text-primary-600 hover:underline">Điều khoản dịch vụ</a>{' '}
              và{' '}
              <a href="#" className="text-primary-600 hover:underline">Chính sách bảo mật</a>.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
