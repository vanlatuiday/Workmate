import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AlertCircle } from 'lucide-react'
import { PageHeader, Panel } from '@components/dashboard'
import { useAuthStore } from '@context/authStore'
import type { Side } from '@context/demoStore'
import { isNotifyOn, useSettingsStore, type EmailDigest, type NotificationKind, type ProfileVisibility } from '@context/settingsStore'
import { resetDemoData } from '@services/connectionService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'

const BTN = `inline-flex items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition-colors duration-300 ${FOCUS}`
const BTN_SOLID = `${BTN} border-page-fg bg-page-fg text-page-bg hover:bg-page-bg hover:text-page-fg`
const BTN_LINE = `${BTN} border-page-line text-page-fg hover:border-page-fg`
const FIELD = `w-full rounded-control border border-page-edge bg-page-surface px-3 py-2 text-sm text-page-fg ${FOCUS}`

/** Các loại thông báo theo phía (nhãn khác nhau vì nhìn từ hai phía) */
const NOTIFY: Record<Side, { kind: NotificationKind; label: string }[]> = {
  seeker: [
    { kind: 'interest', label: 'Doanh nghiệp quan tâm hồ sơ của bạn' },
    { kind: 'connected', label: 'Hai bên đã kết nối' },
    { kind: 'interview_invited', label: 'Lời mời phỏng vấn' },
    { kind: 'interview_cancelled', label: 'Lịch phỏng vấn bị hủy' },
  ],
  recruiter: [
    { kind: 'interest', label: 'Ứng viên ứng tuyển tin của bạn' },
    { kind: 'connected', label: 'Hai bên đã kết nối' },
    { kind: 'interview_confirmed', label: 'Ứng viên xác nhận lịch phỏng vấn' },
    { kind: 'interview_declined', label: 'Ứng viên từ chối lịch phỏng vấn' },
  ],
}

const DIGESTS: { value: EmailDigest; label: string }[] = [
  { value: 'instant', label: 'Ngay lập tức' },
  { value: 'daily', label: 'Mỗi ngày' },
  { value: 'off', label: 'Tắt' },
]
const VISIBILITIES: { value: ProfileVisibility; label: string }[] = [
  { value: 'public', label: 'Mọi doanh nghiệp' },
  { value: 'connected', label: 'Chỉ doanh nghiệp đã kết nối' },
  { value: 'hidden', label: 'Ẩn hồ sơ' },
]

/** Công tắc bật/tắt (role="switch") kèm nhãn; bật = nền đặc */
function Switch({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <li className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <span className="text-sm text-page-fg">{label}</span>
      <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)}
        className={cn('relative h-6 w-11 flex-shrink-0 rounded-full border transition-colors duration-300', checked ? 'border-page-fg bg-page-fg' : 'border-page-edge bg-page-surface', FOCUS)}>
        <span className={cn('absolute top-0.5 h-4 w-4 rounded-full transition-transform duration-300 motion-reduce:transition-none', checked ? 'translate-x-[22px] bg-page-bg' : 'translate-x-0.5 bg-page-muted')} />
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

