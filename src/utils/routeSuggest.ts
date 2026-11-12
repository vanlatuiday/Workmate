// Gợi ý trang gần giống cho trang 404: so khớp đường dẫn gõ sai với danh sách trang tĩnh.
import type { UserRole } from '@/types'

export type RouteEntry = { to: string; label: string; roles?: UserRole[]; guestOnly?: boolean }

const PUBLIC: RouteEntry[] = [
  { to: '/viec-lam', label: 'Việc làm' },
  { to: '/cong-ty', label: 'Công ty' },
  { to: '/match', label: 'Ghép việc' },
  { to: '/cam-nang', label: 'Cẩm nang' },
  { to: '/ho-tro', label: 'Hỗ trợ' },
  { to: '/lien-he', label: 'Liên hệ' },
  { to: '/gioi-thieu', label: 'Giới thiệu' },
  { to: '/nha-tuyen-dung', label: 'Dành cho nhà tuyển dụng' },
  { to: '/dang-nhap', label: 'Đăng nhập', guestOnly: true },
  { to: '/dang-ky', label: 'Đăng ký', guestOnly: true },
  { to: '/ca-nhan', label: 'Cá nhân' },
  { to: '/tin-nhan', label: 'Tin nhắn' },
  { to: '/thong-bao', label: 'Thông báo' },
  { to: '/lich-phong-van', label: 'Lịch phỏng vấn' },
]

const SEEKER: RouteEntry[] = [
  { to: '/tim-viec', label: 'Bảng điều khiển ứng viên' },
  { to: '/tim-viec/phu-hop', label: 'Việc phù hợp' },
  { to: '/tim-viec/da-luu', label: 'Việc đã lưu' },
  { to: '/tim-viec/ung-tuyen', label: 'Đơn ứng tuyển' },
  { to: '/tim-viec/match', label: 'Ghép việc của tôi' },
  { to: '/tim-viec/cv', label: 'Quản lý CV' },
  { to: '/tim-viec/ho-so', label: 'Hồ sơ ứng viên' },
  { to: '/tim-viec/cai-dat', label: 'Cài đặt' },
]

const RECRUITER: RouteEntry[] = [
  { to: '/tuyen-dung', label: 'Bảng điều khiển tuyển dụng' },
  { to: '/tuyen-dung/tin-dang', label: 'Tin đã đăng' },
  { to: '/dang-tin', label: 'Đăng tin tuyển dụng' },
  { to: '/tuyen-dung/tim-ung-vien', label: 'Tìm ứng viên' },
  { to: '/tuyen-dung/ung-vien-da-luu', label: 'Ứng viên đã lưu' },
  { to: '/tuyen-dung/match', label: 'Ghép ứng viên' },
  { to: '/tuyen-dung/ho-so-cong-ty', label: 'Hồ sơ công ty' },
  { to: '/tuyen-dung/cai-dat', label: 'Cài đặt' },
]

const ADMIN: RouteEntry[] = [
  { to: '/admin', label: 'Quản trị' },
  { to: '/admin/nguoi-dung', label: 'Người dùng' },
  { to: '/admin/nha-tuyen-dung', label: 'Nhà tuyển dụng' },
  { to: '/admin/tin-tuyen-dung', label: 'Tin tuyển dụng' },
  { to: '/admin/ung-vien', label: 'Ứng viên' },
  { to: '/admin/bao-cao', label: 'Báo cáo' },
  { to: '/admin/xac-minh', label: 'Xác minh' },
  { to: '/admin/kiem-duyet', label: 'Kiểm duyệt' },
  { to: '/admin/thong-ke', label: 'Thống kê' },
  { to: '/admin/cau-hinh', label: 'Cấu hình' },
]

const SETTINGS: Record<string, string> = {
  jobseeker: '/tim-viec/cai-dat',
  recruiter: '/tuyen-dung/cai-dat',
}

/** Bỏ dấu tiếng Việt, chữ thường */
const fold = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase()

