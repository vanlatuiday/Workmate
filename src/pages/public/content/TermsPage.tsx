// /dieu-khoan — điều khoản sử dụng. Mọi câu phải khớp với hành vi thật của ứng dụng (xem backend); sửa tính năng thì sửa cả chữ ở đây.
import ContentPage, { ProseBlock, Section } from './ContentPage'

interface Block {
  title: string
  paragraphs?: string[]
  bullets?: string[]
}

const SECTIONS: Block[] = [
  {
    title: '1. Chấp nhận điều khoản',
    paragraphs: [
      'Khi tạo tài khoản hoặc dùng Workmate, bạn đồng ý với các điều khoản này và với Chính sách bảo mật. Nếu không đồng ý, bạn vui lòng không dùng dịch vụ.',
      'Workmate là nền tảng kết nối người tìm việc linh hoạt với nhà tuyển dụng, hiện phục vụ khu vực Đà Nẵng.',
    ],
  },
  {
    title: '2. Ai được dùng Workmate',
    paragraphs: ['Workmate có hai loại tài khoản: người tìm việc và nhà tuyển dụng. Mỗi tài khoản chọn một vai trò khi đăng ký.'],
    bullets: [
      'Bạn phải đủ tuổi lao động theo pháp luật Việt Nam. Ứng dụng không hỏi ngày sinh nên bạn tự chịu trách nhiệm về điều này.',
      'Nhà tuyển dụng đăng ký thay mặt công ty hoặc cơ sở kinh doanh cần có quyền làm việc đó.',
      'Mỗi email chỉ tạo được một tài khoản.',
    ],
  },
  {
    title: '3. Tài khoản và bảo mật',
    bullets: [
      'Khi đăng ký, Workmate gửi mã xác nhận 6 chữ số qua email. Tài khoản chỉ được tạo sau khi bạn nhập đúng mã.',
      'Mật khẩu cần ít nhất 8 ký tự. Bạn giữ kín mật khẩu và chịu trách nhiệm về mọi hoạt động trong tài khoản của mình.',
      'Khi bạn đổi hoặc đặt lại mật khẩu, mọi phiên đăng nhập cũ bị đăng xuất.',
      'Nếu nghi ngờ tài khoản bị người khác dùng, hãy đổi mật khẩu ngay trong Cài đặt và báo cho Workmate qua email hỗ trợ.',
    ],
  },
  {
    title: '4. Nội dung bạn đăng',
    paragraphs: ['Hồ sơ, tin tuyển dụng, tin nhắn, đánh giá và báo cáo phải đúng sự thật và do bạn có quyền đăng. Bạn không được đăng hoặc làm những việc sau:'],
    bullets: [
      'Thông tin sai lệch về bản thân, công ty, công việc hoặc mức lương.',
      'Lừa đảo, như hứa việc nhẹ lương cao bất thường hoặc yêu cầu chuyển tiền.',
      'Thu phí ứng viên dưới bất kỳ tên nào (phí hồ sơ, phí đào tạo, tiền cọc, phí giữ chỗ).',
      'Buôn người, mại dâm hoặc việc làm trái pháp luật.',
      'Phân biệt đối xử trong tin tuyển dụng.',
      'Dùng thông tin liên hệ của người khác để quảng cáo, gửi tin rác hoặc mục đích nào khác ngoài trao đổi về công việc.',
    ],
  },
  {
    title: '5. Kiểm duyệt nội dung',
    paragraphs: [
      'Tin tuyển dụng được lọc tự động trước khi hiện công khai. Tin chứa cụm từ bị cấm sẽ bị từ chối. Tin có dấu hiệu đáng ngờ được giữ lại để quản trị viên xem xét. Tin sạch của công ty có mã số doanh nghiệp đang hoạt động được duyệt tự động.',
      'Quản trị viên có thể từ chối hoặc ẩn tin, và khóa tài khoản khi nội dung hoặc hành vi vi phạm điều khoản này. Tài khoản bị khóa không đăng nhập được.',
    ],
  },
  {
    title: '6. Tin tuyển dụng và xác minh công ty',
    bullets: [
      'Khi đăng tin, nhà tuyển dụng chọn thời hạn 7, 14, 30 hoặc 60 ngày. Hết hạn thì tin đóng và không nhận thêm ứng tuyển.',
      'Mở lại tin đã hết hạn thì tin được gia hạn thêm 30 ngày.',
      'Công ty có thể nhập mã số doanh nghiệp để Workmate tra tình trạng hoạt động, và gửi giấy tờ để quản trị viên xác minh. Kết quả được gửi qua email.',
      'Huy hiệu xác minh cho thấy giấy tờ đã được xem xét. Nó không bảo đảm chất lượng công việc hay thái độ của nhà tuyển dụng.',
    ],
  },
  {
    title: '7. Kết nối và nhắn tin',
    bullets: [
      'Một kết nối chỉ hình thành khi cả hai bên đồng ý. Nhắn tin chỉ mở sau khi kết nối.',
      'Họ tên đầy đủ, số điện thoại và CV của người tìm việc chỉ hiện cho nhà tuyển dụng sau khi kết nối.',
      'Bạn chỉ dùng thông tin liên hệ nhận được để trao đổi về công việc đó. Không dùng để gửi tin rác, bán hàng hoặc chia sẻ cho người khác.',
    ],
  },
  {
    title: '8. Phỏng vấn và tuyển dụng',
    paragraphs: [
      'Workmate chỉ giúp hai bên gặp nhau: đề xuất lịch phỏng vấn, chọn giờ, ghi địa điểm hoặc đường link cuộc họp trực tuyến. Việc họp hoặc gặp mặt diễn ra ngoài Workmate.',
      'Workmate không phải bên của hợp đồng lao động. Hai bên tự thỏa thuận công việc, ca làm, lương và cách trả lương. Workmate không giữ, không chuyển và không bảo lãnh khoản tiền nào giữa hai bên.',
    ],
  },
  {
    title: '9. Đánh giá và báo cáo',
    bullets: [
      'Sau khi làm việc cùng nhau, hai bên có thể đánh giá lẫn nhau. Mỗi bên đánh giá một lần và không sửa được sau khi gửi.',
      'Đánh giá phải trung thực, không xúc phạm hay lộ thông tin cá nhân.',
      'Bạn có thể báo cáo tin tuyển dụng, công ty hoặc ứng viên đáng ngờ. Quản trị viên xem xét báo cáo và xử lý theo mục 5.',
    ],
  },
  {
    title: '10. Chi phí',
    paragraphs: ['Workmate hiện miễn phí cho cả người tìm việc và nhà tuyển dụng: tạo hồ sơ, ứng tuyển, đăng tin và nhắn tin đều không mất phí. Nếu sau này có dịch vụ trả phí, Workmate sẽ thông báo rõ trước khi áp dụng.'],
  },
  {
    title: '11. Xóa tài khoản',
    paragraphs: [
      'Bạn có thể tự xóa tài khoản trong Cài đặt, mục Xóa tài khoản, bằng cách nhập mật khẩu. Việc xóa là vĩnh viễn và không khôi phục được. Chi tiết dữ liệu bị xóa nằm trong Chính sách bảo mật.',
      'Workmate có thể khóa tài khoản vi phạm điều khoản này.',
    ],
  },
  {
    title: '12. Giới hạn trách nhiệm',
    paragraphs: [
      'Workmate cung cấp dịch vụ trên cơ sở hiện có. Chúng tôi cố giữ dịch vụ hoạt động ổn định nhưng không bảo đảm dịch vụ không bao giờ gián đoạn hay không có lỗi.',
      'Tin tuyển dụng, hồ sơ và đánh giá do người dùng tự đăng. Workmate không bảo đảm chúng chính xác và không chịu trách nhiệm về thỏa thuận, thiệt hại hay tranh chấp giữa người tìm việc và nhà tuyển dụng, trừ khi pháp luật quy định khác. Hãy tự kiểm tra thông tin trước khi nhận việc và không bao giờ trả tiền để được nhận việc.',
    ],
  },
  {
    title: '13. Thay đổi điều khoản',
    paragraphs: ['Workmate có thể cập nhật điều khoản này. Bản mới được đăng tại trang này kèm ngày có hiệu lực. Nếu bạn tiếp tục dùng dịch vụ sau ngày đó, bạn được xem là đồng ý với bản mới.'],
  },
  {
    title: '14. Luật áp dụng',
    paragraphs: ['Điều khoản này chịu sự điều chỉnh của pháp luật Việt Nam. Tranh chấp được ưu tiên giải quyết bằng thương lượng; nếu không được, các bên đưa ra cơ quan có thẩm quyền tại Việt Nam.'],
  },
  {
    title: '15. Liên hệ',
    paragraphs: ['Mọi câu hỏi về điều khoản xin gửi tới support@workmate.vn.'],
  },
]

export default function TermsPage() {
  return (
    <ContentPage
      eyebrow="Pháp lý"
      title="Điều khoản sử dụng."
      intro="Quy định khi bạn dùng Workmate để tìm việc hoặc tuyển người. Có hiệu lực từ 20/11/2026."
    >
      {SECTIONS.map((s) => (
        <Section key={s.title} title={s.title}>
          <div className="space-y-3">
            {s.paragraphs?.map((p) => <ProseBlock key={p}>{p}</ProseBlock>)}
            {s.bullets && (
              <ul className="max-w-2xl list-disc space-y-2 pl-5 leading-relaxed text-page-muted marker:text-page-line">
                {s.bullets.map((b) => <li key={b}>{b}</li>)}
              </ul>
            )}
          </div>
        </Section>
      ))}
    </ContentPage>
  )
}
