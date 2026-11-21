import LightCurves from './LightCurves'
import { heroArt } from './content'

/** Sao 4 cánh trang trí (lấp lánh rất chậm — .hero-star trong index.css). Vị trí/cỡ truyền qua className/size. */
export function HeroSparkle({
  size,
  className,
  delay = 0,
  duration = 3,
  tone = 'ivory',
}: {
  size: number
  className: string
  delay?: number
  duration?: number
  tone?: 'ivory' | 'cyan'
}) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`hero-star ${tone === 'cyan' ? 'text-wm-cyan' : 'text-wm-ivory'} ${className}`}
      style={{ ['--star-d' as string]: `${delay}s`, ['--star-t' as string]: `${duration}s` }}
    >
      <path d="M12 0C12.8 7 17 11.2 24 12C17 12.8 12.8 17 12 24C11.2 17 7 12.8 0 12C7 11.2 11.2 7 12 0Z" fill="currentColor" />
    </svg>
  )
}

/**
 * Ảnh 3D trang trí ở hai bên hero (cấu hình + cách thêm ảnh: `heroArt` trong content.ts).
 * Chỉ từ lg, aria-hidden, nằm trong lề hai bên tiêu đề (rộng clamp theo màn hình) nên không đè chữ/ô tìm.
 * Ảnh của chủ dự án đã có sẵn vòng quỹ đạo nên không vẽ thêm (.hero-art-orbit để dự phòng); ảnh lơ lửng ±8px chậm (tắt khi giảm chuyển động — index.css).
 * Phần tử cha mang data-hero-item nên fade cùng nội dung hero.
 */
export default function HeroSideArt() {
  const sides = [
    { key: 'left', art: heroArt.left, pos: 'left-[max(8px,1vw)]', tilt: '-rotate-[18deg]', float: '' },
    { key: 'right', art: heroArt.right, pos: 'right-[max(8px,1vw)]', tilt: 'rotate-[14deg]', float: 'hero-art-float--b' },
  ] as const

  return (
    <>
      {/* Sao quanh hai ảnh — chỉ từ lg như ảnh */}
      <div aria-hidden className="pointer-events-none absolute inset-0 hidden lg:block">
        {heroArt.left && (
          <>
            <HeroSparkle size={16} className="left-[5%] top-[19%]" delay={0} duration={3.2} />
            <HeroSparkle size={9} tone="cyan" className="left-[21%] top-[33%]" delay={1.1} duration={2.6} />
          </>
        )}
        {heroArt.right && (
          <>
            <HeroSparkle size={14} tone="cyan" className="right-[6%] top-[20%]" delay={0.6} duration={3.6} />
            <HeroSparkle size={10} className="right-[23%] top-[32%]" delay={1.8} duration={2.9} />
          </>
        )}
      </div>
      {sides.map(({ key, art, pos, float }) =>
        art ? (
          <div
            key={key}
            aria-hidden
            className={`pointer-events-none absolute top-[26%] ${pos} isolate hidden w-[clamp(200px,22vw,380px)] lg:block`}
          >
            {/* Dải cong sáng sau ảnh (cùng kiểu các mục có ảnh trên trang chủ), lan rộng ra ngoài khung ảnh */}
            <LightCurves side={key === 'left' ? 'left' : 'right'} className="-inset-x-[35%] -inset-y-[60%]" />
            <img
              src={art.src}
              alt=""
              loading="lazy"
              decoding="async"
              className={`hero-art-float ${float} relative h-auto w-full select-none`}
            />
          </div>
        ) : null,
      )}
    </>
  )
}
