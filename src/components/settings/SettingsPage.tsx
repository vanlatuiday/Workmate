import FadeIn from '@components/motion/FadeIn'
import { notifySuccess } from '@utils/feedback'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { PageHeader, Panel } from '@components/dashboard'
import { useAuthStore } from '@context/authStore'
import { usePublicProfile } from '@hooks/usePublicProfile'
import type { Side } from '@context/connectionStore'
import { isNotifyOn, useSettingsStore, type EmailDigest, type NotificationKind } from '@context/settingsStore'
import { apiErrorMessage, authService } from '@services/authService'
import { setNotifyPref, startConnections } from '@services/connectionService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { BTN_ACCENT } from '@utils/ui'
import AccountDeletion from './AccountDeletion'
import PasswordField from './PasswordField'


/** Các loại thông báo theo phía (nhãn khác nhau vì nhìn từ hai phía) */
const NOTIFY: Record<Side, { kind: NotificationKind; label: string }[]> = {
  seeker: [
    { kind: 'interest', label: 'Nhà tuyển dụng quan tâm hồ sơ của bạn' },
    { kind: 'considering', label: 'Nhà tuyển dụng đang cân nhắc đơn của bạn' },
    { kind: 'connected', label: 'Hai bên đã kết nối' },
    { kind: 'interview_invited', label: 'Lời mời phỏng vấn' },
    { kind: 'interview_cancelled', label: 'Lịch phỏng vấn bị hủy' },
    { kind: 'offer', label: 'Lời mời nhận việc' },
    { kind: 'offer_withdrawn', label: 'Lời mời nhận việc bị rút' },
    { kind: 'rejected', label: 'Nhà tuyển dụng chưa chọn bạn' },
    { kind: 'review', label: 'Nhà tuyển dụng đánh giá bạn' },
    { kind: 'job_match', label: 'Việc mới rất phù hợp với bạn' },
  ],
  recruiter: [
    { kind: 'interest', label: 'Ứng viên ứng tuyển tin của bạn' },
    { kind: 'connected', label: 'Hai bên đã kết nối' },
    { kind: 'interview_confirmed', label: 'Ứng viên xác nhận lịch phỏng vấn' },
    { kind: 'interview_declined', label: 'Ứng viên từ chối lịch phỏng vấn' },
    { kind: 'offer_accepted', label: 'Ứng viên xác nhận đi làm' },
    { kind: 'offer_declined', label: 'Ứng viên từ chối nhận việc' },
    { kind: 'review', label: 'Ứng viên đánh giá công ty của bạn' },
    { kind: 'candidate_match', label: 'Ứng viên mới rất phù hợp với tin của bạn' },
  ],
}

const DIGESTS: { value: EmailDigest; label: string }[] = [
  { value: 'instant', label: 'Gửi ngay khi có thông báo' },
  { value: 'daily', label: 'Tóm tắt mỗi ngày lúc 8:00' },
  { value: 'off', label: 'Tắt' },
]
/**
 * Người tìm việc: MỘT công tắc "Công khai hồ sơ" (2026-11-21), dùng chung hook với /ho-so (usePublicProfile):
 * bật = published + visibility 'public'; tắt = published=false + visibility 'connected' ("hidden" cũ coi như tắt).
 */
const PUBLIC_HINT = {
  on: 'Mọi nhà tuyển dụng tìm thấy bạn trong danh sách ứng viên, được gợi ý cho tin phù hợp và có thể bấm quan tâm bạn.',
  off: 'Chỉ công ty bạn đã ứng tuyển hoặc đã kết nối mới xem được hồ sơ. Công ty khác không tìm thấy và không gợi ý bạn.',
}

/** Công tắc bật/tắt (role="switch") kèm nhãn; bật = nền đặc */
function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <li className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <span className="text-sm text-page-fg">{label}</span>
      <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
        className={cn('relative h-6 w-11 flex-shrink-0 rounded-full border transition-colors duration-base', checked ? 'border-page-fg bg-page-fg' : 'border-page-edge bg-page-surface', FOCUS)}>
        <span className={cn('absolute left-0 top-0.5 h-4 w-4 rounded-full transition-transform duration-base motion-reduce:transition-none', checked ? 'translate-x-[22px] bg-page-bg' : 'translate-x-0.5 bg-page-muted')} />
      </button>
    </li>
  )
}

