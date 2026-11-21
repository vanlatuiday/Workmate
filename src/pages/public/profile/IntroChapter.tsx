import toast from 'react-hot-toast'
import { cn } from '@utils/cn'
import { BTN_SECONDARY, BTN_SM } from '@utils/ui'
import Avatar from './Avatar'
import { chip, Group, INPUT, Switch } from './ui'
import type { Gender } from '@context/profileStore'
import type { ProfileApi } from './useProfileDraft'

const GENDER_OPTIONS: { label: string; value: Gender | null }[] = [
  { label: 'Nam', value: 'nam' }, { label: 'Nữ', value: 'nu' }, { label: 'Khác', value: 'khac' }, { label: 'Không ghi', value: null },
]

/** Thông tin cơ bản: ảnh đại diện, họ tên, số điện thoại, câu giới thiệu. */
export default function IntroChapter({ api }: { api: ProfileApi }) {
  const { profile, set, setAvatarFile } = api
  // Ảnh hiện ngay, tải lên chạy nền; lỗi thì ảnh cũ quay lại và báo lý do
  const pick = async (f: File) => {
    const err = await setAvatarFile(f)
    if (err) toast.error(err)
  }

  return (
    <Group id="thong-tin" title="Giới thiệu">
      <div className="flex flex-col gap-5 sm:flex-row">
        <div className="flex shrink-0 flex-col items-start gap-3">
          <Avatar name={profile.fullName} url={profile.avatarUrl} className="h-24 w-24 text-3xl" />
          <input
            id="avatar-file"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="peer sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void pick(f); e.target.value = '' }}
          />
          <label
            htmlFor="avatar-file"
            className={cn(BTN_SECONDARY, BTN_SM, 'cursor-pointer peer-focus-visible:ring-2 peer-focus-visible:ring-page-fg peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-page-bg')}
          >
            Tải ảnh lên
          </label>
        </div>
        <div className="min-w-0 flex-1 space-y-4">
          <div>
            <label htmlFor="pf-name" className="mb-1 block text-sm text-page-muted">Họ tên</label>
            <input id="pf-name" value={profile.fullName} onChange={(e) => set('fullName', e.target.value)} className={INPUT} />
          </div>
          <div>
            <label htmlFor="pf-headline" className="mb-1 block text-sm text-page-muted">Chức danh</label>
            <input id="pf-headline" value={profile.headline} maxLength={80} placeholder="Ví dụ: Nhân viên phục vụ" onChange={(e) => set('headline', e.target.value)} className={INPUT} />
          </div>
          <div>
            <label htmlFor="pf-phone" className="mb-1 block text-sm text-page-muted">Số điện thoại (chỉ mở sau khi hai bên kết nối)</label>
            <input id="pf-phone" type="tel" inputMode="tel" autoComplete="tel" value={profile.phone} onChange={(e) => set('phone', e.target.value)} className={INPUT} />
          </div>
          <div>
            <label htmlFor="pf-intro" className="mb-1 block text-sm text-page-muted">Giới thiệu ngắn (1–2 câu)</label>
            <textarea id="pf-intro" rows={3} value={profile.intro} onChange={(e) => set('intro', e.target.value)} className={INPUT} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pf-birth" className="mb-1 block text-sm text-page-muted">Ngày sinh (không bắt buộc)</label>
              <input id="pf-birth" type="date" max={new Date().toISOString().slice(0, 10)} value={profile.birthDate ?? ''} onChange={(e) => set('birthDate', e.target.value || null)} className={INPUT} />
            </div>
            <fieldset>
              <legend className="mb-1 text-sm text-page-muted">Giới tính</legend>
              <div className="flex flex-wrap gap-2">
                {GENDER_OPTIONS.map((o) => (
                  <button key={o.label} type="button" aria-pressed={profile.gender === o.value} onClick={() => set('gender', o.value)} className={chip(profile.gender === o.value)}>{o.label}</button>
                ))}
              </div>
            </fieldset>
          </div>
        </div>
      </div>
      <Switch id="sw-personal" checked={profile.showPersonal} onChange={() => set('showPersonal', !profile.showPersonal)} label="Cho nhà tuyển dụng thấy ngày sinh, giới tính" />
      <p className="-mt-2 text-sm text-page-muted">Không bắt buộc. Tắt thì chỉ bạn thấy.</p>
      <Switch id="sw-avatar" checked={profile.showAvatar} onChange={() => set('showAvatar', !profile.showAvatar)} label="Cho nhà tuyển dụng thấy ảnh" />
    </Group>
  )
}
