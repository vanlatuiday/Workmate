// /cam-nang/:slug — bài viết mẫu
import { Link, useParams } from 'react-router-dom'
import { photoUrl } from '@components/discover/types'
import { FOCUS } from '@utils/focus'
import ContentPage, { ProseBlock } from './ContentPage'
import { findArticle } from './articles'

export default function ArticlePage() {
  const { slug } = useParams()
  const article = findArticle(slug)

  if (!article) {
    return (
      <ContentPage eyebrow="Cẩm nang" title="Không tìm thấy bài viết.">
        <Link to="/cam-nang" className={`link-underline rounded-control text-page-fg ${FOCUS}`}>Về cẩm nang</Link>
      </ContentPage>
    )
  }

  return (
    <ContentPage eyebrow={`Cẩm nang · ${article.readMin} phút đọc`} title={article.title} intro={article.summary}>
      <div className="aspect-[16/9] max-w-3xl overflow-hidden rounded-card border border-page-line bg-page-surface">
        <img src={photoUrl(article.photoId, 1400)} alt={article.photoAlt} className="h-full w-full object-cover" />
      </div>
      <div className="space-y-5">
        {article.body.map((p) => (
          <ProseBlock key={p}>{p}</ProseBlock>
        ))}
      </div>
      <Link to="/cam-nang" className={`link-underline rounded-control text-sm text-page-fg ${FOCUS}`}>← Tất cả bài viết</Link>
    </ContentPage>
  )
}
