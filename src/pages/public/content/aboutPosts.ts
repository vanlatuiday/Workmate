// Dữ liệu trang /gioi-thieu — NỘI DUNG MẪU, chủ dự án sẽ viết lại.
// Ảnh Unsplash mượn từ homeMedia/articles (chỉ cần đổi photoId + photoAlt khi có ảnh thật).

export interface AboutPost {
  /** dùng làm neo #slug */
  id: string
  category: string
  title: string
  meta: string
  excerpt: string
  photoId: string
  photoAlt: string
  cta: { label: string; to: string }
}

export const ABOUT_POSTS: AboutPost[] = [
  {
    id: 'workmate-la-gi',
    category: 'Về Workmate',
    title: 'Workmate là gì',
    meta: 'Đội Workmate · 3 phút đọc',
    excerpt:
      'Workmate là nền tảng việc làm linh hoạt tại Đà Nẵng. Chúng tôi ghép người tìm việc với nhà tuyển dụng dựa trên lịch rảnh, khoảng cách và mức lương, để bạn không phải lọc từng tin một.',
    photoId: '1523240795612-9a054b0db644',
    photoAlt: 'Ba người cười nói bên máy tính trong thư viện',
    cta: { label: 'Xem việc làm', to: '/viec-lam' },
  },
  {
    id: 'lich-ranh',
    category: 'Người tìm việc',
    title: 'Lịch rảnh là điều kiện, không phải tiêu chí phụ',
    meta: 'Đội Workmate · 2 phút đọc',
    excerpt:
      'Bạn khai những buổi mình rảnh, Workmate chỉ gợi ý các ca nằm gọn trong đó. Học, làm thêm hay chăm gia đình — lịch của bạn đến trước, công việc đến sau.',
    photoId: '1435527173128-983b87201f4d',
    photoAlt: 'Cuốn sổ lịch mở trên bàn làm việc',
    cta: { label: 'Đăng ký', to: '/dang-ky' },
  },
  {
    id: 'gan-nha',
    category: 'Người tìm việc',
    title: 'Gần nhà, đúng quãng đường',
    meta: 'Đội Workmate · 2 phút đọc',
    excerpt:
      'Mỗi việc đều có khoảng cách tính từ khu vực bạn chọn. Ca ngắn mà đường xa thì không đáng; Workmate cho bạn thấy điều đó trước khi bạn ứng tuyển.',
    photoId: '1476973422084-e0fa66ff9456',
    photoAlt: 'Bản đồ giấy cắm ghim đánh dấu địa điểm',
    cta: { label: 'Xem việc làm', to: '/viec-lam' },
  },
  {
    id: 'ket-noi-hai-chieu',
    category: 'Cách hoạt động',
    title: 'Kết nối hai chiều rồi mới trò chuyện',
    meta: 'Đội Workmate · 3 phút đọc',
    excerpt:
      'Mỗi việc có điểm khớp theo lịch, khoảng cách và lương. Cả hai bên cùng đồng ý thì cuộc trò chuyện mới mở ra, nên không ai bị làm phiền vô cớ.',
    photoId: '1521791136064-7986c2920216',
    photoAlt: 'Hai người bắt tay nhau trong buổi gặp',
    cta: { label: 'Xem kết nối', to: '/match' },
  },
  {
    id: 'nha-tuyen-dung',
    category: 'Nhà tuyển dụng',
    title: 'Dành cho nhà tuyển dụng',
    meta: 'Đội Workmate · 3 phút đọc',
    excerpt:
      'Đăng ca cần người, chọn khung giờ và khu vực. Workmate gợi ý những ứng viên rảnh đúng giờ và ở gần, giúp bạn lấp ca nhanh hơn mà không phải đọc hàng chục hồ sơ.',
    photoId: '1554118811-1e0d58224f24',
    photoAlt: 'Không gian quán cà phê nhiều cây xanh',
    cta: { label: 'Dành cho nhà tuyển dụng', to: '/nha-tuyen-dung' },
  },
  {
    id: 'bat-dau-o-da-nang',
    category: 'Đà Nẵng',
    title: 'Bắt đầu ở Đà Nẵng',
    meta: 'Đội Workmate · 2 phút đọc',
    excerpt:
      'Chúng tôi bắt đầu từ một thành phố để làm cho thật kỹ: quán cà phê, cửa hàng, kho, giao hàng. Khi đã vững, Workmate mới mở rộng ra nơi khác.',
    photoId: '1522071820081-009f0129c71c',
    photoAlt: 'Nhóm đồng nghiệp trẻ cùng làm việc quanh một chiếc bàn',
    cta: { label: 'Đọc cẩm nang', to: '/cam-nang' },
  },
]
