import toast from 'react-hot-toast'
import { cn } from '@utils/cn'
import { BTN_SECONDARY, BTN_SM } from '@utils/ui'
import Avatar from './Avatar'
import { Group, INPUT, Switch } from './ui'
import type { ProfileApi } from './useProfileDraft'

/** Nhóm 01 — ảnh đại diện, họ tên, câu giới thiệu. */
export default function IntroChapter({ api }: { api: ProfileApi }) {
  const { profile, set, setAvatarFile } = api
  // Ảnh hiện ngay, tải lên chạy nền; lỗi thì ảnh cũ quay lại và báo lý do
  const pick = async (f: File) => {
    const err = await setAvatarFile(f)
    if (err) toast.error(err)
  }

  return (
    <Group title="Giới thiệu" index={1}>
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
            <label htmlFor="pf-intro" className="mb-1 block text-sm text-page-muted">Giới thiệu ngắn (1–2 câu)</label>
            <textarea id="pf-intro" rows={3} value={profile.intro} onChange={(e) => set('intro', e.target.value)} className={INPUT} />
          </div>
        </div>
      </div>
      <Switch id="sw-avatar" checked={profile.showAvatar} onChange={() => set('showAvatar', !profile.showAvatar)} label="Cho doanh nghiệp thấy ảnh" />
    </Group>
  )
}
