// /ho-tro — câu hỏi thường gặp (mẫu)
import { Link } from 'react-router-dom'
import { FOCUS } from '@utils/focus'
import ContentPage, { Section } from './ContentPage'

const GROUPS = [
  {
    title: 'Người tìm việc',
    items: [
      { q: 'Workmate có thu phí người tìm việc không?', a: 'Không. Tạo hồ sơ và ứng tuyển đều miễn phí (nội dung mẫu).' },
      { q: 'Điểm phù hợp được tính thế nào?', a: 'Dựa trên lịch rảnh, khoảng cách và mức lương bạn mong muốn.' },
      { q: 'Khi nào tôi nhắn tin được với nhà tuyển dụng?', a: 'Sau khi cả hai bên cùng đồng ý kết nối.' },
      { q: 'Tôi có thể đổi lịch rảnh không?', a: 'Có, bạn cập nhật trong hồ sơ bất cứ lúc nào.' },
    ],
  },
  {
    title: 'Nhà tuyển dụng',
    items: [
      { q: 'Đăng tin có mất phí không?', a: 'Đăng tin cơ bản miễn phí (nội dung mẫu).' },
      { q: 'Làm sao để công ty được xác minh?', a: 'Bổ sung thông tin công ty, quản trị viên sẽ duyệt.' },
      { q: 'Tôi thấy ứng viên nào trước?', a: 'Những người có điểm phù hợp cao nhất với vị trí.' },
      { q: 'Có thể tạm ẩn tin tuyển không?', a: 'Có, bạn đóng hoặc mở lại tin trong khu tuyển dụng.' },
    ],
  },
]

export default function HelpPage() {
  return (
    <ContentPage eyebrow="Hỗ trợ" title="Câu hỏi thường gặp." intro="Nội dung mẫu — sẽ được chủ dự án bổ sung.">
      {GROUPS.map((g) => (
        <Section key={g.title} title={g.title}>
          <div className="max-w-2xl divide-y divide-page-line border-y border-page-line">
            {g.items.map((it) => (
              <details key={it.q} className="group py-4">
                <summary className={`cursor-pointer list-none rounded-control font-medium text-page-fg ${FOCUS}`}>{it.q}</summary>
                <p className="mt-2 text-sm leading-relaxed text-page-muted">{it.a}</p>
              </details>
            ))}
          </div>
        </Section>
      ))}
      <p className="text-sm text-page-muted">
        Chưa tìm thấy câu trả lời?{' '}
        <Link to="/lien-he" className={`link-underline rounded-control text-page-fg ${FOCUS}`}>Liên hệ chúng tôi</Link>
      </p>
    </ContentPage>
  )
}
