import { CurtainLink } from '@components/motion/PageCurtain'
import Reveal from '@components/motion/Reveal'
import { pad, photoSrcSet, photoUrl, type GalleryItem } from './types'
import type { GalleryProps } from './DiscoverGallery'
import { FOCUS_FAR } from '@utils/focus'

/**
 * Bản xếp dọc của bộ sưu tập: màn hình nhỏ, cảm ứng, hoặc khi bật "giảm chuyển động".
 * Mỗi mục là ảnh lớn + phần chữ ngay dưới (từ lg: ảnh trái, chữ phải). Cuộn tự nhiên, không ghim.
 */
export default function StaticGallery<T extends GalleryItem>({ items, label, intro, renderDetail, layout = 'default' }: GalleryProps<T>) {
  // Bố cục /viec-lam: ảnh rộng full, thẻ kính đè nhẹ lên đáy ảnh
  if (layout === 'jobs') {
    return (
      <section aria-label={label} className="shell pb-section-sm pt-4">
        <ol className="flex flex-col gap-16 md:gap-24">
          {items.map((item, i) => (
            <li key={item.id}>
              <p className="mb-3 text-sm text-page-muted tnum">
                {pad(i + 1)} / {pad(items.length)}
              </p>
              <Reveal y={24}>
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
                    sizes="(min-width: 1024px) 90vw, 100vw"
                    alt={item.photo.alt}
                    loading={i < 2 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 ease-editorial group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100 md:aspect-[16/9]"
                  />
                </CurtainLink>
              </Reveal>
              <div className="glass-liquid relative -mt-14 ml-3 rounded-card p-5 [--glass-alpha:72%] text-page-fg md:-mt-20 md:ml-auto md:mr-6 md:max-w-lg md:p-6">
                {renderDetail(item)}
              </div>
            </li>
          ))}
        </ol>
      </section>
    )
  }

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
