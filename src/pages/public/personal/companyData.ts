// Dữ liệu mẫu — thay bằng API hồ sơ công ty. Một doanh nghiệp dịch vụ ở Đà Nẵng,
// khớp các tin trong MOCK_JOBS (quán cà phê, cửa hàng, tiệc cưới, tiện lợi, giao hàng).
export const COMPANY = {
  name: 'Nhóm Dịch Vụ Sông Hàn',
  industry: 'Dịch vụ ăn uống và bán lẻ',
  location: 'Hải Châu, Đà Nẵng',
  intro:
    'Chúng tôi vận hành một quán cà phê, một cửa hàng tiện lợi và nhận phục vụ tiệc cưới quanh khu vực trung tâm Đà Nẵng. Đội ngũ nhỏ, làm việc theo ca và cần người ở nhiều khung giờ khác nhau.',
  recruiter: { title: 'Quản lý nhân sự', email: 'tuyendung@songhan.example' },
  environment: [
    'Quầy pha chế và khu phục vụ thoáng, làm việc đứng nhiều',
    'Cửa hàng tiện lợi mở theo ca, có khu nghỉ cho nhân viên',
    'Tiệc cưới làm việc tối, theo lịch sự kiện',
  ],
  workOrganization: [
    'Xếp ca trước một tuần, báo lịch qua nhóm chung',
    'Có thể đổi ca với đồng nghiệp nếu báo trước',
    'Mỗi ca có một người phụ trách hướng dẫn',
  ],
  culture: 'Nói thẳng, giúp nhau trong giờ cao điểm, không để ai tự xoay xở một mình.',
  values: ['Đúng giờ', 'Tôn trọng khách', 'Làm việc nhóm', 'Học nhanh'],
  policies: [
    'Lương trả theo giờ hoặc theo ngày, rõ ràng từ đầu',
    'Được hướng dẫn trước khi nhận ca đầu tiên',
    'Nghỉ ca báo trước, không bị trừ nếu có lý do chính đáng',
  ],
  skillsWanted: ['Giao tiếp khách hàng', 'Pha chế cơ bản', 'Thu ngân', 'Làm việc nhóm'],
  priorities: ['Lịch làm ổn định', 'Ở gần địa điểm làm việc', 'Sẵn sàng làm ca tối và cuối tuần'],
  contacts: [
    ['Email tuyển dụng', 'tuyendung@songhan.example'],
    ['Địa chỉ', 'Hải Châu, Đà Nẵng'],
    ['Giờ phản hồi', 'Trong giờ hành chính'],
  ] as [string, string][],
}
