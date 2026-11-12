// Chấm điểm phù hợp người tìm việc – tin tuyển dụng. Nguồn sự thật phía máy chủ (gợi ý, thông báo việc/ứng viên mới).
// GIỮ KHỚP với frontend/src/pages/public/match/score.ts (bản đó còn dùng cho xem trước khi soạn tin và trang mẫu cho khách).
// Mỗi tiêu chí chấm 0–1, nhân trọng số (tổng 100) rồi cộng thành phần trăm.
import type { JobType } from '@prisma/client'

export type CriterionKey = 'skills' | 'schedule' | 'salary' | 'distance' | 'jobType'
export type Weights = Record<CriterionKey, number>

export interface SeekerCriteria {
  skills: string[]
  /** Ô lịch rảnh "ngày-buổi" */
  slots: string[]
  /** Nghìn đồng/giờ */
  salaryMinK: number
  maxDistanceKm: number
  jobTypes: JobType[]
}

export interface JobRequirement {
  skills: string[]
  slots: string[]
  salaryMinK: number
  salaryMaxK: number
  jobType: JobType
  requiredSkills: string[]
  requireAllSlots: boolean
}

export interface CriterionResult {
  key: CriterionKey
  /** 0–1 */
  value: number
  ok: boolean
  note: string
}

export interface MatchOutcome {
  /** 0–100, đã làm tròn */
  score: number
  results: CriterionResult[]
  missingSkills: string[]
  /** Yêu cầu bắt buộc chưa đạt; có thì điểm bị chặn ở UNMET_SCORE_CAP */
  unmet: string[]
}

/** Thiếu yêu cầu bắt buộc → tối đa 39: dưới mức "có thể phù hợp" (40) */
export const UNMET_SCORE_CAP = 39
/** Từ mức này là "Rất phù hợp" — cũng là ngưỡng gửi thông báo việc/ứng viên mới */
export const STRONG_MATCH = 80

const norm = (s: string) => s.trim().toLowerCase()

export function scoreMatch(seeker: SeekerCriteria, job: JobRequirement, distanceKm: number, w: Weights): MatchOutcome {
  const have = new Set(seeker.skills.map(norm))
  const missingSkills = job.skills.filter((s) => !have.has(norm(s)))
  const skillHit = job.skills.length - missingSkills.length
  const skills = job.skills.length ? skillHit / job.skills.length : 1

  const free = new Set(seeker.slots)
  const slotHit = job.slots.filter((s) => free.has(s)).length
  const schedule = job.slots.length ? slotHit / job.slots.length : 1

  const salaryOk = job.salaryMaxK >= seeker.salaryMinK
  // Trong bán kính → đủ điểm; xa tới gấp đôi → nửa điểm; xa hơn → 0
  const distance = distanceKm <= seeker.maxDistanceKm ? 1 : distanceKm <= seeker.maxDistanceKm * 2 ? 0.5 : 0
  const jobTypeOk = seeker.jobTypes.includes(job.jobType)

  const results: CriterionResult[] = [
    { key: 'skills', value: skills, ok: missingSkills.length === 0, note: `${skillHit}/${job.skills.length} kỹ năng` },
    { key: 'schedule', value: schedule, ok: slotHit === job.slots.length, note: `Rảnh ${slotHit}/${job.slots.length} ca` },
    { key: 'salary', value: salaryOk ? 1 : 0, ok: salaryOk, note: salaryOk ? 'Lương' : 'Lương thấp hơn mong muốn' },
    { key: 'distance', value: distance, ok: distance === 1, note: distance === 1 ? `Cách ${distanceKm} km` : `Xa ${distanceKm} km` },
    { key: 'jobType', value: jobTypeOk ? 1 : 0, ok: jobTypeOk, note: jobTypeOk ? 'Loại việc' : 'Khác loại việc' },
  ]

  const missing = new Set(missingSkills.map(norm))
  const reqMissing = job.requiredSkills.filter((s) => missing.has(norm(s)))
  const slotsShort = job.requireAllSlots && slotHit < job.slots.length
  const unmet = [...reqMissing.map((s) => `Kỹ năng ${s}`), ...(slotsShort ? ['Rảnh đủ mọi ca'] : [])]
  if (reqMissing.length) results[0].note = `Thiếu bắt buộc: ${reqMissing.join(', ')}`
  if (slotsShort) results[1].note = `Cần rảnh đủ ${job.slots.length} ca`

  const raw = Math.round(results.reduce((sum, r) => sum + r.value * (w[r.key] ?? 0), 0))
  return { score: unmet.length ? Math.min(raw, UNMET_SCORE_CAP) : raw, results, missingSkills, unmet }
}
