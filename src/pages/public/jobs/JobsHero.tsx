import type { ReactNode } from 'react'
import PageCover from '@components/common/PageCover'

type Props = {
  title: string
  /** Dòng số liệu thật hiện dưới tiêu đề */
  fact: ReactNode
  /** Số liệu theo bộ lọc hiện tại: [số, nhãn] — chỉ đọc cho trình đọc màn hình */
  stats: [number, string][]
  /** Ô tìm kiếm (JobSearchBar inCover) */
  children: ReactNode
}

/**
 * Đầu trang /viec-lam: bìa cấp md (PageCover) chứa tiêu đề, số liệu và ô tìm kiếm kính tối.
 * Vùng `role="status"` ẩn đọc số kết quả khi bộ lọc đổi.
 */
export default function JobsHero({ title, fact, stats, children }: Props) {
  return (
    <>
      <PageCover level="md" title={title} fact={fact}>
        {children}
      </PageCover>
      <p className="sr-only" role="status" aria-live="polite">
        {stats.map(([value, label]) => `${value} ${label}`).join(', ')}
      </p>
    </>
  )
}
