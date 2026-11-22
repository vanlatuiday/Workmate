import { Bookmark } from 'lucide-react'
import type { ReactNode } from 'react'
import PopIcon from '@components/common/PopIcon'
import FadeIn from '@components/motion/FadeIn'
import { photoSrcSet, photoUrl, type Photo } from '@components/discover/types'
import { COVER_GLASS } from '@components/common/PageCover'
import { cn } from '@utils/cn'
import { FOCUS_FAR } from '@utils/focus'
import defaultAvatar from '@assets/images/avatar-default.webp'

export interface GalleryItem {
  id: string
  /** Ảnh minh họa; thiếu khi dùng `avatarOf` */
  photo?: Photo
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
  /** Có thì vùng ảnh vẽ ảnh đại diện tròn giữa nền xanh nhạt (null → ảnh mặc định) thay vì ảnh phủ kín — dùng cho ứng viên */
  avatarOf?: (item: T) => { src: string | null; alt: string }
  /** Nhãn trạng thái ở góc trái ảnh ("Quan tâm bạn", "Đã lưu"…); không có thì không hiện viên. Có thì thay viên % */
  badgeOf?: (item: T) => string | undefined
  /** Nút lưu tròn ở góc phải ảnh: anh em (không lồng) với nút mở chi tiết */
  /** Nút hành động đáy thẻ (toàn chiều rộng): anh em (không lồng) với nút mở chi tiết; không có thì thẻ không có hàng nút */
  action?: (item: T) => ReactNode
  save?: { isSaved: (item: T) => boolean; label: (item: T, saved: boolean) => string; onToggle: (item: T) => void }
}

/**
 * Bộ sưu tập của /match: lưới 4 cột (xl) / 3 cột (lg) / 2 cột (sm) / 1 cột, mỗi thẻ = nút mở chi tiết (ảnh + chữ) + nút lưu + nút hành động đáy, đều là anh em.
 * Không còn uốn cong WebGL theo cuộn: thẻ chỉ trồi lên một lần khi vào khung nhìn (FadeIn; giảm chuyển động → hiện ngay).
 * Bóng thẻ là bóng xanh abyss trung tính, không hắt màu ảnh.
 */
