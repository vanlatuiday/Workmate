import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Briefcase, AlertCircle } from 'lucide-react'
import { useBannedCheck } from '@hooks/useBannedCheck'
import { GateError, GateSkeleton, useEnsureCompany } from '@components/common/OnboardingGate'
import { useAuthStore } from '@context/authStore'
import { useCatalogStore } from '@context/catalogStore'
import { useCompanyStore } from '@context/companyStore'
import { apiErrorMessage } from '@services/authService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { BTN_ACCENT, BTN_GHOST, BTN_SECONDARY, BTN_SM } from '@utils/ui'
import DustField from '@components/motion/DustField'
import { EMAIL_RE } from '../CompanyProfile'
import { StepContact, StepCulture, StepIntro, StepName, StepTax, type Draft, type SetDraft } from './steps'

/** /tuyen-dung/bat-dau — form bắt đầu của nhà tuyển dụng: 5 bước ở đây, bước 6 (đăng tin đầu tiên) là /dang-tin?bat-dau=1. */

const TOTAL = 6

const TITLES: Record<number, string> = {
  1: 'Mã số doanh nghiệp',
  2: 'Tên và ảnh đại diện',
  3: 'Giới thiệu',
  4: 'Môi trường và phúc lợi',
  5: 'Liên hệ',
}

/** Trường nào thuộc bước nào (bước 2–5 lưu bằng PATCH khi bấm "Tiếp theo") */
const STEP_KEYS: Record<number, (keyof Draft)[]> = {
  2: ['name', 'industry', 'district', 'size', 'address'],
  3: ['tagline', 'about', 'cover'],
  4: ['environment', 'values', 'policies', 'culture'],
  5: ['email', 'phone'],
}

export default function OnboardingPage() {
  const { loaded, loadFailed } = useEnsureCompany()
  // Ẩn chuông + tin nhắn nổi trong lúc làm form (CSS: html[data-onboarding] [data-floating])
  useEffect(() => {
    document.documentElement.setAttribute('data-onboarding', '')
    return () => document.documentElement.removeAttribute('data-onboarding')
  }, [])
  if (!loaded) return loadFailed ? <GateError /> : <GateSkeleton />
  return <Wizard />
}

