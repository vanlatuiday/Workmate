import {
  LayoutDashboard, PlusCircle, List, UserCheck,
  Search, BookmarkCheck, Zap, MessageCircle, Calendar,
  Building2, Settings,
} from 'lucide-react'
import DashboardShell from './DashboardShell'

const navItems = [
  { label: 'Tổng quan',          href: '/tuyen-dung',                    icon: LayoutDashboard },
  { label: 'Đăng tin',           href: '/tuyen-dung/dang-tin',           icon: PlusCircle },
  { label: 'Tin tuyển dụng',     href: '/tuyen-dung/tin-dang',           icon: List },
  { label: 'Ứng viên phù hợp',   href: '/tuyen-dung/ung-vien-phu-hop',   icon: UserCheck },
  { label: 'Tìm ứng viên',       href: '/tuyen-dung/tim-ung-vien',       icon: Search },
  { label: 'Ứng viên đã lưu',    href: '/tuyen-dung/ung-vien-da-luu',    icon: BookmarkCheck },
  { label: 'Kết nối',           href: '/tuyen-dung/match',              icon: Zap, badge: 'Mới' },
  { label: 'Tin nhắn',           href: '/tuyen-dung/tin-nhan',           icon: MessageCircle },
  { label: 'Lịch phỏng vấn',     href: '/tuyen-dung/lich-phong-van',     icon: Calendar },
  { label: 'Hồ sơ công ty',      href: '/tuyen-dung/ho-so-cong-ty',      icon: Building2 },
  { label: 'Cài đặt',            href: '/tuyen-dung/cai-dat',            icon: Settings },
]

export default function RecruiterLayout() {
  return <DashboardShell navItems={navItems} roleLabel="Nhà tuyển dụng" homeHref="/tuyen-dung" />
}
