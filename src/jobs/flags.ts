import type { SystemConfigDto } from '../catalog/catalog.types'

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()

/** Phần của tin cần để chấm cờ */
export interface FlagInput {
  title: string
  description: string
  skills: string[]
  slots: string[]
  salaryMaxK: number
}

/** Lý do tự gắn cờ cho một tin (rỗng = không có gì đáng ngờ) — bản server của `flagsOf` ở adminService */
export function flagsOf(job: FlagInput, config: Pick<SystemConfigDto, 'minWageK' | 'bannedWords'>): string[] {
  const flags: string[] = []
  if (job.salaryMaxK > 0 && job.salaryMaxK < config.minWageK) flags.push(`Lương thấp bất thường (dưới ${config.minWageK}.000đ/giờ)`)
  if (!job.skills.length) flags.push('Chưa nêu kỹ năng cần có')
  if (!job.slots.length) flags.push('Chưa nêu ca làm')
  if (!job.description.trim()) flags.push('Thiếu mô tả công việc')
  const text = norm([job.title, job.description].join(' '))
  const hits = config.bannedWords.filter((w) => w.trim() && text.includes(norm(w)))
  if (hits.length) flags.push(`Chứa từ cấm: ${hits.join(', ')}`)
  return flags
}
