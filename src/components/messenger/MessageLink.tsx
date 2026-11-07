import type { ReactNode } from 'react'
import { useMessengerStore } from '@context/messengerStore'

/**
 * Nút "Nhắn tin" mở khung tin nhắn nổi thay vì chuyển trang.
 * convKey dạng "jobId|seekerId"; bỏ trống = mở danh sách hội thoại.
 */
export default function MessageLink({ convKey, className, children }: { convKey?: string | null; className?: string; children: ReactNode }) {
  const openMessenger = useMessengerStore((s) => s.openMessenger)
  return (
    <button type="button" onClick={() => openMessenger(convKey)} className={className}>
      {children}
    </button>
  )
}
