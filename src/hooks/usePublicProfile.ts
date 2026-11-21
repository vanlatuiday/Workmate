import { useCallback } from 'react'
import { useProfileStore } from '@context/profileStore'
import { useSettingsStore } from '@context/settingsStore'

/**
 * MỘT khái niệm "Công khai hồ sơ" cho người tìm việc. Máy chủ chỉ cho nhà tuyển dụng tìm thấy khi
 * `profile.published === true` VÀ cài đặt `visibility === 'public'`, nên hai giá trị luôn đổi cùng nhau:
 * bật → published=true + visibility='public'; tắt → published=false + visibility='connected'.
 * Dùng chung cho /ho-so, Cài đặt và form bắt đầu để không bao giờ lệch nhau.
 */
export function usePublicProfile() {
  const published = useProfileStore((s) => s.profile.published)
  const visibility = useSettingsStore((s) => s.bySide.seeker.visibility)
  const isPublic = published && visibility === 'public'

  const setPublic = useCallback((on: boolean) => {
    useProfileStore.getState().update({ published: on })
    useSettingsStore.getState().update('seeker', { visibility: on ? 'public' : 'connected' })
  }, [])

  return { isPublic, setPublic }
}
