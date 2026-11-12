import { cn } from '@utils/cn'

/** Khối chờ tải: nền page-line bo góc, nhấp nháy nhẹ (tắt khi giảm chuyển động). Ẩn khỏi trình đọc màn hình. */
export default function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-md bg-page-line motion-reduce:animate-none', className)} />
}

/** Danh sách chờ tải trong một Panel/khối: n dòng (tiêu đề + dòng phụ). Có nhãn cho trình đọc màn hình. */
export function SkeletonList({ rows = 3, label = 'Đang tải…' }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite" className="divide-y divide-page-line">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="space-y-2 py-4 first:pt-0 last:pb-0">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  )
}

/** Hàng ô thống kê chờ tải (cùng lưới với StatCard). */
export function SkeletonStats({ count = 4 }: { count?: number }) {
  return (
    <div role="status" aria-live="polite" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <span className="sr-only">Đang tải số liệu…</span>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-card border border-page-line bg-page-surface p-5 md:p-6">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="mt-4 h-9 w-1/3" />
        </div>
      ))}
    </div>
  )
}

/** Lưới thẻ chờ tải (thẻ việc, thẻ công ty, thẻ ứng viên): ảnh tùy chọn + tiêu đề + 2 dòng + hàng nút */
export function SkeletonCards({
  count = 3,
  image = false,
  className = 'grid gap-4 md:grid-cols-2 xl:grid-cols-3',
  label = 'Đang tải danh sách…',
}: { count?: number; image?: boolean; className?: string; label?: string }) {
  return (
    <div role="status" aria-live="polite" className={className}>
      <span className="sr-only">{label}</span>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-card border border-page-line bg-page-surface p-5">
          {image && <Skeleton className="mb-4 aspect-[4/3] w-full rounded-control" />}
          <div className="flex items-start gap-3">
            <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="mt-4 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-5/6" />
          <div className="mt-5 flex gap-2">
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-16 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** Khung chat chờ tải: bong bóng hai phía xen kẽ */
export function SkeletonChat({ count = 5, label = 'Đang tải tin nhắn…' }: { count?: number; label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3 p-4">
      <span className="sr-only">{label}</span>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className={i % 2 ? 'h-10 w-1/2 self-end rounded-card' : 'h-12 w-2/3 rounded-card'} />
      ))}
    </div>
  )
}
