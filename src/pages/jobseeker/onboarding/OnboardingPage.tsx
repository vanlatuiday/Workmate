import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Briefcase, Plus, Printer } from 'lucide-react'
import toast from 'react-hot-toast'
import DustField from '@components/motion/DustField'
import { ScaledCv, toCvData, useCvPrint } from '@components/cv/CvPanel'
import { useAuthStore } from '@context/authStore'
import { usePublicProfile } from '@hooks/usePublicProfile'
import { useProfileStore } from '@context/profileStore'
import Avatar from '@pages/public/profile/Avatar'
import PeriodField from '@pages/public/profile/PeriodField'
import { AvailabilityGrid, BulletsEditor, SkillsFields } from '@pages/public/profile/Sections'
import { INPUT, Switch } from '@pages/public/profile/ui'
import { useProfileDraft } from '@pages/public/profile/useProfileDraft'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { BTN_ACCENT, BTN_GHOST, BTN_SECONDARY, BTN_SM } from '@utils/ui'

/**
 * /tim-viec/bat-dau — "Viết CV" lần đầu cho người tìm việc mới (không bắt buộc; bỏ qua được ở mọi bước).
 * 4 bước: thông tin cơ bản → lịch rảnh → kỹ năng và kinh nghiệm → xem CV. Mọi ô lưu ngay qua profileStore
 * (cùng đường đồng bộ với /ho-so). Bước 1–3 có CV xem trước dính bên phải (từ lg). Bỏ qua / hoàn tất đều sang /match.
 */

const TOTAL = 4
const TITLES: Record<number, string> = { 1: 'Thông tin cơ bản', 2: 'Lịch rảnh', 3: 'Kỹ năng và kinh nghiệm', 4: 'Xem CV' }
const INTROS: Record<number, string> = {
  1: 'Tên, chức danh và vài dòng giới thiệu là phần nhà tuyển dụng đọc đầu tiên. Ảnh không bắt buộc.',
  2: 'Chọn các buổi bạn có thể đi làm. Hệ thống dùng lịch này để gợi ý việc không trùng giờ. Bạn sửa lại được bất cứ lúc nào.',
  3: 'Thêm vài kỹ năng và một nơi bạn từng làm. Chưa có kinh nghiệm thì bỏ trống cũng được.',
  4: 'Đây là CV Workmate tạo từ những gì bạn vừa điền. Công khai hồ sơ để nhà tuyển dụng tìm thấy và gợi ý bạn cho tin phù hợp.',
}

const SESSION_EVENING = 2
const WEEKEND_DAYS = [5, 6]
const LABEL = 'mb-1 block text-sm text-page-muted'

