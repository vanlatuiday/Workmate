// Tính toán cho trang cá nhân: mức độ phù hợp, mức hoàn thiện, kiểm tra dữ liệu.
// Hàm thuần — nhận dữ liệu hai bên, trả kết quả; không viết cứng kết quả nào.
import {
  WORK_MODE_LABELS,
  type CompanyPosition,
  type CompanyProfile,
  type SeekerProfile,
} from './model'

// ─── Mức độ phù hợp ─────────────────────────────────────────────────────────

/** Trọng số các tiêu chí (tổng 100) */
const WEIGHTS = { skills: 55, salary: 20, mode: 15, location: 10 } as const

const norm = (s: string) => s.trim().toLowerCase()

export type CriterionResult = {
  key: keyof typeof WEIGHTS
  /** null = không đủ dữ liệu (vd. ứng viên ẩn mức lương) → không tính vào điểm */
  ok: boolean | null
  text: string
}

export type PositionMatch = {
  position: CompanyPosition
  /** 0–100, đã làm tròn */
  score: number
  matchedSkills: string[]
  missingSkills: string[]
  criteria: CriterionResult[]
}

/**
 * So một ứng viên với một vị trí.
 * `salaryVisible = false` (ứng viên ẩn lương với người xem) → bỏ tiêu chí lương khỏi điểm.
 */
export function matchPosition(seeker: SeekerProfile, position: CompanyPosition, salaryVisible = true): PositionMatch {
  const own = new Set(seeker.skills.map((s) => norm(s.name)))
  const matchedSkills = position.skills.filter((s) => own.has(norm(s)))
  const missingSkills = position.skills.filter((s) => !own.has(norm(s)))
  const skillRatio = position.skills.length ? matchedSkills.length / position.skills.length : 0

  const { salaryMin, salaryMax, modes, locations } = seeker.wishes
  // Hai khoảng lương giao nhau
  const salaryOk = salaryVisible ? position.salaryMin <= salaryMax && salaryMin <= position.salaryMax : null
  const modeOk = modes.includes(position.mode)
  const locationOk =
    position.mode === 'remote' || locations.some((l) => norm(l) === norm(position.location))

  const criteria: CriterionResult[] = [
    {
      key: 'skills',
      ok: skillRatio >= 0.6,
      text: `Khớp ${matchedSkills.length}/${position.skills.length} kỹ năng`,
    },
    {
      key: 'salary',
      ok: salaryOk,
      text:
        salaryOk === null
          ? 'Mức lương mong muốn đang ẩn'
          : salaryOk
            ? 'Mức lương nằm trong khoảng mong muốn'
            : 'Mức lương lệch khoảng mong muốn',
    },
    {
      key: 'mode',
      ok: modeOk,
      text: modeOk
        ? `Có hình thức ${WORK_MODE_LABELS[position.mode].toLowerCase()} như mong muốn`
        : `Hình thức ${WORK_MODE_LABELS[position.mode].toLowerCase()} chưa nằm trong mong muốn`,
    },
    {
      key: 'location',
      ok: locationOk,
      text: locationOk ? 'Địa điểm phù hợp' : `Làm tại ${position.location}, ngoài nơi mong muốn`,
    },
  ]

  let earned = 0
  let total = 0
  for (const c of criteria) {
    if (c.ok === null) continue
    const w = WEIGHTS[c.key]
    total += w
    if (c.key === 'skills') earned += w * skillRatio
    else if (c.ok) earned += w
  }

  return {
    position,
    score: total ? Math.round((earned / total) * 100) : 0,
    matchedSkills,
    missingSkills,
    criteria,
  }
}

/** So ứng viên với mọi vị trí của công ty, cao nhất lên đầu. */
export function matchCompany(seeker: SeekerProfile, company: CompanyProfile, salaryVisible = true) {
  return company.positions
    .map((p) => matchPosition(seeker, p, salaryVisible))
    .sort((a, b) => b.score - a.score)
}

// ─── Mức hoàn thiện hồ sơ ──────────────────────────────────────────────────

/** `cell` là id ô bento cần mở khi bấm gợi ý */
export type CompletionCheck = { key: string; label: string; cell: string; done: boolean }

