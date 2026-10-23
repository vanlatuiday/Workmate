import { Link } from 'react-router-dom'
import { Sparkles, ClipboardList, Bookmark, Zap, ArrowRight, MapPin, Clock, TrendingUp } from 'lucide-react'
import { useAuthStore } from '@context/authStore'
import { cn } from '@utils/cn'

const stats = [
  { label: 'Đã ứng tuyển', value: 12, icon: ClipboardList, color: 'text-blue-600 bg-blue-50', href: '/tim-viec/ung-tuyen' },
  { label: 'NTD đã xem', value: 7,  icon: TrendingUp,   color: 'text-purple-600 bg-purple-50', href: '/tim-viec/ung-tuyen' },
  { label: 'Việc đã lưu',  value: 5,  icon: Bookmark,     color: 'text-yellow-600 bg-yellow-50', href: '/tim-viec/da-luu' },
  { label: 'MATCH',        value: 3,  icon: Zap,          color: 'text-green-600 bg-green-50',  href: '/tim-viec/match' },
]

const recommendedJobs = [
  { id: '1', title: 'Nhân viên bán hàng', company: 'ABC Shop', location: 'Hải Châu, Đà Nẵng', salary: '25k–30k/giờ', type: 'Part-time', match: 92, logo: '🛍️' },
  { id: '2', title: 'Pha chế Barista', company: 'The Coffee House', location: 'Thanh Khê', salary: '4–5tr/tháng', type: 'Part-time', match: 87, logo: '☕' },
  { id: '3', title: 'Marketing Intern', company: 'Startup XYZ', location: 'Sơn Trà', salary: 'Thỏa thuận', type: 'Full-time', match: 84, logo: '📣' },
]

const recentApplications = [
  { id: '1', title: 'Nhân viên bán hàng', company: 'ABC Shop', status: 'interview_invited', statusLabel: 'Mời phỏng vấn', statusColor: 'badge-green' },
  { id: '2', title: 'Content Creator', company: 'Media Co.', status: 'considering', statusLabel: 'Đang xem xét', statusColor: 'badge-yellow' },
  { id: '3', title: 'Pha chế Barista', company: 'Cafe 88', status: 'viewed', statusLabel: 'NTD đã xem', statusColor: 'badge-blue' },
]

export default function JobseekerDashboard() {
  const { user } = useAuthStore()
  const name = user?.email?.split('@')[0] ?? 'bạn'

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-700 rounded-2xl p-6 text-white">
        <h1 className="text-xl font-bold mb-1">Xin chào, {name}! 👋</h1>
        <p className="text-primary-100 text-sm">Hôm nay có 5 công việc mới phù hợp trên 80% với hồ sơ của bạn.</p>
        <Link to="/tim-viec/phu-hop" className="inline-flex items-center gap-1 mt-4 bg-white text-primary-600 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors">
          <Sparkles className="w-4 h-4" />
          Xem việc phù hợp
          <ArrowRight className="w-4 h-4" />
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recommended jobs */}
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-500" />
              Việc phù hợp với bạn
            </h2>
            <Link to="/tim-viec/phu-hop" className="text-xs text-primary-600 hover:underline flex items-center gap-1">
              Xem tất cả <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recommendedJobs.map((job) => (
              <Link key={job.id} to={`/viec-lam/${job.id}`} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                  {job.logo}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 truncate">{job.title}</p>
                  <p className="text-xs text-gray-500 truncate">{job.company}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{job.location}</span>
                    <span>·</span>
                    <span>{job.salary}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={cn(
                    'text-xs font-bold px-2 py-0.5 rounded-full',
                    job.match >= 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700',
                  )}>
                    {job.match}%
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{job.type}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent applications */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-gray-500" />
              Ứng tuyển gần đây
            </h2>
            <Link to="/tim-viec/ung-tuyen" className="text-xs text-primary-600 hover:underline">
              Xem tất cả
            </Link>
          </div>
          <div className="space-y-3">
            {recentApplications.map((app) => (
              <div key={app.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ClipboardList className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{app.title}</p>
                  <p className="text-xs text-gray-500">{app.company}</p>
                  <span className={cn('badge mt-1', app.statusColor)}>{app.statusLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Profile completion nudge */}
      <div className="card p-5 border-dashed border-2 border-primary-200 bg-primary-50/30">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-gray-800">Hoàn thiện hồ sơ của bạn</p>
            <p className="text-sm text-gray-500 mt-0.5">Hồ sơ đầy đủ giúp tăng tỷ lệ match lên đến 3x.</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 bg-gray-200 rounded-full h-1.5 max-w-xs">
                <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: '60%' }} />
              </div>
              <span className="text-xs font-medium text-gray-600">60%</span>
            </div>
          </div>
          <Link to="/tim-viec/ho-so" className="btn-primary text-sm flex-shrink-0">
            Cập nhật
          </Link>
        </div>
      </div>
    </div>
  )
}
