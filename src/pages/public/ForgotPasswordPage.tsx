import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Info, Loader2 } from 'lucide-react'
import { findDemoAccountByIdentifier, setDemoPassword, type DemoAccount } from '@constants/demoAccounts'
import { FOCUS } from '@utils/focus'
import TextReveal from '@components/motion/TextReveal'
import { usePageEnterDelay } from '@components/motion/PageTransition'

/*
 * Quên mật khẩu — 3 bước trên một trang: nhập tài khoản → nhập mã + mật khẩu mới → xong.
 * Giống LoginPage (cùng cột max-w-md, theme ngà do PublicLayout cấp).
 * TẠM THỜI chạy hoàn toàn ở trình duyệt: mã 6 số sinh ngẫu nhiên và hiện ngay trên trang
 * (chưa có email thật). Khi có backend, thay bằng authService.forgotPassword / resetPassword.
 */
const INPUT = `w-full rounded-control border border-page-edge bg-page-surface px-4 py-3 text-base text-page-fg placeholder:text-page-edge ${FOCUS}`
const PRIMARY = `w-full inline-flex items-center justify-center gap-2 rounded-full bg-page-fg text-page-bg px-8 py-4 text-sm font-medium
                 transition-opacity duration-300 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed ${FOCUS}`
const LINK_BTN = `inline-flex items-center min-h-10 px-1 text-sm font-medium text-page-fg underline underline-offset-4 rounded-control
                  disabled:text-page-muted disabled:no-underline disabled:cursor-not-allowed ${FOCUS}`

type Step = 'request' | 'verify' | 'done'
const RESEND_SECONDS = 30
const TITLES: Record<Step, string> = { request: 'Quên mật khẩu', verify: 'Nhập mã xác nhận', done: 'Đã đặt lại mật khẩu' }

const newCode = () => String(Math.floor(100000 + Math.random() * 900000))

/** Lỗi nhỏ dưới ô nhập, gắn với ô qua aria-describedby */
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="mt-2 flex items-center gap-1.5 text-sm font-medium text-page-fg">
      <AlertCircle className="w-4 h-4 shrink-0" aria-hidden />{message}
    </p>
  )
}

