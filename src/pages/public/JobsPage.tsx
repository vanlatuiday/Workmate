import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Search, MapPin, Filter, Bookmark, Clock, SlidersHorizontal, X } from 'lucide-react'
import { JOB_TYPES, INDUSTRIES } from '@constants/index'
import { cn } from '@utils/cn'

const mockJobs = [
  { id: '1', title: 'Nhân viên bán hàng', company: 'ABC Shop', location: 'Hải Châu, Đà Nẵng', salary: '25k–30k/giờ', type: 'part-time', industry: 'Bán hàng & Bán lẻ', match: 92, logo: '🛍️', postedAt: '2 giờ trước', saved: false },
  { id: '2', title: 'Pha chế Barista', company: 'The Coffee House', location: 'Thanh Khê, Đà Nẵng', salary: '4–5tr/tháng', type: 'part-time', industry: 'Nhà hàng & Cà phê', match: 87, logo: '☕', postedAt: '5 giờ trước', saved: true },
  { id: '3', title: 'Marketing Intern', company: 'Startup XYZ', location: 'Sơn Trà, Đà Nẵng', salary: 'Thỏa thuận', type: 'full-time', industry: 'Marketing', match: 84, logo: '📣', postedAt: '1 ngày trước', saved: false },
  { id: '4', title: 'Nhân viên phục vụ', company: 'Nhà hàng DEF', location: 'Ngũ Hành Sơn', salary: '30k/giờ', type: 'shift', industry: 'Nhà hàng & Cà phê', match: 79, logo: '🍜', postedAt: '1 ngày trước', saved: false },
  { id: '5', title: 'Cộng tác viên bán hàng online', company: 'MNO Store', location: 'Làm remote', salary: 'Hoa hồng', type: 'flexible', industry: 'Bán hàng & Bán lẻ', match: 75, logo: '💻', postedAt: '2 ngày trước', saved: false },
  { id: '6', title: 'Nhân viên giao hàng', company: 'Giao Nhanh Co.', location: 'Toàn thành phố', salary: '200k/ngày', type: 'flexible', industry: 'Vận chuyển', match: 71, logo: '🛵', postedAt: '2 ngày trước', saved: false },
  { id: '7', title: 'Gia sư Toán', company: 'Trung tâm GPA', location: 'Liên Chiểu, Đà Nẵng', salary: '150k/buổi', type: 'part-time', industry: 'Giáo dục', match: 68, logo: '📚', postedAt: '3 ngày trước', saved: false },
  { id: '8', title: 'Nhân viên CSKH', company: 'Công ty ABC', location: 'Hải Châu, Đà Nẵng', salary: '7–9tr/tháng', type: 'full-time', industry: 'Chăm sóc khách hàng', match: 65, logo: '🎧', postedAt: '3 ngày trước', saved: false },
]

