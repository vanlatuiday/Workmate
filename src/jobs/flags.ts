import type { SystemConfigDto } from '../catalog/catalog.types'

// Tự lọc tin đăng (2026-11-15, chủ dự án chốt):
// - Từ "cấm tuyệt đối" (config.bannedWords) → tự từ chối, báo rõ cụm từ cho nhà tuyển dụng.
// - Từ "đáng ngờ" (config.suspectWords) + các dấu hiệu dưới đây → giữ chờ admin, KHÔNG nói cho nhà tuyển dụng.
// - Không dính gì + mã số doanh nghiệp đang hoạt động → tự duyệt (quyết định ở JobsService).

/** Bỏ dấu, đ → d, chữ thường */
export const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
/** Chỉ còn chữ/số, cách nhau một khoảng trắng */
const wordsOf = (s: string) => norm(s).replace(/[^a-z0-9]+/g, ' ').trim()

/** Cụm ≥ 6 chữ cái so theo bản đã ép liền, bỏ hết khoảng trắng / dấu câu (bắt được "đ.ặ.t c.ọ.c", "d a t c o c", "datcoc");
    cụm ngắn so nguyên từ để không bắt nhầm ("cọc" ≠ "cọc tiêu") */
const MIN_SQUEEZE = 6

/** Chữ phủ định đứng trước cụm (cách tối đa 3 từ): "không thu phí hồ sơ", "miễn đặt cọc", "tuyệt đối không yêu cầu chuyển khoản trước" */
const NEGATION = '(?:khong|ko|k|mien|chang|cam|tranh)'
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Cụm từ trong `phrases` xuất hiện trong văn bản (trả cách viết gốc của cụm).
 * `negated`: cụm chỉ xuất hiện sau chữ phủ định — tin tử tế hay ghi "không thu phí hồ sơ", nên không coi là vi phạm chắc chắn.
 */
export function phraseHits(text: string, phrases: string[]): { hits: string[]; negated: string[] } {
  const words = ` ${wordsOf(text)} `
  const hits: string[] = []
  const negated: string[] = []
  const seen = new Set<string>()
  for (const p of phrases) {
    const pw = wordsOf(p)
    if (!pw || seen.has(pw)) continue
    seen.add(pw)
    const ps = pw.replace(/ /g, '')
    const inWords = words.includes(` ${pw} `)
    // Bỏ các lần xuất hiện có phủ định phía trước rồi xét lại phần còn lại
    const cleaned = inWords ? words.replace(new RegExp(` ${NEGATION}(?: [a-z0-9]+){0,3} ${escapeRe(pw)}(?= )`, 'g'), ' ') : words
    const remain = ps.length >= MIN_SQUEEZE ? cleaned.replace(/ /g, '').includes(ps) : cleaned.includes(` ${pw} `)
    if (remain) hits.push(p)
    else if (inWords) negated.push(p)
  }
  return { hits, negated }
}

/** Phần của tin cần để chấm */
export interface FlagInput {
  title: string
  description: string
  skills: string[]
  slots: string[]
  salaryMinK: number
  salaryMaxK: number
}

type Config = Pick<SystemConfigDto, 'minWageK' | 'bannedWords' | 'suspectWords'>

/** Lương theo giờ cao hơn mức này coi là bất thường (nghìn đồng) */
export const HIGH_WAGE_K = 150
/** Hứa thu nhập tháng từ mức này trở lên (triệu) coi là câu kéo */
const BIG_INCOME_MILLION = 15

export interface JobReview {
  /** Cụm từ cấm tuyệt đối tìm thấy → tự từ chối */
  banned: string[]
  /** Dấu hiệu đáng ngờ / thiếu sót → giữ cho admin (chỉ admin thấy) */
  signals: string[]
}

const PHONE = /(?:\+?84|\b0)(?:[\s.-]?\d){8,10}\b/
const CONTACT_WORDS = /\b(zalo|zl|telegram|viber|messenger|facebook|fb|whatsapp|wechat)\b/
const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]{2,}\.(com|vn|net|org|me|io|info|xyz|link|site)\b)/
const EMAIL = /[a-z0-9._%+-]+@[a-z0-9-]+\.[a-z.]{2,}/
/** "35k/giờ", "35 nghìn 1 giờ", "35.000đ/h" */
const HOURLY = /(\d{2,3})(?:[.,]000)?\s*(?:k|nghin|ngan|d|dong|vnd)?\s*(?:\/|mot|1)\s*(?:h|gio|tieng)\b/g
const MONTHLY_MILLION = /(\d{1,3})\s*(?:-\s*\d{1,3}\s*)?(?:tr|trieu)\b/g

