// /bao-mat — chính sách bảo mật. Mọi câu phải khớp với code backend (schema Prisma, AccountService, MailService); sửa tính năng thì sửa cả chữ ở đây.
import ContentPage, { ProseBlock, Section } from './ContentPage'

interface Block {
  title: string
  paragraphs?: string[]
  bullets?: string[]
  /** Đoạn kết đặt sau danh sách */
  after?: string[]
}

const SECTIONS: Block[] = [
  {
    title: '1. Phạm vi',
    paragraphs: [
      'Chính sách này nói Workmate thu thập dữ liệu cá nhân nào, dùng để làm gì, ai xem được và bạn kiểm soát chúng ra sao. Chính sách áp dụng cho người tìm việc, nhà tuyển dụng và khách truy cập website.',
      'Workmate xử lý dữ liệu theo pháp luật Việt Nam về bảo vệ dữ liệu cá nhân, gồm Nghị định 13/2023/NĐ-CP.',
    ],
  },
  {
    title: '2. Dữ liệu Workmate thu thập',
    paragraphs: ['Tùy vai trò của bạn, Workmate lưu những dữ liệu sau.'],
    bullets: [
      'Tài khoản: email, mật khẩu (lưu dưới dạng đã mã hóa một chiều, Workmate không đọc được mật khẩu gốc), vai trò và tên bạn nhập khi đăng ký.',
      'Người tìm việc: họ tên, số điện thoại, ảnh đại diện, giới thiệu bản thân, kinh nghiệm, kỹ năng, lịch rảnh, mức lương mong muốn, khu vực và khoảng cách có thể đi làm, loại hình việc, và các file CV bạn tải lên.',
      'Nhà tuyển dụng: tên công ty, mã số doanh nghiệp, logo, ảnh bìa, mô tả, địa chỉ, email và số điện thoại công ty, cùng giấy tờ xác minh bạn gửi.',
      'Hoạt động trên Workmate: tin tuyển dụng đã đăng, đơn ứng tuyển và lời bày tỏ quan tâm, kết nối, tin nhắn, lịch phỏng vấn, đánh giá, tin đã lưu, thông báo, báo cáo bạn gửi và cài đặt của bạn.',
      'Lượt xem tin tuyển dụng: ghi theo ngày, kèm mã tài khoản nếu bạn đã đăng nhập, hoặc một chuỗi đã băm từ địa chỉ IP nếu bạn là khách. Workmate không lưu địa chỉ IP gốc trong bảng này.',
    ],
  },
  {
    title: '3. Mục đích sử dụng',
    bullets: [
      'Vận hành tài khoản, đăng nhập và xác nhận email.',
      'Gợi ý việc và ứng viên phù hợp, dựa trên kỹ năng, lịch rảnh, mức lương, khoảng cách và loại hình việc.',
      'Cho phép kết nối, nhắn tin và hẹn phỏng vấn giữa hai bên.',
      'Gửi thông báo và email theo cài đặt của bạn.',
      'Xác minh công ty, lọc tin đáng ngờ và xử lý báo cáo để giữ nền tảng an toàn.',
    ],
    after: ['Workmate không bán dữ liệu cá nhân của bạn.'],
  },
  {
    title: '4. Ai nhìn thấy dữ liệu của bạn',
    bullets: [
      'Họ tên đầy đủ, số điện thoại và CV của người tìm việc chỉ hiện cho nhà tuyển dụng sau khi hai bên kết nối. Nhắn tin cũng chỉ mở sau khi kết nối.',
      'Người tìm việc chọn ai xem được hồ sơ trong Cài đặt. Công khai: mọi nhà tuyển dụng tìm thấy bạn. Riêng tư: chỉ công ty bạn đã ứng tuyển hoặc đã kết nối xem được hồ sơ.',
      'Nhà tuyển dụng có thể ẩn trang công ty trong Cài đặt. Khi đó khách và người tìm việc không xem được trang công ty, còn tin tuyển dụng vẫn hiện bình thường.',
      'Thông tin công ty và tin tuyển dụng đã duyệt hiển thị công khai trên website.',
      'Giấy tờ xác minh công ty và file CV nằm ở kho riêng tư. Chỉ người có quyền được mở file qua đường link tạm thời, hết hạn sau vài phút.',
      'Quản trị viên của Workmate xem được dữ liệu cần thiết để duyệt tin, xác minh công ty và xử lý báo cáo.',
    ],
  },
  {
    title: '5. Email Workmate gửi cho bạn',
    bullets: [
      'Mã xác nhận đăng ký và mã đặt lại mật khẩu (luôn gửi khi bạn yêu cầu).',
      'Kết quả xác minh công ty (đã duyệt hoặc chưa được duyệt).',
      'Thông báo về kết nối, phỏng vấn, đề nghị làm việc, đánh giá và việc hoặc ứng viên phù hợp từ 80%. Bạn chọn nhận ngay, nhận bản tóm tắt lúc 8:00 hằng ngày, hoặc tắt trong Cài đặt.',
    ],
  },
  {
    title: '6. Bên thứ ba',
    paragraphs: ['Workmate dùng một số dịch vụ bên ngoài. Những gì họ nhận được như sau.'],
    bullets: [
      'Dịch vụ gửi email (máy chủ SMTP): nhận địa chỉ email và nội dung thư để chuyển tới bạn.',
      'Dịch vụ tra mã số doanh nghiệp (VietQR): nhận mã số doanh nghiệp mà nhà tuyển dụng nhập để kiểm tra tình trạng hoạt động. Dịch vụ không nhận thông tin cá nhân khác.',
      'Google Fonts: trình duyệt của bạn tải phông chữ từ Google nên Google nhận được địa chỉ IP của bạn.',
      'Unsplash: một số ảnh minh họa trên website được tải trực tiếp từ Unsplash nên Unsplash nhận được địa chỉ IP của bạn.',
      'Kho lưu trữ file chuẩn S3: lưu ảnh đại diện, logo, CV và giấy tờ xác minh.',
    ],
    after: ['Workmate hiện không dùng công cụ phân tích hành vi hay quảng cáo trên website.'],
  },
  {
    title: '7. Lưu trữ và xóa dữ liệu',
    paragraphs: [
      'Workmate giữ dữ liệu trong thời gian bạn còn dùng tài khoản. Mã xác nhận và mã đặt lại mật khẩu chỉ có hiệu lực trong thời gian ngắn và bị hủy sau 5 lần nhập sai.',
      'Bạn có thể tự xóa tài khoản trong Cài đặt, mục Xóa tài khoản, bằng cách nhập mật khẩu. Việc xóa là vĩnh viễn và không khôi phục được. Hệ thống xóa:',
    ],
    bullets: [
      'Tài khoản, hồ sơ, cài đặt, kinh nghiệm, ảnh đại diện và các file CV.',
      'Đơn ứng tuyển, lời quan tâm, kết nối, tin nhắn, lịch phỏng vấn, đề nghị làm việc, đánh giá và thông báo liên quan.',
      'Với nhà tuyển dụng là người quản lý duy nhất của công ty: công ty, các tin tuyển dụng, logo, ảnh bìa và giấy tờ xác minh. Nếu công ty còn người quản lý khác thì công ty ở lại.',
    ],
    after: [
      'Báo cáo vi phạm bạn từng gửi vẫn được giữ cho quản trị viên, nhưng không còn liên kết tới tài khoản của bạn. Tài khoản quản trị viên không tự xóa được.',
    ],
  },
  {
    title: '8. Quyền của bạn',
    paragraphs: ['Theo Nghị định 13/2023/NĐ-CP, bạn có các quyền sau đối với dữ liệu cá nhân của mình.'],
    bullets: [
      'Được biết và truy cập: xem hồ sơ, tin nhắn, đơn ứng tuyển và cài đặt ngay trong tài khoản.',
      'Chỉnh sửa: sửa hồ sơ hoặc thông tin công ty bất cứ lúc nào.',
      'Xóa dữ liệu: dùng Cài đặt, Xóa tài khoản như mục 7.',
      'Rút lại sự đồng ý hoặc hạn chế: chỉnh mức hiển thị hồ sơ và loại thông báo trong Cài đặt, hoặc xóa tài khoản.',
      'Khiếu nại: gửi email tới support@workmate.vn. Bạn cũng có quyền khiếu nại tới cơ quan nhà nước có thẩm quyền.',
    ],
    after: ['Với yêu cầu cần Workmate hỗ trợ, hãy gửi email từ địa chỉ đã đăng ký tài khoản để Workmate xác nhận đúng người.'],
  },
  {
    title: '9. Biện pháp bảo mật',
    bullets: [
      'Mật khẩu được mã hóa một chiều trước khi lưu.',
      'Đăng nhập và các thao tác về mã xác nhận có giới hạn số lần thử theo địa chỉ IP và theo tài khoản.',
      'Khi đổi hoặc đặt lại mật khẩu, mọi phiên đăng nhập cũ bị thu hồi.',
      'Thông tin liên hệ của người tìm việc chỉ mở cho nhà tuyển dụng sau khi kết nối.',
      'File CV và giấy tờ xác minh lưu ở kho riêng tư, mở bằng đường link tạm thời.',
    ],
    after: ['Không hệ thống nào an toàn tuyệt đối. Hãy giữ mật khẩu cho riêng bạn và đừng chia sẻ mã xác nhận với ai.'],
  },
  {
    title: '10. Thay đổi chính sách',
    paragraphs: ['Khi chính sách thay đổi, bản mới được đăng tại trang này kèm ngày có hiệu lực. Nếu thay đổi ảnh hưởng lớn tới cách dùng dữ liệu của bạn, Workmate sẽ thông báo trong ứng dụng hoặc qua email.'],
  },
  {
    title: '11. Liên hệ',
    paragraphs: ['Mọi câu hỏi về dữ liệu cá nhân xin gửi tới support@workmate.vn.'],
  },
]

export default function PrivacyPage() {
  return (
    <ContentPage
      eyebrow="Pháp lý"
      title="Chính sách bảo mật."
      intro="Cách Workmate thu thập, dùng và bảo vệ dữ liệu của bạn. Có hiệu lực từ 20/11/2026."
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
            {s.after?.map((p) => <ProseBlock key={p}>{p}</ProseBlock>)}
          </div>
        </Section>
      ))}
    </ContentPage>
  )
}