export default function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [keyword, setKeyword] = useState(searchParams.get('keyword') ?? '')
  const [filterOpen, setFilterOpen] = useState(false)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set(['2']))

  const selectedType = searchParams.get('type') ?? ''
  const selectedIndustry = searchParams.get('industry') ?? ''

  const filtered = mockJobs.filter((j) => {
    const matchKw = !keyword || j.title.toLowerCase().includes(keyword.toLowerCase()) || j.company.toLowerCase().includes(keyword.toLowerCase())
    const matchType = !selectedType || j.type === selectedType
    const matchIndustry = !selectedIndustry || j.industry === selectedIndustry
    return matchKw && matchType && matchIndustry
  })

  const toggleSave = (id: string) => {
    setSavedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const setFilter = (key: string, val: string) => {
    const p = new URLSearchParams(searchParams)
    if (val) p.set(key, val)
    else p.delete(key)
    setSearchParams(p)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 flex flex-col sm:flex-row gap-2 mb-6 shadow-sm">
        <div className="flex-1 flex items-center gap-2 px-2">
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm vị trí, kỹ năng, công ty..."
            className="flex-1 text-sm outline-none text-gray-800 placeholder:text-gray-400"
          />
        </div>
        <div className="flex items-center gap-2 sm:border-l border-gray-100 px-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Địa điểm..."
            className="text-sm outline-none text-gray-800 placeholder:text-gray-400 w-28"
          />
        </div>
        <button className="btn-primary text-sm px-5">Tìm kiếm</button>
      </div>

      <div className="flex gap-6">
        {/* Filter sidebar – desktop */}
        <aside className="hidden lg:block w-56 flex-shrink-0 space-y-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Hình thức</h3>
            <div className="space-y-1">
              <button
                onClick={() => setFilter('type', '')}
                className={cn('w-full text-left text-sm px-3 py-1.5 rounded-lg', !selectedType ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-600 hover:bg-gray-50')}
              >
                Tất cả
              </button>
              {JOB_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setFilter('type', t.value)}
                  className={cn('w-full text-left text-sm px-3 py-1.5 rounded-lg', selectedType === t.value ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-600 hover:bg-gray-50')}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-2">Ngành nghề</h3>
            <div className="space-y-1">
              <button
                onClick={() => setFilter('industry', '')}
                className={cn('w-full text-left text-sm px-3 py-1.5 rounded-lg', !selectedIndustry ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-600 hover:bg-gray-50')}
              >
                Tất cả
              </button>
              {INDUSTRIES.slice(0, 8).map((ind) => (
                <button
                  key={ind}
                  onClick={() => setFilter('industry', ind)}
                  className={cn('w-full text-left text-sm px-3 py-1.5 rounded-lg truncate', selectedIndustry === ind ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-600 hover:bg-gray-50')}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              Tìm thấy <span className="font-semibold text-gray-800">{filtered.length}</span> việc làm
            </p>
            <button
              onClick={() => setFilterOpen(true)}
              className="lg:hidden btn-secondary text-sm"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Lọc
            </button>
          </div>

          {/* Active filters */}
          {(selectedType || selectedIndustry) && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedType && (
                <span className="flex items-center gap-1 bg-primary-50 text-primary-600 text-xs px-3 py-1 rounded-full font-medium">
                  {JOB_TYPES.find((t) => t.value === selectedType)?.label}
                  <button onClick={() => setFilter('type', '')}><X className="w-3 h-3" /></button>
                </span>
              )}
              {selectedIndustry && (
                <span className="flex items-center gap-1 bg-primary-50 text-primary-600 text-xs px-3 py-1 rounded-full font-medium">
                  {selectedIndustry}
                  <button onClick={() => setFilter('industry', '')}><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
          )}

          {/* Job list */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="card p-12 text-center">
                <Filter className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Không tìm thấy việc làm phù hợp.</p>
                <button
                  onClick={() => { setKeyword(''); setSearchParams({}); }}
                  className="mt-3 text-sm text-primary-600 hover:underline"
                >
                  Xoá bộ lọc
                </button>
              </div>
            ) : (
              filtered.map((job) => (
                <div key={job.id} className="card p-5 hover:shadow-md transition-shadow flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl flex-shrink-0">
                    {job.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          to={`/viec-lam/${job.id}`}
                          className="font-semibold text-gray-900 hover:text-primary-600 transition-colors"
                        >
                          {job.title}
                        </Link>
                        <p className="text-sm text-gray-500">{job.company}</p>
                      </div>
                      <button
                        onClick={() => toggleSave(job.id)}
                        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-100"
                      >
                        <Bookmark
                          className={cn('w-4 h-4', savedIds.has(job.id) ? 'fill-primary-500 text-primary-500' : 'text-gray-400')}
                        />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.postedAt}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className="font-semibold text-gray-800 text-sm">{job.salary}</span>
                      <span className="badge-blue">{JOB_TYPES.find((t) => t.value === job.type)?.label}</span>
                      <span className={cn('badge', job.match >= 80 ? 'badge-green' : job.match >= 60 ? 'badge-yellow' : 'badge-gray')}>
                        {job.match}% phù hợp
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {filterOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
          <div className="flex-1 bg-black/40" onClick={() => setFilterOpen(false)} />
          <div className="w-72 bg-white h-full overflow-y-auto p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Bộ lọc</h3>
              <button onClick={() => setFilterOpen(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Hình thức</h4>
              {JOB_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => { setFilter('type', t.value); setFilterOpen(false); }}
                  className={cn('w-full text-left text-sm px-3 py-2 rounded-lg', selectedType === t.value ? 'bg-primary-50 text-primary-600 font-medium' : 'text-gray-600 hover:bg-gray-50')}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
