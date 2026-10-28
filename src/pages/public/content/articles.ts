// Bài cẩm nang MẪU — nội dung ngắn để dựng khung, sẽ thay bằng bài thật.
export interface Article {
  slug: string
  title: string
  summary: string
  readMin: number
  /** id ảnh Unsplash (dùng với photoUrl) */
  photoId: string
  photoAlt: string
  body: string[]
}

export const ARTICLES: Article[] = [
  {
    slug: 'viet-cv-dau-tien',
    title: 'Viết CV đầu tiên khi chưa có kinh nghiệm',
    summary: 'Ba mục nên có để nhà tuyển dụng nhớ bạn.',
    readMin: 4,
    photoId: '1523240795612-9a054b0db644',
    photoAlt: 'Ba người cười nói bên máy tính trong thư viện',
    body: [
      'Chưa có kinh nghiệm không có nghĩa là chưa có gì để viết. Hoạt động trường, câu lạc bộ và dự án nhóm đều là điểm cộng.',
      'Hãy nêu rõ bạn rảnh khung giờ nào trong tuần; với việc linh hoạt, đây là thông tin được đọc đầu tiên.',
      'Giữ CV một trang, dùng câu ngắn và con số cụ thể.',
    ],
  },
  {
    slug: 'phong-van-part-time',
    title: 'Phỏng vấn việc part-time: chuẩn bị gì',
    summary: 'Những câu hỏi hay gặp và cách trả lời gọn.',
    readMin: 5,
    photoId: '1554118811-1e0d58224f24',
    photoAlt: 'Không gian quán cà phê nhiều cây xanh',
    body: [
      'Nhà tuyển dụng thường hỏi về lịch học, khả năng đi làm đúng giờ và lý do bạn chọn nơi này.',
      'Hãy trung thực về giờ rảnh để tránh bị xếp ca không phù hợp.',
      'Đến sớm vài phút và hỏi lại về ca làm, lương, cách chấm công.',
    ],
  },
  {
    slug: 'can-bang-hoc-va-lam',
    title: 'Cân bằng giữa đi học và đi làm',
    summary: 'Lên lịch tuần để không kiệt sức.',
    readMin: 4,
    photoId: '1522071820081-009f0129c71c',
    photoAlt: 'Nhóm người làm việc quanh một bàn dài',
    body: [
      'Bắt đầu bằng việc đánh dấu giờ học và giờ ôn bài cố định, phần còn lại mới dành cho việc làm.',
      'Nên nhận 12-20 giờ mỗi tuần khi mới bắt đầu, rồi điều chỉnh theo sức.',
      'Báo sớm với quản lý khi gần kỳ thi.',
    ],
  },
  {
    slug: 'tuyen-nguoi-ca-ngan',
    title: 'Dành cho nhà tuyển dụng: viết tin tuyển ca ngắn',
    summary: 'Tin rõ ca, rõ lương thì có nhiều ứng viên hơn.',
    readMin: 3,
    photoId: '1441986300917-64674bd600d8',
    photoAlt: 'Cửa hàng quần áo với kệ gỗ và đèn treo',
    body: [
      'Ghi rõ ca làm, số giờ và mức lương ngay đầu tin.',
      'Nói thẳng yêu cầu bắt buộc và những gì có thể đào tạo.',
      'Phản hồi ứng viên trong 48 giờ để giữ họ quan tâm.',
    ],
  },
]

export function findArticle(slug: string | undefined) {
  return ARTICLES.find((a) => a.slug === slug)
}
