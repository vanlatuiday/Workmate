import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Briefcase } from 'lucide-react'
import DustField from '@components/motion/DustField'
import { usePublicProfile } from '@hooks/usePublicProfile'
import { useProfileStore } from '@context/profileStore'
import { AvailabilityGrid, SkillsFields, WantsFields } from '@pages/public/profile/Sections'
import { Switch } from '@pages/public/profile/ui'
import { useProfileDraft } from '@pages/public/profile/useProfileDraft'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { BTN_ACCENT, BTN_GHOST, BTN_SECONDARY, BTN_SM } from '@utils/ui'

/**
 * /tim-viec/bat-dau — hướng dẫn lần đầu cho người tìm việc mới (không bắt buộc; ai cũng bỏ qua được ở mọi bước).
 * 3 bước: lịch rảnh → kỹ năng và mong muốn → công khai hồ sơ. Lưu qua profileStore.update (cùng đồng bộ với /ho-so).
 */

const TOTAL = 3
const TITLES: Record<number, string> = { 1: 'Lịch rảnh', 2: 'Kỹ năng và mong muốn', 3: 'Công khai hồ sơ' }
const INTROS: Record<number, string> = {
  1: 'Chọn các buổi bạn có thể đi làm. Hệ thống dùng lịch này để gợi ý việc không trùng giờ. Bạn sửa lại được bất cứ lúc nào.',
  2: 'Kỹ năng, mức lương và khoảng cách giúp Workmate tính điểm phù hợp sát với bạn hơn.',
  3: 'Công khai nghĩa là mọi nhà tuyển dụng tìm thấy và gợi ý bạn cho tin phù hợp. Liên hệ của bạn chỉ mở sau khi hai bên kết nối.',
}

const SESSION_EVENING = 2
const WEEKEND_DAYS = [5, 6]

export default function JobseekerOnboardingPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const api = useProfileDraft()
  const { isPublic, setPublic } = usePublicProfile()
  // Mặc định bật; chỉ áp dụng khi bấm "Xem việc phù hợp"
  const [wantPublic, setWantPublic] = useState(true)

  // Ẩn chuông + tin nhắn nổi trong lúc làm form (CSS: html[data-onboarding] [data-floating])
  useEffect(() => {
    document.documentElement.setAttribute('data-onboarding', '')
    return () => document.documentElement.removeAttribute('data-onboarding')
  }, [])

  const raw = Number(params.get('buoc'))
  const step = Number.isInteger(raw) && raw >= 1 ? Math.min(raw, TOTAL) : 1
  const go = (n: number) => setParams({ buoc: String(n) })
  const skip = () => navigate('/tim-viec')

  /** Thêm ca vào lịch rảnh (không bỏ ca đã chọn) */
  const addSlots = (keys: string[]) => {
    const cur = useProfileStore.getState().profile.availability
    api.set('availability', [...new Set([...cur, ...keys])])
  }
  const evenings = Array.from({ length: 7 }, (_, d) => `${d}-${SESSION_EVENING}`)
  const weekend = WEEKEND_DAYS.flatMap((d) => [0, 1, 2].map((s) => `${d}-${s}`))

  const finish = () => {
    if (wantPublic !== isPublic) setPublic(wantPublic)
    navigate('/tim-viec/phu-hop')
  }

  return (
    <div className="theme-night relative isolate min-h-screen overflow-x-hidden bg-page-bg text-page-fg">
      <DustField className="-z-10" />

      <header className="flex h-16 items-center justify-between px-4 sm:px-6">
        <Link to="/" className={cn('flex items-center gap-2 rounded-control font-display text-lg font-semibold', FOCUS)}>
          <Briefcase className="h-5 w-5" aria-hidden="true" />Workmate
        </Link>
      </header>

      <main className="mx-auto w-full max-w-[720px] px-4 pb-10 pt-4 md:pb-14 md:pt-8">
        <div className="glass-dark rounded-card p-5 sm:p-8 md:p-10">
          <p className="text-sm font-medium text-page-muted" aria-live="polite">Bước {step}/{TOTAL}</p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-page-line" role="progressbar" aria-label="Tiến độ" aria-valuemin={1} aria-valuemax={TOTAL} aria-valuenow={step}>
            <div className="h-full w-full origin-left rounded-full bg-accent transition-transform duration-base ease-editorial motion-reduce:transition-none" style={{ transform: `scaleX(${step / TOTAL})` }} />
          </div>

          <div key={step} className="onboard-step">
            <h1 className="mt-6 font-display text-2xl font-medium md:text-3xl">{TITLES[step]}</h1>
            <p className="mt-2 text-sm text-page-muted">{INTROS[step]}</p>

            <section className="mt-5 space-y-4">
              {step === 1 && (
                <>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => addSlots(evenings)} className={cn(BTN_SECONDARY, BTN_SM)}>Chọn mọi buổi tối</button>
                    <button type="button" onClick={() => addSlots(weekend)} className={cn(BTN_SECONDARY, BTN_SM)}>Chọn cuối tuần</button>
                  </div>
                  <AvailabilityGrid availability={api.profile.availability} onToggle={api.toggleCell} />
                  <p className="tnum text-xs text-page-muted">Đã chọn {api.profile.availability.length} / 21 buổi</p>
                </>
              )}
              {step === 2 && (
                <>
                  <div>
                    <h2 className="mb-2 text-sm font-medium text-page-fg">Kỹ năng</h2>
                    <SkillsFields api={api} />
                  </div>
                  <div className="border-t border-page-line pt-4">
                    <h2 className="mb-3 text-sm font-medium text-page-fg">Mong muốn</h2>
                    <WantsFields api={api} />
                  </div>
                </>
              )}
              {step === 3 && (
                <Switch id="sw-onboard-public" checked={wantPublic} onChange={() => setWantPublic((v) => !v)} label="Công khai hồ sơ" />
              )}
            </section>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-page-line pt-5">
            {step > 1 && <button type="button" onClick={() => go(step - 1)} className={BTN_SECONDARY}>Quay lại</button>}
            {step < TOTAL ? (
              <button type="button" onClick={() => go(step + 1)} className={BTN_ACCENT}>Tiếp theo</button>
            ) : (
              <button type="button" onClick={finish} className={BTN_ACCENT}>Xem việc phù hợp</button>
            )}
            <button type="button" onClick={skip} className={BTN_GHOST}>Bỏ qua</button>
          </div>
        </div>
      </main>
    </div>
  )
}
