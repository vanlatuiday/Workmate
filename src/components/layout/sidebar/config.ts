import {
  LayoutDashboard, Sparkles, Bookmark, ClipboardList, Zap, Calendar, FileText, User, Settings,
  PlusCircle, List, UserCheck, Search, BookmarkCheck, Building2, Users, UserCircle, BarChart2,
  ShieldCheck, Eye, TrendingUp, Cog, MessageCircle, LineChart,
  type LucideIcon,
} from 'lucide-react'

/** Loại số liệu thật hiện ở mục (lấy từ store, xem useSidebarBadges) */
export type BadgeKind = 'messages' | 'applications' | 'interviews'

export type SidebarChild = {
  label: string
  /** Đường dẫn kèm #neo, vd. /tim-viec/ho-so#kinh-nghiem */
  href: string
  /** Lớp màu chấm nhỏ đầu dòng */
  dot: string
}

export type SidebarItem = {
  key: string
  label: string
  icon: LucideIcon
  /** Không có href = mục hành động (vd. mở khung tin nhắn) */
  href?: string
  /** 'messages' = mở khung tin nhắn nổi thay vì chuyển trang */
  action?: 'messages'
  /** count = huy hiệu số đỏ; dot = chấm đỏ (khi thu gọn luôn là chấm) */
  badge?: { kind: BadgeKind; style: 'count' | 'dot' }
  children?: SidebarChild[]
}

export type SidebarGroup = { label: string; items: SidebarItem[] }

export type SidebarRole = 'seeker' | 'recruiter' | 'admin'

export type SidebarConfig = {
  subtitle: string
  homeHref: string
  groups: SidebarGroup[]
  /** Đường dẫn trong menu tài khoản (⋯) */
  profileHref?: string
  settingsHref: string
}

const item = (key: string, label: string, icon: LucideIcon, href: string, badge?: SidebarItem['badge']): SidebarItem => ({
  key, label, icon, href, badge,
})

const messages: SidebarItem = {
  key: 'messages', label: 'Tin nhắn', icon: MessageCircle, action: 'messages',
  badge: { kind: 'messages', style: 'count' },
}

export const SIDEBAR_CONFIG: Record<SidebarRole, SidebarConfig> = {
  seeker: {
    subtitle: 'Không gian người tìm việc',
    homeHref: '/tim-viec',
    profileHref: '/tim-viec/ho-so',
    settingsHref: '/tim-viec/cai-dat',
    groups: [
      {
        label: 'Chính',
        items: [
          item('home', 'Tổng quan', LayoutDashboard, '/tim-viec'),
          item('match-jobs', 'Việc phù hợp', Sparkles, '/tim-viec/phu-hop'),
          item('applied', 'Đã ứng tuyển', ClipboardList, '/tim-viec/ung-tuyen', { kind: 'applications', style: 'count' }),
          item('saved', 'Việc đã lưu', Bookmark, '/tim-viec/da-luu'),
          item('connect', 'Kết nối', Zap, '/tim-viec/match'),
          item('interviews', 'Lịch phỏng vấn', Calendar, '/tim-viec/lich-phong-van', { kind: 'interviews', style: 'dot' }),
        ],
      },
      {
        label: 'Cá nhân',
        items: [
          messages,
          {
            key: 'profile', label: 'Hồ sơ của tôi', icon: User, href: '/tim-viec/ho-so',
            children: [
              { label: 'Thông tin cá nhân', href: '/tim-viec/ho-so#thong-tin', dot: 'bg-wm-fern' },
              { label: 'Kinh nghiệm', href: '/tim-viec/ho-so#kinh-nghiem', dot: 'bg-wm-clay' },
              { label: 'Lịch rảnh', href: '/tim-viec/ho-so#lich-ranh', dot: 'bg-wm-violet' },
            ],
          },
          item('cv', 'CV', FileText, '/tim-viec/cv'),
          item('stats', 'Thống kê', LineChart, '/tim-viec/thong-ke'),
          item('settings', 'Cài đặt', Settings, '/tim-viec/cai-dat'),
        ],
      },
    ],
  },
  recruiter: {
    subtitle: 'Không gian nhà tuyển dụng',
    homeHref: '/tuyen-dung',
    profileHref: '/tuyen-dung/ho-so-cong-ty',
    settingsHref: '/tuyen-dung/cai-dat',
    groups: [
      {
        label: 'Chính',
        items: [
          item('home', 'Tổng quan', LayoutDashboard, '/tuyen-dung'),
          item('post', 'Đăng tin', PlusCircle, '/dang-tin'),
          item('jobs', 'Tin tuyển dụng', List, '/tuyen-dung/tin-dang'),
          item('match-cands', 'Ứng viên phù hợp', UserCheck, '/tuyen-dung/ung-vien-phu-hop'),
          item('search', 'Tìm ứng viên', Search, '/tuyen-dung/tim-ung-vien'),
          item('saved', 'Ứng viên đã lưu', BookmarkCheck, '/tuyen-dung/ung-vien-da-luu'),
          item('connect', 'Kết nối', Zap, '/tuyen-dung/match'),
          item('interviews', 'Lịch phỏng vấn', Calendar, '/tuyen-dung/lich-phong-van', { kind: 'interviews', style: 'dot' }),
        ],
      },
      {
        label: 'Công ty',
        items: [
          messages,
          item('company', 'Hồ sơ công ty', Building2, '/tuyen-dung/ho-so-cong-ty'),
          item('settings', 'Cài đặt', Settings, '/tuyen-dung/cai-dat'),
        ],
      },
    ],
  },
  admin: {
    subtitle: 'Khu quản trị',
    homeHref: '/admin',
    settingsHref: '/admin/cau-hinh',
    groups: [
      {
        label: 'Quản lý',
        items: [
          item('home', 'Tổng quan', LayoutDashboard, '/admin'),
          item('users', 'Người dùng', Users, '/admin/nguoi-dung'),
          item('employers', 'Nhà tuyển dụng', Building2, '/admin/nha-tuyen-dung'),
          item('jobs', 'Tin tuyển dụng', FileText, '/admin/tin-tuyen-dung'),
          item('seekers', 'Ứng viên', UserCircle, '/admin/ung-vien'),
          item('moderation', 'Kiểm duyệt', Eye, '/admin/kiem-duyet'),
          item('verify', 'Xác minh', ShieldCheck, '/admin/xac-minh'),
          item('reports', 'Báo cáo', BarChart2, '/admin/bao-cao'),
        ],
      },
      {
        label: 'Hệ thống',
        items: [
          item('stats', 'Thống kê', TrendingUp, '/admin/thong-ke'),
          item('config', 'Cấu hình', Cog, '/admin/cau-hinh'),
        ],
      },
    ],
  },
}

/** Mục đang chọn: Tổng quan khớp chính xác; mục khác khớp theo tiền tố đường dẫn. */
export function isItemActive(pathname: string, href: string, homeHref: string) {
  if (href === homeHref) return pathname === href
  return pathname === href || pathname.startsWith(href + '/')
}

/** Bỏ dấu + hạ chữ thường để tìm trang gõ không dấu cũng ra */
export function normalize(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').toLowerCase()
}
