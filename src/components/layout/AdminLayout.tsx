import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useRef, useState } from 'react'
import {
  Briefcase, LayoutDashboard, Users, Building2, FileText,
  UserCircle, BarChart2, ShieldCheck, Eye, TrendingUp, Cog,
  Bell, LogOut, Menu, X,
} from 'lucide-react'
import { useAuthStore } from '@context/authStore'
import { cn } from '@utils/cn'
import RouteScroll from '@components/common/RouteScroll'

const navItems = [
  { label: 'Dashboard',          href: '/admin',                  icon: LayoutDashboard },
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/dang-nhap')
  }

  const Sidebar = ({ mobile = false }) => (
    <aside className={cn('flex flex-col h-full bg-gray-900 text-white', mobile ? 'w-64' : 'w-60')}>
      <div className="flex items-center justify-between p-5 border-b border-gray-700">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-white">
          <Briefcase className="w-5 h-5 text-primary-400" />
          Workmate
          <span className="text-xs bg-primary-500 text-white px-1.5 py-0.5 rounded font-medium">Admin</span>
        </Link>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-gray-700">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = location.pathname === item.href
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white',
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-gray-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-red-400"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <Sidebar mobile />
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4 flex-shrink-0">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5 text-gray-500" />
          </button>
          <h1 className="text-sm font-semibold text-gray-700 hidden md:block">
            {navItems.find((n) => n.href === location.pathname)?.label ?? 'Admin'}
          </h1>
          <div className="flex items-center gap-2 ml-auto">
            <button className="p-2 rounded-lg hover:bg-gray-100 relative">
              <Bell className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </header>

        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
          {/* key theo route → remount mỗi lần đổi trang, xem RouteScroll */}
          <RouteScroll key={location.pathname} container={mainRef} />
        </main>
      </div>
    </div>
  )
}
