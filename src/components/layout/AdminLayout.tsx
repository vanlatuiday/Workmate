import {
  LayoutDashboard, Users, Building2, FileText,
  UserCircle, BarChart2, ShieldCheck, Eye, TrendingUp, Cog,
} from 'lucide-react'
import DashboardShell from './DashboardShell'

const navItems = [
  { label: 'Tổng quan',          href: '/admin',                  icon: LayoutDashboard },
  { label: 'Người dùng',         href: '/admin/nguoi-dung',       icon: Users },
  { label: 'Nhà tuyển dụng',     href: '/admin/nha-tuyen-dung',   icon: Building2 },
  { label: 'Tin tuyển dụng',     href: '/admin/tin-tuyen-dung',   icon: FileText },
  { label: 'Ứng viên',           href: '/admin/ung-vien',         icon: UserCircle },
  { label: 'Báo cáo',            href: '/admin/bao-cao',          icon: BarChart2 },
  { label: 'Xác minh',           href: '/admin/xac-minh',         icon: ShieldCheck },
  { label: 'Kiểm duyệt',         href: '/admin/kiem-duyet',       icon: Eye },
  { label: 'Thống kê',           href: '/admin/thong-ke',         icon: TrendingUp },
  { label: 'Cấu hình',           href: '/admin/cau-hinh',         icon: Cog },
]

export default function AdminLayout() {
  return <DashboardShell navItems={navItems} roleLabel="Quản trị viên" homeHref="/admin" />
}
