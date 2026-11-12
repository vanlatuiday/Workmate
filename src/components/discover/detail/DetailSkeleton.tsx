import Skeleton from '@components/dashboard/Skeleton'

/** Khung chờ cho trang chi tiết khi danh mục chưa về từ máy chủ (thay cho "Không tìm thấy" nháy lên). */
export default function DetailSkeleton({ label = 'Đang tải…' }: { label?: string }) {
  return (
    <section role="status" aria-live="polite" className="shell min-h-[60vh] py-section-sm">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-4 w-20" />
      <Skeleton className="mt-10 h-12 w-2/3 max-w-xl" />
      <Skeleton className="mt-8 aspect-[16/9] w-full rounded-control" />
      <div className="mt-10 grid gap-8 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-4">
          <Skeleton className="h-14 w-14 rounded-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="space-y-4 lg:col-span-8">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </section>
  )
}
