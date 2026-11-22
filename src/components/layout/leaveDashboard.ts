import {
  BookOpen, Briefcase, Building2, CalendarClock, CircleHelp, FilePlus2, Globe, Handshake, Home, Info, Lock, LogIn, Mail,
  MessageCircle, ScrollText, ShieldCheck, Sparkles, User, UserRound, type LucideIcon,
} from 'lucide-react'
import { SIDEBAR_CONFIG } from './sidebar/config'

/** Khu làm việc (dashboard) → tiền tố đường dẫn; đi trong cùng khu thì không hỏi. */
const AREAS = ['/tim-viec', '/tuyen-dung', '/admin'] as const
type Area = (typeof AREAS)[number]

export const areaOf = (path: string): Area | undefined => AREAS.find((a) => path === a || path.startsWith(`${a}/`))

/** Trang đích ngoài khu làm việc: biểu tượng, tên, một câu mô tả. Khớp tiền tố dài nhất trước. */
type PageMeta = { icon: LucideIcon; name: string; desc: string }
const PAGES: [string, PageMeta][] = [
  ['/tin-nhan', { icon: MessageCircle, name: 'Tin nhắn', desc: 'Trò chuyện với những người bạn đã kết nối.' }],
  ['/lich-phong-van', { icon: CalendarClock, name: 'Lịch phỏng vấn', desc: 'Xem, chọn giờ và đổi lịch các buổi phỏng vấn.' }],
  ['/dang-tin', { icon: FilePlus2, name: 'Đăng tin', desc: 'Soạn tin tuyển dụng mới hoặc sửa tin đã đăng.' }],
  ['/match', { icon: Handshake, name: 'Kết nối', desc: 'Lướt gợi ý phù hợp và bày tỏ quan tâm.' }],
  ['/ho-so', { icon: User, name: 'Hồ sơ', desc: 'Sửa hồ sơ và tờ CV mà nhà tuyển dụng nhìn thấy.' }],
  ['/trang-ca-nhan', { icon: UserRound, name: 'Trang cá nhân', desc: 'Trang giới thiệu công khai của bạn.' }],
  ['/ca-nhan', { icon: UserRound, name: 'Trang cá nhân', desc: 'Trang giới thiệu công khai của bạn.' }],
  ['/thong-bao', { icon: Sparkles, name: 'Thông báo', desc: 'Toàn bộ thông báo gần đây.' }],
  ['/ung-vien', { icon: User, name: 'Hồ sơ ứng viên', desc: 'Trang hồ sơ đầy đủ của ứng viên.' }],
  ['/viec-lam', { icon: Briefcase, name: 'Việc làm', desc: 'Trang công khai: việc đang tuyển theo ngành nghề.' }],
  ['/cong-ty', { icon: Building2, name: 'Trang công ty', desc: 'Trang công khai giới thiệu công ty.' }],
  ['/vi-tri', { icon: Briefcase, name: 'Trang vị trí', desc: 'Trang công khai của một vị trí tuyển dụng.' }],
  ['/cam-nang', { icon: BookOpen, name: 'Cẩm nang', desc: 'Bài viết hướng dẫn tìm việc và tuyển người.' }],
  ['/nha-tuyen-dung', { icon: Building2, name: 'Dành cho nhà tuyển dụng', desc: 'Giới thiệu Workmate cho doanh nghiệp.' }],
  ['/gioi-thieu', { icon: Info, name: 'Giới thiệu', desc: 'Câu chuyện và cách Workmate hoạt động.' }],
  ['/ho-tro', { icon: CircleHelp, name: 'Trợ giúp', desc: 'Câu hỏi thường gặp và hướng dẫn sử dụng.' }],
  ['/lien-he', { icon: Mail, name: 'Liên hệ', desc: 'Gửi câu hỏi hoặc góp ý cho Workmate.' }],
  ['/dieu-khoan', { icon: ScrollText, name: 'Điều khoản', desc: 'Điều khoản sử dụng dịch vụ.' }],
  ['/bao-mat', { icon: Lock, name: 'Bảo mật', desc: 'Cách Workmate xử lý dữ liệu của bạn.' }],
  ['/dang-nhap', { icon: LogIn, name: 'Đăng nhập', desc: 'Trang đăng nhập tài khoản.' }],
  ['/dang-ky', { icon: LogIn, name: 'Đăng ký', desc: 'Trang tạo tài khoản mới.' }],
  ['/xem-thu', { icon: Globe, name: 'Xem thử', desc: 'Trang xem thử giao diện.' }],
]
const HOME: PageMeta = { icon: Home, name: 'Trang chủ', desc: 'Trang chủ công khai của Workmate.' }
const OTHER_AREA: Record<Area, PageMeta> = {
  '/tim-viec': { icon: Briefcase, name: 'Khu tìm việc', desc: 'Khu làm việc của người tìm việc.' },
  '/tuyen-dung': { icon: Building2, name: 'Khu tuyển dụng', desc: 'Khu làm việc của nhà tuyển dụng.' },
  '/admin': { icon: ShieldCheck, name: 'Khu quản trị', desc: 'Khu làm việc của quản trị viên.' },
}
const FALLBACK: PageMeta = { icon: Globe, name: 'trang mới', desc: 'Một trang nằm ngoài khu làm việc.' }

