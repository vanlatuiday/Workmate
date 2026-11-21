import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ChooseSlotDialog from '@components/interview/ChooseSlotDialog'
import HireAction from '@components/hire/HireAction'
import { candidateHref } from '@pages/public/personal/links'
import { markNotificationRead, type DemoNotification } from '@services/connectionService'
import { BTN_PRIMARY, BTN_SM } from '@utils/ui'
import { cn } from '@utils/cn'
import type { NotificationAction } from './notificationGroups'

export default function NotificationActionControl({ action, notification, onNavigate }: { action: NotificationAction; notification: DemoNotification; onNavigate: () => void }) {
  const [choosing, setChoosing] = useState(false)
  const navigate = useNavigate()
  const read = () => { if (!notification.read) markNotificationRead(notification.id) }
  if (action.kind === 'offer') return (
    <div className="flex flex-wrap gap-2" onClickCapture={read}>
      <HireAction viewer="seeker" jobId={notification.jobId} seekerId={notification.seekerId} compact />
    </div>
  )
  if (action.kind === 'application') return (
    <button type="button" className={cn(BTN_PRIMARY, BTN_SM, 'min-h-11')} onClick={() => { read(); onNavigate(); navigate(candidateHref(notification.seekerId)) }}>Xem hồ sơ</button>
  )
  return <>
    <button type="button" className={cn(BTN_PRIMARY, BTN_SM, 'min-h-11')} onClick={() => { read(); setChoosing(true) }}>Chọn giờ phỏng vấn</button>
    {choosing && <ChooseSlotDialog key={action.interview.slots.join('|')} interview={action.interview} onClose={() => setChoosing(false)} />}
  </>
}
