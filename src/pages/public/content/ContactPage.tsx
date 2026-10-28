// /lien-he — form mẫu, chưa gửi đi đâu
import type { FormEvent } from 'react'
import toast from 'react-hot-toast'
import { FOCUS } from '@utils/focus'
import ContentPage, { CTA_PRIMARY, Section } from './ContentPage'

const FIELD = `mt-2 w-full rounded-card border border-page-edge bg-page-bg px-4 py-3 text-sm text-page-fg ${FOCUS}`

export default function ContactPage() {
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    toast.success('Đã nhận tin nhắn (bản mẫu, chưa gửi đi)')
    e.currentTarget.reset()
  }
  return (
    <ContentPage eyebrow="Liên hệ" title="Nói chuyện với chúng tôi.">
      <div className="grid gap-12 md:grid-cols-2">
        <Section title="Thông tin">
          <p className="text-sm leading-relaxed text-page-muted">
            Email: <a href="mailto:support@workmate.vn" className={`link-underline rounded-control text-page-fg ${FOCUS}`}>support@workmate.vn</a>
            <br />
            Khu vực: Đà Nẵng
          </p>
        </Section>
        <form onSubmit={onSubmit} className="space-y-5">
          <label className="block text-sm font-medium text-page-fg">
            Họ tên
            <input name="name" type="text" required autoComplete="name" className={FIELD} />
          </label>
          <label className="block text-sm font-medium text-page-fg">
            Email
            <input name="email" type="email" required autoComplete="email" className={FIELD} />
          </label>
          <label className="block text-sm font-medium text-page-fg">
            Nội dung
            <textarea name="message" required rows={5} className={FIELD} />
          </label>
          <button type="submit" className={CTA_PRIMARY}>Gửi tin nhắn</button>
        </form>
      </div>
    </ContentPage>
  )
}
