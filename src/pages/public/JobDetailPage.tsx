import { Link } from 'react-router-dom'
import { MapPin, Clock, Briefcase, DollarSign, Users, Bookmark, Share2, ArrowLeft, CheckCircle, XCircle, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@utils/cn'

const mockJob = {
  id: '1',
  title: 'Nhân viên bán hàng',
  company: 'ABC Shop',
  logo: '🛍️',
  location: 'Hải Châu, Đà Nẵng',
  salary: '25.000 – 30.000đ/giờ',
  type: 'Part-time',
  quantity: 3,
  postedAt: '2 ngày trước',
  expiresAt: '30/11/2026',
  match: 92,
  description: `Chúng tôi đang tìm kiếm nhân viên bán hàng năng động, nhiệt tình để gia nhập đội ngũ tại cửa hàng ABC Shop tại Hải Châu, Đà Nẵng.

Công việc bao gồm: tư vấn và hỗ trợ khách hàng lựa chọn sản phẩm, sắp xếp và bổ sung hàng hóa trên kệ, thực hiện các giao dịch thanh toán, duy trì vệ sinh và trật tự khu vực bán hàng.`,
  requirements: {
    age: '18 – 30 tuổi',
    experience: 'Không yêu cầu kinh nghiệm',
    education: 'Tốt nghiệp THPT trở lên',
    skills: ['Giao tiếp tốt', 'Nhanh nhẹn', 'Chăm chỉ'],
  },
  schedule: 'Ca sáng 8h–12h, Ca chiều 13h–17h, Ca tối 17h–22h (chọn ít nhất 4 ca/tuần)',
  mandatory: ['Làm được ca tối', 'Làm ít nhất 4 buổi/tuần', 'Địa điểm ≤ 5km'],
  preferred: ['Có kinh nghiệm bán hàng', 'Giao tiếp tốt', 'Biết sử dụng Excel'],
  benefits: ['Lương giờ cạnh tranh', 'Thưởng hiệu suất hàng tháng', 'Được đào tạo bài bản', 'Môi trường trẻ trung, thân thiện'],
  companyInfo: {
    name: 'ABC Shop',
    description: 'Chuỗi cửa hàng thời trang & phụ kiện với 5 chi nhánh tại Đà Nẵng.',
    size: '11 – 50 nhân viên',
    industry: 'Bán lẻ',
  },
}

export default function JobDetailPage() {
  // TODO: đọc id từ useParams khi nối API (hiện dùng dữ liệu mẫu)
  const [saved, setSaved] = useState(false)
  const job = mockJob

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link to="/viec-lam" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" />
        Quay lại danh sách việc làm
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header card */}
          <div className="card p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center text-3xl flex-shrink-0">
                {job.logo}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
                <p className="text-gray-600">{job.company}</p>
                <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{job.location}</span>
                  <span className="flex items-center gap-1"><DollarSign className="w-4 h-4" />{job.salary}</span>
                  <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" />{job.type}</span>
                  <span className="flex items-center gap-1"><Users className="w-4 h-4" />{job.quantity} người</span>
                  <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{job.postedAt}</span>
                </div>
              </div>
            </div>

            {/* Match score */}
            <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-100 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-700">Bạn phù hợp {job.match}% với vị trí này</p>
                <div className="mt-1.5 bg-green-100 rounded-full h-1.5">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${job.match}%` }} />
                </div>
              </div>
              <button className="text-sm text-green-700 font-medium hover:underline flex-shrink-0">
                Phân tích AI
              </button>
            </div>

            <div className="flex gap-3 mt-4">
              <button className="btn-primary flex-1 justify-center">Ứng tuyển ngay</button>
              <button
                onClick={() => setSaved(!saved)}
                className={cn('btn-secondary px-3', saved && 'bg-primary-50 border-primary-300 text-primary-600')}
              >
                <Bookmark className={cn('w-4 h-4', saved && 'fill-primary-500')} />
              </button>
              <button className="btn-secondary px-3">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Mô tả công việc</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{job.description}</p>
          </div>

          {/* Requirements */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Yêu cầu</h2>
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div><span className="text-gray-400">Độ tuổi:</span> <span className="text-gray-700 font-medium">{job.requirements.age}</span></div>
              <div><span className="text-gray-400">Kinh nghiệm:</span> <span className="text-gray-700 font-medium">{job.requirements.experience}</span></div>
              <div><span className="text-gray-400">Trình độ:</span> <span className="text-gray-700 font-medium">{job.requirements.education}</span></div>
            </div>
            <div className="flex flex-wrap gap-2">
              {job.requirements.skills.map((s) => (
                <span key={s} className="badge-blue">{s}</span>
              ))}
            </div>
          </div>

          {/* Criteria */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Tiêu chí tuyển dụng</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-red-600 mb-2 flex items-center gap-1">
                  <XCircle className="w-4 h-4" /> Bắt buộc
                </p>
                <ul className="space-y-1">
                  {job.mandatory.map((c) => (
                    <li key={c} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium text-green-600 mb-2 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" /> Ưu tiên
                </p>
                <ul className="space-y-1">
                  {job.preferred.map((c) => (
                    <li key={c} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-2">Lịch làm việc</h2>
            <p className="text-sm text-gray-600">{job.schedule}</p>
          </div>

          {/* Benefits */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Quyền lợi</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {job.benefits.map((b) => (
                <li key={b} className="flex items-center gap-2 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Company info */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Về công ty</h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">
                {job.logo}
              </div>
              <div>
                <p className="font-medium text-gray-800">{job.companyInfo.name}</p>
                <p className="text-xs text-gray-500">{job.companyInfo.industry}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-3">{job.companyInfo.description}</p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>Quy mô: {job.companyInfo.size}</p>
            </div>
          </div>

          {/* Job info summary */}
          <div className="card p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">Thông tin chung</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Hạn nộp</span>
                <span className="font-medium text-gray-700">{job.expiresAt}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Số lượng</span>
                <span className="font-medium text-gray-700">{job.quantity} người</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Hình thức</span>
                <span className="font-medium text-gray-700">{job.type}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