export function seekerCompletion(p: SeekerProfile): CompletionCheck[] {
  return [
    { key: 'name', label: 'Họ tên', cell: 'core', done: !!p.name.trim() },
    { key: 'title', label: 'Vị trí mong muốn', cell: 'core', done: !!p.title.trim() },
    { key: 'bio', label: 'Câu giới thiệu', cell: 'core', done: !!p.bio.trim() },
    { key: 'skills', label: 'Ít nhất 3 kỹ năng', cell: 'skills', done: p.skills.length >= 3 },
    { key: 'experience', label: 'Kinh nghiệm làm việc', cell: 'experience', done: p.experience.length > 0 },
    { key: 'wishes', label: 'Mong muốn về lương và hình thức', cell: 'wishes', done: p.wishes.modes.length > 0 && p.wishes.salaryMax > 0 },
    { key: 'projects', label: 'Dự án tiêu biểu', cell: 'projects', done: p.projects.length > 0 },
    { key: 'education', label: 'Học vấn', cell: 'education', done: p.education.length > 0 },
    { key: 'certificates', label: 'Chứng chỉ', cell: 'education', done: p.certificates.length > 0 },
    { key: 'contact', label: 'Email và số điện thoại', cell: 'contact', done: !!p.contact.email.trim() && !!p.contact.phone.trim() },
  ]
}

export function companyCompletion(c: CompanyProfile): CompletionCheck[] {
  return [
    { key: 'name', label: 'Tên công ty', cell: 'core', done: !!c.name.trim() },
    { key: 'mission', label: 'Câu sứ mệnh', cell: 'core', done: !!c.mission.trim() },
    { key: 'positions', label: 'Ít nhất 1 vị trí đang tuyển', cell: 'positions', done: c.positions.length > 0 },
    { key: 'culture', label: 'Ít nhất 2 điều về văn hóa', cell: 'culture', done: c.culture.length >= 2 },
    { key: 'benefits', label: 'Ít nhất 3 phúc lợi', cell: 'benefits', done: c.benefits.length >= 3 },
    { key: 'day', label: 'Một ngày làm việc (3 mốc trở lên)', cell: 'day', done: c.day.length >= 3 },
    { key: 'address', label: 'Địa chỉ văn phòng', cell: 'contact', done: !!c.address.trim() },
    { key: 'contact', label: 'Email liên hệ', cell: 'contact', done: !!c.contact.email.trim() },
  ]
}

export const completionPercent = (checks: CompletionCheck[]) =>
  checks.length ? Math.round((checks.filter((c) => c.done).length / checks.length) * 100) : 0

// ─── Kiểm tra dữ liệu khi lưu ──────────────────────────────────────────────

/** Lỗi theo tên trường; rỗng = hợp lệ */
export type FieldErrors = Record<string, string>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const validate = {
  required(errors: FieldErrors, field: string, value: string, label: string) {
    if (!value.trim()) errors[field] = `${label} không được để trống`
  },
  email(errors: FieldErrors, field: string, value: string) {
    if (value.trim() && !EMAIL_RE.test(value.trim())) errors[field] = 'Email chưa đúng định dạng'
  },
  salaryRange(errors: FieldErrors, min: number, max: number) {
    if (!Number.isFinite(min) || min < 0) errors.salaryMin = 'Lương tối thiểu phải là số không âm'
    else if (!Number.isFinite(max) || max <= 0) errors.salaryMax = 'Lương tối đa phải lớn hơn 0'
    else if (min > max) errors.salaryMin = 'Lương tối thiểu không được lớn hơn lương tối đa'
  },
}

// ─── Định dạng ─────────────────────────────────────────────────────────────

export const formatSalary = (min: number, max: number) => `${min}–${max} triệu/tháng`

/** "2024-03" → "03/2024" */
export const formatMonth = (ym?: string) => (ym ? ym.split('-').reverse().join('/') : 'Hiện tại')

/** "2026-12-01" → "01/12/2026" */
export const formatDate = (ymd: string) => ymd.split('-').reverse().join('/')

/** Id mới cho mục thêm vào danh sách */
export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
