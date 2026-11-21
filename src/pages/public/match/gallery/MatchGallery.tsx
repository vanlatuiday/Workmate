import type { ReactNode } from 'react'
import FadeIn from '@components/motion/FadeIn'
import { photoSrcSet, photoUrl, type Photo } from '@components/discover/types'
import { COVER_GLASS } from '@components/common/PageCover'
import { cn } from '@utils/cn'
import { FOCUS_FAR } from '@utils/focus'

export interface GalleryItem {
  id: string
  photo: Photo
}

type Props<T extends GalleryItem> = {
  items: T[]
  /** Nhãn của danh sách cho trình đọc màn hình */
  label: string
  /** Phần chữ dưới ảnh (xem GalleryCaption) */
  renderCaption: (item: T) => ReactNode
  /** Tên đầy đủ của nút cho trình đọc màn hình */
  itemLabel: (item: T) => string
  /** Bấm thẻ; `origin` là nút chứa ảnh (có [data-print]) để khung chi tiết phóng ra từ đó */
  onOpen: (item: T, origin: HTMLElement) => void
  /** Thẻ đang mở chi tiết — ẩn ảnh của nó (tấm ảnh đang "bay") */
  hiddenId?: string | null
  /** Điểm phù hợp (0–100) → viên % nổi ở góc ảnh để quét nhanh */
  scoreOf?: (item: T) => number
}

/**
 * Bộ sưu tập của /match: lưới 4 cột (xl) / 3 cột (lg) / 2 cột (sm) / 1 cột, mỗi thẻ là MỘT nút mở chi tiết.
 * Không còn uốn cong WebGL theo cuộn: thẻ chỉ trồi lên một lần khi vào khung nhìn (FadeIn; giảm chuyển động → hiện ngay).
 * Bóng thẻ là bóng xanh abyss trung tính, không hắt màu ảnh.
 */
export default function MatchGallery<T extends GalleryItem>({ items, label, renderCaption, itemLabel, onOpen, hiddenId, scoreOf }: Props<T>) {
  return (
    <ul aria-label={label} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item, i) => (
        <li key={item.id} className="min-w-0">
          <FadeIn delay={(i % 4) * 70} className="h-full">
            <button
              type="button"
              aria-label={itemLabel(item)}
              onClick={(e) => onOpen(item, e.currentTarget)}
              className={cn(
                COVER_GLASS,
                'group flex h-full w-full flex-col overflow-hidden rounded-card text-left',
                'shadow-[0_18px_40px_-24px_color-mix(in_srgb,var(--wm-abyss)_35%,transparent)]',
                'transition-[border-color] duration-base hover:border-page-fg motion-reduce:transition-none',
                FOCUS_FAR,
              )}
            >
              <div data-print className="relative aspect-[3/2] w-full overflow-hidden bg-page-surface">
                <img
                  src={photoUrl(item.photo.id, 960)}
                  srcSet={photoSrcSet(item.photo.id)}
                  sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  alt={item.photo.alt}
                  loading="lazy"
                  className={cn(
                    'h-full w-full object-cover',
                    'transition-transform duration-slow ease-editorial group-hover:scale-[1.04]',
                    'motion-reduce:transition-none motion-reduce:group-hover:scale-100',
                    hiddenId === item.id && 'invisible',
                  )}
                />
                {scoreOf && <ScoreBadge score={scoreOf(item)} />}
              </div>
              <div className="flex flex-1 flex-col p-4">{renderCaption(item)}</div>
            </button>
          </FadeIn>
        </li>
      ))}
    </ul>
  )
}

/** Mức + màu theo điểm (khớp nhãn MatchScore): ≥80 xanh lá, ≥60 azure, ≥40 hổ phách, còn lại đất nung */
export function fitTone(score: number) {
  if (score >= 80) return { label: 'Rất phù hợp', bar: 'bg-wm-fern', text: 'text-wm-fern', dot: 'bg-wm-leaf' }
  if (score >= 60) return { label: 'Phù hợp', bar: 'bg-wm-azure', text: 'text-wm-azure', dot: 'bg-wm-azure' }
  if (score >= 40) return { label: 'Có thể phù hợp', bar: 'bg-wm-amber', text: 'text-wm-amber-ink', dot: 'bg-wm-amber' }
  return { label: 'Ít phù hợp', bar: 'bg-wm-rust', text: 'text-wm-rust', dot: 'bg-wm-rust' }
}

/** Viên % trên góc ảnh: nền abyss kính, chữ ngà, chấm màu theo mức (trang trí — số đầy đủ đã có trong phần chữ) */
function ScoreBadge({ score }: { score: number }) {
  const v = Math.round(Math.min(100, Math.max(0, score)))
  const t = fitTone(v)
  return (
    <span aria-hidden className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-wm-abyss/70 px-2.5 py-1 text-xs font-semibold text-wm-ivory backdrop-blur-md">
      <span className={cn('h-2 w-2 rounded-full', t.dot)} />
      <span className="tnum">{v}%</span>
      <span className="font-normal text-wm-ivory/85">{t.label}</span>
    </span>
  )
}
