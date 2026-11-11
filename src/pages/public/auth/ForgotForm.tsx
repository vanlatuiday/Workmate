import toast from 'react-hot-toast'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Info, KeyRound, Lock, Mail } from 'lucide-react'
import { apiErrorMessage, authService } from '@services/authService'
import { AuthField, ErrorBox, Item, LINK_BTN, PRIMARY, ShowPassButton, Stagger, SubmitButton, TEXT_LINK } from './shared'
import { AUTH_PATHS, confirmError, loginEmailError, passwordMinError, useFieldTouch, useFocusFirst, type AuthFormProps } from './authShared'

/*
 * Quên mật khẩu — 3 bước trong một form: nhập tài khoản → nhập mã + mật khẩu mới → xong.
 * Là nửa "form" của AuthPage (cùng thẻ kính với Đăng nhập / Đăng ký).
 * Mã xác nhận (OTP) gửi tới email của tài khoản. Trên máy cá nhân chưa cấu hình email thì máy chủ trả kèm
 * `devCode` và trang hiện mã ngay (khối DEMO-ONLY bên dưới); production không bao giờ có `devCode`.
 */
type Step = 'request' | 'verify' | 'done'
const RESEND_SECONDS = 60
const TITLES: Record<Step, string> = { request: 'Quên mật khẩu', verify: 'Nhập mã xác nhận', done: 'Đã đặt lại mật khẩu' }

