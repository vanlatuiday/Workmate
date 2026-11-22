import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CurtainLink } from '@components/motion/PageCurtain'
import Reveal from '@components/motion/Reveal'
import { pad, photoSrcSet, photoUrl, type GalleryItem } from './types'
import type { GalleryProps } from './DiscoverGallery'
import { FOCUS_FAR } from '@utils/focus'
import { scrollToY } from '@hooks/useSmoothScroll'

/**
 * Bản xếp dọc của bộ sưu tập: màn hình nhỏ, cảm ứng, hoặc khi bật "giảm chuyển động".
 * Mỗi mục là ảnh lớn + phần chữ ngay dưới (từ lg: ảnh trái, chữ phải). Cuộn tự nhiên, không ghim.
 */
export default function StaticGallery<T extends GalleryItem>({ items, label, intro, renderDetail, layout = 'default', initialIndex = 0 }: GalleryProps<T>) {
  const location = useLocation()
  const listRef = useRef<HTMLOListElement>(null)
  // Mở sẵn ở mục `initialIndex` (bố cục jobs): nhảy tức thì tới khối đó, trừ chiều cao header
  useEffect(() => {
    if (layout !== 'jobs' || initialIndex <= 0) return
    const raf = requestAnimationFrame(() => {
      const block = listRef.current?.children[Math.min(items.length - 1, Math.round(initialIndex))] as HTMLElement | undefined
      if (!block) return
      scrollToY(block.getBoundingClientRect().top + window.scrollY - 80)
    })
    return () => cancelAnimationFrame(raf)
    // chỉ chạy khi gắn
  }, [])
  // Bố cục /viec-lam: ảnh rộng full, thẻ kính đè nhẹ lên đáy ảnh
  if (layout === 'jobs') {
    return (
      <section aria-label={label} className="shell pb-section-sm pt-4">
        <ol ref={listRef} className="flex flex-col gap-16 md:gap-24">
          {items.map((item, i) => (
            <li key={item.id}>
              <p className="mb-3 text-sm text-page-muted tnum">
                {pad(i + 1)} / {pad(items.length)}
              </p>
              <Reveal y={24}>
{item.popup ? (
                  <Link
                    to={item.href}
                    state={{ jobDetailFrom: `${location.pathname}${location.search}${location.hash}` }}
                    aria-label={item.linkLabel}
                    className={`group block overflow-hidden rounded-control bg-page-surface ${FOCUS_FAR}`}
                  >
                    <img
                    src={photoUrl(item.photo, 960)}
                    srcSet={photoSrcSet(item.photo)}
                    sizes="(min-width: 1024px) 90vw, 100vw"
                    alt={item.photo.alt}
                    loading={i < 2 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-slow ease-editorial group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100 md:aspect-[16/9]"
                  />
                  </Link>
                ) : (
                <CurtainLink
                  to={item.href}
                  title={item.title}
                  state={{ from: '/viec-lam' }}
                  aria-label={item.linkLabel}
                  className={`group block overflow-hidden rounded-control bg-page-surface ${FOCUS_FAR}`}
                >
                  <img
                    src={photoUrl(item.photo, 960)}
                    srcSet={photoSrcSet(item.photo)}
                    sizes="(min-width: 1024px) 90vw, 100vw"
                    alt={item.photo.alt}
                    loading={i < 2 ? 'eager' : 'lazy'}
                    decoding="async"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-slow ease-editorial group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100 md:aspect-[16/9]"
                  />
                </CurtainLink>
                )}
              </Reveal>
              <div className="relative isolate -mt-14 ml-3 md:-mt-20 md:ml-auto md:mr-6 md:max-w-lg">
                {/* Quầng cyan mờ phía sau thẻ cho thẻ nổi khỏi nền (tĩnh) */}
                <div aria-hidden="true" className="jobs-card-halo pointer-events-none absolute -inset-3 -z-10 opacity-35" />
                <div data-lenis-prevent={item.popup ? '' : undefined} className={`day-gcard relative rounded-card border border-wm-ivory/20 bg-wm-abyss/65 p-5 text-page-fg ring-1 ring-wm-cyan/35 backdrop-blur-[16px]${item.popup ? ' max-h-[75svh] overflow-y-auto overscroll-contain [scrollbar-width:thin]' : ''}`}>
                  {renderDetail(item)}
                </div>
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
                  src={photoUrl(item.photo, 960)}
                  srcSet={photoSrcSet(item.photo)}
                  sizes="(min-width: 1024px) 55vw, 90vw"
                  alt={item.photo.alt}
                  loading={i < 2 ? 'eager' : 'lazy'}
                  decoding="async"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-slow ease-editorial group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
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
