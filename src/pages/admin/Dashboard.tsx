import { Users, Building2, FileText, UserCircle, TrendingUp, ShieldCheck, AlertTriangle } from 'lucide-react'
import { cn } from '@utils/cn'

const stats = [
  { label: 'Tổng người dùng',    value: '14,230', change: '+12%', icon: Users,       color: 'text-blue-600 bg-blue-50' },
  { label: 'Nhà tuyển dụng',     value: '856',    change: '+8%',  icon: Building2,   color: 'text-green-600 bg-green-50' },
  { label: 'Tin tuyển dụng',     value: '2,401',  change: '+15%', icon: FileText,    color: 'text-purple-600 bg-purple-50' },
  { label: 'Ứng viên',           value: '13,374', change: '+13%', icon: UserCircle,  color: 'text-yellow-600 bg-yellow-50' },
]

const pendingVerifications = [
  { id: '1', name: 'Nhà hàng Hải Sản Đà Nẵng', type: 'Nhà hàng', submittedAt: '2 giờ trước', status: 'pending' },
  { id: '2', name: 'ABC Coffee & Tea',           type: 'Cà phê',  submittedAt: '4 giờ trước', status: 'pending' },
  { id: '3', name: 'Tech Startup XYZ',            type: 'Startup', submittedAt: '1 ngày trước', status: 'pending' },
]

const recentReports = [
  { id: '1', type: 'Tin tuyển dụng giả', target: 'Nhân viên bán hàng – Shop A', reportedAt: '1 giờ trước', severity: 'high' },
  { id: '2', type: 'Spam tin nhắn',       target: 'User ID #4521',               reportedAt: '3 giờ trước', severity: 'medium' },
  { id: '3', type: 'Review ẩn danh giả', target: 'Coffee House B',              reportedAt: '5 giờ trước', severity: 'low' },
]

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Tổng quan hệ thống Workmate</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', s.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  {s.change}
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending verifications */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary-500" />
              Chờ xác minh ({pendingVerifications.length})
            </h2>
          </div>
          <div className="space-y-3">
            {pendingVerifications.map((v) => (
              <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl bg-yellow-50 border border-yellow-100">
                <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-yellow-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{v.name}</p>
                  <p className="text-xs text-gray-500">{v.type} · {v.submittedAt}</p>
                </div>
                <div className="flex gap-1">
                  <button className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">
                    Duyệt
                  </button>
                  <button className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded hover:bg-gray-300">
                    Từ chối
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent reports */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Báo cáo mới nhất
            </h2>
          </div>
          <div className="space-y-3">
            {recentReports.map((r) => (
              <div key={r.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50">
                <div className={cn(
                  'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                  r.severity === 'high' ? 'bg-red-500' : r.severity === 'medium' ? 'bg-yellow-500' : 'bg-gray-300',
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{r.type}</p>
                  <p className="text-xs text-gray-500 truncate">{r.target}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{r.reportedAt}</p>
                </div>
                <button className="text-xs text-primary-600 hover:underline flex-shrink-0">
                  Xem
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Growth chart placeholder */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary-500" />
          <h2 className="font-semibold text-gray-900">Tăng trưởng người dùng (30 ngày)</h2>
        </div>
        <div className="h-48 flex items-end justify-between gap-1">
          {[30,35,28,45,50,42,60,55,70,65,80,75,90,85,95,88,100,92,110,105,115,108,120,118,125,130,122,135,140,145].map((v, i) => (
            <div
              key={i}
              className="flex-1 bg-primary-400 rounded-t opacity-70 hover:opacity-100 transition-opacity"
              style={{ height: `${(v / 145) * 100}%` }}
            />
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1 tháng trước</span>
          <span>Hôm nay</span>
        </div>
      </div>
    </div>
  )
}
