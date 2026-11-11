import { useHire, type Side } from '@services/connectionService'
import { hireLabel } from './format'
import HireChip from './HireChip'

type Props = { viewer: Side; jobId: string; seekerId: string }

/** Nhãn trạng thái nhận việc của một cặp (chỉ đọc); không hiện gì khi chưa có bản ghi. */
export default function HireStatusChip({ viewer, jobId, seekerId }: Props) {
  const hire = useHire(jobId, seekerId)
  if (!hire) return null
  return (
    <HireChip status={hire.status}>{hireLabel(viewer, hire)}</HireChip>
  )
}
