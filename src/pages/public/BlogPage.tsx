// /cam-nang — danh sách bài mẫu, dàn theo video tham khảo references/p7.mp4:
// tiêu đề lớn + đoạn giới thiệu bên phải, lưới 2 cột thẻ ảnh lớn.
// Chuyển động: thẻ trồi lên khi vào khung (Rise, chạy lại khi cuộn ngược), ảnh trong thẻ trôi chậm hơn thẻ (parallax).
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { photoSrcSet, photoUrl } from '@components/discover/types'
import Rise from '@components/motion/Rise'
import Reveal from '@components/motion/Reveal'
import TextReveal from '@components/motion/TextReveal'
import { usePageEnterDelay } from '@components/motion/PageTransition'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { FOCUS } from '@utils/focus'
import { ARTICLES, type Article } from './content/articles'

// Hiệu ứng hover chỉ cho con trỏ chuột (màn cảm ứng không có hover thật): tiền tố
// [@media(hover:hover)]:group-hover: viết thẳng trong class — Tailwind không nhận class ghép bằng biến

function ArticleCard({ a, index }: { a: Article; index: number }) {
  const reduced = useReducedMotion()
  const frameRef = useRef<HTMLDivElement>(null)
  // Tiến độ thẻ băng qua khung nhìn: 0 (mép dưới vừa vào) → 1 (mép trên vừa ra)
  const { scrollYProgress } = useScroll({ target: frameRef, offset: ['start end', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], ['-6%', '6%'])
  const eager = index < 2

  return (
    // Hai cột lệch nhịp ~0.1s
    <Rise from={{ y: 48 }} delay={(index % 2) * 0.1}>
      <Link to={`/cam-nang/${a.slug}`} data-cursor="Đọc" className={`group block rounded-card ${FOCUS}`}>
        <div ref={frameRef} className="aspect-[16/10] overflow-hidden rounded-card bg-page-surface">
          {/* Lớp ngoài: phóng nhẹ khi hover; lớp trong: ảnh cao hơn khung + trôi dọc */}
          <div
            className={`h-full w-full transition-transform duration-[400ms] ease-out motion-reduce:transition-none [@media(hover:hover)]:group-hover:scale-[1.03] motion-reduce:group-hover:scale-100`}
          >
            <motion.img
              src={photoUrl(a.photoId, 960)}
              srcSet={photoSrcSet(a.photoId)}
              sizes="(min-width: 768px) 46vw, 100vw"
              alt={a.photoAlt}
              width={960}
              height={600}
              loading={eager ? 'eager' : 'lazy'}
              style={reduced ? undefined : { y, scale: 1.15 }}
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <p className="mt-5 text-xs uppercase tracking-wide text-page-muted">
          {[...a.tags, `${a.readMin} phút đọc`].join(' • ')}
        </p>
        <h2 className="relative mt-2 font-display text-xl font-normal text-page-fg md:text-2xl">
          <ArrowRight
            className={`absolute left-0 top-[0.4em] h-5 w-5 -translate-x-2 opacity-0 transition-[opacity,transform] duration-[400ms] ease-out motion-reduce:transition-none [@media(hover:hover)]:group-hover:translate-x-0 [@media(hover:hover)]:group-hover:opacity-100`}
            aria-hidden
          />
          <span
            className={`block transition-transform duration-[400ms] ease-out motion-reduce:transition-none [@media(hover:hover)]:group-hover:translate-x-7`}
          >
            {a.title}
          </span>
        </h2>
      </Link>
    </Rise>
  )
}

export default function BlogPage() {
  const enter = usePageEnterDelay()
  return (
    <section className="shell py-section-sm">
      <div className="grid items-start gap-6 md:grid-cols-12 md:gap-8">
        <TextReveal
          as="h1"
          immediate
          delay={enter}
          text="Cẩm nang"
          className="font-display text-display-lg font-semibold text-page-fg md:col-span-8"
        />
        <Reveal immediate delay={enter + 0.25} y={16} className="md:col-span-4 md:pt-4">
          <p className="leading-relaxed text-page-muted">
            Mẹo nhỏ cho đường việc làm: viết CV, đi phỏng vấn, cân bằng học và làm.
          </p>
          <p className="mt-3 text-sm text-page-muted">Bài viết mẫu — sẽ được thay bằng nội dung thật.</p>
        </Reveal>
      </div>

      <ul className="mt-12 grid gap-x-6 gap-y-14 md:mt-20 md:grid-cols-2 md:gap-x-8 md:gap-y-20">
        {ARTICLES.map((a, i) => (
          <li key={a.slug} className="min-w-0">
            <ArticleCard a={a} index={i} />
          </li>
        ))}
      </ul>

      <div className="mt-16 flex justify-center md:mt-24">
        <Link
          to="/viec-lam"
          className={`rounded-control text-xs uppercase tracking-wide text-page-fg underline-offset-8 transition-opacity hover:underline ${FOCUS}`}
        >
          Xem việc làm
        </Link>
      </div>
    </section>
  )
}
