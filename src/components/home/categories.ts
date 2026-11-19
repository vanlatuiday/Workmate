import type { MatchJob } from '@pages/public/match/data'
import type { Photo } from '@components/discover/types'
import { homeMedia } from './homeMedia'

/**
 * Nhóm nghề của bảng "Ca đang cần người" (ShiftBoardSection).
 * Xếp theo TÊN VIỆC (không theo kỹ năng/tên công ty như bộ lọc `q` của /viec-lam — một việc phục vụ có kỹ năng
 * "bán hàng" từng bị xếp nhầm). Mỗi việc thuộc đúng một nhóm: nhóm ĐẦU TIÊN có từ khóa nằm trong tên việc, nên thứ tự
 * quan trọng ("Phục vụ tiệc cưới" vào Phục vụ vì đứng trước Sự kiện). Không khớp nhóm nào thì vào "Việc khác".
 * `q`: từ khóa mở /viec-lam khi cần xem thêm. `photo` không có thì thẻ lấy ảnh của việc sớm nhất trong nhóm.
 */
export interface HomeCategory {
  key: string
  label: string
  q: string
  photo?: Photo
  /** Từ khóa (không dấu, chữ thường) tìm trong tên việc */
  words: string[]
}

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase()

const m = homeMedia.categories

export const HOME_CATEGORIES: HomeCategory[] = [
  { key: 'pha_che', label: 'Pha chế', q: 'Pha chế', photo: m.pha_che, words: ['pha che', 'barista'] },
  { key: 'phuc_vu', label: 'Phục vụ', q: 'Phục vụ', photo: m.phuc_vu, words: ['phuc vu'] },
  { key: 'phu_bep', label: 'Phụ bếp', q: 'Phụ bếp', words: ['bep'] },
  { key: 'thu_ngan', label: 'Thu ngân', q: 'Thu ngân', words: ['thu ngan'] },
  { key: 'ban_hang', label: 'Bán hàng', q: 'Bán hàng', photo: m.ban_hang, words: ['ban hang', 'cua hang'] },
  { key: 'giao_hang', label: 'Giao hàng', q: 'Giao hàng', photo: m.giao_hang, words: ['giao hang', 'tai xe', 'lai xe', 'shipper'] },
  { key: 'kho', label: 'Kho hàng', q: 'Kho', photo: m.kho, words: ['kho'] },
  { key: 'le_tan', label: 'Lễ tân', q: 'Lễ tân', words: ['le tan'] },
  { key: 'su_kien', label: 'Sự kiện', q: 'Sự kiện', words: ['su kien', 'tiec'] },
  { key: 'hanh_chinh', label: 'Hành chính', q: 'Hành chính', words: ['hanh chinh', 'van phong'] },
  { key: 'marketing', label: 'Marketing & nội dung', q: 'Marketing', words: ['marketing', 'noi dung'] },
  { key: 'tro_giang', label: 'Trợ giảng', q: 'Trợ giảng', words: ['tro giang', 'gia su', 'giang'] },
  { key: 'khac', label: 'Việc khác', q: '', words: [] },
]

const FALLBACK = HOME_CATEGORIES[HOME_CATEGORIES.length - 1]

/** Nhóm nghề của một việc (luôn có — việc không khớp từ khóa nào vào "Việc khác") */
export function categoryOf(job: MatchJob): HomeCategory {
  const title = norm(job.title)
  return HOME_CATEGORIES.find((c) => c.words.some((w) => title.includes(w))) ?? FALLBACK
}
