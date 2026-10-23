import { Info } from 'lucide-react'

/** Đặt ở trang/khối đang hiển thị dữ liệu giả (DESIGN.md: dữ liệu giả phải ghi rõ). */
export default function MockNotice() {
  return (
    <p className="flex items-center gap-2 text-xs text-page-muted">
      <Info className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
      Dữ liệu mẫu — chưa kết nối hệ thống.
    </p>
  )
}
