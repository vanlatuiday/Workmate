import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@context/authStore'
import { useMediaQuery } from '@hooks/useMediaQuery'
import { cn } from '@utils/cn'
import DemoBar from './profile/DemoBar'
import ModeBanner from './profile/ModeBanner'
import ProfileBento from './profile/ProfileBento'
import Toast from './profile/Toast'
import { ViewCtx, useToast } from './profile/context'
import { DEMO_PARAMS, shownKind, useProfileStore, type DemoActor, type DemoView } from './profile/store'

/**
 * /trang-ca-nhan — trang cá nhân của ứng viên / doanh nghiệp (bản demo, dữ liệu mẫu trong bộ nhớ).
 * Chế độ lấy từ query: ?vai=ung-vien|doanh-nghiep & ?xem=cua-toi|doi-phuong.
 * Chế độ tối theo hệ thống chỉ áp dụng riêng trang này.
 */
export default function ProfilePage() {
  const role = useAuthStore((s) => s.user?.role)
  const [params, setParams] = useSearchParams()
  const { seeker, company, reset } = useProfileStore()
  const { message, notify } = useToast()
  // Xem trước "như người khác thấy" của chính trang này — không đổi URL
  const [preview, setPreview] = useState(false)
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)')
  const themeClass = systemDark ? 'theme-charcoal' : 'theme-ivory'

  // Mặc định: nhà tuyển dụng → doanh nghiệp, còn lại → người tìm việc
  const vai = params.get('vai')
  const actor: DemoActor =
    vai === DEMO_PARAMS.actor.company ? 'company' : vai === DEMO_PARAMS.actor.seeker ? 'seeker' : role === 'recruiter' ? 'company' : 'seeker'
  const view: DemoView = params.get('xem') === DEMO_PARAMS.view.other ? 'other' : 'own'

  const setDemo = (a: DemoActor, v: DemoView) => {
    setPreview(false)
    setParams({ vai: DEMO_PARAMS.actor[a], xem: DEMO_PARAMS.view[v] }, { replace: true })
  }

  const kind = shownKind(actor, view)
  const owner = view === 'own' && !preview
  // Ô Mức độ phù hợp chỉ có khi xem trang của đối phương (không có khi xem trước trang mình)
  const showMatch = view === 'other'

  return (
    <ViewCtx.Provider value={{ owner, notify, themeClass }}>
      <div className={cn(themeClass, 'min-h-[calc(100vh-4rem)] pb-section-sm')}>
        <div className="shell pt-6">
          <DemoBar actor={actor} view={view} onChange={setDemo} onReset={() => { reset(); notify('Đã khôi phục dữ liệu mẫu') }} />
          <div className="mt-4">
            <ModeBanner
              owner={owner}
              preview={preview}
              targetName={kind === 'seeker' ? seeker.name : company.name}
              onPreview={() => setPreview(true)}
              onBack={() => setPreview(false)}
            />
          </div>
          {/* key: đổi hồ sơ/chế độ thì dựng lại để các ô hiện lần lượt và đóng modal đang mở */}
          <ProfileBento key={`${kind}-${owner}`} kind={kind} owner={owner} showMatch={showMatch} />
        </div>
      </div>
      <Toast message={message} themeClass={themeClass} />
    </ViewCtx.Provider>
  )
}
