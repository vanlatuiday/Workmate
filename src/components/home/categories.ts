import { BellRing, Bike, BookOpen, Briefcase, ChefHat, Coffee, FolderOpen, Megaphone, Package, PartyPopper, ScanBarcode, ShoppingBag, UtensilsCrossed, type LucideIcon } from 'lucide-react'
import type { MatchJob } from '@pages/public/match/data'
import type { Photo } from '@components/discover/types'
import banHang from '@assets/images/trades/ban_hang.webp'
import giaoHang from '@assets/images/trades/giao_hang.webp'
import hanhChinh from '@assets/images/trades/hanh_chinh.webp'
import kho from '@assets/images/trades/kho.webp'
import leTan from '@assets/images/trades/le_tan.webp'
import marketing from '@assets/images/trades/marketing.webp'
import phaChe from '@assets/images/trades/pha_che.webp'
import phuBep from '@assets/images/trades/phu_bep.webp'
import phucVu from '@assets/images/trades/phuc_vu.webp'
import suKien from '@assets/images/trades/su_kien.webp'
import thuNgan from '@assets/images/trades/thu_ngan.webp'
import troGiang from '@assets/images/trades/tro_giang.webp'

/**
 * Nhóm nghề của bảng "Ca đang cần người" (ShiftBoardSection).
 * Xếp theo TÊN VIỆC (không theo kỹ năng/tên công ty như bộ lọc `q` của /viec-lam — một việc phục vụ có kỹ năng
 * "bán hàng" từng bị xếp nhầm). Mỗi việc thuộc đúng một nhóm: nhóm ĐẦU TIÊN có từ khóa nằm trong tên việc, nên thứ tự
 * quan trọng ("Phục vụ tiệc cưới" vào Phục vụ vì đứng trước Sự kiện). Không khớp nhóm nào thì vào "Việc khác".
 * `q`: từ khóa mở /viec-lam khi cần xem thêm. `cutout`: ảnh tách nền (không mặt người) đặt thẳng trên nền trang; nhóm không có ("Việc khác") lấy ảnh của việc sớm nhất, mép mờ dần.
 */
export interface HomeCategory {
  key: string
  label: string
  /** Biểu tượng tròn cạnh tên nghề trên thẻ */
  icon: LucideIcon
  q: string
  /** Ảnh tách nền + mô tả */
  cutout?: { src: string; alt: string }
  /** Chỉ dùng khi không có `cutout` (gán ở ShiftBoardSection từ việc sớm nhất) */
  photo?: Photo
  /** Từ khóa (không dấu, chữ thường) tìm trong tên việc */
  words: string[]
}

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase()

export const HOME_CATEGORIES: HomeCategory[] = [
  { key: 'pha_che', label: 'Pha chế', icon: Coffee, q: 'Pha chế', cutout: { src: phaChe, alt: 'Tay nhân viên pha chế rót sữa tạo hình lên ly cà phê' }, words: ['pha che', 'barista'] },
  { key: 'phuc_vu', label: 'Phục vụ', icon: UtensilsCrossed, q: 'Phục vụ', cutout: { src: phucVu, alt: 'Nhân viên phục vụ mặc tạp dề bưng khay nước và đĩa mì' }, words: ['phuc vu'] },
  { key: 'phu_bep', label: 'Phụ bếp', icon: ChefHat, q: 'Phụ bếp', cutout: { src: phuBep, alt: 'Tay đeo găng thái ớt chuông trên thớt trong bếp' }, words: ['bep'] },
  { key: 'thu_ngan', label: 'Thu ngân', icon: ScanBarcode, q: 'Thu ngân', cutout: { src: thuNgan, alt: 'Nhân viên thu ngân quét mã gói hàng bằng súng đọc mã vạch' }, words: ['thu ngan'] },
  { key: 'ban_hang', label: 'Bán hàng', icon: ShoppingBag, q: 'Bán hàng', cutout: { src: banHang, alt: 'Nhân viên gấp áo sơ mi ở quầy quần áo' }, words: ['ban hang', 'cua hang'] },
  { key: 'giao_hang', label: 'Giao hàng', icon: Bike, q: 'Giao hàng', cutout: { src: giaoHang, alt: 'Người giao hàng đội mũ bảo hiểm, đeo thùng giao hàng, ôm kiện hàng' }, words: ['giao hang', 'tai xe', 'lai xe', 'shipper'] },
  { key: 'kho', label: 'Kho hàng', icon: Package, q: 'Kho', cutout: { src: kho, alt: 'Nhân viên kho đeo găng quét mã vạch trên thùng hàng' }, words: ['kho'] },
  { key: 'le_tan', label: 'Lễ tân', icon: BellRing, q: 'Lễ tân', cutout: { src: leTan, alt: 'Nhân viên lễ tân mặc vest đưa thẻ, bên cạnh chuông bàn' }, words: ['le tan'] },
  { key: 'su_kien', label: 'Sự kiện', icon: PartyPopper, q: 'Sự kiện', cutout: { src: suKien, alt: 'Tay chỉnh bàn trộn âm thanh ở sự kiện' }, words: ['su kien', 'tiec'] },
  { key: 'hanh_chinh', label: 'Hành chính', icon: FolderOpen, q: 'Hành chính', cutout: { src: hanhChinh, alt: 'Nhân viên văn phòng sắp xếp chồng giấy bên máy tính xách tay' }, words: ['hanh chinh', 'van phong'] },
  { key: 'marketing', label: 'Marketing & nội dung', icon: Megaphone, q: 'Marketing', cutout: { src: marketing, alt: 'Máy quay và máy tính đang dựng video nội dung' }, words: ['marketing', 'noi dung'] },
  { key: 'tro_giang', label: 'Trợ giảng', icon: BookOpen, q: 'Trợ giảng', cutout: { src: troGiang, alt: 'Hai người chỉ vào cuốn sách giáo trình đang mở trên bàn' }, words: ['tro giang', 'gia su', 'giang'] },
  { key: 'khac', label: 'Việc khác', icon: Briefcase, q: '', words: [] },
]

const FALLBACK = HOME_CATEGORIES[HOME_CATEGORIES.length - 1]

/** Nhóm nghề của một việc (luôn có — việc không khớp từ khóa nào vào "Việc khác") */
export function categoryOf(job: MatchJob): HomeCategory {
  const title = norm(job.title)
  return HOME_CATEGORIES.find((c) => c.words.some((w) => title.includes(w))) ?? FALLBACK
}
