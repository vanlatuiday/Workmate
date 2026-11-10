import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common'
import type { Prisma } from '@prisma/client'
import { MailService } from '../common/mail.service'
import { PrismaService } from '../prisma/prisma.service'
import { composeMail, digestCutoff, type MailItem } from './notification-mail'

const TICK_MS = 60_000
/** Bỏ qua thông báo cũ hơn mức này: máy chủ dừng lâu rồi chạy lại thì không gửi thư về chuyện đã qua */
const LOOKBACK_MS = 48 * 3_600_000
const BATCH = 500

const ROW = {
  id: true, userId: true, kind: true, seekerId: true,
  job: { select: { title: true, company: { select: { name: true } } } },
  user: { select: { email: true, settings: { select: { notify: true } } } },
} satisfies Prisma.NotificationSelect
type Row = Prisma.NotificationGetPayload<{ select: typeof ROW }>

/** Máy chủ thư từ chối hẳn địa chỉ này (hộp thư không tồn tại): thử lại cũng vô ích */
const recipientRejected = (e: unknown) =>
  ((e as { rejectedErrors?: { responseCode?: number }[] }).rejectedErrors ?? []).some((r) => (r.responseCode ?? 0) >= 500)

/**
 * Gửi email thông báo theo Cài đặt của từng người: `instant` trong vòng 1 phút, `daily` một thư lúc 8:00 giờ Việt Nam, `off` không gửi.
 * Chạy nền và đọc từ bảng Notification nên không làm chậm thao tác của người dùng, và khởi động lại không mất thư.
 * Thông báo đã đọc trên web không gửi nữa; loại đã tắt trong Cài đặt cũng không.
 */
@Injectable()
export class NotificationMailService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout
  private running = false

  constructor(private prisma: PrismaService, private mail: MailService) {}

  onModuleInit() {
    if (!this.mail.enabled) return
    this.timer = setInterval(() => void this.tick(), TICK_MS)
    this.timer.unref()
  }

  onModuleDestroy() {
    clearInterval(this.timer)
  }

  async tick(now = new Date()) {
    if (this.running) return
    this.running = true
    try {
      const cutoff = digestCutoff(now)
      // Thư tóm tắt chỉ gom thông báo trước mốc 8:00 gần nhất, nên mỗi người tối đa một thư mỗi ngày
      // và máy chủ có dừng đúng lúc 8:00 thì khi chạy lại vẫn gửi bù
      const healthy = await this.process({ settings: { emailDigest: 'instant' } }, { gte: new Date(now.getTime() - LOOKBACK_MS) }, now)
      if (healthy) await this.process({ OR: [{ settings: null }, { settings: { emailDigest: 'daily' } }] }, { gte: new Date(cutoff.getTime() - LOOKBACK_MS), lt: cutoff }, now)
    } catch (e) {
      console.warn('Không xử lý được email thông báo:', (e as Error).message)
    } finally {
      this.running = false
    }
  }

  /** Trả về false khi máy chủ thư đang lỗi, để lượt này dừng hẳn và phút sau thử lại */
  private async process(user: Prisma.UserWhereInput, at: Prisma.DateTimeFilter, now: Date): Promise<boolean> {
    const rows = await this.prisma.notification.findMany({
      where: { emailedAt: null, read: false, at, user: { status: 'active', ...user } },
      orderBy: { at: 'asc' },
      take: BATCH,
      select: ROW,
    })
    const byUser = new Map<string, Row[]>()
    for (const r of rows) byUser.set(r.userId, [...(byUser.get(r.userId) ?? []), r])

    for (const [userId, group] of byUser) {
      const ids = group.map((r) => r.id)
      // Giữ chỗ trước khi gửi: nếu chạy nhiều máy chủ thì chỉ một máy lấy được; loại đã tắt cũng được đánh dấu để không bị đọc lại mãi
      const { count } = await this.prisma.notification.updateMany({ where: { id: { in: ids }, emailedAt: null }, data: { emailedAt: now } })
      if (!count) continue
      const muted = (group[0].user.settings?.notify ?? {}) as Record<string, boolean>
      const items: MailItem[] = group
        .filter((r) => muted[r.kind] !== false)
        .map((r) => ({ kind: r.kind, side: r.userId === r.seekerId ? 'seeker' : 'recruiter', jobTitle: r.job.title, companyName: r.job.company.name }))
      if (!items.length) continue
      try {
        await this.mail.send(group[0].user.email, composeMail(items))
      } catch (e) {
        if (recipientRejected(e)) {
          console.warn(`Địa chỉ email của tài khoản ${userId} bị từ chối, bỏ qua thư này`)
          continue
        }
        await this.prisma.notification.updateMany({ where: { id: { in: ids } }, data: { emailedAt: null } })
        console.warn('Không gửi được email thông báo, sẽ thử lại sau:', (e as Error).message)
        return false
      }
    }
    return true
  }
}
