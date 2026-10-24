import { CurtainLink } from '@components/motion/PageCurtain'
import Reveal from '@components/motion/Reveal'
import { pad, photoSrcSet, photoUrl, type GalleryItem } from './types'
import type { GalleryProps } from './DiscoverGallery'
import { FOCUS_FAR } from '@utils/focus'

/**
 * Bản xếp dọc của bộ sưu tập: màn hình nhỏ, cảm ứng, hoặc khi bật "giảm chuyển động".
 * Mỗi mục là ảnh lớn + phần chữ ngay dưới (từ lg: ảnh trái, chữ phải). Cuộn tự nhiên, không ghim.
 */
export default function StaticGallery<T extends GalleryItem>({ items, label, intro, renderDetail }: GalleryProps<T>) {
  return (
    <section aria-label={label} className="shell py-section-sm">
      <div className="max-w-xl">{intro}</div>
      <ol className="mt-14 flex flex-col gap-20 md:gap-28">
        {items.map((item, i) => (
          <li key={item.id} className="grid gap-6 lg:grid-cols-12 lg:items-center lg:gap-12">
            <Reveal y={24} className="lg:col-span-7">
              <CurtainLink
                to={item.href}
                title={item.title}
                state={{ from: '/viec-lam' }}
                aria-label={item.linkLabel}
                className={`group block overflow-hidden rounded-control bg-page-surface ${FOCUS_FAR}`}
              >
                <img
                  src={photoUrl(item.photo.id, 960)}
                  srcSet={photoSrcSet(item.photo.id)}
                  sizes="(min-width: 1024px) 55vw, 90vw"
                  alt={item.photo.alt}
                  loading={i < 2 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-editorial group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              </CurtainLink>
            </Reveal>
            <div className="lg:col-span-5">
              <p className="mb-4 text-sm text-page-muted tnum">
                {pad(i + 1)} / {pad(items.length)}
              </p>
              {renderDetail(item)}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
