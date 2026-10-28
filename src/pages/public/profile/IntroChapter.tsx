import { useEffect, useRef } from 'react'
import TextReveal from '@components/motion/TextReveal'
import { FOCUS } from '@utils/focus'
import Avatar from './Avatar'
import ChapterShell from './ChapterShell'
import type { ProfileApi } from './useProfileDraft'

const INPUT = `w-full rounded-control border border-page-edge bg-page-surface px-3 py-2 text-sm text-page-fg ${FOCUS}`

/** Chương ① — ảnh đại diện, tên lớn, câu giới thiệu. */
export default function IntroChapter({ api, delay }: { api: ProfileApi; delay: number }) {
  const { profile, set, setAvatarFile } = api
  // Thu hồi object URL khi rời trang
  const urlRef = useRef<string | null>(null)
  urlRef.current = profile.avatarUrl
  useEffect(() => () => { if (urlRef.current) URL.revokeObjectURL(urlRef.current) }, [])

  const name = profile.fullName.trim() || 'bạn'
  return (
    <ChapterShell no="01" title="Mở đầu" plainTitle area="lg:col-start-1 lg:col-span-5 lg:row-start-1 lg:row-span-2">
      {(editing) => (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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
              className={`cursor-pointer rounded-full border border-page-edge px-4 py-1 text-sm text-page-fg transition-colors duration-200 hover:border-page-fg peer-focus-visible:ring-2 peer-focus-visible:ring-page-fg peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-page-bg`}
            >
              Tải ảnh lên
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={profile.showAvatar}
                aria-labelledby="sw-avatar"
                onClick={() => set('showAvatar', !profile.showAvatar)}
                className={`relative h-6 w-11 shrink-0 rounded-full border border-page-edge transition-colors duration-200 ${FOCUS} ${profile.showAvatar ? 'bg-page-fg' : 'bg-page-surface'}`}
              >
                <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full transition-transform duration-200 ${profile.showAvatar ? 'translate-x-5 bg-page-bg' : 'bg-page-fg'}`} />
              </button>
              <span id="sw-avatar" className="text-sm text-page-fg">Cho doanh nghiệp thấy ảnh</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <TextReveal
              as="h1"
              immediate
              delay={delay}
              text={`Xin chào, mình là ${name}`}
              className="font-display text-2xl font-semibold leading-tight text-page-fg md:text-3xl"
            />
            {editing ? (
              <div className="mt-3 space-y-3">
                <div>
                  <label htmlFor="pf-name" className="mb-1 block text-sm text-page-muted">Họ tên</label>
                  <input id="pf-name" value={profile.fullName} onChange={(e) => set('fullName', e.target.value)} className={INPUT} />
                </div>
                <div>
                  <label htmlFor="pf-intro" className="mb-1 block text-sm text-page-muted">Giới thiệu ngắn (1–2 câu)</label>
                  <textarea id="pf-intro" rows={4} value={profile.intro} onChange={(e) => set('intro', e.target.value)} className={INPUT} />
                </div>
              </div>
            ) : (
              <p className="mt-3 leading-relaxed text-page-muted">{profile.intro || 'Chưa có giới thiệu.'}</p>
            )}
          </div>
        </div>
      )}
    </ChapterShell>
  )
}
