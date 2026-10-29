import { StatusBadge } from '@components/dashboard'
import { useHire, type Side } from '@services/connectionService'
import { HIRE_LABEL } from './format'

type Props = { viewer: Side; jobId: string; seekerId: string }

/** Nhãn trạng thái nhận việc của một cặp (chỉ đọc); không hiện gì khi chưa có bản ghi. */
export default function HireStatusChip({ viewer, jobId, seekerId }: Props) {
  const hire = useHire(jobId, seekerId)
  if (!hire) return null
  return (
    <StatusBadge tone={hire.status === 'accepted' ? 'strong' : hire.status === 'offered' ? 'default' : 'muted'}>
      {HIRE_LABEL[viewer][hire.status]}
    </StatusBadge>
  )
}
