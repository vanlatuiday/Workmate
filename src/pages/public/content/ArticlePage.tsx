// /cam-nang/:slug — một bài cẩm nang
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
      {/* Desktop: chữ bên trái, ảnh bên phải đứng yên khi cuộn; mobile: ảnh trên, chữ dưới */}
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-16">
        <figure className="overflow-hidden rounded-card border border-page-line bg-page-surface lg:sticky lg:top-24 lg:order-2 lg:self-start">
          <img
            src={photoUrl(article.photoId, 1400)}
            alt={article.photoAlt}
            className="aspect-[16/10] w-full object-cover lg:aspect-[4/5]"
          />
        </figure>
        <div className="space-y-5 lg:order-1">
          {article.body.map((p) => (
            <ProseBlock key={p}>{p}</ProseBlock>
          ))}
          <div className="pt-4">
            <Link to="/cam-nang" className={`link-underline rounded-control text-sm text-page-fg ${FOCUS}`}>Về cẩm nang</Link>
          </div>
        </div>
      </div>
    </ContentPage>
  )
}
