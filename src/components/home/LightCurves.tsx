import { cn } from '@utils/cn'

/**
 * Dải cong sáng mờ sau ảnh minh họa (quầng xanh lớn + vòng cung viền xanh ngọc mảnh + quầng nhỏ góc đối diện),
 * mép trên/dưới tan vào nền sao. Dùng chung cho các mục có ảnh trên trang chủ (CSS: .stmt-curve* trong index.css).
 * `side`: phía có ảnh — 'right' (mặc định), 'left' (lật gương), 'center' (ảnh giữa, dải ôm phía sau ảnh).
 * Đặt làm con đầu tiên của section `relative` (section nên có overflow-x-clip để không tràn ngang).
 */
export default function LightCurves({ side = 'right', className }: { side?: 'right' | 'left' | 'center'; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'stmt-curves pointer-events-none absolute inset-0 -z-10',
        side === 'left' && '-scale-x-100',
        side === 'center' && 'stmt-curves--center',
        className,
      )}
    >
      <span className="stmt-curve stmt-curve-a" />
      <span className="stmt-curve stmt-curve-b" />
      <span className="stmt-curve stmt-curve-c" />
    </div>
  )
}
