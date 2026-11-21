import toast from 'react-hot-toast'
import { usePublicProfile } from '@hooks/usePublicProfile'
import { BTN_ACCENT, BTN_GHOST, BTN_SM } from '@utils/ui'
import PreviewDock from './PreviewDock'
import type { ProfileApi } from './useProfileDraft'

/** Dải trạng thái đầu trang /ho-so: hồ sơ có công khai không + MỘT công tắc duy nhất (cùng Cài đặt) + xem bản nhà tuyển dụng thấy. */
export default function PublicStatusBar({ api }: { api: ProfileApi }) {
  const { isPublic, setPublic } = usePublicProfile()
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-card border border-page-line bg-page-surface px-5 py-4">
      <p role="status" className="min-w-0 text-sm text-page-fg">
        {isPublic ? 'Hồ sơ đang công khai.' : 'Hồ sơ chưa công khai. Nhà tuyển dụng chưa tìm thấy bạn.'}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <PreviewDock api={api} />
        {isPublic ? (
          <button type="button" onClick={() => { setPublic(false); toast.success('Đã chuyển sang riêng tư') }} className={`${BTN_GHOST} ${BTN_SM}`}>
            Chuyển sang riêng tư
          </button>
        ) : (
          <button type="button" onClick={() => { setPublic(true); toast.success('Đã công khai hồ sơ') }} className={`${BTN_ACCENT} ${BTN_SM}`}>
            Công khai hồ sơ
          </button>
        )}
      </div>
    </div>
  )
}
