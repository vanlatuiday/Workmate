// Dữ liệu mẫu cho trang cá nhân — một ứng viên Frontend Developer và một công ty công nghệ.
// Chỉ nằm trong bộ nhớ (store), tải lại trang là về mặc định. Thay bằng API khi có backend.
import type { CompanyProfile, SeekerProfile } from './model'

export const SAMPLE_SEEKER: SeekerProfile = {
  name: 'Trần Minh Khoa',
  initials: 'MK',
  title: 'Frontend Developer',
  years: 3,
  bio: 'Thích làm giao diện nhanh, dễ dùng và đo được hiệu quả bằng số liệu thật.',
  availableFrom: '2026-12-01',
  currentCompany: 'Công ty TNHH Phần mềm Sông Hàn',
  skills: [
    { id: 's1', name: 'React', level: 4 },
    { id: 's2', name: 'TypeScript', level: 4 },
    { id: 's3', name: 'Tailwind CSS', level: 4 },
    { id: 's4', name: 'Next.js', level: 3 },
    { id: 's5', name: 'Kiểm thử (Jest)', level: 3 },
    { id: 's6', name: 'Figma', level: 2 },
  ],
  experience: [
    {
      id: 'e1',
      company: 'Công ty TNHH Phần mềm Sông Hàn',
      role: 'Frontend Developer',
      start: '2024-03',
      summary: 'Làm lại trang quản trị đặt phòng khách sạn bằng React + TypeScript, giảm 40% thời gian tải trang.',
    },
    {
      id: 'e2',
      company: 'Studio Cánh Buồm',
      role: 'Lập trình viên web (bán thời gian)',
      start: '2022-06',
      end: '2024-02',
      summary: 'Dựng website giới thiệu cho quán cà phê và cửa hàng địa phương.',
    },
    {
      id: 'e3',
      company: 'Trung tâm CNTT Đại học Đà Nẵng',
      role: 'Thực tập sinh',
      start: '2022-01',
      end: '2022-05',
      summary: 'Sửa lỗi giao diện và viết tài liệu cho cổng thông tin sinh viên.',
    },
  ],
  wishes: {
    salaryMin: 20,
    salaryMax: 28,
    locations: ['Đà Nẵng'],
    modes: ['hybrid', 'remote'],
  },
  projects: [
    {
      id: 'p1',
      name: 'Bảng điều khiển đặt phòng',
      summary: 'Trang quản trị cho 30 khách sạn, có lọc theo ngày và xuất báo cáo.',
      tech: ['React', 'TypeScript', 'TanStack Query'],
    },
    {
      id: 'p2',
      name: 'Ứng dụng gọi món tại bàn',
      summary: 'Quét mã QR để gọi món, chạy tốt trên điện thoại cũ.',
      tech: ['Next.js', 'Tailwind CSS'],
    },
  ],
  education: [{ id: 'ed1', school: 'Đại học Bách khoa – Đại học Đà Nẵng', degree: 'Kỹ sư Công nghệ thông tin', year: 2023 }],
  // Để trống chứng chỉ → thanh hoàn thiện có sẵn một gợi ý khi mở demo
  certificates: [],
  contact: { email: 'khoa.tran@example.com', phone: '0905 123 456' },
  visibility: { email: true, phone: false, salary: true, currentCompany: false },
}

export const SAMPLE_COMPANY: CompanyProfile = {
  name: 'Công ty Cổ phần Công nghệ Biển Đông',
  logoText: 'BĐ',
  industry: 'Phần mềm & dịch vụ số',
  size: '51–200 nhân viên',
  founded: 2016,
  mission: 'Làm phần mềm giúp doanh nghiệp du lịch miền Trung vận hành gọn hơn.',
  responseDays: 2,
  positions: [
    {
      id: 'v1',
      title: 'Frontend Developer (React)',
      skills: ['React', 'TypeScript', 'Tailwind CSS', 'Kiểm thử (Jest)', 'GraphQL'],
      salaryMin: 18,
      salaryMax: 26,
      mode: 'hybrid',
      location: 'Đà Nẵng',
    },
    {
      id: 'v2',
      title: 'Senior Frontend Engineer',
      skills: ['React', 'TypeScript', 'Next.js', 'Hiệu năng web', 'Dẫn dắt nhóm'],
      salaryMin: 30,
      salaryMax: 40,
      mode: 'onsite',
      location: 'Đà Nẵng',
    },
    {
      id: 'v3',
      title: 'Mobile Developer (React Native)',
      skills: ['React Native', 'TypeScript', 'Redux'],
      salaryMin: 20,
      salaryMax: 30,
      mode: 'remote',
      location: 'Toàn quốc',
    },
  ],
  culture: [
    { id: 'cu1', title: 'Nhóm nhỏ, tự chủ', text: 'Mỗi nhóm 5–7 người, tự lên kế hoạch hai tuần một lần.' },
    { id: 'cu2', title: 'Viết ra trước khi họp', text: 'Ý tưởng được viết thành tài liệu ngắn, họp chỉ để chốt.' },
    { id: 'cu3', title: 'Về đúng giờ', text: 'Không khuyến khích làm thêm giờ; tăng ca được trả gấp đôi.' },
  ],
  benefits: [
    { id: 'b1', icon: 'health', label: 'Bảo hiểm sức khỏe cho cả người thân' },
    { id: 'b2', icon: 'laptop', label: 'Cấp MacBook khi nhận việc' },
    { id: 'b3', icon: 'learning', label: '10 triệu/năm cho khóa học, sách' },
    { id: 'b4', icon: 'bonus', label: 'Thưởng tháng 13 và thưởng dự án' },
    { id: 'b5', icon: 'vacation', label: '15 ngày phép mỗi năm' },
  ],
  day: [
    { id: 'd1', time: '09:00', text: 'Họp nhanh 15 phút với nhóm' },
    { id: 'd2', time: '09:30', text: 'Tập trung làm việc, không họp' },
    { id: 'd3', time: '12:00', text: 'Ăn trưa cùng nhau ở căng tin' },
    { id: 'd4', time: '14:00', text: 'Xem code chéo, ghép cặp khi cần' },
    { id: 'd5', time: '17:30', text: 'Về nhà' },
  ],
  address: 'Tầng 6, 78 Bạch Đằng, Hải Châu, Đà Nẵng',
  contact: { email: 'tuyendung@biendong.example', phone: '0236 3 888 999', website: 'biendong.example' },
}
