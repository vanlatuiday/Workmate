/** Khu làm việc (dashboard) → tiền tố đường dẫn; đi trong cùng khu thì không hỏi. */
const AREAS = ['/tim-viec', '/tuyen-dung', '/admin'] as const

/** Tên trang đích (khớp tiền tố dài nhất trước) để hiện trong hộp xác nhận. */
const PAGE_NAMES: [string, string][] = [
  ['/viec-lam', 'Việc làm'],
  ['/cong-ty', 'Trang công ty'],
  ['/vi-tri', 'Trang vị trí'],
  ['/ung-vien', 'Hồ sơ ứng viên'],
  ['/cam-nang', 'Cẩm nang'],
  ['/dang-nhap', 'Đăng nhập'],
  ['/dang-ky', 'Đăng ký'],
  ['/ca-nhan', 'Trang cá nhân'],
  ['/trang-ca-nhan', 'Trang cá nhân'],
  ['/match', 'Kết nối'],
  ['/tin-nhan', 'Tin nhắn'],
  ['/lich-phong-van', 'Lịch phỏng vấn'],
  ['/dang-tin', 'Đăng tin'],
  ['/ho-so', 'Hồ sơ'],
  ['/gioi-thieu', 'Giới thiệu'],
  ['/nha-tuyen-dung', 'Dành cho nhà tuyển dụng'],
  ['/ho-tro', 'Trợ giúp'],
  ['/lien-he', 'Liên hệ'],
  ['/dieu-khoan', 'Điều khoản'],
  ['/bao-mat', 'Bảo mật'],
]

/**
 * Công cụ làm việc hằng ngày nằm ngoài khung dashboard nhưng vẫn là "việc trong khu" (mở từ thanh bên):
 * đi thẳng, không hỏi. Chỉ hỏi khi sang trang công khai (trang chủ, việc làm, công ty, cẩm nang…).
 */
const WORK_PATHS = ['/tin-nhan', '/lich-phong-van', '/dang-tin', '/match', '/ho-so', '/ca-nhan', '/trang-ca-nhan', '/thong-bao', '/ung-vien']
const isWorkPath = (path: string) => WORK_PATHS.some((p) => path === p || path.startsWith(`${p}/`))

const areaOf = (path: string) => AREAS.find((a) => path === a || path.startsWith(`${a}/`))

export function pageNameFor(path: string): string {
  if (path === '/') return 'Trang chủ'
  return PAGE_NAMES.find(([p]) => path === p || path.startsWith(`${p}/`))?.[1] ?? 'trang mới'
}

/**
 * Trả về đích (path+search+hash, tên trang) nếu click vào `a` làm rời khỏi khu làm việc hiện tại;
 * null nếu không cần hỏi (ngoài trang, tải về, mở tab mới, cùng khu, hash trong trang, opt-out…).
 */
export function leaveTarget(a: HTMLAnchorElement, current: Location): { to: string; name: string } | null {
  if (a.hasAttribute('download') || a.hasAttribute('data-no-leave-confirm')) return null
  if (a.target && a.target !== '_self') return null
  const raw = a.getAttribute('href')
  if (!raw || raw.startsWith('#')) return null
  const url = new URL(a.href, current.href)
  if (url.origin !== current.origin) return null
  const here = areaOf(current.pathname)
  if (!here) return null
  // Cùng trang (vd. mở tin chi tiết bằng ?tin=) hoặc cùng khu: đi thẳng
  if (url.pathname === current.pathname || areaOf(url.pathname) === here || isWorkPath(url.pathname)) return null
  return { to: `${url.pathname}${url.search}${url.hash}`, name: pageNameFor(url.pathname) }
}
