import { candidateHref } from '@pages/public/personal/links'
import type { Side } from '@services/connectionService'
import { useConnectionStore, convKey } from '@context/connectionStore'
import { useCatalogStore } from '@context/catalogStore'
import { candidatesOf } from '../match/data'
import { findAnyJob } from '../jobs/lookup'

export interface ConversationInfo {
  name: string
  subtitle: string
  initials: string
  /** Logo công ty (phía người tìm việc) hoặc ảnh ứng viên nếu họ cho hiện */
  avatarUrl: string | null
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
  const conv = useConnectionStore.getState().conversations.find((c) => c.key === convKey(jobId, seekerId))
  const job = findAnyJob(jobId)
  const subtitle = conv?.jobTitle ?? job?.title ?? 'Vị trí đã đóng'
  if (viewer === 'seeker') {
    const companyId = conv?.peer.companyId ?? job?.companyId
    const name = conv?.peer.name ?? useCatalogStore.getState().companies.find((c) => c.id === companyId)?.name ?? 'Doanh nghiệp'
    return { name, subtitle, initials: initialsOf(name), avatarUrl: conv?.peer.avatarUrl ?? null, profileHref: companyId ? `/cong-ty/${companyId}` : '/cong-ty', profileLabel: 'Xem công ty' }
  }
  const name = conv?.peer.name ?? candidatesOf().find((c) => c.id === seekerId)?.name ?? 'Ứng viên'
  return { name, subtitle, initials: initialsOf(name), avatarUrl: conv?.peer.avatarUrl ?? null, profileHref: candidateHref(seekerId), profileLabel: 'Xem hồ sơ' }
}
