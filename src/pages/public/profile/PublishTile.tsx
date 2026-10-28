import toast from 'react-hot-toast'
import { FOCUS } from '@utils/focus'
import ChapterShell from './ChapterShell'
import PreviewDock from './PreviewDock'
import type { ProfileApi } from './useProfileDraft'

/** Khối ⑦ — Công khai: mức hoàn thiện, công tắc công khai, nút xem bản doanh nghiệp thấy. */
export default function PublishTile({ api }: { api: ProfileApi }) {
  const { profile, set, percent, missing } = api
  const toggle = () => {
    const next = !profile.published
    set('published', next)
    if (next) toast.success('Đã công khai (bản mẫu, chưa lưu)')
  }
  return (
    <ChapterShell no="07" title="Công khai" noEdit area="lg:col-start-5 lg:col-span-4 lg:row-start-3 lg:row-span-1">
      {() => (
        <div className="space-y-2">
          {/* Chữ + thanh tiến độ chung một dòng để khối vừa một hàng lưới */}
          <div className="flex items-center gap-3">
            <p className="shrink-0 text-page-muted">Hoàn thiện <span className="font-semibold text-page-fg">{percent}%</span></p>
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-page-line" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Mức hoàn thiện hồ sơ">
              <div className="h-full origin-left rounded-full bg-page-fg" style={{ transform: `scaleX(${percent / 100})` }} />
            </div>
          </div>
          {percent < 60 && <p className="text-xs text-page-muted">Nên điền: {missing.slice(0, 2).join(', ')}</p>}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                role="switch"
                aria-checked={profile.published}
                aria-labelledby="sw-publish"
                onClick={toggle}
                className={`relative h-6 w-11 shrink-0 rounded-full border border-page-edge transition-colors duration-200 ${FOCUS} ${profile.published ? 'bg-page-fg' : 'bg-page-surface'}`}
              >
                <span className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full transition-transform duration-200 ${profile.published ? 'translate-x-5 bg-page-bg' : 'bg-page-fg'}`} />
              </button>
              <span id="sw-publish" className="font-medium text-page-fg">Công khai hồ sơ</span>
            </div>
            <PreviewDock api={api} />
          </div>
        </div>
      )}
    </ChapterShell>
  )
}
