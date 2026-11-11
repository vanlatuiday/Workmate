import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Info, KeyRound, Lock, Mail, User } from 'lucide-react'
import { useAuthStore } from '@context/authStore'
import { useCatalogStore } from '@context/catalogStore'
import { apiErrorMessage, authService } from '@services/authService'
import { AuthField, ErrorBox, Item, LINK_BTN, PasswordStrength, RoleSwitch, ShowPassButton, Stagger, SubmitButton, TEXT_LINK, type AuthRole } from './shared'
import { AUTH_PATHS, confirmError, passwordMinError, registerEmailError, useFieldTouch, useFocusFirst, type AuthFormProps } from './authShared'

/*
 * Đăng ký 2 bước: điền thông tin → nhập mã gửi về email. Đúng mã máy chủ mới tạo tài khoản và đăng nhập luôn.
 * Là nửa "form" của AuthPage.
 */
const RESEND_SECONDS = 60
type Role = AuthRole

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
  // Bước nhập mã: có email nghĩa là máy chủ đã gửi mã (mật khẩu giữ trong form để gửi kèm khi xác nhận)
  const [pendingEmail, setPendingEmail] = useState('')
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [cooldown, setCooldown] = useState(0)
  // DEMO-ONLY: chỉ có trên máy cá nhân chưa cấu hình email, production không bao giờ có
  const [devCode, setDevCode] = useState('')
  useFocusFirst(root, focus || !!pendingEmail, pendingEmail)
  const { touch, show, submit } = useFieldTouch(root)
  const nameErr = form.fullName.trim() ? undefined : role === 'recruiter' ? 'Vui lòng nhập tên người liên hệ' : 'Vui lòng nhập họ và tên'
  const emailErr = registerEmailError(form.email)
  const passErr = passwordMinError(form.password)
  const confirmErr = confirmError(form.confirm, form.password)

  // Đếm ngược để mở lại nút "Gửi lại mã"
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  // Quản trị viên có thể tạm dừng đăng ký (Cấu hình hệ thống)
  const registrationOpen = useCatalogStore((s) => s.config.registrationOpen)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    if (submit([
      { id: 'reg-name', error: nameErr }, { id: 'reg-email', error: emailErr },
      { id: 'reg-password', error: passErr }, { id: 'reg-confirm', error: confirmErr },
    ])) {
      setError('')
      shake()
      return
    }
    setError('')
    setLoading(true)
    try {
      const { data } = await authService.register({ email: form.email.trim(), password: form.password, role, name: form.fullName.trim() })
      setDevCode(data.devCode ?? '')
      setCode('')
      setCodeError('')
      setCooldown(RESEND_SECONDS)
      setPendingEmail(data.email)
    } catch (err) {
      setError(apiErrorMessage(err, 'Chưa gửi được mã xác nhận, vui lòng thử lại.'))
      shake()
    } finally {
      setLoading(false)
    }
  }

  const verify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    if (!/^\d{6}$/.test(code)) {
      setCodeError('Mã gồm đúng 6 chữ số.')
      shake()
      return
    }
    setCodeError('')
    setError('')
    setLoading(true)
    let res
    try {
      res = (await authService.verifyEmail(pendingEmail, code, form.password)).data
    } catch (err) {
      setError(apiErrorMessage(err, 'Mã không đúng hoặc đã hết hạn.'))
      setLoading(false)
      shake()
      return
    }
    // Thẻ mờ đi xong mới đổi trang
    await leave()
    setUser(res.user, res.token)
    navigate('/')
  }

  const resend = async () => {
    if (cooldown > 0 || loading) return
    setCode(''); setCodeError(''); setError('')
    setCooldown(RESEND_SECONDS)
    try {
      const { data } = await authService.resendVerification(pendingEmail)
      setDevCode(data.devCode ?? '')
      toast.success('Đã gửi lại mã, mã trước không còn dùng được')
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  if (pendingEmail) {
    return (
      <Stagger key="verify">
        <div ref={root}>
          <Item>
            <h1 className="font-display text-3xl font-semibold text-page-fg">Xác nhận email</h1>
          </Item>
          <Item>
            <p className="mt-3 text-sm text-page-muted">
              Mã 6 số đã được gửi tới <strong className="break-all font-medium text-page-fg">{pendingEmail}</strong> và có hiệu lực 15 phút. Không thấy thư thì xem cả mục Thư rác.
            </p>
          </Item>
          {devCode && (
            <Item className="mt-3">
              <div className="flex items-start gap-3 rounded-card border border-dashed border-page-line bg-page-surface p-3 text-sm text-page-muted">
                <Info className="h-5 w-5 shrink-0" aria-hidden />
                <p>Bản demo (chưa cấu hình email): mã của bạn là <strong className="font-semibold tabular-nums tracking-widest text-page-fg">{devCode}</strong></p>
              </div>
            </Item>
          )}
          <form onSubmit={verify} className="mt-3 space-y-2" noValidate>
            {error && <Item><ErrorBox message={error} /></Item>}
            <Item>
              <AuthField
                id="reg-code"
                label="Mã xác nhận (6 chữ số)"
                icon={KeyRound}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(v) => setCode(v.replace(/\D/g, ''))}
                error={codeError}
                className="tabular-nums tracking-widest"
              />
            </Item>
            <Item className="pt-2">
              <SubmitButton loading={loading} idle="Xác nhận và vào Workmate" busy="Đang xác nhận..." />
            </Item>
          </form>
          <Item className="mt-2">
            <div className="flex flex-wrap items-center justify-between gap-x-4">
              <button type="button" onClick={resend} disabled={cooldown > 0 || loading} className={LINK_BTN}>
                {cooldown > 0 ? `Gửi lại mã (${cooldown}s)` : 'Gửi lại mã'}
              </button>
              <button type="button" onClick={() => { setPendingEmail(''); setError('') }} className={LINK_BTN}>Sửa thông tin</button>
            </div>
          </Item>
        </div>
      </Stagger>
    )
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
          <RoleSwitch value={role} onChange={setRole} />
        </Item>

        <form onSubmit={handleSubmit} className="mt-3 space-y-2" noValidate>
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
              onBlur={() => touch('reg-name')}
              error={show('reg-name', nameErr)}
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
              onBlur={() => touch('reg-email')}
              error={show('reg-email', emailErr)}
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
              value={form.password}
              onChange={(password) => setForm({ ...form, password })}
              onBlur={() => touch('reg-password')}
              error={show('reg-password', passErr)}
              trailing={<ShowPassButton shown={showPass} onToggle={() => setShowPass(!showPass)} />}
            />
            <PasswordStrength password={form.password} />
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
              onBlur={() => touch('reg-confirm')}
              error={show('reg-confirm', confirmErr)}
            />
          </Item>

          <Item className="pt-2">
            <SubmitButton loading={loading} idle="Tiếp tục" busy="Đang gửi mã xác nhận..." />
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