function Wizard() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const logout = useAuthStore((s) => s.logout)
  const profile = useCompanyStore((s) => s.profile)
  const savedAddress = useCompanyStore((s) => s.address)
  const logoUrl = useCompanyStore((s) => s.logoUrl)
  const missing = useCompanyStore((s) => s.missingRequired)
  const needsOnboarding = useCompanyStore((s) => s.needsOnboarding)
  const onboardedAt = useCompanyStore((s) => s.onboardedAt)
  const nameBanned = useCompanyStore((s) => s.nameBanned)
  const update = useCompanyStore((s) => s.update)
  const complete = useCompanyStore((s) => s.completeOnboarding)

  const [draft, setDraft] = useState<Draft>(() => ({ ...profile, address: savedAddress }))
  const set: SetDraft = (k, v) => setDraft((d) => ({ ...d, [k]: v }))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | undefined>()
  // Đang hoàn thành: không bị đẩy về /tuyen-dung khi cờ needsOnboarding vừa tắt
  const finishing = useRef(false)

  // Bước cao nhất được vào: còn thiếu mã số → 1, thiếu tên/logo → 2, đủ rồi → 5
  // Đã hoàn thành form từ trước nhưng tên hiện tại có cụm từ cấm → buộc đặt lại tên
  const reentry = !!onboardedAt && nameBanned.length > 0
  const hasMissing = missing.length > 0
  const limit = missing.includes('taxCode') ? 1 : hasMissing ? 2 : 5
  // Bước mở đầu khi URL chưa có ?buoc: chốt một lần lúc vào trang (không đổi theo cờ "còn thiếu" về sau)
  const [initial] = useState(limit === 5 ? 1 : limit)
  const raw = Number(params.get('buoc'))
  const step = Number.isInteger(raw) && raw >= 1 ? Math.min(raw, 5, limit) : Math.min(initial, limit)
  // Dò cụm từ cấm khi gõ: tên ở bước 2, giới thiệu ở bước 3
  const bannedName = useBannedCheck(draft.name, step === 2)
  const bannedTagline = useBannedCheck(draft.tagline, step === 3)
  const bannedAbout = useBannedCheck(draft.about, step === 3)
  // Ghi bước hiện tại lên URL để tải lại trang vẫn ở đúng bước
  useEffect(() => {
    if (!needsOnboarding) return // đã xong form: đang được chuyển đi, không ghi đè URL
    if (params.get('buoc') !== String(step)) setParams({ buoc: String(step) }, { replace: true })
  }, [params, step, setParams, needsOnboarding])

  if (!needsOnboarding && !finishing.current) return <Navigate to="/tuyen-dung" replace />

  const go = (n: number) => { setError(null); setEmailError(undefined); setParams({ buoc: String(n) }) }

  // Lý do chưa cho "Tiếp theo" ở bước bắt buộc
  const blockReason =
    step === 1 ? (missing.includes('taxCode') ? 'Lưu một mã số đang hoạt động để tiếp tục.' : null)
    : step === 2 ? (bannedName.length > 0 ? 'Tên công ty có cụm từ không được phép' : draft.name.trim().length < 2 ? 'Nhập tên doanh nghiệp (ít nhất 2 ký tự) để tiếp tục.' : !logoUrl ? 'Tải logo công ty lên để tiếp tục.' : null)
    : step === 3 ? (bannedTagline.length + bannedAbout.length > 0 ? 'Nội dung có cụm từ không được phép' : null)
    : null

  const finish = async (save: boolean) => {
    setError(null); setBusy(true); finishing.current = true
    try {
      if (save) await savePatch(5)
      await complete()
      void useCatalogStore.getState().load().catch(() => undefined)
      navigate('/dang-tin?bat-dau=1')
    } catch (err) {
      finishing.current = false
      setError(apiErrorMessage(err, 'Chưa hoàn thành được, vui lòng thử lại.'))
      setBusy(false)
    }
  }

  /** Chỉ gửi các trường của bước đã đổi so với bản đã lưu */
  const savePatch = async (n: number) => {
    const saved: Draft = { ...profile, address: savedAddress }
    const patch: Record<string, unknown> = {}
    for (const k of STEP_KEYS[n] ?? []) {
      if (JSON.stringify(draft[k]) !== JSON.stringify(saved[k])) patch[k] = typeof draft[k] === 'string' ? (draft[k] as string).trim() : draft[k]
    }
    if (Object.keys(patch).length) await update(patch)
  }

  const next = async () => {
    if (blockReason || busy) return
    if (step === 5) {
      if (draft.email.trim() && !EMAIL_RE.test(draft.email.trim())) { setEmailError('Email chưa hợp lệ.'); return }
      await finish(true)
      return
    }
    if (step >= 2) {
      setError(null); setBusy(true)
      try { await savePatch(step) } catch (err) {
        setError(apiErrorMessage(err, 'Chưa lưu được, vui lòng thử lại.')); setBusy(false); return
      }
      setBusy(false)
      // Công ty đã xong form từ trước, chỉ bị buộc đặt lại tên: lưu tên hợp lệ xong là về trang quản lý, không đi tiếp bước 3–6
      if (reentry && step === 2) { navigate('/tuyen-dung', { replace: true }); return }
    }
    go(step + 1)
  }

  const skip = () => { if (step === 5) void finish(false); else go(step + 1) }
  const optional = step >= 3

  return (
    <div className="theme-night relative isolate min-h-screen overflow-x-hidden bg-page-bg text-page-fg">
      {/* Nền đen rêu + hạt bụi, cùng trang Đăng nhập/Đăng ký */}
      <DustField className="-z-10" />

      <header className="flex h-16 items-center justify-between px-4 sm:px-6">
        <Link to="/" className={cn('flex items-center gap-2 rounded-control font-display text-lg font-semibold', FOCUS)}>
          <Briefcase className="h-5 w-5" aria-hidden="true" />Workmate
        </Link>
        <button type="button" onClick={() => { logout(); navigate('/dang-nhap') }} className={cn(BTN_GHOST, BTN_SM)}>Đăng xuất</button>
      </header>

      <main className="mx-auto w-full max-w-[720px] px-4 pb-10 pt-4 md:pb-14 md:pt-8">
        {/* Thẻ kính tối duy nhất (DESIGN.md: ngoại lệ thứ năm), giống thẻ Đăng ký */}
        <div className="glass-dark rounded-card p-5 sm:p-8 md:p-10">
          <p className="text-sm font-medium text-page-muted" aria-live="polite">Bước {step}/{TOTAL}</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-page-line" role="progressbar" aria-label="Tiến độ" aria-valuemin={1} aria-valuemax={TOTAL} aria-valuenow={step}>
            <div className="h-full w-full origin-left rounded-full bg-page-fg transition-transform duration-base ease-editorial motion-reduce:transition-none" style={{ transform: `scaleX(${step / TOTAL})` }} />
          </div>

          {/* key theo bước: mỗi lần đổi bước nội dung vào lại bằng opacity + trượt nhẹ (onboard-step, bỏ trượt khi giảm chuyển động) */}
          {reentry && step === 2 && (
            <p role="alert" className="mt-5 flex items-start gap-1.5 rounded-control border border-danger px-3 py-2 text-sm font-medium text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <span className="min-w-0 break-words">Tên công ty hiện tại có cụm từ không được phép ({nameBanned.join(', ')}). Hãy đặt tên khác để tiếp tục dùng Workmate.</span>
            </p>
          )}

          <div key={step} className="onboard-step">
            <h1 className="mt-6 font-display text-2xl font-medium md:text-3xl">{TITLES[step]}</h1>
            <section className="mt-2">
              {step === 1 && <StepTax />}
              {step === 2 && <StepName draft={draft} set={set} banned={bannedName} />}
              {step === 3 && <StepIntro draft={draft} set={set} bannedTagline={bannedTagline} bannedAbout={bannedAbout} />}
              {step === 4 && <StepCulture draft={draft} set={set} />}
              {step === 5 && <StepContact draft={draft} set={set} emailError={emailError} />}
            </section>
          </div>

          {error && (
            <p role="alert" className="mt-4 flex items-start gap-1.5 text-sm font-medium text-danger">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" /><span className="min-w-0 break-words">{error}</span>
            </p>
          )}
          {blockReason && <p className="mt-4 text-sm text-page-muted">{blockReason}</p>}

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-page-line pt-5">
            {step > 1 && <button type="button" disabled={busy} onClick={() => go(step - 1)} className={BTN_SECONDARY}>Quay lại</button>}
            <button type="button" disabled={!!blockReason || busy} onClick={() => { void next() }} className={BTN_ACCENT}>
              {busy ? 'Đang lưu…' : 'Tiếp theo'}
            </button>
            {optional && <button type="button" disabled={busy} onClick={skip} className={BTN_GHOST}>Bỏ qua</button>}
          </div>
        </div>
      </main>
    </div>
  )
}
