// /lien-he — thông tin liên hệ, chỉ đường tới đúng chỗ tự xử lý được, và form soạn sẵn email.
// Chưa có máy chủ nhận tin: form mở ứng dụng email của người dùng với tiêu đề + nội dung đã điền sẵn.
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { FOCUS } from '@utils/focus'
import { BTN_ACCENT, LINK } from '@utils/ui'
import ContentPage, { ProseBlock, Section } from './ContentPage'

const SUPPORT_EMAIL = 'support@workmate.vn'

const FIELD = `mt-2 w-full rounded-card border border-page-edge bg-page-bg px-4 py-3 text-sm text-page-fg ${FOCUS}`

/** Những việc tự làm được ngay trên Workmate, khỏi phải chờ trả lời */
const SELF_SERVE: { title: string; text: string; to: string; link: string }[] = [
  {
    title: 'Quên mật khẩu',
    text: 'Nhập email đã đăng ký, Workmate gửi mã xác nhận để bạn đặt mật khẩu mới.',
    to: '/quen-mat-khau',
    link: 'Đặt lại mật khẩu',
  },
  {
    title: 'Câu hỏi về cách dùng',
    text: 'Điểm phù hợp, kết nối, nhắn tin, đăng tin và xác minh công ty đều có giải thích ngắn.',
    to: '/ho-tro',
    link: 'Đọc câu hỏi thường gặp',
  },
  {
    title: 'Tin tuyển dụng đáng ngờ',
    text: 'Mở tin đó và bấm "Báo cáo" ở cuối trang, chọn lý do. Quản trị viên sẽ xem và ẩn tin nếu vi phạm. Đừng chuyển tiền cho bất kỳ ai để được nhận việc.',
    to: '/viec-lam',
    link: 'Tới trang việc làm',
  },
  {
    title: 'Dữ liệu cá nhân',
    text: 'Bạn xem, sửa hoặc xóa tài khoản trong mục Cài đặt. Cách Workmate dùng dữ liệu được ghi trong chính sách bảo mật.',
    to: '/bao-mat',
    link: 'Đọc chính sách bảo mật',
  },
]

/** Chủ đề trong form: dùng làm tiêu đề email để chuyển đúng người xử lý */
const TOPICS = [
  'Tài khoản và đăng nhập',
  'Xác minh công ty',
  'Tin tuyển dụng bị từ chối hoặc ẩn',
  'Báo cáo lừa đảo',
  'Dữ liệu cá nhân',
  'Góp ý cho Workmate',
  'Việc khác',
] as const

export default function ContactPage() {
  const [topic, setTopic] = useState<string>(TOPICS[0])

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const name = String(data.get('name') ?? '').trim()
    const email = String(data.get('email') ?? '').trim()
    const message = String(data.get('message') ?? '').trim()
    const subject = `[Workmate] ${topic}`
    const body = `${message}\n\nHọ tên: ${name}\nEmail tài khoản: ${email}`
    // Mở ứng dụng email với nội dung đã soạn; người dùng tự bấm gửi
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  return (
    <ContentPage
      eyebrow="Liên hệ"
      title="Liên hệ đội Workmate."
      intro="Workmate kết nối người tìm việc linh hoạt với nhà tuyển dụng ở Đà Nẵng. Nhiều việc bạn tự làm được ngay bên dưới; việc còn lại, gửi email cho đội hỗ trợ."
    >
      <Section title="Tự xử lý ngay">
        <ul className="grid gap-x-10 gap-y-8 md:grid-cols-2">
          {SELF_SERVE.map((s) => (
            <li key={s.title} className="max-w-md">
              <h3 className="font-display text-base font-semibold text-page-fg">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-page-muted">{s.text}</p>
              <Link to={s.to} className={`mt-3 inline-block text-sm font-medium ${LINK}`}>
                {s.link}
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <div className="grid gap-12 md:grid-cols-2">
        <Section title="Gửi email cho đội hỗ trợ">
          <div className="space-y-4">
            <ProseBlock>
              Email:{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className={`link-underline rounded-control text-page-fg ${FOCUS}`}>
                {SUPPORT_EMAIL}
              </a>
              <br />
              Khu vực hoạt động: Đà Nẵng
            </ProseBlock>
            <ProseBlock>Để được xử lý nhanh, email của bạn nên có:</ProseBlock>
            <ul className="max-w-2xl list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-page-muted">
              <li>Email bạn dùng để đăng nhập Workmate và vai trò (người tìm việc hay nhà tuyển dụng).</li>
              <li>Đường dẫn tới tin tuyển dụng, trang công ty hoặc hồ sơ liên quan.</li>
              <li>Chuyện gì đã xảy ra, lúc nào, và ảnh chụp màn hình nếu có.</li>
            </ul>
            <ProseBlock>
              Workmate không bao giờ hỏi mật khẩu hay mã xác nhận của bạn. Đừng gửi những thông tin này qua email.
            </ProseBlock>
          </div>
        </Section>

        <Section title="Soạn email nhanh">
          <form onSubmit={onSubmit} className="space-y-5">
            <label className="block text-sm font-medium text-page-fg">
              Chủ đề
              <select name="topic" value={topic} onChange={(e) => setTopic(e.target.value)} className={FIELD}>
                {TOPICS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-page-fg">
              Họ tên
              <input name="name" type="text" required autoComplete="name" className={FIELD} />
            </label>
            <label className="block text-sm font-medium text-page-fg">
              Email tài khoản
              <input name="email" type="email" required autoComplete="email" className={FIELD} />
            </label>
            <label className="block text-sm font-medium text-page-fg">
              Nội dung
              <textarea name="message" required rows={5} className={FIELD} />
            </label>
            <p className="text-sm text-page-muted">
              Bấm nút bên dưới để mở ứng dụng email của bạn với nội dung đã điền sẵn, rồi bấm gửi trong ứng dụng đó.
            </p>
            <button type="submit" className={BTN_ACCENT}>Mở email để gửi</button>
          </form>
        </Section>
      </div>
    </ContentPage>
  )
}
