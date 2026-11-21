// Bài cẩm nang. Mỗi mục trong body là một đoạn; chỉ mô tả tính năng Workmate có thật.
export interface Article {
  slug: string
  title: string
  summary: string
  readMin: number
  /** id ảnh Unsplash (dùng với photoUrl) */
  photoId: string
  photoAlt: string
  /** Nhãn ngắn hiện trên thẻ ở /cam-nang */
  tags: string[]
  body: string[]
}

export const ARTICLES: Article[] = [
  {
    slug: 'viet-cv-dau-tien',
    title: 'Viết CV đầu tiên khi chưa có kinh nghiệm',
    summary: 'Ba mục nên có trong CV để nhà tuyển dụng hiểu bạn làm được gì và rảnh lúc nào.',
    readMin: 2,
    photoId: '1523240795612-9a054b0db644',
    photoAlt: 'Ba người cười nói bên máy tính trong thư viện',
    tags: ['CV', 'Sinh viên', 'Kỹ năng'],
    body: [
      'Chưa đi làm lần nào không có nghĩa là bạn chưa có gì để viết. Với việc theo ca như phục vụ, bán hàng, phát tờ rơi hay hỗ trợ sự kiện, nhà tuyển dụng cần biết ba điều: bạn làm được gì, bạn rảnh lúc nào và bạn đáng tin tới đâu. CV đầu tiên chỉ cần trả lời gọn ba câu đó.',
      'Mục thứ nhất là kỹ năng. Hãy liệt kê những thứ bạn thực sự dùng được: giao tiếp với khách, dùng máy tính tiền hoặc điện thoại để ghi đơn, nói được tiếng Anh cơ bản, chạy xe máy trong thành phố, chụp ảnh sản phẩm. Chọn vài kỹ năng sát với việc bạn muốn làm thay vì viết một danh sách dài.',
      'Mục thứ hai là những gì bạn đã làm, dù không có lương. Phụ trách quầy trong hội chợ của trường, làm tình nguyện viên cho một giải chạy, trông quán giúp gia đình, nhận nhóm trưởng một bài tập lớn. Mỗi việc viết một hai câu: bạn làm gì, trong bao lâu, kết quả ra sao. Câu có số cụ thể như "phụ trách quầy trong 3 ngày" thuyết phục hơn câu "có tinh thần trách nhiệm".',
      'Mục thứ ba là lịch rảnh. Với việc linh hoạt, đây thường là thông tin được đọc đầu tiên. Ghi rõ các buổi bạn đi làm được trong tuần, ngày bạn bắt đầu được và khu vực bạn đi lại thuận tiện. Trong Workmate, bạn đánh dấu lịch rảnh theo từng ngày và buổi sáng, chiều, tối. Hệ thống dùng lịch này cùng kỹ năng, mức lương mong muốn và khoảng cách để tính điểm phù hợp với từng tin.',
      'Về hình thức, giữ CV trong một trang, dùng một kiểu chữ, chia mục rõ ràng và để ảnh chân dung nếu có thì gọn, nghiêm túc. Lưu thành file PDF để định dạng không bị vỡ khi mở trên điện thoại. Bạn có thể tải CV lên hồ sơ Workmate và chọn một CV mặc định. Họ tên đầy đủ, số điện thoại và CV của bạn chỉ hiện cho nhà tuyển dụng sau khi hai bên kết nối.',
      'Cuối cùng, đọc lại một lần để soát lỗi chính tả và kiểm tra số điện thoại, email. Một CV trung thực, ngắn và dễ đọc luôn có giá trị hơn một CV dài mà thông tin bị tô vẽ. Khi được hỏi về điều bạn đã ghi, bạn phải trả lời được.',
    ],
  },
  {
    slug: 'phong-van-part-time',
    title: 'Phỏng vấn việc bán thời gian: chuẩn bị gì',
    summary: 'Những câu hỏi hay gặp khi phỏng vấn việc theo ca và cách chuẩn bị để trả lời gọn.',
    readMin: 2,
    photoId: '1554118811-1e0d58224f24',
    photoAlt: 'Không gian quán cà phê nhiều cây xanh',
    tags: ['Phỏng vấn', 'Bán thời gian'],
    body: [
      'Phỏng vấn việc bán thời gian thường ngắn, khoảng vài chục phút, và thiên về chuyện thực tế: bạn đi làm được ca nào, có đúng giờ không, có làm được việc này không. Chuẩn bị trước vài câu trả lời sẽ giúp bạn bình tĩnh hơn nhiều.',
      'Nhà tuyển dụng hay hỏi về lịch học hoặc lịch làm chính của bạn. Hãy mở sẵn thời khóa biểu và nói rõ buổi nào bận, buổi nào rảnh, tuần thi có khác không. Trung thực ở bước này giúp bạn tránh bị xếp vào ca không đi được, và tránh phải xin nghỉ ngay tuần đầu.',
      'Câu hỏi thứ hai là vì sao bạn chọn nơi này. Bạn không cần lời lẽ hoa mỹ. Chỉ cần nói thật và cụ thể: quán gần nhà nên đi lại dễ, bạn đã từng là khách quen, bạn muốn học cách làm việc với khách. Xem trước trang công ty trên Workmate để biết họ làm gì, ở quận nào và cần vị trí gì.',
      'Hãy chuẩn bị cả câu hỏi của chính bạn. Hỏi cụ thể về ca làm và số giờ mỗi tuần, mức lương theo giờ hay theo ca, ngày trả lương, cách chấm công, có được đổi ca khi gần kỳ thi không, và ai là người hướng dẫn bạn trong tuần đầu. Hỏi những điều này cho thấy bạn nghiêm túc, và bạn cần biết rõ để quyết định.',
      'Với phỏng vấn qua Workmate, nhà tuyển dụng đề xuất một đến ba khung giờ và bạn chọn khung phù hợp. Nếu là phỏng vấn trực tuyến, nhà tuyển dụng gửi đường link cuộc họp như Google Meet hoặc Zoom. Hãy thử mở link trước vài phút, kiểm tra mạng, micro và để điện thoại ở nơi yên tĩnh. Nếu phỏng vấn tại chỗ, xem trước đường đi và đến sớm khoảng mười phút.',
      'Về cách ăn mặc, chọn trang phục gọn gàng, hợp với môi trường làm việc. Sau buổi phỏng vấn, bạn có thể nhắn lại cảm ơn trong khung tin nhắn khi đã kết nối. Và nhớ rằng một nhà tuyển dụng đàng hoàng sẽ không thu bất kỳ khoản phí nào để nhận bạn vào làm. Gặp trường hợp này, hãy dừng lại và báo cáo tin đó trên Workmate.',
    ],
  },
  {
    slug: 'can-bang-hoc-va-lam',
    title: 'Cân bằng giữa đi học và đi làm',
    summary: 'Cách xếp lịch tuần để vừa đủ giờ học, giờ làm và giờ nghỉ.',
    readMin: 2,
    photoId: '1522071820081-009f0129c71c',
    photoAlt: 'Nhóm người làm việc quanh một bàn dài',
    tags: ['Sinh viên', 'Lịch làm', 'Sức khỏe'],
    body: [
      'Đi làm thêm giúp bạn có thu nhập và kinh nghiệm, nhưng cũng dễ làm bạn mệt nếu không tính trước. Cách đơn giản nhất là bắt đầu bằng lịch học, rồi mới tới lịch làm.',
      'Hãy ghi ra giấy hoặc điện thoại cả tuần của bạn theo bốn buổi sáng, chiều, tối, khuya. Đánh dấu trước giờ học trên lớp, giờ tự học, thời gian di chuyển, bữa ăn và giờ ngủ. Phần còn lại mới là chỗ trống có thể dành cho việc làm. Nhiều bạn quên tính thời gian đi lại giữa trường và nơi làm, trong khi quãng này có thể ngốn thêm cả giờ mỗi ngày.',
      'Khi mới bắt đầu, nên nhận ít giờ hơn mức bạn nghĩ mình làm được. Khoảng 12 đến 20 giờ mỗi tuần là mức nhiều bạn sinh viên thấy vừa sức, nhưng mỗi người khác nhau. Hãy thử vài tuần, thấy ổn rồi mới tăng. Nếu điểm số hay giấc ngủ giảm, đó là dấu hiệu cần giảm bớt.',
      'Chọn việc gần trường hoặc gần nhà sẽ tiết kiệm sức hơn mức lương cao hơn vài nghìn đồng một giờ. Trên Workmate, bạn có thể bật lọc "Gần tôi" và đặt khoảng cách tối đa bạn chịu đi để chỉ thấy những tin nằm trong tầm. Bạn cũng đánh dấu lịch rảnh thật chính xác, để các tin gợi ý khớp đúng những buổi bạn có thể làm.',
      'Hãy báo sớm khi lịch thay đổi. Gần kỳ thi, nói với quản lý ít nhất vài ngày trước để họ sắp xếp người thay. Khi nhận việc, hỏi luôn về chuyện đổi ca và nghỉ thi ngay từ đầu, thay vì đợi tới lúc cần mới hỏi. Cập nhật lịch rảnh trong hồ sơ vào mùa thi cũng giúp bạn không nhận những tin trái lịch.',
      'Cuối cùng, giữ một khoảng nghỉ cố định mỗi tuần, ví dụ một buổi tối hoặc một buổi sáng cuối tuần không học và không làm. Công việc linh hoạt chỉ hữu ích khi nó vừa với cuộc sống của bạn.',
    ],
  },
  {
    slug: 'tuyen-nguoi-ca-ngan',
    title: 'Dành cho nhà tuyển dụng: viết tin tuyển ca ngắn',
    summary: 'Cách viết tin rõ ca, rõ lương để người phù hợp nhận ra ngay và liên hệ.',
    readMin: 2,
    photoId: '1441986300917-64674bd600d8',
    photoAlt: 'Cửa hàng quần áo với kệ gỗ và đèn treo',
    tags: ['Nhà tuyển dụng', 'Tin tuyển', 'Lương'],
    body: [
      'Người tìm việc theo ca lướt qua nhiều tin trong vài phút. Tin nào cho họ biết ngay mình có làm được hay không sẽ được mở ra đọc tiếp. Vì vậy phần đầu tin quan trọng hơn mọi phần khác.',
      'Hãy ghi rõ ba thứ ở đầu tin: ca làm, số giờ mỗi tuần và mức lương. Ví dụ "ca tối 17:00 đến 22:00, 4 buổi mỗi tuần, 30.000đ mỗi giờ". Nếu lương thay đổi theo ca hoặc có thưởng, nói rõ cách tính. Tin giấu mức lương thường nhận về nhiều người rồi rút lui khi biết con số.',
      'Phân biệt điều bắt buộc với điều có thể đào tạo. Trong Workmate, bạn có thể đặt một số kỹ năng là bắt buộc. Ứng viên thiếu kỹ năng bắt buộc sẽ có điểm phù hợp thấp, tối đa 39%. Chỉ đánh dấu bắt buộc những thứ thật sự cần ngay ngày đầu, như biết đi xe máy khi cần giao hàng. Những thứ còn lại, hãy ghi là sẽ hướng dẫn.',
      'Chọn thời hạn tin cho phù hợp. Tin có thể hết hạn sau 7, 14, 30 hoặc 60 ngày. Việc cần người gấp cho một sự kiện cuối tuần thì chọn ngắn. Khi tin hết hạn, bạn mở lại được và tin sẽ gia hạn thêm 30 ngày. Hãy đóng tin ngay khi đã đủ người để người tìm việc không mất công liên hệ vô ích.',
      'Viết đúng sự thật và tránh những cụm từ bị cấm. Workmate tự lọc tin trước khi hiện công khai: tin có cụm từ bị cấm bị từ chối, tin có dấu hiệu đáng ngờ được giữ lại để quản trị viên xem. Không thu phí ứng viên dưới bất kỳ hình thức nào, và không viết lời hứa lương bất thường. Công ty nhập mã số doanh nghiệp và được xác minh sẽ tạo thêm tin tưởng cho ứng viên.',
      'Sau khi đăng, trả lời nhanh. Xem danh sách ứng viên, bày tỏ quan tâm với người phù hợp và kết nối để mở nhắn tin. Đặt lịch phỏng vấn với một đến ba khung giờ, kèm địa chỉ hoặc link cuộc họp. Phản hồi trong vòng hai ngày giúp bạn không mất người tốt vào tay nơi khác.',
    ],
  },
]

export function findArticle(slug: string | undefined) {
  return ARTICLES.find((a) => a.slug === slug)
}
