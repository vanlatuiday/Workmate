import { useEffect, useRef, type PointerEvent } from 'react'
import { gsap, useGSAP } from '@utils/gsap'
import { useMediaQuery, FINE_POINTER } from '@hooks/useMediaQuery'
import { photoSrcSet, photoUrl, type Photo } from './types'

type Props = {
  photo: Photo
  /** Chỉ ảnh đang ở giữa mới nghiêng theo chuột */
  active: boolean
  eager?: boolean
  sizes: string
}

/**
 * Khung ảnh nghiêng nhẹ theo vị trí con trỏ, ảnh bên trong trôi ngược chiều
 * tạo cảm giác chiều sâu. Chỉ bật với chuột thật và khi không "giảm chuyển động".
 * Không đụng vào transform của phần tử cha — cha do ScrollGallery điều khiển.
 */
export default function TiltFrame({ photo, active, eager = false, sizes }: Props) {
  const frameRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const fine = useMediaQuery(FINE_POINTER)
  const { contextSafe } = useGSAP({ scope: frameRef })

  const reset = contextSafe(() => {
    gsap.to(frameRef.current, { rotationX: 0, rotationY: 0, duration: 0.9, ease: 'power3.out', overwrite: 'auto' })
    gsap.to(imgRef.current, { x: 0, y: 0, scale: 1, duration: 0.9, ease: 'power3.out', overwrite: 'auto' })
  })

  const onMove = contextSafe((e: PointerEvent<HTMLDivElement>) => {
    if (!fine || !active) return
    const r = e.currentTarget.getBoundingClientRect()
    const rx = (e.clientX - r.left) / r.width - 0.5
    const ry = (e.clientY - r.top) / r.height - 0.5
    gsap.to(frameRef.current, {
      rotationY: rx * 7,
      rotationX: -ry * 7,
      transformPerspective: 1100,
      duration: 0.6,
      ease: 'power3.out',
      overwrite: 'auto',
    })
    gsap.to(imgRef.current, { x: -rx * 20, y: -ry * 20, scale: 1.07, duration: 0.6, ease: 'power3.out', overwrite: 'auto' })
  })

  // Ảnh rời vị trí giữa khi đang được rê chuột → trả về thế thẳng
  useEffect(() => {
    if (!active) reset()
    // reset là hàm mới mỗi lần render; chỉ cần chạy khi `active` đổi
  }, [active])

  return (
    <div
      ref={frameRef}
      onPointerMove={onMove}
      onPointerLeave={reset}
      className="h-full w-full overflow-hidden rounded-control bg-page-surface"
    >
      <img
        ref={imgRef}
        src={photoUrl(photo.id, 960)}
        srcSet={photoSrcSet(photo.id)}
        sizes={sizes}
        alt={photo.alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
        className="h-full w-full object-cover"
      />
    </div>
  )
}
