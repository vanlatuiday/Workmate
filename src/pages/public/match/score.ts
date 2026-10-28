// Cách tính điểm phù hợp cho trang /match — dùng chung cho cả hai phía.
// Mỗi tiêu chí chấm 0–1, nhân trọng số rồi cộng lại thành phần trăm.
// Đổi thứ tự ưu tiên = gán lại trọng số theo hạng (RANK_WEIGHTS) rồi tính lại.
import type { JobType } from '@/types'

export type CriterionKey = 'skills' | 'schedule' | 'salary' | 'distance' | 'jobType'

export const CRITERION_LABELS: Record<CriterionKey, string> = {
  skills: 'Kỹ năng',
  schedule: 'Lịch làm',
  salary: 'Mức lương',
  distance: 'Khoảng cách',
  jobType: 'Loại việc',
}

/** Thứ tự ưu tiên mặc định, quan trọng nhất trước */
export const DEFAULT_PRIORITY: CriterionKey[] = ['skills', 'schedule', 'salary', 'distance', 'jobType']

/**
 * Trọng số theo hạng (tổng 100). Hạng 3 nhỉnh hơn hạng 4 một chút
 * để đổi chỗ hai tiêu chí nào cũng làm danh sách thay đổi.
 */
export const RANK_WEIGHTS = [35, 25, 16, 14, 10] as const

export function weightsOf(priority: CriterionKey[]): Record<CriterionKey, number> {
  const w = {} as Record<CriterionKey, number>
  priority.forEach((k, i) => (w[k] = RANK_WEIGHTS[i] ?? 0))
  return w
}

/** Điều kiện của người tìm việc (hoặc yêu cầu của tin, nhìn từ phía ứng viên). */
export interface SeekerCriteria {
  skills: string[]
  /** Ca rảnh, khóa `${chỉ số ngày}-${chỉ số buổi}` như AVAILABILITY_DEFAULT */
  slots: string[]
  /** Lương tối thiểu mong muốn, nghìn đồng/giờ */
  salaryMinK: number
  maxDistanceKm: number
  jobTypes: JobType[]
}

/** Phần một vị trí tuyển dụng cần để chấm điểm. */
export interface JobRequirement {
  skills: string[]
  slots: string[]
  /** Khoảng lương quy ra nghìn đồng/giờ */
  salaryMinK: number
  salaryMaxK: number
  jobType: JobType
}

export interface CriterionResult {
  key: CriterionKey
  /** 0–1 */
  value: number
  ok: boolean
  /** Dòng giải thích ngắn trên thẻ, vd. "3/4 kỹ năng", "Thiếu: Pha chế" */
  note: string
}

export interface MatchOutcome {
  /** 0–100, đã làm tròn */
  score: number
  results: CriterionResult[]
  /** Kỹ năng yêu cầu mà bên kia chưa có */
  missingSkills: string[]
}

const norm = (s: string) => s.trim().toLowerCase()

/**
 * Chấm một cặp người tìm việc – vị trí.
 * `distanceKm` là khoảng cách từ nơi ở tới chỗ làm (dữ liệu mẫu cho sẵn).
 * `priority` chỉ người tìm việc chỉnh được; phía doanh nghiệp dùng mặc định.
 */
export function scoreMatch(
  seeker: SeekerCriteria,
  job: JobRequirement,
  distanceKm: number,
  priority: CriterionKey[] = DEFAULT_PRIORITY,
): MatchOutcome {
  const have = new Set(seeker.skills.map(norm))
  const missingSkills = job.skills.filter((s) => !have.has(norm(s)))
  const skillHit = job.skills.length - missingSkills.length
  const skills = job.skills.length ? skillHit / job.skills.length : 1

  const free = new Set(seeker.slots)
  const slotHit = job.slots.filter((s) => free.has(s)).length
  const schedule = job.slots.length ? slotHit / job.slots.length : 1

  // Khoảng lương giao nhau = mức cao nhất của tin chạm tới mức tối thiểu người tìm việc muốn
  const salaryOk = job.salaryMaxK >= seeker.salaryMinK

  // Trong bán kính → đủ điểm; xa tới gấp đôi → nửa điểm; xa hơn → 0
  const distance = distanceKm <= seeker.maxDistanceKm ? 1 : distanceKm <= seeker.maxDistanceKm * 2 ? 0.5 : 0

  const jobTypeOk = seeker.jobTypes.includes(job.jobType)

  const results: CriterionResult[] = [
    {
      key: 'skills',
      value: skills,
      ok: missingSkills.length === 0,
      note: `${skillHit}/${job.skills.length} kỹ năng`,
    },
    {
      key: 'schedule',
      value: schedule,
      ok: slotHit === job.slots.length,
      note: `Rảnh ${slotHit}/${job.slots.length} ca`,
    },
    { key: 'salary', value: salaryOk ? 1 : 0, ok: salaryOk, note: salaryOk ? 'Lương' : 'Lương thấp hơn mong muốn' },
    {
      key: 'distance',
      value: distance,
      ok: distance === 1,
      note: distance === 1 ? `Cách ${distanceKm} km` : `Xa ${distanceKm} km`,
    },
    { key: 'jobType', value: jobTypeOk ? 1 : 0, ok: jobTypeOk, note: jobTypeOk ? 'Loại việc' : 'Khác loại việc' },
  ]

  const w = weightsOf(priority)
  const score = Math.round(results.reduce((sum, r) => sum + r.value * w[r.key], 0))
  return { score, results, missingSkills }
}
