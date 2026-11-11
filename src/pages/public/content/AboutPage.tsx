// /gioi-thieu — danh sách bài kiểu blog + thanh bên (tìm kiếm, mục trong trang, chủ đề).
// Dữ liệu bài ở aboutPosts.ts. Mỗi phần tử của bài hiện lần lượt khi cuộn tới (Rise, chạy lại cả khi cuộn lên).
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight } from 'lucide-react'
import Reveal from '@components/motion/Reveal'
import Rise from '@components/motion/Rise'
import { photoSrcSet, photoUrl } from '@components/discover/types'
import { useReducedMotion } from '@hooks/useReducedMotion'
import { FOCUS } from '@utils/focus'
import ContentPage, { CTA_PRIMARY, CTA_SECONDARY, CtaRow } from './ContentPage'
import { ABOUT_POSTS, type AboutPost } from './aboutPosts'

/** Bỏ dấu + chữ thường để tìm không phân biệt dấu/hoa thường */
const fold = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/đ/g, 'd')

const CATEGORIES = Array.from(new Set(ABOUT_POSTS.map((p) => p.category)))

const CARD = 'rounded-card border border-page-line p-6'
const SIDE_TITLE = 'font-display text-lg font-semibold text-page-fg'

/**
 * Một bài, theo nhịp video: ảnh trượt từ trái + phóng từ nhỏ lên, rồi tiêu đề trồi lên,
 * dòng meta, đoạn chữ hiện chậm từ nhạt, cuối cùng là nút.
 */
function Post({ post }: { post: AboutPost }) {
  return (
    <article id={post.id} className="grid scroll-mt-28 gap-6 py-10 first:pt-0 md:grid-cols-5 md:gap-8">
      <Rise from={{ x: -56, y: 24, scale: 0.86 }} duration={1.1} className="origin-left md:col-span-2">
        <div className="aspect-[4/3] overflow-hidden rounded-card bg-page-surface">
          <img
            src={photoUrl(post.photoId, 640)}
            srcSet={photoSrcSet(post.photoId)}
            sizes="(min-width: 1024px) 22vw, (min-width: 768px) 30vw, 100vw"
            alt={post.photoAlt}
            width={640}
            height={480}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      </Rise>
      <div className="min-w-0 md:col-span-3">
        <Rise from={{ y: 40 }} delay={0.2}>
          <h2 className="font-display text-2xl font-semibold text-page-fg md:text-3xl">
            <Link to={post.cta.to} className={`rounded-control transition-opacity hover:opacity-70 ${FOCUS}`}>
              {post.title}
            </Link>
          </h2>
        </Rise>
        <Rise from={{ y: 24 }} delay={0.35}>
          <p className="mt-3 text-sm text-page-muted">
            {post.category} · {post.meta}
          </p>
        </Rise>
        <Rise from={{ y: 24 }} delay={0.45} duration={1.4}>
          <p className="mt-4 leading-relaxed text-page-muted">{post.excerpt}</p>
        </Rise>
        <Rise from={{ y: 16, scale: 0.92 }} delay={0.7}>
          <Link
            to={post.cta.to}
            className={`mt-6 inline-flex items-center gap-2 rounded-full border border-page-line px-5 py-2.5 text-sm font-medium text-page-fg transition-colors duration-300 hover:border-page-fg ${FOCUS}`}
          >
            {post.cta.label}
            <ArrowUpRight className="h-4 w-4" aria-hidden />
          </Link>
        </Rise>
      </div>
    </article>
  )
}

export default function AboutPage() {
  const reduced = useReducedMotion()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)

  // Lọc kết hợp: chủ đề + từ khóa (tiêu đề/đoạn trích)
  const posts = useMemo(() => {
    const q = fold(query.trim())
    return ABOUT_POSTS.filter(
      (p) => (!category || p.category === category) && (!q || fold(`${p.title} ${p.excerpt}`).includes(q)),
    )
  }, [query, category])

  // Lọc làm danh sách ngắn lại → nếu đang cuộn quá đầu danh sách thì đưa về đầu danh sách,
  // tránh bị đẩy xuống chân trang (mất cả ô tìm và các chủ đề)
  const gridRef = useRef<HTMLDivElement>(null)
  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    const el = gridRef.current
    // Chỉ trên desktop (thanh bên dính cạnh danh sách); trên điện thoại ô tìm nằm dưới danh sách,
    // cuộn đi sẽ làm mất ô đang gõ
    if (!el || !window.matchMedia('(min-width: 1024px)').matches) return
    const top = el.getBoundingClientRect().top + window.scrollY - 112 // chừa chỗ header
    if (window.scrollY > top) window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' })
  }, [query, category, reduced])

  const goTo = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    document.getElementById(id)?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' })
    history.replaceState(null, '', `#${id}`)
  }

  const chip = (active: boolean) =>
    `rounded-full border px-4 py-2 text-sm transition-colors duration-300 ${FOCUS} ${
      active
        ? 'border-page-fg bg-page-fg text-page-bg'
        : 'border-page-line text-page-fg hover:border-page-fg'
    }`

  return (
    <ContentPage
      eyebrow="Giới thiệu"
      title="Việc làm linh hoạt, khớp với cuộc sống của bạn."
    >
      <div ref={gridRef} className="grid gap-12 lg:grid-cols-12">
        {/* Danh sách bài */}
        <div className="divide-y divide-page-line lg:col-span-8" aria-live="polite">
          {posts.length > 0 ? (
            posts.map((p) => <Post key={p.id} post={p} />)
          ) : (
            <p className="py-10 text-page-muted">Không có mục nào khớp</p>
          )}
        </div>

        {/* Thanh bên: dính khi cuộn trên desktop, nằm dưới danh sách trên màn nhỏ */}
        <aside className="space-y-6 lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
          <Reveal immediate y={24} delay={0.1}>
            <div className={CARD}>
              <label htmlFor="about-search" className={SIDE_TITLE}>
                Tìm trong trang
              </label>
              <input
                id="about-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nhập từ khóa"
                className={`mt-4 w-full rounded-card border border-page-edge bg-transparent px-4 py-3 text-sm text-page-fg placeholder:text-page-muted ${FOCUS}`}
              />
            </div>
          </Reveal>

          <Reveal immediate y={24} delay={0.18}>
            <nav className={CARD} aria-label="Mục trong trang">
              <h2 className={SIDE_TITLE}>Mục trong trang</h2>
              <ul className="mt-4 space-y-3">
                {posts.map((p) => (
                  <li key={p.id}>
                    <a
                      href={`#${p.id}`}
                      onClick={(e) => goTo(e, p.id)}
                      className={`rounded-control text-sm text-page-muted transition-colors hover:text-page-fg ${FOCUS}`}
                    >
                      {p.title}
                    </a>
                  </li>
                ))}
                {posts.length === 0 && <li className="text-sm text-page-muted">Không có mục nào khớp</li>}
              </ul>
            </nav>
          </Reveal>

          <Reveal immediate y={24} delay={0.26}>
            <div className={CARD}>
              <h2 className={SIDE_TITLE}>Chủ đề</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" aria-pressed={category === null} onClick={() => setCategory(null)} className={chip(category === null)}>
                  Tất cả
                </button>
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={category === c}
                    onClick={() => setCategory(category === c ? null : c)}
                    className={chip(category === c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>
        </aside>
      </div>

      <CtaRow>
        <Link to="/match" className={CTA_PRIMARY}>Xem kết nối</Link>
        <Link to="/dang-ky" className={CTA_SECONDARY}>Đăng ký</Link>
      </CtaRow>
    </ContentPage>
  )
}