/** Ô mật khẩu có nhãn và lỗi gắn aria-describedby */
function PasswordField({ label, value, onChange, error, autoComplete }: { label: string; value: string; onChange: (v: string) => void; error?: string; autoComplete: string }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-page-muted">{label}</label>
      <input id={id} type="password" value={value} autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-err` : undefined} className={FIELD} />
      {error && (
        <p id={`${id}-err`} role="alert" className="flex items-center gap-1.5 text-sm font-medium text-page-fg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />{error}
        </p>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <Panel title={title}>{children}</Panel>
}

/** Cài đặt dùng chung hai phía: tài khoản, thông báo, riêng tư, dữ liệu demo, xóa tài khoản (bản mẫu, lưu localStorage). */
export default function SettingsPage({ side }: { side: Side }) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const settings = useSettingsStore((s) => s.bySide[side])
  const update = useSettingsStore((s) => s.update)
  const setNotify = useSettingsStore((s) => s.setNotify)

  const [cur, setCur] = useState('')
  const [next, setNext] = useState('')
  const [again, setAgain] = useState('')
  const [errs, setErrs] = useState<{ cur?: string; next?: string; again?: string }>({})
  const [deleting, setDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const saved = () => toast.success('Đã lưu', { duration: 1500 })

  const changePassword = (e: FormEvent) => {
    e.preventDefault()
    const v = {
      cur: cur ? undefined : 'Vui lòng nhập mật khẩu hiện tại.',
      next: next.length >= 8 ? undefined : 'Mật khẩu mới cần ít nhất 8 ký tự.',
      again: again === next ? undefined : 'Mật khẩu nhập lại chưa khớp.',
    }
    setErrs(v)
    if (v.cur || v.next || v.again) return
    setCur(''); setNext(''); setAgain('')
    toast.success('Đã đổi mật khẩu (bản mẫu, chưa lưu)')
  }

  const deleteAccount = () => {
    useSettingsStore.getState().reset()
    resetDemoData()
    logout()
    navigate('/')
    toast.success('Đã xóa tài khoản (bản mẫu)')
  }

  return (
    <div>
      <PageHeader title="Cài đặt" description="Tài khoản, thông báo và quyền riêng tư. Thay đổi ở phần thông báo và riêng tư được lưu ngay." />

      <div className="flex max-w-3xl flex-col gap-6">
        <Section title="Tài khoản">
          <dl className="mb-6 grid gap-4 sm:grid-cols-2">
            <div><dt className="text-sm text-page-muted">Email</dt><dd className="mt-1 text-sm text-page-fg">{user?.email ?? '—'}</dd></div>
            <div><dt className="text-sm text-page-muted">Vai trò</dt><dd className="mt-1 text-sm text-page-fg">{side === 'seeker' ? 'Người tìm việc' : 'Doanh nghiệp'}</dd></div>
          </dl>
          <form onSubmit={changePassword} noValidate className="flex flex-col gap-4 border-t border-page-line pt-6">
            <h3 className="font-medium text-page-fg">Đổi mật khẩu</h3>
            <PasswordField label="Mật khẩu hiện tại" value={cur} onChange={setCur} error={errs.cur} autoComplete="current-password" />
            <PasswordField label="Mật khẩu mới (ít nhất 8 ký tự)" value={next} onChange={setNext} error={errs.next} autoComplete="new-password" />
            <PasswordField label="Nhập lại mật khẩu mới" value={again} onChange={setAgain} error={errs.again} autoComplete="new-password" />
            <div><button type="submit" className={BTN_SOLID}>Đổi mật khẩu</button></div>
          </form>
        </Section>

        <Section title="Thông báo">
          <ul className="divide-y divide-page-line">
            {NOTIFY[side].map((n) => (
              <Switch key={n.kind} label={n.label} checked={isNotifyOn(settings, n.kind)} onChange={(on) => { setNotify(side, n.kind, on); saved() }} />
            ))}
          </ul>
          <div className="mt-6 border-t border-page-line pt-6">
            <RadioGroup legend="Email tóm tắt (giao diện mẫu, chưa gửi thật)" options={DIGESTS} value={settings.emailDigest} onChange={(v) => { update(side, { emailDigest: v }); saved() }} />
          </div>
        </Section>

        <Section title="Quyền riêng tư">
          {side === 'seeker' ? (
            <RadioGroup legend="Ai xem được hồ sơ" options={VISIBILITIES} value={settings.visibility} onChange={(v) => { update(side, { visibility: v }); saved() }} />
          ) : (
            <ul>
              <Switch label="Công khai trang công ty" checked={settings.visibility !== 'hidden'} onChange={(on) => { update(side, { visibility: on ? 'public' : 'hidden' }); saved() }} />
            </ul>
          )}
        </Section>

        <Section title="Dữ liệu demo">
          <p className="mb-4 text-sm text-page-muted">Đưa kết nối, tin nhắn, thông báo và lịch phỏng vấn về trạng thái ban đầu.</p>
          <button type="button" className={BTN_LINE} onClick={() => { resetDemoData(); toast.success('Đã đặt lại dữ liệu demo') }}>Đặt lại dữ liệu demo</button>
        </Section>

        <Section title="Vùng nguy hiểm">
          <p className="mb-4 text-sm text-page-muted">Xóa tài khoản sẽ đặt lại cài đặt, dữ liệu demo và đăng xuất bạn.</p>
          {!deleting ? (
            <button type="button" className={BTN_LINE} onClick={() => setDeleting(true)}>Xóa tài khoản</button>
          ) : (
            <div role="alertdialog" aria-label="Xác nhận xóa tài khoản" className="rounded-card border border-page-fg p-4">
              <label htmlFor="delete-confirm" className="text-sm text-page-fg">Gõ <strong>XÓA</strong> để xác nhận.</label>
              <input id="delete-confirm" autoFocus value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className={`${FIELD} mt-2`} />
              <div className="mt-3 flex gap-2">
                <button type="button" disabled={confirmText.trim() !== 'XÓA'} onClick={deleteAccount} className={`${BTN_SOLID} disabled:opacity-50`}>Xóa tài khoản</button>
                <button type="button" className={BTN_LINE} onClick={() => { setDeleting(false); setConfirmText('') }}>Hủy</button>
              </div>
            </div>
          )}
        </Section>
      </div>
    </div>
  )
}
