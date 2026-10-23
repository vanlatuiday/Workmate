import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useRef, useState } from 'react'
import {
  Briefcase, LayoutDashboard, Sparkles, Bookmark, ClipboardList,
  Zap, MessageCircle, Calendar, FileText, User, Settings,
  Bell, LogOut, Menu, X, ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '@context/authStore'
import { cn } from '@utils/cn'
import RouteScroll from '@components/common/RouteScroll'

const navItems = [
  { label: 'Tổng quan',        href: '/tim-viec',                  icon: LayoutDashboard },
  { label: 'Việc phù hợp',     href: '/tim-viec/phu-hop',          icon: Sparkles },
  { label: 'Việc đã lưu',      href: '/tim-viec/da-luu',           icon: Bookmark },
  { label: 'Đã ứng tuyển',     href: '/tim-viec/ung-tuyen',        icon: ClipboardList },
  { label: 'MATCH',            href: '/tim-viec/match',            icon: Zap, highlight: true },
  { label: 'Tin nhắn',         href: '/tim-viec/tin-nhan',         icon: MessageCircle },
  { label: 'Lịch phỏng vấn',   href: '/tim-viec/lich-phong-van',   icon: Calendar },
  { label: 'CV',               href: '/tim-viec/cv',               icon: FileText },
  { label: 'Hồ sơ cá nhân',    href: '/tim-viec/ho-so',            icon: User },
  { label: 'Cài đặt',          href: '/tim-viec/cai-dat',          icon: Settings },
]

export default function JobseekerLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/dang-nhap')
  }

  const Sidebar = ({ mobile = false }) => (
    <aside
      className={cn(
        'flex flex-col h-full bg-white border-r border-gray-200',
        mobile ? 'w-72' : 'w-64',
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary-600">
          <Briefcase className="w-5 h-5" />
          Workmate
        </Link>
        {mobile && (
          <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* User info */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-semibold text-sm">
            {user?.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{user?.email}</p>
            <p className="text-xs text-gray-400">Người tìm việc</p>
          </div>
        </div>
      </div>

      {/* Nav */}
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
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                item.highlight && !active && 'text-primary-500',
              )}
            >
              <Icon className={cn('w-4 h-4 flex-shrink-0', item.highlight && 'text-primary-500')} />
              {item.label}
              {item.highlight && (
                <span className="ml-auto text-xs bg-primary-500 text-white px-1.5 py-0.5 rounded-full font-semibold">
                  NEW
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-gray-100 space-y-0.5">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          <ChevronRight className="w-4 h-4" />
          Về trang chủ
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <Sidebar mobile />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4 flex-shrink-0">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1 md:flex-none" />
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-gray-100 relative">
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
          {/* key theo route → remount mỗi lần đổi trang, xem RouteScroll */}
          <RouteScroll key={location.pathname} container={mainRef} />
        </main>
      </div>
    </div>
  )
}
