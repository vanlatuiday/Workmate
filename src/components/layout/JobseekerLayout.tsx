import {
  LayoutDashboard, Sparkles, Bookmark, ClipboardList,
  Zap, MessageCircle, Calendar, FileText, User, Settings,
} from 'lucide-react'
import DashboardShell from './DashboardShell'

const navItems = [
  { label: 'Tổng quan',        href: '/tim-viec',                  icon: LayoutDashboard },
  { label: 'Việc phù hợp',     href: '/tim-viec/phu-hop',          icon: Sparkles },
  { label: 'Việc đã lưu',      href: '/tim-viec/da-luu',           icon: Bookmark },
  { label: 'Đã ứng tuyển',     href: '/tim-viec/ung-tuyen',        icon: ClipboardList },
  { label: 'MATCH',            href: '/tim-viec/match',            icon: Zap, badge: 'Mới' },
  { label: 'Tin nhắn',         href: '/tim-viec/tin-nhan',         icon: MessageCircle },
  { label: 'Lịch phỏng vấn',   href: '/tim-viec/lich-phong-van',   icon: Calendar },
  { label: 'CV',               href: '/tim-viec/cv',               icon: FileText },
  { label: 'Hồ sơ cá nhân',    href: '/tim-viec/ho-so',            icon: User },
  { label: 'Cài đặt',          href: '/tim-viec/cai-dat',          icon: Settings },
]

export default function JobseekerLayout() {
  return <DashboardShell navItems={navItems} roleLabel="Người tìm việc" homeHref="/tim-viec" />
}
