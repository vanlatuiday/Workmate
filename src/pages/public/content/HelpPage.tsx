// /ho-tro — câu hỏi thường gặp
import { useId, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, MessageCircle } from 'lucide-react'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import { BTN_ACCENT } from '@utils/ui'
import ContentPage, { Section } from './ContentPage'

const GROUPS = [
  {
    title: 'Người tìm việc',
    items: [
      { q: 'Workmate có thu phí người tìm việc không?', a: 'Không. Tạo hồ sơ và ứng tuyển đều miễn phí.' },
      { q: 'Điểm phù hợp được tính thế nào?', a: 'Dựa trên lịch rảnh, khoảng cách và mức lương bạn mong muốn.' },
      { q: 'Khi nào tôi nhắn tin được với nhà tuyển dụng?', a: 'Sau khi cả hai bên cùng đồng ý kết nối.' },
      { q: 'Tôi có thể đổi lịch rảnh không?', a: 'Có, bạn cập nhật trong hồ sơ bất cứ lúc nào.' },
    ],
  },
  {
    title: 'Nhà tuyển dụng',
    items: [
      { q: 'Đăng tin có mất phí không?', a: 'Đăng tin cơ bản miễn phí.' },
      { q: 'Làm sao để công ty được xác minh?', a: 'Bổ sung thông tin công ty, quản trị viên sẽ duyệt.' },
      { q: 'Tôi thấy ứng viên nào trước?', a: 'Những người có điểm phù hợp cao nhất với vị trí.' },
      { q: 'Có thể tạm ẩn tin tuyển không?', a: 'Có, bạn đóng hoặc mở lại tin trong khu tuyển dụng.' },
    ],
  },
]

/** Một câu hỏi dạng accordion: nút aria-expanded, nội dung mở bằng grid-rows 0fr→1fr (reduced-motion: mở ngay) */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  const uid = useId()
  const panelId = `${uid}-panel`
  return (
    <div>
      <h3>
        <button
          type="button"
          id={`${uid}-btn`}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'flex w-full items-center justify-between gap-4 rounded-control py-4 text-left font-medium text-page-fg transition-colors duration-fast hover:text-page-muted',
            FOCUS,
          )}
        >
          {q}
          <ChevronDown
            aria-hidden="true"
            className={cn('h-5 w-5 shrink-0 transition-transform duration-base motion-reduce:transition-none', open && 'rotate-180')}
          />
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={`${uid}-btn`}
        className={cn(
          'grid transition-[grid-template-rows] duration-base ease-editorial motion-reduce:transition-none',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <p className="pb-4 text-sm leading-relaxed text-page-muted">{a}</p>
        </div>
      </div>
    </div>
  )
}

export default function HelpPage() {
  return (
    <ContentPage eyebrow="Hỗ trợ" title="Câu hỏi thường gặp.">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="space-y-14 lg:col-span-8">
          {GROUPS.map((g) => (
            <Section key={g.title} title={g.title}>
              <div className="divide-y divide-page-line border-y border-page-line">
                {g.items.map((it) => (
                  <FaqItem key={it.q} q={it.q} a={it.a} />
                ))}
              </div>
            </Section>
          ))}
        </div>

        <aside className="lg:col-span-4">
          <div className="rounded-card border border-page-line p-6 lg:sticky lg:top-28">
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-page-line text-page-fg">
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
            </span>
            <h2 className="mt-4 font-display text-lg font-semibold text-page-fg">Chưa tìm thấy câu trả lời?</h2>
            <p className="mt-2 text-sm leading-relaxed text-page-muted">Nhắn cho đội Workmate, chúng tôi sẽ phản hồi sớm.</p>
            <Link to="/lien-he" className={cn(BTN_ACCENT, 'mt-5')}>Liên hệ hỗ trợ</Link>
          </div>
        </aside>
      </div>
    </ContentPage>
  )
}
