import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { useExperienceStore } from '@context/experienceStore'
import { useMessengerStore } from '@context/messengerStore'
import { useNotificationCenterStore } from '@context/notificationCenterStore'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'

export type AccountActions = {
  area: { label: string; href: string }
  profileHref: string
  unreadMessages: number
  unreadNotifications: number
  onOpenProfile: (event: MouseEvent<HTMLAnchorElement>) => void
  onLogout: () => void
}

const ITEM = cn(
  'block w-full rounded-control px-3 py-2 text-left text-sm text-page-muted transition-colors duration-fast hover:bg-page-surface hover:text-page-fg',
  FOCUS,
)

export default function AccountActions({ area, profileHref, unreadMessages, unreadNotifications, onOpenProfile, onLogout, close, menuRole }: AccountActions & {
  close: (refocus?: boolean) => void
  menuRole?: 'menuitem'
}) {
  const { quality, setQuality } = useExperienceStore()
  const openMessenger = useMessengerStore((state) => state.openMessenger)
  const openNotificationCenter = useNotificationCenterStore((state) => state.openCenter)
  return (
    <>
      <button
        type="button"
        role={menuRole}
        className={cn(ITEM, 'flex items-center justify-between')}
        onClick={() => {
          close(false)
          openMessenger()
        }}
      >
        Tin nhắn
        {unreadMessages > 0 && (
          <span className="rounded-full bg-page-fg px-2 text-xs font-medium text-page-bg">{unreadMessages}</span>
        )}
      </button>
      <button
        type="button"
        role={menuRole}
        aria-haspopup="dialog"
        className={cn(ITEM, 'flex items-center justify-between')}
        onClick={() => {
          close(false)
          openNotificationCenter()
        }}
      >
        Thông báo
        {unreadNotifications > 0 && (
          <span className="rounded-full bg-page-fg px-2 text-xs font-medium text-page-bg">{unreadNotifications}</span>
        )}
      </button>
      <Link role={menuRole} to="/lich-phong-van" className={ITEM} onClick={() => close(false)}>
        Lịch phỏng vấn
      </Link>
      <Link role={menuRole} to={area.href} className={ITEM} onClick={() => close(false)}>
        {area.label}
      </Link>
      <Link
        role={menuRole}
        to={profileHref}
        className={ITEM}
        onClick={(e) => {
          close(false)
          onOpenProfile(e)
        }}
      >
        Trang cá nhân
      </Link>
      <button
        role={menuRole}
        type="button"
        className={ITEM}
        onClick={() => {
          setQuality(quality === 'high' ? 'low' : 'high')
          close()
        }}
      >
        {quality === 'high' ? 'Giảm hiệu ứng' : 'Nâng hiệu ứng'}
        <span className="ml-2 opacity-70">({quality === 'high' ? 'Cao' : 'Thấp'})</span>
      </button>
      <div role={menuRole ? "separator" : undefined} className="my-1 h-px bg-page-line" />
      <button
        role={menuRole}
        type="button"
        className={ITEM}
        onClick={() => {
          close(false)
          onLogout()
        }}
      >
        Đăng xuất
      </button>
    </>
  )
}
