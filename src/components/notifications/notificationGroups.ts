import type { DemoNotification, Interview, Hire, Interest, Connection, Side } from '@context/connectionStore'
import type { CatalogJob } from '@context/catalogStore'

export type NotificationAction = { kind: 'interview'; interview: Interview } | { kind: 'offer'; hire: Hire } | { kind: 'application' }
export type NotificationEntry = { notification: DemoNotification; action?: NotificationAction }
type Input = { viewer: Side; notifications: DemoNotification[]; interviews: Interview[]; hires: Hire[]; interests: Interest[]; connections: Connection[]; jobs: Pick<CatalogJob, 'id' | 'visible' | 'expiresAt'>[]; now: number }

/** Đã đọc không đồng nghĩa đã xử lý; chỉ bản ghi hiện hành mới tạo thao tác. */
export function groupNotifications({ viewer, notifications, interviews, hires, interests, connections, jobs, now }: Input): { actions: NotificationEntry[]; updates: NotificationEntry[] } {
  const result = { actions: [] as NotificationEntry[], updates: [] as NotificationEntry[] }
  const seen = new Set<string>()
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(now))
  for (const notification of [...notifications].filter((n) => n.to === viewer).sort((a, b) => b.at.localeCompare(a.at))) {
    const samePair = (p: { jobId: string; seekerId: string }) => p.jobId === notification.jobId && p.seekerId === notification.seekerId
    const hire = hires.find(samePair)
    let action: NotificationAction | undefined
    if (viewer === 'seeker' && notification.kind === 'interview_invited' && !hire) {
      const interview = interviews.filter(samePair).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
      const slots = interview?.slots.filter((slot) => Date.parse(slot) > now) ?? []
      if (interview?.status === 'pending' && slots.length && Date.parse(notification.at) >= Date.parse(interview.createdAt)) {
        action = { kind: 'interview', interview: { ...interview, slots } }
      }
    }
    if (viewer === 'seeker' && notification.kind === 'offer' && hire?.status === 'offered' && (!hire.startDate || hire.startDate >= today) && Date.parse(notification.at) >= Date.parse(hire.at)) {
      action = { kind: 'offer', hire }
    }
    if (viewer === 'recruiter' && notification.kind === 'interest' && !hire && !connections.some(samePair)) {
      const interest = interests.find((i) => samePair(i) && i.from === 'seeker')
      const job = jobs.find((j) => j.id === notification.jobId)
      if (interest && !interest.viewedAt && !interest.consideringAt && job?.visible && (!job.expiresAt || Date.parse(job.expiresAt) > now) && Date.parse(notification.at) >= Date.parse(interest.at)) {
        action = { kind: 'application' }
      }
    }
    const key = `${notification.jobId}|${notification.seekerId}|${action?.kind}`
    if (action && !seen.has(key)) {
      seen.add(key)
      result.actions.push({ notification, action })
    } else result.updates.push({ notification })
  }
  return result
}
