import { Link } from 'react-router-dom'
import { Users, FileText, Zap, Eye, PlusCircle, ArrowRight, MapPin, TrendingUp } from 'lucide-react'
import { useAuthStore } from '@context/authStore'
import { cn } from '@utils/cn'

const stats = [
  { label: 'Tin đang tuyển', value: 5,  icon: FileText, color: 'text-blue-600 bg-blue-50',   href: '/tuyen-dung/tin-dang' },
  { label: 'Ứng viên mới',   value: 24, icon: Users,    color: 'text-green-600 bg-green-50',  href: '/tuyen-dung/ung-vien-phu-hop' },
  { label: 'MATCH',          value: 8,  icon: Zap,      color: 'text-yellow-600 bg-yellow-50', href: '/tuyen-dung/match' },
  { label: 'Lượt xem hôm nay', value: 132, icon: Eye,  color: 'text-purple-600 bg-purple-50', href: '/tuyen-dung' },
]

const recentJobs = [
  { id: '1', title: 'Nhân viên bán hàng', applicants: 12, views: 87,  status: 'active', postedAt: '2 ngày trước' },
  { id: '2', title: 'Nhân viên phục vụ',  applicants: 8,  views: 64,  status: 'active', postedAt: '4 ngày trước' },
  { id: '3', title: 'Thu ngân',           applicants: 5,  views: 41,  status: 'active', postedAt: '1 tuần trước' },
]

const suggestedCandidates = [
  { id: '1', name: 'Nguyễn Minh Anh', skills: ['Bán hàng', 'CSKH'], location: 'Hải Châu', match: 91, avatar: '👩' },
  { id: '2', name: 'Trần Văn Bảo',    skills: ['Pha chế', 'Barista'], location: 'Thanh Khê', match: 88, avatar: '👨' },
  { id: '3', name: 'Lê Thị Cẩm',      skills: ['Marketing', 'Canva'], location: 'Sơn Trà', match: 83, avatar: '👩' },
]

export default function RecruiterDashboard() {
  const { user } = useAuthStore()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Dashboard tuyển dụng</h1>
          <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>
        </div>
        <Link to="/tuyen-dung/dang-tin" className="btn-primary text-sm">
          <PlusCircle className="w-4 h-4" />
          Đăng tin mới
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <Link key={s.label} to={s.href} className="card p-4 hover:shadow-md transition-shadow">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center mb-3', s.color)}>
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </Link>
          )
        })}
      </div>

      {/* Chart placeholder */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            Lượt xem & ứng tuyển (7 ngày)
          </h2>
        </div>
        <div className="h-40 flex items-end justify-between gap-2">
          {[40, 65, 55, 80, 72, 90, 85].map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-primary-500 rounded-t-md opacity-80"
                style={{ height: `${v}%` }}
              />
              <span className="text-xs text-gray-400">
                {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'][i]}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent job listings */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Tin tuyển dụng đang chạy</h2>
            <Link to="/tuyen-dung/tin-dang" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              Xem tất cả <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentJobs.map((job) => (
              <div key={job.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{job.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{job.postedAt}</p>
                </div>
                <div className="text-right text-xs text-gray-500 flex-shrink-0">
                  <p><span className="font-semibold text-gray-700">{job.applicants}</span> ứng viên</p>
                  <p><span className="font-semibold text-gray-700">{job.views}</span> lượt xem</p>
                </div>
                <span className="badge-green flex-shrink-0">Đang chạy</span>
              </div>
            ))}
          </div>
        </div>

        {/* Suggested candidates */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Ứng viên gợi ý</h2>
            <Link to="/tuyen-dung/ung-vien-phu-hop" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              Xem tất cả <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {suggestedCandidates.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 group cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                  {c.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 group-hover:text-primary-600">{c.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {c.skills.slice(0, 2).map((s) => (
                      <span key={s} className="badge-gray">{s}</span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-0.5 mt-1">
                    <MapPin className="w-3 h-3" /> {c.location}
                  </p>
                </div>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full flex-shrink-0">
                  {c.match}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
