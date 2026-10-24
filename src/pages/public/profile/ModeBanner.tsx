// Dải phân biệt chế độ: chủ sở hữu / người xem / xem trước.
import { Eye, Pencil } from 'lucide-react'
import { Btn } from './ui'

export default function ModeBanner({
  owner,
  preview,
  targetName,
  onPreview,
  onBack,
}: {
  owner: boolean
  preview: boolean
  /** Tên chủ trang đang hiển thị */
  targetName: string
  onPreview: () => void
  onBack: () => void
}) {
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-page-line bg-page-surface px-4 py-3">
      <p className="text-sm font-medium text-page-fg">
        {preview
          ? 'Đang xem trước như người khác thấy'
          : owner
            ? 'Bạn đang xem trang của mình'
            : `Bạn đang xem hồ sơ của ${targetName}`}
      </p>
      {owner && (
        <Btn onClick={onPreview} className="!py-1.5">
          <Eye className="h-4 w-4" aria-hidden />
          Xem như người khác thấy
        </Btn>
      )}
      {preview && (
        <Btn onClick={onBack} className="!py-1.5">
          <Pencil className="h-4 w-4" aria-hidden />
          Quay lại chỉnh sửa
        </Btn>
      )}
    </div>
  )
}
