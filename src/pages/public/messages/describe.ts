import { COMPANY_PUBLIC_HREF, SEEKER_PUBLIC_HREF } from '@pages/public/personal/links'
import type { Side } from '@services/connectionService'
import { candidatesOf, companyOf, POSITIONS } from '../match/data'
import { findAnyJob } from '../jobs/lookup'

export interface ConversationInfo {
  name: string
  subtitle: string
  initials: string
  profileHref: string
  profileLabel: string
}

/** Chữ tắt trong vòng tròn: chữ cái đầu của hai từ đầu tiên */
const initialsOf = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')

/**
 * Tên + phụ đề hiển thị cho một cuộc trò chuyện, theo người xem:
 * người tìm việc thấy công ty + vị trí; doanh nghiệp thấy ứng viên + vị trí.
 */
export function describeConversation(viewer: Side, jobId: string, seekerId: string): ConversationInfo {
  if (viewer === 'seeker') {
    const job = findAnyJob(jobId)
    const name = job ? companyOf(job.companyId).name : 'Doanh nghiệp'
    return { name, subtitle: job?.title ?? 'Vị trí đã đóng', initials: initialsOf(name), profileHref: COMPANY_PUBLIC_HREF, profileLabel: 'Xem công ty' }
  }
  const position = POSITIONS.find((p) => p.id === jobId)
  const cand = candidatesOf(jobId).find((c) => c.id === seekerId)
  const name = cand?.name ?? 'Ứng viên'
  return { name, subtitle: position?.job.title ?? 'Vị trí đã đóng', initials: initialsOf(name), profileHref: SEEKER_PUBLIC_HREF, profileLabel: 'Xem hồ sơ' }
}
