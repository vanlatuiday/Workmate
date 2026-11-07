import { useEffect, useRef } from 'react'
import Avatar from './Avatar'
import { Group, INPUT, Switch } from './ui'
import type { ProfileApi } from './useProfileDraft'

/** Nhóm 01 — ảnh đại diện, họ tên, câu giới thiệu. */
export default function IntroChapter({ api }: { api: ProfileApi }) {
  const { profile, set, setAvatarFile } = api
  // Thu hồi object URL khi rời trang
  const urlRef = useRef<string | null>(null)
  urlRef.current = profile.avatarUrl
  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current) }, [])

  return (
    <Group title="Giới thiệu" index={1}>
      <div className="flex flex-col gap-5 sm:flex-row">
        <div className="flex shrink-0 flex-col items-start gap-3">
          <Avatar name={profile.fullName} url={profile.avatarUrl} className="h-24 w-24 text-3xl" />
          <input
            id="avatar-file"
            type="file"
            accept="image/*"
            className="peer sr-only"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setAvatarFile(f); e.target.value = '' }}
          />
          <label
            htmlFor="avatar-file"
            className="cursor-pointer rounded-full border border-page-edge px-4 py-1 text-sm text-page-fg transition-colors duration-200 hover:border-page-fg peer-focus-visible:ring-2 peer-focus-visible:ring-page-fg peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-page-bg motion-reduce:transition-none"
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