export default function ForgotForm({ delay, focus, shake }: AuthFormProps) {
  const [step, setStep] = useState<Step>('request')
  const [identifier, setIdentifier] = useState('')
  // DEMO-ONLY: mã do máy chủ trả về khi chưa cấu hình email (không có nếu tài khoản không tồn tại, đã có email hoặc chạy production)
  const [devCode, setDevCode] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errs, setErrs] = useState<{ code?: string; password?: string; confirm?: string }>({})
  const [cooldown, setCooldown] = useState(0)
  const root = useRef<HTMLDivElement>(null)
  const { touch, show, submit } = useFieldTouch(root)
  const idErr = loginEmailError(identifier)
  // Vừa chuyển từ chế độ khác sang, hoặc sang bước mới → đưa focus vào ô đầu của bước đó
  useFocusFirst(root, focus || step !== 'request', step)

  // Đếm ngược để mở lại nút "Gửi lại mã"
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  // Bước 1: luôn sang bước 2 dù tài khoản có tồn tại hay không
  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    if (submit([{ id: 'fp-identifier', error: idErr }])) {
      shake()
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await authService.forgotPassword(identifier.trim())
      setDevCode(res.data.devCode ?? '')
    } catch (err) {
      setError(apiErrorMessage(err))
      setLoading(false)
      shake()
      return
    }
    setCode(''); setPassword(''); setConfirm(''); setErrs({})
    setCooldown(RESEND_SECONDS)
    setLoading(false)
    setStep('verify')
  }

  const resend = async () => {
    if (cooldown > 0 || loading) return
    setCode(''); setErrs({}); setError('')
    setCooldown(RESEND_SECONDS)
    try {
      const res = await authService.forgotPassword(identifier.trim())
      setDevCode(res.data.devCode ?? '')
      toast.success('Đã gửi lại mã, mã trước không còn dùng được')
    } catch (err) {
      setError(apiErrorMessage(err))
    }
  }

  const backToRequest = () => {
    setError(''); setErrs({})
    setStep('request')
  }

  // Bước 2: kiểm tra ô, rồi mã, rồi đổi mật khẩu
  const reset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    const v = {
      code: /^\d{6}$/.test(code) ? undefined : 'Mã gồm đúng 6 chữ số.',
      password: passwordMinError(password),
      confirm: confirmError(confirm, password),
    }
    setErrs(v)
    setError('')
    if (v.code || v.password || v.confirm) {
      shake()
      const firstId = v.code ? 'fp-code' : v.password ? 'fp-password' : 'fp-confirm'
      root.current?.querySelector<HTMLElement>(`#${firstId}`)?.focus()
      return
    }
    setLoading(true)
    try {
      await authService.resetPassword(identifier.trim(), code, password)
    } catch (err) {
      setError(apiErrorMessage(err, 'Mã không đúng hoặc đã hết hạn.'))
      setLoading(false)
      shake()
      return
    }
    setLoading(false)
    setStep('done')
  }

  // key theo bước: đổi bước thì các ô hiện lại từ đầu (bước đầu theo `delay`, các bước sau hiện ngay)
  return (
    <Stagger key={step} delay={step === 'request' ? delay : 0}>
      <div ref={root}>
        <Item>
          <h1
            data-autofocus={step === 'done' ? '' : undefined}
            tabIndex={step === 'done' ? -1 : undefined}
            className="font-display text-3xl font-semibold text-page-fg focus:outline-none"
          >
            {TITLES[step]}
          </h1>
        </Item>

        {step === 'request' && (
          <form onSubmit={requestCode} className="mt-5 space-y-4" noValidate>
            <Item>
              <p className="text-base text-page-muted">Nhập email của tài khoản, chúng tôi sẽ gửi mã xác nhận để bạn đặt mật khẩu mới.</p>
            </Item>
            <Item>
              <AuthField
                id="fp-identifier"
                label="Email"
                icon={Mail}
                type="text"
                inputMode="email"
                autoComplete="username"
                required
                value={identifier}
                onChange={setIdentifier}
                onBlur={() => touch('fp-identifier')}
                error={show('fp-identifier', idErr) ?? (error || undefined)}
              />
            </Item>
            <Item>
              <SubmitButton loading={loading} idle="Gửi mã xác nhận" busy="Đang gửi..." />
            </Item>
          </form>
        )}

        {step === 'verify' && (
          <>
            <Item>
              <p className="text-sm text-page-muted mt-3">Nếu tài khoản tồn tại, mã xác nhận 6 số đã được gửi tới email đăng ký và có hiệu lực 15 phút. Không thấy thư thì xem cả mục Thư rác.</p>
            </Item>

            {/* DEMO-ONLY: xóa khi có backend — hiện mã ngay trên trang vì chưa có email thật (bắt đầu).
                Chỉ hiện khi máy chủ trả devCode (tài khoản có thật, không phải production) */}
            {devCode && (
              <Item className="mt-3">
                <div className="flex items-start gap-3 rounded-card border border-dashed border-page-line bg-page-surface p-3 text-sm text-page-muted">
                  <Info className="w-5 h-5 shrink-0" aria-hidden />
                  <p>Bản demo (chưa có email thật): mã của bạn là <strong className="font-semibold text-page-fg tabular-nums tracking-widest">{devCode}</strong></p>
                </div>
              </Item>
            )}
            {/* DEMO-ONLY: xóa khi có backend — kết thúc */}

            <form onSubmit={reset} className="mt-3 space-y-2" noValidate>
              {error && <Item><ErrorBox message={error} /></Item>}

              <Item>
                <AuthField
                  id="fp-code"
                  label="Mã xác nhận (6 chữ số)"
                  icon={KeyRound}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(v) => setCode(v.replace(/\D/g, ''))}
                  error={errs.code}
                  className="tabular-nums tracking-widest"
                />
              </Item>

              <Item>
                <AuthField
                  id="fp-password"
                  label="Mật khẩu mới (tối thiểu 8 ký tự)"
                  icon={Lock}
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={setPassword}
                  error={errs.password}
                  trailing={<ShowPassButton shown={showPass} onToggle={() => setShowPass(!showPass)} />}
                />
              </Item>

              <Item>
                <AuthField
                  id="fp-confirm"
                  label="Nhập lại mật khẩu mới"
                  icon={Lock}
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={setConfirm}
                  error={errs.confirm}
                />
              </Item>

              <Item className="pt-2">
                <SubmitButton loading={loading} idle="Đặt lại mật khẩu" busy="Đang đặt lại..." />
              </Item>
            </form>

            <Item className="mt-2">
              <div className="flex flex-wrap items-center justify-between gap-x-4">
                <button type="button" onClick={resend} disabled={cooldown > 0 || loading} className={LINK_BTN}>
                  {cooldown > 0 ? `Gửi lại mã (${cooldown}s)` : 'Gửi lại mã'}
                </button>
                <button type="button" onClick={backToRequest} className={LINK_BTN}>Đổi email</button>
              </div>
            </Item>
          </>
        )}

        {step === 'done' && (
          <>
            <Item>
              <p className="text-base text-page-muted mt-3" role="status">Mật khẩu mới đã có hiệu lực. Hãy đăng nhập lại bằng mật khẩu này.</p>
            </Item>
            <Item className="mt-6">
              <Link to={AUTH_PATHS.login} state={{ username: identifier.trim() }} className={PRIMARY}>
                Đến trang đăng nhập
              </Link>
            </Item>
          </>
        )}

        {step !== 'done' && (
          <Item className="mt-4">
            <p className="text-sm text-page-muted">
              Nhớ ra mật khẩu rồi?{' '}
              <Link to={AUTH_PATHS.login} className={TEXT_LINK}>Đăng nhập</Link>
            </p>
          </Item>
        )}
      </div>
    </Stagger>
  )
}
