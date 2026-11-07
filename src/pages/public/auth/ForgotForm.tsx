import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Info, KeyRound, Lock, User } from 'lucide-react'
import { findDemoAccountByIdentifier, setDemoPassword, type DemoAccount } from '@constants/demoAccounts'
import { AuthField, ErrorBox, Item, LINK_BTN, PRIMARY, ShowPassButton, Stagger, SubmitButton, TEXT_LINK } from './shared'
import { AUTH_PATHS, useFocusFirst, type AuthFormProps } from './authShared'

/*
 * Quên mật khẩu — 3 bước trong một form: nhập tài khoản → nhập mã + mật khẩu mới → xong.
 * Là nửa "form" của AuthPage (cùng thẻ kính với Đăng nhập / Đăng ký).
 * TẠM THỜI chạy hoàn toàn ở trình duyệt: mã 6 số sinh ngẫu nhiên và hiện ngay trên trang
 * (chưa có email thật). Khi có backend, thay bằng authService.forgotPassword / resetPassword.
 */
type Step = 'request' | 'verify' | 'done'
const RESEND_SECONDS = 30
const TITLES: Record<Step, string> = { request: 'Quên mật khẩu', verify: 'Nhập mã xác nhận', done: 'Đã đặt lại mật khẩu' }

const newCode = () => String(Math.floor(100000 + Math.random() * 900000))

export default function ForgotForm({ delay, focus, shake }: AuthFormProps) {
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
  const root = useRef<HTMLDivElement>(null)
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
    if (!identifier.trim()) {
      setError('Vui lòng nhập email hoặc tên đăng nhập.')
      shake()
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
    if (v.code || v.password || v.confirm) {
      shake()
      return
    }
    setLoading(true)
    await new Promise((r) => setTimeout(r, 600))
    if (!account || code !== sentCode) {
      setError('Mã không đúng hoặc đã hết hạn.')
      setLoading(false)
      shake()
      return
    }
    setDemoPassword(account.username, password)
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
              <p className="text-base text-page-muted">Nhập email hoặc tên đăng nhập, chúng tôi sẽ gửi mã xác nhận để bạn đặt mật khẩu mới.</p>
            </Item>
            <Item>
              <AuthField
                id="fp-identifier"
                label="Email hoặc tên đăng nhập"
                icon={User}
                type="text"
                autoComplete="username"
                value={identifier}
                onChange={setIdentifier}
                error={error}
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
              <p className="text-sm text-page-muted mt-3">Nếu tài khoản tồn tại, mã xác nhận 6 số đã được gửi tới email đăng ký.</p>
            </Item>

            {/* DEMO-ONLY: xóa khi có backend — hiện mã ngay trên trang vì chưa có email thật (bắt đầu).
                Chỉ hiện khi tài khoản có thật — nếu hiện cho mọi trường hợp thì chẳng còn gì để giấu */}
            {account && (
              <Item className="mt-3">
                <div className="flex items-start gap-3 rounded-card border border-dashed border-page-line bg-page-surface p-3 text-sm text-page-muted">
                  <Info className="w-5 h-5 shrink-0" aria-hidden />
                  <p>Bản demo (chưa có email thật): mã của bạn là <strong className="font-semibold text-page-fg tabular-nums tracking-widest">{sentCode}</strong></p>
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
                  label="Mật khẩu mới (ít nhất 6 ký tự)"
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
              <Link to={AUTH_PATHS.login} state={{ username: account?.username }} className={PRIMARY}>
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
