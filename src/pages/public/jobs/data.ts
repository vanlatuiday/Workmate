// Dữ liệu mẫu cho /viec-lam và /cong-ty/:id — thay bằng API khi có backend.
// Việc làm của từng công ty nằm ở `jobs/catalog.ts` (một nguồn cho cả hai phía),
// tin của nhà tuyển dụng lấy từ MOCK_JOBS — cùng nguồn với dashboard nên số liệu không lệch nhau.
import { useCatalogStore } from '@context/catalogStore'
import type { Photo } from '@components/discover/types'
import type { CompanySize } from '@/types'

export interface DiscoverCompany {
  /** Dùng làm đường dẫn /cong-ty/:id */
  id: string
  name: string
  industry: string
  district: string
  size: CompanySize
  cover: Photo
  /** Ảnh phụ ở trang chi tiết (nếu có) */
  more?: Photo
  /** Mô tả một câu */
  tagline: string
  /** Lý do đáng ghé xem — dành cho khách */
  why: string
  about: string
  environment: string[]
}

export const COMPANIES: DiscoverCompany[] = [
  {
    id: 'gio-song-han',
    name: 'Quán Gió Sông Hàn',
    industry: 'Cà phê',
    district: 'Sơn Trà',
    size: '11-50',
    cover: { id: '1554118811-1e0d58224f24', alt: 'Không gian quán cà phê nhiều cây xanh, quầy pha chế phía sau' },
    more: { id: '1509042239860-f550ce710b93', alt: 'Ba tách cà phê latte trên bàn gỗ' },
    tagline: 'Quán cà phê ven sông, đông khách nhất vào buổi tối.',
    why: 'Ca tối ngắn, hợp với sinh viên học ban ngày.',
    about:
      'Quán nhỏ bên bờ đông sông Hàn, phục vụ cà phê pha máy và đồ uống theo mùa. Đội ngũ trẻ, phần lớn là sinh viên làm bán thời gian.',
    environment: ['Được hướng dẫn pha chế từ đầu', 'Chọn ca theo tuần', 'Bữa nhẹ trong ca'],
  },
  {
    id: 'bien-xanh',
    name: 'Cửa hàng Biển Xanh',
    industry: 'Bán lẻ thời trang',
    district: 'Hải Châu',
    size: '11-50',
    cover: { id: '1441986300917-64674bd600d8', alt: 'Cửa hàng quần áo với kệ gỗ và đèn treo' },
    tagline: 'Cửa hàng thời trang biển ở trung tâm thành phố.',
    why: 'Việc cuối tuần, không cần kinh nghiệm bán hàng.',
    about:
      'Cửa hàng quần áo và phụ kiện đi biển, đông khách vào cuối tuần và mùa du lịch. Nhân viên mới được kèm trong hai ca đầu.',
    environment: ['Không yêu cầu kinh nghiệm', 'Ca cố định cuối tuần', 'Giảm giá nhân viên'],
  },
  {
    id: 'may-trang',
    name: 'Công ty Sự kiện Mây Trắng',
    industry: 'Tổ chức sự kiện',
    district: 'Thanh Khê',
    size: '51-200',
    cover: { id: '1511795409834-ef04bbd61622', alt: 'Bàn tiệc dài trang trí hoa và ly thủy tinh' },
    tagline: 'Tổ chức tiệc, khai trương và hội nghị khắp Đà Nẵng.',
    why: 'Việc theo từng sự kiện, nhận ngày công rõ ràng.',
    about:
      'Đơn vị tổ chức sự kiện cho doanh nghiệp và tiệc gia đình. Cần thêm người vào các dịp cao điểm, làm theo lịch từng sự kiện.',
    environment: ['Làm theo lịch sự kiện', 'Trả công theo ngày', 'Có trưởng nhóm hướng dẫn tại chỗ'],
  },
  {
    id: 'canh-buom',
    name: 'Studio Cánh Buồm',
    industry: 'Marketing & sáng tạo',
    district: 'Hải Châu',
    size: '1-10',
    cover: { id: '1522071820081-009f0129c71c', alt: 'Nhóm người làm việc với máy tính quanh một bàn dài' },
    more: { id: '1556761175-5973dc0f32e7', alt: 'Một người trình bày trước nhóm đồng nghiệp trong văn phòng gạch' },
    tagline: 'Studio nhỏ làm nội dung và thương hiệu cho doanh nghiệp địa phương.',
    why: 'Chỗ thực tập để có sản phẩm thật trong hồ sơ.',
    about:
      'Nhóm sáu người làm nội dung mạng xã hội, chụp ảnh sản phẩm và nhận diện thương hiệu. Thực tập sinh tham gia dự án thật ngay từ tuần đầu.',
    environment: ['Làm dự án thật', 'Giờ giấc văn phòng', 'Có người kèm cặp'],
  },
  {
    id: 'giao-nhanh',
    name: 'Giao Nhanh Đà Thành',
    industry: 'Giao nhận',
    district: 'Cẩm Lệ',
    size: '51-200',
    cover: { id: '1586528116311-ad8dd3c8310d', alt: 'Kho hàng với các kệ cao xếp đầy thùng hàng' },
    tagline: 'Giao hàng nội thành trong ngày cho các cửa hàng trực tuyến.',
    why: 'Tự chọn ca sáng hoặc tối, có thưởng theo chuyến.',
    about:
      'Đơn vị giao nhận nội thành Đà Nẵng, kho chính ở Cẩm Lệ. Tài xế chọn ca theo tuần và nhận thêm thưởng theo số chuyến.',
    environment: ['Chọn ca theo tuần', 'Thưởng theo chuyến', 'Cần xe máy riêng'],
  },
  {
    id: 'hoa-sua',
    name: 'Trung tâm Ngôn Ngữ Hoa Sữa',
    industry: 'Giáo dục',
    district: 'Ngũ Hành Sơn',
    size: '11-50',
    cover: { id: '1523240795612-9a054b0db644', alt: 'Ba người cười nói bên máy tính trong thư viện' },
    tagline: 'Lớp tiếng Anh giao tiếp buổi tối cho người đi làm.',
    why: 'Dạy buổi tối, trả theo giờ, hợp với người có chứng chỉ.',
    about:
      'Trung tâm nhỏ dạy tiếng Anh giao tiếp, lớp tối dưới 12 học viên. Giáo án có sẵn, gia sư mới được dự giờ trước khi đứng lớp.',
    environment: ['Giáo án có sẵn', 'Lớp nhỏ', 'Dự giờ trước khi nhận lớp'],
  },
  {
    id: 'song-vo',
    name: 'Nhà hàng Sóng Vỗ',
    industry: 'Nhà hàng',
    district: 'Sơn Trà',
    size: '51-200',
    cover: { id: '1517248135467-4c7edcad34c4', alt: 'Phòng ăn nhà hàng với bàn gỗ và đèn vàng' },
    more: { id: '1414235077428-338989a2e8c0', alt: 'Món ăn trình bày trên đĩa trắng giữa bàn tiệc' },
    tagline: 'Nhà hàng hải sản gần biển Mỹ Khê, đông nhất vào mùa hè.',
    why: 'Việc thời vụ mùa cao điểm, ca chiều tối.',
    about:
      'Nhà hàng hải sản hơn trăm chỗ ngồi gần biển. Mỗi mùa hè tuyển thêm phục vụ theo mùa, có đào tạo ngắn trước khi vào ca.',
    environment: ['Đào tạo trước khi vào ca', 'Bữa ăn trong ca', 'Ca chiều tối'],
  },
]

/** Công ty theo id: ưu tiên danh mục đã nạp từ máy chủ, chưa có thì dữ liệu mẫu (chưa ghép hồ sơ đã sửa của công ty demo — dùng `companyOf`) */
export function findCompany(id: string | undefined) {
  return useCatalogStore.getState().companies.find((c) => c.id === id) ?? COMPANIES.find((c) => c.id === id)
}