const match = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`)

export function pageMeta(path: string): PageMeta {
  if (path === '/') return HOME
  const area = areaOf(path)
  if (area) return OTHER_AREA[area]
  return PAGES.find(([p]) => match(path, p))?.[1] ?? FALLBACK
}

/** Mọi mục có href của thanh bên (cả mục con), để gọi tên trang đang đứng trong dashboard */
const SIDEBAR_LINKS = Object.values(SIDEBAR_CONFIG).flatMap((cfg) =>
  cfg.groups.flatMap((g) => g.items.flatMap((it) => [
    ...(it.href ? [{ href: it.href, label: it.label }] : []),
    ...(it.children ?? []).map((c) => ({ href: c.href.split('#')[0], label: c.label })),
  ])),
)

/** Tên trang đang đứng trong khu làm việc (theo nhãn thanh bên, khớp đường dẫn dài nhất) */
export function currentPageName(path: string): string {
  const area = areaOf(path)
  if (area && path === area) return 'Tổng quan'
  const best = SIDEBAR_LINKS.filter((l) => areaOf(l.href) && match(path, l.href)).sort((a, b) => b.href.length - a.href.length)[0]
  return best?.label ?? (area ? OTHER_AREA[area].name : 'Khu làm việc')
}

/**
 * Đường dẫn trong khu nhưng chỉ chuyển hướng ra trang ngoài khu (route <Navigate> trong App.tsx; thanh bên còn trỏ vào vài cái).
 * Bấm vào → hỏi ngay với tên trang đích thật; bước chuyển hướng sau khi đã đồng ý thì đi thẳng.
 */
const ALIASES: Record<string, string> = {
  '/tim-viec/bat-dau': '/ho-so',
  '/tim-viec/tin-nhan': '/tin-nhan',
  '/tim-viec/lich-phong-van': '/lich-phong-van',
  '/tuyen-dung/dang-tin': '/dang-tin',
  '/tuyen-dung/ung-vien-phu-hop': '/match',
  '/tuyen-dung/tin-nhan': '/tin-nhan',
  '/tuyen-dung/lich-phong-van': '/lich-phong-van',
}
export const resolveAlias = (path: string) => ALIASES[path.replace(/\/+$/, '')] ?? path

/**
 * Có cần hỏi trước khi đi từ `from` sang `to` không: chỉ khi đang ở một khu làm việc và đích nằm NGOÀI khu đó.
 * Cùng đường dẫn (vd. mở/đóng tin chi tiết bằng ?tin=, đổi #neo) thì không hỏi.
 */
export function needsLeaveConfirm(from: string, to: string): boolean {
  // Đang ở đường dẫn chuyển hướng = người dùng đã đồng ý rời đi ở bước trước
  if (resolveAlias(from) !== from) return false
  const here = areaOf(from)
  if (!here || from === to) return false
  return areaOf(resolveAlias(to)) !== here
}

/** Nơi quay lại khu làm việc, theo khu đang đứng (hiện trong hộp hỏi) */
export const AREA_HOME_LABEL: Record<Area, string> = {
  '/tim-viec': 'Khu tìm việc',
  '/tuyen-dung': 'Khu tuyển dụng',
  '/admin': 'Khu quản trị',
}
