import { ShieldCheck } from 'lucide-react'
import StatusBadge from '@components/dashboard/StatusBadge'

/** Huy hiệu "Mã số thuế hợp lệ": mã số doanh nghiệp đang hoạt động theo dữ liệu thuế (khác "đã xác minh giấy tờ"). Chỉ hiện khi `valid`. */
export default function TaxValidBadge({ valid, className }: { valid?: boolean; className?: string }) {
  if (!valid) return null
  return (
    <span title="Mã số doanh nghiệp đang hoạt động theo dữ liệu thuế" className={className}>
      <StatusBadge tone="muted">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />Mã số thuế hợp lệ
        <span className="sr-only">. Mã số doanh nghiệp đang hoạt động theo dữ liệu thuế</span>
      </StatusBadge>
    </span>
  )
}