/** Tỉ lệ chữ HOA trong các chữ cái (null nếu quá ít chữ để đánh giá) */
function upperRatio(s: string, minLetters: number): number | null {
  const letters = [...s].filter((c) => c.toLowerCase() !== c.toUpperCase())
  if (letters.length < minLetters) return null
  return letters.filter((c) => c === c.toUpperCase()).length / letters.length
}

/** Chấm một tin: cụm cấm tuyệt đối + dấu hiệu đáng ngờ */
export function reviewJob(job: FlagInput, config: Config): JobReview {
  const text = `${job.title}\n${job.description}`
  const bannedCheck = phraseHits(text, config.bannedWords)
  const banned = bannedCheck.hits
  const signals: string[] = []
  if (bannedCheck.negated.length) signals.push(`Nhắc tới cụm từ cấm kèm phủ định (cần xem): ${bannedCheck.negated.join(', ')}`)

  // Thiếu sót / lương thấp (đã có từ trước)
  if (job.salaryMaxK > 0 && job.salaryMaxK < config.minWageK) signals.push(`Lương thấp bất thường (dưới ${config.minWageK}.000đ/giờ)`)
  if (!job.skills.length) signals.push('Chưa nêu kỹ năng cần có')
  if (!job.slots.length) signals.push('Chưa nêu ca làm')
  if (!job.description.trim()) signals.push('Thiếu mô tả công việc')

  // Cụm từ đáng ngờ (đòi tiền / giấy tờ, lời hứa quá đà…) do admin quản lý
  const suspectCheck = phraseHits(text, config.suspectWords)
  const suspect = [...suspectCheck.hits, ...suspectCheck.negated]
  if (suspect.length) signals.push(`Có cụm từ đáng ngờ: ${suspect.join(', ')}`)

  // Kéo người dùng ra ngoài hệ thống tin nhắn
  const n = norm(text)
  const contact = [PHONE.test(n) && 'số điện thoại', CONTACT_WORDS.test(n) && 'Zalo/Telegram/mạng xã hội', LINK.test(n) && 'đường link', EMAIL.test(n) && 'email']
    .filter((x): x is string => !!x)
  if (contact.length) signals.push(`Có ${contact.join(', ')} trong tin (kéo người dùng ra ngoài)`)

  // Lương phi lý
  if (job.salaryMaxK > HIGH_WAGE_K) signals.push(`Lương cao bất thường (trên ${HIGH_WAGE_K}.000đ/giờ)`)
  if (job.salaryMaxK > 0) {
    const lo = job.salaryMinK * 0.8
    const hi = job.salaryMaxK * 1.2
    const odd = [...n.matchAll(HOURLY)].map((m) => Number(m[1])).filter((k) => k < lo || k > hi)
    if (odd.length) signals.push(`Lương trong mô tả (${odd[0]}.000đ/giờ) khác ô lương (${job.salaryMinK}–${job.salaryMaxK}.000đ/giờ)`)
  }
  const bigIncome = [...n.matchAll(MONTHLY_MILLION)].map((m) => Number(m[1])).find((v) => v >= BIG_INCOME_MILLION)
  if (bigIncome) signals.push(`Hứa thu nhập cao (${bigIncome} triệu)`)

  // Câu kéo: viết HOA, nhiều dấu chấm than
  const titleUpper = upperRatio(job.title, 10)
  const descUpper = upperRatio(job.description, 40)
  if ((titleUpper ?? 0) >= 0.7 || (descUpper ?? 0) >= 0.6) signals.push('Viết HOA gần như toàn bộ')
  if (/!{3,}/.test(text)) signals.push('Nhiều dấu chấm than liên tiếp')

  return { banned, signals }
}

/** Mọi lý do gắn cờ, cho admin xem (cụm cấm tuyệt đối đứng đầu) */
export function flagsOf(job: FlagInput, config: Config): string[] {
  const { banned, signals } = reviewJob(job, config)
  return [...(banned.length ? [`Chứa từ cấm: ${banned.join(', ')}`] : []), ...signals]
}
