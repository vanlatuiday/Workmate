import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Loader2, CheckCircle } from 'lucide-react'
import { JOB_TYPES, SALARY_UNITS, INDUSTRIES, DAYS_OF_WEEK } from '@constants/index'
import { cn } from '@utils/cn'

const steps = ['Thông tin vị trí', 'Yêu cầu', 'Lịch & Lương', 'Tiêu chí']

export default function PostJob() {
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '',
    industry: '',
    description: '',
    quantity: 1,
    jobType: '',
    city: '',
    district: '',
    salaryMin: '',
    salaryMax: '',
    salaryUnit: 'hour',
    minAge: '',
    maxAge: '',
    experience: '',
    education: '',
    skills: [] as string[],
    skillInput: '',
    mandatory: [] as string[],
    mandatoryInput: '',
    preferred: [] as string[],
    preferredInput: '',
    schedule: {} as Record<string, { start: string; end: string }>,
  })

  const addSkill = () => {
    if (form.skillInput.trim()) {
      setForm({ ...form, skills: [...form.skills, form.skillInput.trim()], skillInput: '' })
    }
  }

  const addMandatory = () => {
    if (form.mandatoryInput.trim()) {
      setForm({ ...form, mandatory: [...form.mandatory, form.mandatoryInput.trim()], mandatoryInput: '' })
    }
  }

  const addPreferred = () => {
    if (form.preferredInput.trim()) {
      setForm({ ...form, preferred: [...form.preferred, form.preferredInput.trim()], preferredInput: '' })
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 1000))
    setSubmitting(false)
    setDone(true)
    setTimeout(() => navigate('/tuyen-dung/tin-dang'), 2000)
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Đăng tin thành công!</h2>
        <p className="text-gray-500">Tin tuyển dụng của bạn đang được xét duyệt.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Đăng tin tuyển dụng</h1>
        <p className="text-sm text-gray-500 mt-0.5">Điền đầy đủ thông tin để hệ thống Matching hoạt động chính xác.</p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
            <button
              onClick={() => i < step && setStep(i)}
              className={cn(
                'flex items-center gap-1.5 text-xs font-medium whitespace-nowrap',
                i === step ? 'text-primary-600' : i < step ? 'text-green-600' : 'text-gray-400',
              )}
            >
              <span className={cn(
                'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                i === step ? 'bg-primary-600 text-white' : i < step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500',
              )}>
                {i < step ? '✓' : i + 1}
              </span>
              <span className="hidden sm:inline">{s}</span>
            </button>
            {i < steps.length - 1 && <div className="flex-1 h-px bg-gray-200 min-w-4" />}
          </div>
        ))}
      </div>

      <div className="card p-6">
        {/* Step 0 – Basic info */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên vị trí <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="VD: Nhân viên bán hàng, Barista, Marketing Intern..."
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngành nghề <span className="text-red-500">*</span></label>
              <select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} className="input">
                <option value="">-- Chọn ngành --</option>
                {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng cần tuyển</label>
                <input
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hình thức <span className="text-red-500">*</span></label>
                <select value={form.jobType} onChange={(e) => setForm({ ...form, jobType: e.target.value })} className="input">
                  <option value="">-- Chọn --</option>
                  {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tỉnh/Thành phố</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="VD: Đà Nẵng"
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện</label>
                <input
                  type="text"
                  value={form.district}
                  onChange={(e) => setForm({ ...form, district: e.target.value })}
                  placeholder="VD: Hải Châu"
                  className="input"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả công việc</label>
              <textarea
                rows={5}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Mô tả chi tiết công việc, trách nhiệm..."
                className="input resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 1 – Requirements */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tuổi tối thiểu</label>
                <input type="number" value={form.minAge} onChange={(e) => setForm({ ...form, minAge: e.target.value })} placeholder="18" className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tuổi tối đa</label>
                <input type="number" value={form.maxAge} onChange={(e) => setForm({ ...form, maxAge: e.target.value })} placeholder="35" className="input" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kinh nghiệm</label>
              <input type="text" value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} placeholder="VD: Không yêu cầu / 1 năm kinh nghiệm bán hàng" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Trình độ học vấn</label>
              <input type="text" value={form.education} onChange={(e) => setForm({ ...form, education: e.target.value })} placeholder="VD: Tốt nghiệp THPT trở lên" className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kỹ năng yêu cầu</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={form.skillInput}
                  onChange={(e) => setForm({ ...form, skillInput: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  placeholder="Nhập kỹ năng rồi Enter..."
                  className="input flex-1"
                />
                <button type="button" onClick={addSkill} className="btn-secondary px-3"><Plus className="w-4 h-4" /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.skills.map((s) => (
                  <span key={s} className="flex items-center gap-1 badge-blue">
                    {s}
                    <button onClick={() => setForm({ ...form, skills: form.skills.filter((sk) => sk !== s) })}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2 – Schedule & Salary */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Mức lương</h3>
              <div className="grid grid-cols-3 gap-3">
                <input type="number" value={form.salaryMin} onChange={(e) => setForm({ ...form, salaryMin: e.target.value })} placeholder="Tối thiểu" className="input" />
                <input type="number" value={form.salaryMax} onChange={(e) => setForm({ ...form, salaryMax: e.target.value })} placeholder="Tối đa" className="input" />
                <select value={form.salaryUnit} onChange={(e) => setForm({ ...form, salaryUnit: e.target.value })} className="input">
                  {SALARY_UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Ca làm việc cần người</h3>
              <div className="space-y-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.value} className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id={day.value}
                      checked={!!form.schedule[day.value]}
                      onChange={(e) => {
                        const s = { ...form.schedule }
                        if (e.target.checked) s[day.value] = { start: '17:00', end: '22:00' }
                        else delete s[day.value]
                        setForm({ ...form, schedule: s })
                      }}
                      className="w-4 h-4 accent-primary-600"
                    />
                    <label htmlFor={day.value} className="text-sm text-gray-700 w-16">{day.label}</label>
                    {form.schedule[day.value] && (
                      <>
                        <input
                          type="time"
                          value={form.schedule[day.value].start}
                          onChange={(e) => setForm({ ...form, schedule: { ...form.schedule, [day.value]: { ...form.schedule[day.value], start: e.target.value } } })}
                          className="input w-28 text-xs"
                        />
                        <span className="text-gray-400 text-sm">–</span>
                        <input
                          type="time"
                          value={form.schedule[day.value].end}
                          onChange={(e) => setForm({ ...form, schedule: { ...form.schedule, [day.value]: { ...form.schedule[day.value], end: e.target.value } } })}
                          className="input w-28 text-xs"
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3 – Criteria */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-red-600 mb-2">Tiêu chí bắt buộc</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={form.mandatoryInput}
                  onChange={(e) => setForm({ ...form, mandatoryInput: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMandatory())}
                  placeholder="VD: Làm được ca tối, Địa điểm ≤ 5km..."
                  className="input flex-1"
                />
                <button type="button" onClick={addMandatory} className="btn-secondary px-3"><Plus className="w-4 h-4" /></button>
              </div>
              <ul className="space-y-1">
                {form.mandatory.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-sm bg-red-50 text-red-700 px-3 py-1.5 rounded-lg">
                    <span className="flex-1">{c}</span>
                    <button onClick={() => setForm({ ...form, mandatory: form.mandatory.filter((m) => m !== c) })}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <label className="block text-sm font-medium text-green-600 mb-2">Tiêu chí ưu tiên</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={form.preferredInput}
                  onChange={(e) => setForm({ ...form, preferredInput: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addPreferred())}
                  placeholder="VD: Có kinh nghiệm, Giao tiếp tốt..."
                  className="input flex-1"
                />
                <button type="button" onClick={addPreferred} className="btn-secondary px-3"><Plus className="w-4 h-4" /></button>
              </div>
              <ul className="space-y-1">
                {form.preferred.map((c) => (
                  <li key={c} className="flex items-center gap-2 text-sm bg-green-50 text-green-700 px-3 py-1.5 rounded-lg">
                    <span className="flex-1">{c}</span>
                    <button onClick={() => setForm({ ...form, preferred: form.preferred.filter((p) => p !== c) })}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="btn-secondary disabled:opacity-50"
        >
          Quay lại
        </button>
        {step < steps.length - 1 ? (
          <button onClick={() => setStep(step + 1)} className="btn-primary">
            Tiếp theo
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Đang đăng...' : 'Đăng tin tuyển dụng'}
          </button>
        )}
      </div>
    </div>
  )
}