export default function ForgotPasswordPage() {
  const enter = usePageEnterDelay()
  const [step, setStep] = useState<Step>('request')
  const [identifier, setIdentifier] = useState('')
  // Tài khoản khớp (undefined nếu không tồn tại — vẫn sang bước sau để không lộ thông tin)
  const [account, setAccount] = useState<DemoAccount | undefined>()
  const [code, setCode] = useState('')
  const [sentCode, setSentCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errs, setErrs] = useState<{ code?: string; password?: string; confirm?: string }>({})
  const [cooldown, setCooldown] = useState(0)

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
    if (!identifier.trim()) {
      setError('Vui lòng nhập email hoặc tên đăng nhập.')
      return
    }
    setError('')
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600)) // độ trễ giả
    const found = findDemoAccountByIdentifier(identifier)
    setAccount(found)
    setSentCode(found ? newCode() : '')
    setCode(''); setPassword(''); setConfirm(''); setErrs({})
    setCooldown(RESEND_SECONDS)
    setLoading(false)
    setStep('verify')
  }

  const resend = () => {
    if (cooldown > 0) return
    if (account) setSentCode(newCode())
    setCode(''); setErrs({}); setError('')
    setCooldown(RESEND_SECONDS)
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
      password: password.length >= 6 ? undefined : 'Mật khẩu mới cần ít nhất 6 ký tự.',
      confirm: confirm === password ? undefined : 'Mật khẩu nhập lại chưa khớp.',
    }
    setErrs(v)
    setError('')
    if (v.code || v.password || v.confirm) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    if (!account || code !== sentCode) {
      setError('Mã không đúng hoặc đã hết hạn.')
      setLoading(false)
      return
    }
    setDemoPassword(account.username, password)
    setLoading(false)
    setStep('done')
  }

  return (
    <div className="min-h-[calc(100vh-64px)] text-page-fg flex items-start justify-center px-6 py-12 md:py-16">
      <div className="w-full max-w-md">
        {/* key: đổi bước thì tiêu đề trồi lại */}
        <TextReveal key={step} as="h1" immediate delay={step === 'request' ? enter : 0} text={TITLES[step]} className="font-display text-display-sm font-semibold text-page-fg" />

        {step === 'request' && (
          <>
            <p className="text-base text-page-muted mt-3">Nhập email hoặc tên đăng nhập, chúng tôi sẽ gửi mã xác nhận để bạn đặt mật khẩu mới.</p>
            <form onSubmit={requestCode} className="mt-8 space-y-5" noValidate>
              <div>
                <label htmlFor="fp-identifier" className="block text-sm font-medium mb-2">Email hoặc tên đăng nhập</label>
                <input
                  id="fp-identifier"
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? 'fp-identifier-err' : undefined}
                  placeholder="Email hoặc tên đăng nhập của bạn"
                  className={INPUT}
                />
                <FieldError id="fp-identifier-err" message={error} />
              </div>
              <button type="submit" disabled={loading} className={PRIMARY}>
                {loading && <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden />}
                {loading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
              </button>
            </form>
          </>
        )}

        {step === 'verify' && (
          <>
            <p className="text-base text-page-muted mt-3">Nếu tài khoản tồn tại, mã xác nhận 6 số đã được gửi tới email đăng ký.</p>

            {/* Chỉ hiện khi tài khoản có thật — nếu hiện cho mọi trường hợp thì chẳng còn gì để giấu */}
            {account && (
              <div className="mt-6 flex items-start gap-3 rounded-card border border-dashed border-page-line bg-page-surface p-4 text-sm text-page-muted">
                <Info className="w-5 h-5 shrink-0" aria-hidden />
                <p>Bản demo (chưa có email thật): mã của bạn là <strong className="font-semibold text-page-fg tabular-nums tracking-widest">{sentCode}</strong></p>
              </div>
            )}

            <form onSubmit={reset} className="mt-6 space-y-5" noValidate>
              {error && (
                <div role="alert" className="flex items-start gap-3 rounded-card border border-page-fg bg-page-surface p-4 text-sm font-medium text-page-fg">
                  <AlertCircle className="w-5 h-5 shrink-0" aria-hidden />
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="fp-code" className="block text-sm font-medium mb-2">Mã xác nhận</label>
                <input
                  id="fp-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  aria-invalid={errs.code ? true : undefined}
                  aria-describedby={errs.code ? 'fp-code-err' : undefined}
                  placeholder="6 chữ số"
                  className={`${INPUT} tabular-nums tracking-widest`}
                />
                <FieldError id="fp-code-err" message={errs.code} />
              </div>

              <div>
                <label htmlFor="fp-password" className="block text-sm font-medium mb-2">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    id="fp-password"
                    type={showPass ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-invalid={errs.password ? true : undefined}
                    aria-describedby={errs.password ? 'fp-password-err' : 'fp-password-hint'}
                    placeholder="Ít nhất 6 ký tự"
                    className={`${INPUT} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    aria-label={showPass ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className={`absolute right-1 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-10 h-10 rounded-control text-page-muted hover:text-page-fg transition-colors ${FOCUS}`}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" aria-hidden /> : <Eye className="w-4 h-4" aria-hidden />}
                  </button>
                </div>
                {errs.password ? <FieldError id="fp-password-err" message={errs.password} /> : <p id="fp-password-hint" className="mt-2 text-xs text-page-muted">Tối thiểu 6 ký tự.</p>}
              </div>

              <div>
                <label htmlFor="fp-confirm" className="block text-sm font-medium mb-2">Nhập lại mật khẩu mới</label>
                <input
                  id="fp-confirm"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  aria-invalid={errs.confirm ? true : undefined}
                  aria-describedby={errs.confirm ? 'fp-confirm-err' : undefined}
                  placeholder="Nhập lại mật khẩu"
                  className={INPUT}
                />
                <FieldError id="fp-confirm-err" message={errs.confirm} />
              </div>

              <button type="submit" disabled={loading} className={PRIMARY}>
                {loading && <Loader2 className="w-4 h-4 animate-spin motion-reduce:animate-none" aria-hidden />}
                {loading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4">
              <button type="button" onClick={resend} disabled={cooldown > 0 || loading} className={LINK_BTN}>
                {cooldown > 0 ? `Gửi lại mã (${cooldown}s)` : 'Gửi lại mã'}
              </button>
              <button type="button" onClick={backToRequest} className={LINK_BTN}>Đổi email</button>
            </div>
          </>
        )}

        {step === 'done' && (
          <>
            <p className="text-base text-page-muted mt-3" role="status">Mật khẩu mới đã có hiệu lực. Hãy đăng nhập lại bằng mật khẩu này.</p>
            <Link
              to="/dang-nhap"
              state={{ username: account?.username }}
              className={`${PRIMARY} mt-8`}
            >
              Đến trang đăng nhập
            </Link>
          </>
        )}

        {step !== 'done' && (
          <p className="text-sm text-page-muted mt-8">
            Nhớ ra mật khẩu rồi?{' '}
            <Link to="/dang-nhap" className={`font-medium text-page-fg underline underline-offset-4 rounded-control ${FOCUS}`}>Đăng nhập</Link>
          </p>
        )}
      </div>
    </div>
  )
}
