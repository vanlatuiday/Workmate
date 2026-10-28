// /cam-nang — danh sách bài mẫu
import { Link } from 'react-router-dom'
import { photoUrl } from '@components/discover/types'
import { FOCUS } from '@utils/focus'
import ContentPage from './content/ContentPage'
import { ARTICLES } from './content/articles'

export default function BlogPage() {
  return (
    <ContentPage eyebrow="Cẩm nang" title="Mẹo nhỏ cho đường việc làm." intro="Bài viết mẫu — sẽ được thay bằng nội dung thật.">
      <ul className="grid gap-8 sm:grid-cols-2">
        {ARTICLES.map((a) => (
          <li key={a.slug}>
            <Link to={`/cam-nang/${a.slug}`} data-cursor="Đọc" className={`group block rounded-card ${FOCUS}`}>
              <div className="aspect-[4/3] overflow-hidden rounded-card border border-page-line bg-page-surface">
                <img src={photoUrl(a.photoId, 640)} alt={a.photoAlt} loading="lazy" className="h-full w-full object-cover" />
              </div>
              <h2 className="mt-4 font-display text-lg font-semibold text-page-fg">{a.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-page-muted">{a.summary}</p>
              <p className="mt-2 text-xs text-page-muted">{a.readMin} phút đọc</p>
            </Link>
          </li>
        ))}
      </ul>
    </ContentPage>
  )
}