export default function MatchGallery<T extends GalleryItem>({ items, label, renderCaption, itemLabel, onOpen, hiddenId, scoreOf, avatarOf, badgeOf, action, save }: Props<T>) {
  return (
    <ul aria-label={label} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {items.map((item, i) => (
        <li key={item.id} className="min-w-0">
          <FadeIn delay={(i % 4) * 70} className="h-full">
            {/* Thẻ = khung relative chứa hai nút anh em: nút mở chi tiết (cả thẻ) và nút lưu nổi trên ảnh */}
            <div className="group/card relative h-full transition-transform duration-base ease-editorial hover:-translate-y-[3px] focus-within:-translate-y-[3px] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-y-0">
              {/* Khung kính của thẻ: cột [nút mở chi tiết (flex-1)] [hàng nút hành động]; vòng focus của nút mở vẽ quanh cả khung */}
              <div
                className={cn(
                  COVER_GLASS,
                  'flex h-full w-full flex-col overflow-hidden rounded-card text-left',
                  'shadow-[0_18px_40px_-24px_color-mix(in_srgb,var(--wm-abyss)_35%,transparent)]',
                  'transition-[border-color,box-shadow] duration-base hover:border-page-fg motion-reduce:transition-none',
                  'group-hover/card:shadow-[0_24px_48px_-22px_color-mix(in_srgb,var(--wm-abyss)_45%,transparent)] group-focus-within/card:shadow-[0_24px_48px_-22px_color-mix(in_srgb,var(--wm-abyss)_45%,transparent)]',
                  'has-[[data-open-card]:focus-visible]:ring-2 has-[[data-open-card]:focus-visible]:ring-page-fg has-[[data-open-card]:focus-visible]:ring-offset-4 has-[[data-open-card]:focus-visible]:ring-offset-page-bg',
                )}
              >
              <button
                type="button"
                data-open-card
                aria-label={itemLabel(item)}
                onClick={(e) => onOpen(item, e.currentTarget)}
                className="group flex w-full flex-1 flex-col text-left focus-visible:outline-none"
              >
                <div data-print className="relative aspect-[2/1] w-full overflow-hidden bg-page-surface">
                  {avatarOf ? (
                    <div className="flex h-full w-full items-center justify-center bg-wm-azure/[0.12]">
                      <img
                        src={avatarOf(item).src ?? defaultAvatar}
                        alt={avatarOf(item).alt}
                        loading="lazy"
                        draggable={false}
                        className={cn(
                          'h-24 w-24 rounded-full border-2 border-wm-ivory bg-wm-ivory object-cover sm:h-28 sm:w-28',
                          'transition-transform duration-slow ease-editorial group-hover:scale-[1.04]',
                          'motion-reduce:transition-none motion-reduce:group-hover:scale-100',
                        )}
                        onError={(e) => { if (!e.currentTarget.src.endsWith(defaultAvatar)) e.currentTarget.src = defaultAvatar }}
                      />
                    </div>
                  ) : item.photo && (
                    <img
                      src={photoUrl(item.photo, 960)}
                      srcSet={photoSrcSet(item.photo)}
                      sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      alt={item.photo.alt}
                      loading="lazy"
                      className={cn(
                        'h-full w-full object-cover',
                        'transition-transform duration-slow ease-editorial group-hover:scale-[1.03]',
                        'motion-reduce:transition-none motion-reduce:group-hover:scale-100',
                        hiddenId === item.id && 'invisible',
                      )}
                    />
                  )}
                  {/* Phủ xanh azure rất nhẹ cho ảnh stock hợp nền ban ngày + vệt tối đáy để viên nhãn dễ đọc */}
                  {!avatarOf && <span aria-hidden="true" className="photo-tint pointer-events-none absolute inset-0" />}
                  {badgeOf ? <StatusBadge text={badgeOf(item)} /> : scoreOf && <ScoreBadge score={scoreOf(item)} />}
                </div>
                <div className="flex flex-1 flex-col p-4">{renderCaption(item)}</div>
              </button>
              {action && <div className="px-4 pb-4">{action(item)}</div>}
              </div>
              {save && (() => {
                const saved = save.isSaved(item)
                return (
                  <button
                    type="button"
                    aria-pressed={saved}
                    aria-label={save.label(item, saved)}
                    onClick={(e) => {
                      e.stopPropagation()
                      save.onToggle(item)
                    }}
                    className={cn(
                      'absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full',
                      'bg-wm-abyss/70 text-wm-ivory backdrop-blur-md hover:bg-wm-abyss/90',
                      'transition-colors duration-fast motion-reduce:transition-none',
                      FOCUS_FAR,
                    )}
                  >
                    <PopIcon icon={Bookmark} on={saved} />
                  </button>
                )
              })()}
            </div>
          </FadeIn>
        </li>
      ))}
    </ul>
  )
}

/** (pillText: màu chữ đạt ≥4.5:1 trên nền tint; azure thuần chỉ 4.4:1 nên viên dùng abyss)
 * Mức + màu theo điểm (khớp nhãn MatchScore): ≥80 xanh lá, ≥60 azure, ≥40 hổ phách, còn lại đất nung */
export function fitTone(score: number) {
  if (score >= 80) return { label: 'Rất phù hợp', bar: 'bg-wm-fern', stroke: 'stroke-wm-fern', text: 'text-wm-fern', dot: 'bg-wm-leaf', tint: 'bg-wm-fern/[0.08]', pillText: 'text-wm-fern' }
  if (score >= 60) return { label: 'Phù hợp', bar: 'bg-wm-azure', stroke: 'stroke-wm-azure', text: 'text-wm-ocean', dot: 'bg-wm-azure', tint: 'bg-wm-azure/[0.09]', pillText: 'text-wm-abyss' }
  if (score >= 40) return { label: 'Có thể phù hợp', bar: 'bg-wm-amber', stroke: 'stroke-wm-amber', text: 'text-wm-amber-ink', dot: 'bg-wm-amber', tint: 'bg-wm-amber/[0.12]', pillText: 'text-wm-amber-ink' }
  return { label: 'Ít phù hợp', bar: 'bg-wm-rust', stroke: 'stroke-wm-rust', text: 'text-wm-rust', dot: 'bg-wm-rust', tint: 'bg-wm-rust/[0.08]', pillText: 'text-wm-rust' }
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

/** Viên trạng thái trên góc ảnh (trang trí — trạng thái đã nằm trong tên nút của thẻ) */
function StatusBadge({ text }: { text?: string }) {
  if (!text) return null
  return (
    <span aria-hidden className="absolute left-3 top-3 inline-flex items-center rounded-full bg-wm-abyss/70 px-2.5 py-1 text-xs font-semibold text-wm-ivory backdrop-blur-md">
      {text}
    </span>
  )
}