/** Nhóm radio có chú thích */
function RadioGroup<T extends string>({ legend, options, value, onChange }: { legend: string; options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  const name = useId()
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-page-fg">{legend}</legend>
      <div className="flex flex-col gap-2">
        {options.map((o) => (
          <label key={o.value} className="flex cursor-pointer items-center gap-3 text-sm text-page-fg">
            <input type="radio" name={name} checked={value === o.value} onChange={() => onChange(o.value)} className={cn('h-4 w-4 accent-[currentColor]', FOCUS)} />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <Panel title={title}>{children}</Panel>
}

/** Cài đặt dùng chung hai phía: tài khoản, thông báo, riêng tư (lưu trên máy chủ), xóa tài khoản. */
export default function SettingsPage({ side }: { side: Side }) {
  const user = useAuthStore((s) => s.user)
  const settings = useSettingsStore((s) => s.bySide[side])
  const update = useSettingsStore((s) => s.update)
  const { isPublic, setPublic } = usePublicProfile()

  const [cur, setCur] = useState('')
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const [errs, setErrs] = useState<{ cur?: string; next?: string; again?: string }>({})
  const saved = () => notifySuccess('Đã lưu')

  const changePassword = async (e: FormEvent) => {
    e.preventDefault()
    const v = {
      cur: !cur ? 'Vui lòng nhập mật khẩu hiện tại.' : undefined,
      next: next.length >= 8 ? undefined : 'Mật khẩu mới cần ít nhất 8 ký tự.',
      again: again === next ? undefined : 'Mật khẩu nhập lại chưa khớp.',
    }
    setErrs(v)
    if (v.cur || v.next || v.again) return
    try {
      // Đổi mật khẩu làm mọi phiên cũ hết hiệu lực: lấy phiên mới cho thiết bị này và mở lại kết nối tin nhắn
      const { data } = await authService.changePassword(cur, next)
      useAuthStore.getState().setUser(data.user, data.token)
      void startConnections().catch(() => undefined)
    } catch (err) {
      // Máy chủ báo "Mật khẩu hiện tại chưa đúng" thì gắn vào ô tương ứng
      const msg = apiErrorMessage(err)
      setErrs({ cur: msg.startsWith('Mật khẩu hiện tại') ? msg : undefined, next: msg.startsWith('Mật khẩu hiện tại') ? undefined : msg })
      return
    }
    setCur(''); setNext(''); setAgain('')
    notifySuccess('Đã đổi mật khẩu. Các thiết bị khác đã được đăng xuất.')
  }

  return (
    <div>
      <PageHeader title="Cài đặt" description="Tài khoản, thông báo và quyền riêng tư. Thay đổi ở phần thông báo và riêng tư được lưu ngay." />

      <div className="grid max-w-5xl items-start gap-6 lg:grid-cols-2">
        {/* Cột trái: thông báo + riêng tư; cột phải: tài khoản + vùng nguy hiểm (1 cột dưới lg, thứ tự: tài khoản trước) */}
        <div className="order-2 flex min-w-0 flex-col gap-6 lg:order-1">
        <FadeIn>
        <Section title="Thông báo">
          <ul className="divide-y divide-page-line">
            {NOTIFY[side].map((n) => (
              <Switch key={n.kind} label={n.label} checked={isNotifyOn(settings, n.kind)} onChange={(on) => { void setNotifyPref(side, n.kind, on); saved() }} />
            ))}
          </ul>
          <div className="mt-6 border-t border-page-line pt-6">
            <RadioGroup legend="Email thông báo" options={DIGESTS} value={settings.emailDigest} onChange={(v) => { update(side, { emailDigest: v }); saved() }} />
          </div>
        </Section>
        </FadeIn>

        <FadeIn>
        <Section title="Quyền riêng tư">
          {side === 'seeker' ? (
            <>
              <ul>
                <Switch label="Công khai hồ sơ" checked={isPublic} onChange={(on) => { setPublic(on); saved() }} />
              </ul>
              <p className="mt-3 text-sm text-page-muted">{isPublic ? PUBLIC_HINT.on : PUBLIC_HINT.off}</p>
            </>
          ) : (
            <>
              <ul>
                <Switch label="Công khai trang công ty" checked={settings.visibility !== 'hidden'} onChange={(on) => { update(side, { visibility: on ? 'public' : 'hidden' }); saved() }} />
              </ul>
              <p className="mt-3 text-sm text-page-muted">
                {settings.visibility === 'hidden'
                  ? 'Đang ẩn: khách và người tìm việc không xem được trang công ty của bạn. Các tin tuyển dụng vẫn hiện bình thường.'
                  : 'Đang công khai: ai cũng xem được trang công ty. Tắt để ẩn trang này; các tin tuyển dụng vẫn hiện bình thường.'}
              </p>
            </>
          )}
        </Section>
        </FadeIn>

        </div>
        <div className="order-1 flex min-w-0 flex-col gap-6 lg:order-2">
        <Section title="Tài khoản">
          <dl className="mb-6 grid gap-4 sm:grid-cols-2">
            <div><dt className="text-sm text-page-muted">Email</dt><dd className="mt-1 text-sm text-page-fg">{user?.email ?? '—'}</dd></div>
            <div><dt className="text-sm text-page-muted">Vai trò</dt><dd className="mt-1 text-sm text-page-fg">{side === 'seeker' ? 'Người tìm việc' : 'Nhà tuyển dụng'}</dd></div>
          </dl>
          <form onSubmit={changePassword} noValidate className="flex flex-col gap-4 border-t border-page-line pt-6">
            <h3 className="font-medium text-page-fg">Đổi mật khẩu</h3>
            <PasswordField label="Mật khẩu hiện tại" value={cur} onChange={setCur} error={errs.cur} autoComplete="current-password" />
            <PasswordField label="Mật khẩu mới (ít nhất 8 ký tự)" value={next} onChange={setNext} error={errs.next} autoComplete="new-password" />
            <PasswordField label="Nhập lại mật khẩu mới" value={again} onChange={setAgain} error={errs.again} autoComplete="new-password" />
            <div><button type="submit" className={BTN_ACCENT}>Đổi mật khẩu</button></div>
          </form>
        </Section>

        <FadeIn>
        <Section title="Vùng nguy hiểm">
          <AccountDeletion side={side} />
        </Section>
        </FadeIn>
        </div>
      </div>
    </div>
  )
}
