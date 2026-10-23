/**
 * Nội dung mẫu cho trang chủ. Toàn bộ là placeholder để thử trải nghiệm cuộn —
 * thay bằng nội dung thật tại đây, không cần đụng vào các component.
 */

export const heroTags = ['Barista', 'Bán hàng', 'Marketing', 'Giao hàng', 'Phục vụ']

export const benefits = [
  {
    title: 'Lịch rảnh là điều kiện, không phải tiêu chí phụ.',
    body: 'Nhập giờ học, giờ làm hiện tại — chỉ những ca khớp với bạn mới được đề xuất.',
  },
  {
    title: 'Gần nhà, đúng quãng đường bạn muốn đi.',
    body: 'Đặt bán kính di chuyển một lần, Workmate lọc phần còn lại.',
  },
  {
    title: 'Chỉ kết nối khi cả hai bên cùng muốn.',
    body: 'Ứng viên và nhà tuyển dụng cùng quan tâm thì kênh trò chuyện riêng mới mở ra.',
  },
]

export type SampleJob = {
  title: string
  location: string
  type: string
  salary: string
}

/** Tin mẫu — không phải vị trí tuyển dụng có thật. Thẻ đầu tiên hiển thị lớn. */
export const sampleJobs: SampleJob[] = [
  { title: 'Pha chế barista',            location: 'Thanh Khê, Đà Nẵng',    type: 'Bán thời gian', salary: '25.000–30.000đ/giờ' },
  { title: 'Nhân viên bán hàng',         location: 'Hải Châu, Đà Nẵng',     type: 'Theo ca',       salary: '4–5 triệu/tháng' },
  { title: 'Thực tập sinh marketing',    location: 'Sơn Trà, Đà Nẵng',      type: 'Toàn thời gian', salary: 'Thỏa thuận' },
  { title: 'Nhân viên phục vụ',          location: 'Ngũ Hành Sơn, Đà Nẵng', type: 'Cuối tuần',     salary: '30.000đ/giờ' },
  { title: 'Cộng tác viên bán online',   location: 'Làm từ xa',             type: 'Linh hoạt',     salary: 'Theo hoa hồng' },
  { title: 'Nhân viên giao hàng',        location: 'Toàn thành phố',        type: 'Theo ngày',     salary: '200.000đ/ngày' },
]

export const steps = [
  { title: 'Tạo hồ sơ trong 5 phút', body: 'Kỹ năng, khu vực và lịch rảnh trong tuần — không cần CV dài.' },
  { title: 'Nhận gợi ý vừa khít', body: 'Mỗi việc làm kèm điểm phù hợp và lý do vì sao nó hợp với bạn.' },
  { title: 'Match rồi mới trò chuyện', body: 'Hai bên cùng quan tâm thì kênh chat riêng mở ra, hẹn phỏng vấn ngay trong đó.' },
]

export const brandStatement =
  'Chúng tôi không đo thành công bằng số tin đăng, mà bằng số người thật sự đi làm.'