export default function JobseekerOnboardingPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const api = useProfileDraft()
  const { profile, set, setAvatarFile, addExperience, updateExperience } = api
  const email = useAuthStore((s) => s.user?.email)
  const { isPublic, setPublic } = usePublicProfile()
  // Mặc định bật; chỉ áp dụng khi bấm "Hoàn tất"
  const [wantPublic, setWantPublic] = useState(true)

  const cv = toCvData(profile, email)
  const { start: printCv, portal } = useCvPrint(cv, 'owner')

  // Ẩn chuông + tin nhắn nổi trong lúc làm form (CSS: html[data-onboarding] [data-floating])
  useEffect(() => {
    document.documentElement.setAttribute('data-onboarding', '')
    return () => document.documentElement.removeAttribute('data-onboarding')
  }, [])

  const raw = Number(params.get('buoc'))
  const step = Number.isInteger(raw) && raw >= 1 ? Math.min(raw, TOTAL) : 1
  const go = (n: number) => setParams({ buoc: String(n) })
  const skip = () => navigate('/match')

  /** Thêm ca vào lịch rảnh (không bỏ ca đã chọn) */
  const addSlots = (keys: string[]) => {
    const cur = useProfileStore.getState().profile.availability
    set('availability', [...new Set([...cur, ...keys])])
  }
  const evenings = Array.from({ length: 7 }, (_, d) => `${d}-${SESSION_EVENING}`)
  const weekend = WEEKEND_DAYS.flatMap((d) => [0, 1, 2].map((s) => `${d}-${s}`))

  // Ảnh hiện ngay, tải lên chạy nền; lỗi thì ảnh cũ quay lại và báo lý do
  const pickAvatar = async (f: File) => {
    const err = await setAvatarFile(f)
    if (err) toast.error(err)
  }

  const finish = () => {
    if (wantPublic !== isPublic) setPublic(wantPublic)
    navigate('/match')
  }

  const exp = profile.experience[0]

  return (
    <div className="theme-night relative isolate min-h-screen overflow-x-hidden bg-page-bg text-page-fg">
      <DustField className="-z-10" />

      <header className="flex h-16 items-center justify-between px-4 sm:px-6">
        <Link to="/" className={cn('flex items-center gap-2 rounded-control font-display text-lg font-semibold', FOCUS)}>
          <Briefcase className="h-5 w-5" aria-hidden="true" />Workmate
        </Link>
      </header>

      <main className={cn('mx-auto w-full px-4 pb-10 pt-4 md:pb-14 md:pt-8', step === 4 ? 'max-w-[760px]' : 'max-w-[1080px]')}>
        <div className={cn('grid min-w-0 items-start gap-6', step < 4 && 'lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]')}>
          <div className="glass-dark min-w-0 rounded-card p-5 sm:p-8 md:p-10">
            <h1 className="font-display text-xl font-medium text-page-muted md:text-2xl">Viết CV để được gợi ý việc sát hơn</h1>
            <p className="mt-4 text-sm font-medium text-page-muted" aria-live="polite">Bước {step}/{TOTAL}</p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-page-line" role="progressbar" aria-label="Tiến độ" aria-valuemin={1} aria-valuemax={TOTAL} aria-valuenow={step}>
              <div className="h-full w-full origin-left rounded-full bg-accent transition-transform duration-base ease-editorial motion-reduce:transition-none" style={{ transform: `scaleX(${step / TOTAL})` }} />
            </div>

            <div key={step} className="onboard-step">
              <h2 className="mt-6 font-display text-2xl font-medium md:text-3xl">{TITLES[step]}</h2>
              <p className="mt-2 text-sm text-page-muted">{INTROS[step]}</p>

              <section className="mt-5 space-y-4">
                {step === 1 && (
                  <>
                    <div className="flex items-center gap-4">
                      <Avatar name={profile.fullName} url={profile.avatarUrl} className="h-20 w-20 shrink-0 text-2xl" />
                      <div>
                        <input
                          id="avatar-file"
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="peer sr-only"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) void pickAvatar(f); e.target.value = '' }}
                        />
                        <label
                          htmlFor="avatar-file"
                          className={cn(BTN_SECONDARY, BTN_SM, 'cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-page-fg peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-page-bg')}
                        >
                          Tải ảnh lên
                        </label>
                        <p className="mt-1 text-xs text-page-muted">Không bắt buộc.</p>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="pf-name" className={LABEL}>Họ tên</label>
                      <input id="pf-name" value={profile.fullName} autoComplete="name" onChange={(e) => set('fullName', e.target.value)} className={INPUT} />
                    </div>
                    <div>
                      <label htmlFor="pf-headline" className={LABEL}>Chức danh</label>
                      <input id="pf-headline" value={profile.headline} maxLength={80} placeholder="Ví dụ: Nhân viên phục vụ" onChange={(e) => set('headline', e.target.value)} className={INPUT} />
                    </div>
                    <div>
                      <label htmlFor="pf-phone" className={LABEL}>Số điện thoại (chỉ mở sau khi hai bên kết nối)</label>
                      <input id="pf-phone" type="tel" inputMode="tel" autoComplete="tel" value={profile.phone} onChange={(e) => set('phone', e.target.value)} className={INPUT} />
                    </div>
                    <div>
                      <label htmlFor="pf-intro" className={LABEL}>Giới thiệu ngắn (1–2 câu)</label>
                      <textarea id="pf-intro" rows={3} value={profile.intro} onChange={(e) => set('intro', e.target.value)} className={INPUT} />
                    </div>
                  </>
                )}
                {step === 2 && (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => addSlots(evenings)} className={cn(BTN_SECONDARY, BTN_SM)}>Chọn mọi buổi tối</button>
                      <button type="button" onClick={() => addSlots(weekend)} className={cn(BTN_SECONDARY, BTN_SM)}>Chọn cuối tuần</button>
                    </div>
                    <AvailabilityGrid availability={profile.availability} onToggle={api.toggleCell} />
                    <p className="tnum text-xs text-page-muted">Đã chọn {profile.availability.length} / 28 buổi</p>
                  </>
                )}
                {step === 3 && (
                  <>
                    <div>
                      <h3 className="mb-2 text-sm font-medium text-page-fg">Kỹ năng</h3>
                      <SkillsFields api={api} />
                    </div>
                    <div className="space-y-3 border-t border-page-line pt-4">
                      <h3 className="text-sm font-medium text-page-fg">Một kinh nghiệm làm việc</h3>
                      {exp ? (
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div>
                            <label htmlFor={`kn-t-${exp.id}`} className="sr-only">Chức danh</label>
                            <input id={`kn-t-${exp.id}`} value={exp.title} placeholder="Chức danh" onChange={(e) => updateExperience(exp.id, { title: e.target.value })} className={INPUT} />
                          </div>
                          <div>
                            <label htmlFor={`kn-c-${exp.id}`} className="sr-only">Nơi làm</label>
                            <input id={`kn-c-${exp.id}`} value={exp.company} placeholder="Nơi làm" onChange={(e) => updateExperience(exp.id, { company: e.target.value })} className={INPUT} />
                          </div>
                          <div className="sm:col-span-2">
                            <PeriodField id={`kn-p-${exp.id}`} value={exp.period} onChange={(v) => updateExperience(exp.id, { period: v })} />
                          </div>
                          <div className="sm:col-span-2">
                            <BulletsEditor id={exp.id} bullets={exp.bullets ?? []} onChange={(bullets) => updateExperience(exp.id, { bullets })} />
                          </div>
                        </div>
                      ) : (
                        <button type="button" onClick={addExperience} className={cn(BTN_SECONDARY, BTN_SM)}><Plus className="h-4 w-4" aria-hidden />Thêm kinh nghiệm</button>
                      )}
                    </div>
                  </>
                )}
                {step === 4 && (
                  <>
                    <div className="mx-auto w-full max-w-[560px]"><ScaledCv data={cv} mode="owner" compact /></div>
                    <Switch id="sw-onboard-public" checked={wantPublic} onChange={() => setWantPublic((v) => !v)} label="Công khai hồ sơ" />
                    <p className="-mt-2 text-xs text-page-muted">Liên hệ của bạn chỉ mở sau khi hai bên kết nối.</p>
                  </>
                )}
              </section>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-page-line pt-5">
              {step > 1 && <button type="button" onClick={() => go(step - 1)} className={BTN_SECONDARY}>Quay lại</button>}
              {step < TOTAL ? (
                <button type="button" onClick={() => go(step + 1)} className={BTN_ACCENT}>Tiếp theo</button>
              ) : (
                <>
                  <button type="button" onClick={printCv} className={BTN_SECONDARY}><Printer className="h-4 w-4" aria-hidden />Tải CV (PDF)</button>
                  <button type="button" onClick={finish} className={BTN_ACCENT}>Hoàn tất</button>
                </>
              )}
              <button type="button" onClick={skip} className={BTN_GHOST}>Bỏ qua</button>
            </div>
          </div>

          {step < 4 && (
            <aside className="hidden lg:sticky lg:top-6 lg:block" aria-label="CV xem trước">
              <p className="mb-2 text-sm font-medium text-page-muted">CV xem trước</p>
              <ScaledCv data={cv} mode="owner" compact />
            </aside>
          )}
        </div>
      </main>
      {portal}
    </div>
  )
}
