import { heroSkyline } from './content'

/** Vị trí đèn cố định (sinh một lần, xác định — không đổi giữa các lần render). */
const LIGHTS = (() => {
  let s = 20261122
  const rnd = () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
  return Array.from({ length: 24 }, (_, i) => ({
    left: 3 + rnd() * 94, // %
    top: 40 + rnd() * 58, // % — nửa dưới ảnh (cầu + mặt nước)
    size: 2 + Math.round(rnd() * 2), // px
    warm: i % 3 !== 0,
    delay: -(rnd() * 4), // giây, âm để lệch pha ngay từ đầu
    dur: 2 + rnd() * 2,
  }))
})()

/**
 * Dải thành phố / cầu Rồng ở đáy hero (cấu hình + cách thêm ảnh: `heroSkyline` trong content.ts).
 * Trống khi `heroSkyline` là null. Đặt làm con ĐẦU của khối hero (data-hero-item) để nằm dưới chữ,
 * thẻ tính năng và nút chuột; vì ở trong khối đó nên vào cùng hero, không hiện lúc intro hạt.
 */
export default function HeroSkyline() {
  if (!heroSkyline) return null
  return (
    <div
      aria-hidden
      className="hero-skyline pointer-events-none absolute inset-x-0 bottom-0 h-[clamp(160px,28vh,320px)] overflow-hidden"
    >
      <img
        src={heroSkyline.src}
        alt=""
        decoding="async"
        className="h-full w-full select-none object-cover object-bottom"
      />
      {/* Đèn lấp lánh trên cầu / mặt nước */}
      <div className="absolute inset-0">
        {LIGHTS.map((l, i) => (
          <span
            key={i}
            className="hero-light absolute rounded-full"
            style={{
              left: `${l.left}%`,
              top: `${l.top}%`,
              width: l.size,
              height: l.size,
              background: `var(${l.warm ? '--wm-apricot' : '--wm-cyan'})`,
              boxShadow: `0 0 6px 1px var(${l.warm ? '--wm-apricot' : '--wm-cyan'})`,
              animationDelay: `${l.delay}s`,
              animationDuration: `${l.dur}s`,
            }}
          />
        ))}
      </div>
      {/* Dải sáng lướt chậm trên mặt nước */}
      <div className="absolute inset-x-0 bottom-0 h-[22%]">
        <div className="hero-shimmer absolute inset-y-0 -left-1/3 w-2/3 blur-xl" />
      </div>
    </div>
  )
}

/**
 * Vài vệt sáng cong mảnh vắt ngang bầu trời hero (luôn có, không phụ thuộc ảnh).
 * Nằm sau nội dung, mờ dần ở hai đầu; trôi cực chậm (tắt khi giảm chuyển động).
 */
export function HeroSkyStreaks() {
  const arcs = [
    { d: 'M-40 210 C 260 40, 640 20, 980 120', cls: 'left-[-6%] top-[4%] w-[62%]', tone: '--wm-ivory', o: 0.4, w: 1.5, dur: '26s' },
    { d: 'M-40 120 C 300 10, 600 40, 900 180', cls: 'left-[-4%] top-[14%] w-[54%]', tone: '--wm-cyan', o: 0.35, w: 1, dur: '32s' },
    { d: 'M40 180 C 380 30, 700 10, 1040 200', cls: 'right-[-6%] top-[2%] w-[62%] -scale-x-100', tone: '--wm-cyan', o: 0.4, w: 1.5, dur: '29s' },
    { d: 'M0 150 C 300 60, 640 40, 940 150', cls: 'right-[-4%] top-[16%] w-[50%] -scale-x-100', tone: '--wm-ivory', o: 0.25, w: 1, dur: '35s' },
  ]
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {arcs.map((a, i) => (
        // Lật gương ở div ngoài: animation của svg sẽ ghi đè transform nếu đặt chung
        <div key={i} className={`absolute ${a.cls}`}>
        <svg
          viewBox="0 0 1000 260"
          fill="none"
          className="hero-streak block h-auto w-full"
          style={{ animationDuration: a.dur, animationDelay: `${-i * 5}s` }}
        >
          <defs>
            <linearGradient id={`hs-g${i}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={`var(${a.tone})`} stopOpacity="0" />
              <stop offset="0.5" stopColor={`var(${a.tone})`} stopOpacity={a.o} />
              <stop offset="1" stopColor={`var(${a.tone})`} stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* quầng mờ rồi nét mảnh */}
          <path d={a.d} stroke={`url(#hs-g${i})`} strokeWidth={a.w * 5} strokeLinecap="round" opacity="0.35" style={{ filter: 'blur(4px)' }} />
          <path d={a.d} stroke={`url(#hs-g${i})`} strokeWidth={a.w} strokeLinecap="round" />
        </svg>
        </div>
      ))}
    </div>
  )
}