/** Chuẩn hóa: - _ / khoảng trắng như nhau; trả về các đoạn đã bỏ dấu */
function segments(s: string): string[] {
  return fold(s).split(/[\s/_-]+/).filter(Boolean)
}

const compact = (s: string) => segments(s).join('')

function levenshtein(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j]
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return dp[b.length]
}

/** Điểm 0..1 giữa hai chuỗi đã gộp liền */
function similarity(q: string, t: string): number {
  if (!q || !t) return 0
  if (q === t) return 1
  const min = Math.min(q.length, t.length)
  const max = Math.max(q.length, t.length)
  if (min >= 3 && (t.includes(q) || q.includes(t))) {
    const bonus = (t.startsWith(q) || q.startsWith(t) ? 0.1 : 0) + (t.includes(q) ? 0.02 : 0)
    return Math.min(0.95, 0.6 + 0.3 * (min / max) + bonus)
  }
  return Math.max(0, 1 - levenshtein(q, t) / max) * 0.9
}

const ALIASES: Record<string, string> = {
  jobs: '/viec-lam', job: '/viec-lam', login: '/dang-nhap', signin: '/dang-nhap',
  register: '/dang-ky', signup: '/dang-ky', companies: '/cong-ty', company: '/cong-ty',
  messages: '/tin-nhan', message: '/tin-nhan', profile: '/ca-nhan', blog: '/cam-nang',
  help: '/ho-tro', contact: '/lien-he', about: '/gioi-thieu', dashboard: '/',
  notifications: '/thong-bao', schedule: '/lich-phong-van',
}

const THRESHOLD = 0.6

export function routesForRole(role?: UserRole | null): RouteEntry[] {
  const extra = role === 'jobseeker' ? SEEKER : role === 'recruiter' ? RECRUITER : role === 'admin' ? ADMIN : []
  return [...PUBLIC.filter((r) => !(role && r.guestOnly)), ...extra]
}

function defaultsFor(role?: UserRole | null): string[] {
  if (role === 'jobseeker') return ['/tim-viec', '/viec-lam', '/tim-viec/da-luu']
  if (role === 'recruiter') return ['/tuyen-dung', '/tuyen-dung/tin-dang', '/dang-tin']
  if (role === 'admin') return ['/admin', '/admin/nguoi-dung', '/viec-lam']
  return ['/viec-lam', '/cong-ty', '/dang-nhap']
}

/** Tối đa 3 gợi ý; không đủ điểm thì trả về 3 trang hữu ích nhất theo vai trò */
export function suggestRoutes(pathname: string, role?: UserRole | null): RouteEntry[] {
  const routes = routesForRole(role)
  const segs = segments(pathname)
  const full = segs.join('')
  const last = segs[segs.length - 1] ?? ''

  const scored = new Map<string, number>()
  const bump = (to: string, score: number) => scored.set(to, Math.max(scored.get(to) ?? 0, score))

  // Từ đồng nghĩa tiếng Anh
  for (const s of [full, last]) {
    const alias = s === 'settings' || s === 'setting' ? (role ? SETTINGS[role] : undefined) : ALIASES[s]
    if (alias) bump(alias, 1)
  }

  for (const r of routes) {
    const slug = compact(r.to)
    const slugLast = segments(r.to).pop() ?? ''
    const label = compact(r.label)
    // So cả đường dẫn đầy đủ lẫn đoạn cuối, với cả slug và nhãn
    const s = Math.max(
      similarity(full, slug), similarity(full, label),
      similarity(last, slugLast) * 0.85, similarity(last, label) * 0.8,
    )
    if (s >= THRESHOLD) bump(r.to, s)
  }

  const byTo = new Map(routes.map((r) => [r.to, r]))
  const hits = [...scored.entries()]
    .filter(([to]) => byTo.has(to) && to !== '/')
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([to]) => byTo.get(to)!)
  if (hits.length) return hits
  return defaultsFor(role).map((to) => byTo.get(to)).filter((r): r is RouteEntry => !!r)
}
