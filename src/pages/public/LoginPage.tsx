import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Briefcase, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuthStore } from '@context/authStore'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { setUser } = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // TODO: call authService.login
      // Mock: demo login
      await new Promise((r) => setTimeout(r, 800))
      const role = form.email.includes('recruiter') ? 'recruiter'
        : form.email.includes('admin') ? 'admin'
        : 'jobseeker'
      setUser({ id: '1', email: form.email, role, createdAt: new Date().toISOString() }, 'mock-token')
      navigate(role === 'recruiter' ? '/tuyen-dung' : role === 'admin' ? '/admin' : '/tim-viec')
    } catch {
      setError('Email hoặc mật khẩu không đúng.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-primary-600 font-bold text-xl">
            <Briefcase className="w-6 h-6" />
            Workmate
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Đăng nhập</h1>
          <p className="text-sm text-gray-500 mt-1">
            Chưa có tài khoản?{' '}
            <Link to="/dang-ky" className="text-primary-600 font-medium hover:underline">
              Đăng ký miễn phí
            </Link>
          </p>
        </div>

        <div className="card p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                <Link to="/quen-mat-khau" className="text-xs text-primary-600 hover:underline">
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
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

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-400">hoặc đăng nhập bằng</span>
            </div>
          </div>

          <button className="btn-secondary w-full justify-center py-2.5 text-sm">
            <img src="https://www.google.com/favicon.ico" alt="" className="w-4 h-4" />
            Google
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Demo: dùng email chứa "recruiter" để login nhà tuyển dụng, "admin" cho admin.
        </p>
      </div>
    </div>
  )
}
