// Thông báo nhỏ (vùng aria-live luôn có mặt để trình đọc màn hình đọc được)
import { createPortal } from 'react-dom'
import { cn } from '@utils/cn'

export default function Toast({ message, themeClass }: { message: string; themeClass: string }) {
  return createPortal(
    <div className={cn(themeClass, '!bg-transparent')}>
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center px-4">
        {message && (
          <p className="rounded-full bg-page-fg px-5 py-3 text-sm font-medium text-page-bg">{message}</p>
        )}
      </div>
    </div>,
    document.body,
  )
}
