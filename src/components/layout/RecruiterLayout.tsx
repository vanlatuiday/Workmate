import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useRef, useState } from 'react'
import {
  Briefcase, LayoutDashboard, PlusCircle, List, UserCheck,
  Search, BookmarkCheck, Zap, MessageCircle, Calendar,
  Building2, Settings, Bell, LogOut, Menu, X, ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '@context/authStore'
import { cn } from '@utils/cn'
import RouteScroll from '@components/common/RouteScroll'

const navItems = [
  { label: 'Tổng quan',          href: '/tuyen-dung',                    icon: LayoutDashboard },
  { label: 'Đăng tin',           href: '/tuyen-dung/dang-tin',           icon: PlusCircle },
  { label: 'Tin tuyển dụng',     href: '/tuyen-dung/tin-dang',           icon: List },
  { label: 'Ứng viên phù hợp',   href: '/tuyen-dung/ung-vien-phu-hop',   icon: UserCheck },
  { label: 'Tìm ứng viên',       href: '/tuyen-dung/tim-ung-vien',       icon: Search },
  { label: 'Ứng viên đã lưu',    href: '/tuyen-dung/ung-vien-da-luu',    icon: BookmarkCheck },
  { label: 'MATCH',              href: '/tuyen-dung/match',              icon: Zap, highlight: true },
  { label: 'Tin nhắn',           href: '/tuyen-dung/tin-nhan',           icon: MessageCircle },
  { label: 'Lịch phỏng vấn',     href: '/tuyen-dung/lich-phong-van',     icon: Calendar },
  { label: 'Hồ sơ công ty',      href: '/tuyen-dung/ho-so-cong-ty',      icon: Building2 },
  { label: 'Cài đặt',            href: '/tuyen-dung/cai-dat',            icon: Settings },
]

export default function RecruiterLayout() {
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

      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-secondary-100 flex items-center justify-center text-secondary-600 font-semibold text-sm">
            {user?.email?.[0]?.toUpperCase() ?? 'R'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{user?.email}</p>
            <p className="text-xs text-gray-400">Nhà tuyển dụng</p>
          </div>
        </div>
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
                  ? 'bg-secondary-50 text-secondary-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                item.highlight && !active && 'text-primary-500',
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
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
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <Sidebar mobile />
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
          <div className="flex-1 md:flex-none" />
          <div className="flex items-center gap-2">
            <Link
              to="/tuyen-dung/dang-tin"
              className="hidden md:flex btn-primary text-sm"
            >
              <PlusCircle className="w-4 h-4" />
              Đăng tin mới
            </Link>
            <button className="p-2 rounded-lg hover:bg-gray-100 relative">
              <Bell className="w-5 h-5 text-gray-500" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
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
