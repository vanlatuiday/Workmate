import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import type { Message, Notification, NotificationKind, Prisma, Side } from '@prisma/client'
import type { AuthUser } from '../auth/current-user.decorator'
import { PrismaService } from '../prisma/prisma.service'
import { RealtimeGateway } from './realtime.gateway'

export type Tx = Prisma.TransactionClient

export const sideOf = (user: AuthUser): Side => (user.role === 'jobseeker' ? 'seeker' : 'recruiter')
export const otherSide = (side: Side): Side => (side === 'seeker' ? 'recruiter' : 'seeker')

export const messageView = (m: Message) => ({
  id: m.id, jobId: m.jobId, seekerId: m.seekerId, from: m.from, text: m.text, at: m.at.toISOString(), ...(m.system ? { system: true } : {}),
})

/** Thay đổi đi kèm một thao tác trên cặp: ghi trong cùng giao dịch, đẩy qua socket sau khi commit */
export class PairEffects {
  readonly at = new Date()
  readonly notifications: Notification[] = []
  readonly messages: Message[] = []

  constructor(private tx: Tx, private jobId: string, private seekerId: string) {}

  /** Báo cho một phía; phía doanh nghiệp = mọi thành viên của công ty sở hữu tin */
  async notify(to: Side, kind: NotificationKind) {
    const { jobId, seekerId, at } = this
    const userIds = to === 'seeker'
      ? [seekerId]
      : (await this.tx.companyMember.findMany({ where: { company: { jobs: { some: { id: jobId } } } }, select: { userId: true } })).map((m) => m.userId)
    if (!userIds.length) return
    const rows = await this.tx.notification.createManyAndReturn({ data: userIds.map((userId) => ({ userId, kind, jobId, seekerId, at })) })
    this.notifications.push(...rows)
  }

  /** Dòng hệ thống giữa khung chat */
  async system(from: Side, text: string) {
    const { jobId, seekerId, at } = this
    this.messages.push(await this.tx.message.create({ data: { jobId, seekerId, from, text, system: true, at } }))
  }

  addMessage(m: Message) {
    this.messages.push(m)
  }
}

/** Dùng chung cho mọi thao tác trên cặp (tin, người tìm việc): phân quyền, khóa, đẩy sự kiện */
@Injectable()
export class PairService {
  constructor(private prisma: PrismaService, private realtime: RealtimeGateway) {}

  /** Điều kiện lọc "các cặp của tôi" */
  scope(user: AuthUser): { seekerId: string } | { job: Prisma.JobWhereInput } {
    return user.role === 'jobseeker'
      ? { seekerId: user.id }
      : { job: { company: { members: { some: { userId: user.id } } } } }
  }

  /**
   * Cặp này có thuộc về tôi không; không thuộc → 404 (không tiết lộ là có tồn tại).
   * `act` = sắp thay đổi dữ liệu: công ty bị khóa thì không được hành động.
   */
  async access(user: AuthUser, jobId: string, seekerId: string, act = false) {
    if (user.role === 'jobseeker' && user.id !== seekerId) throw new NotFoundException('Không tìm thấy')
    const job = await this.prisma.job.findFirst({
      where: { id: jobId, ...(user.role === 'recruiter' ? { company: { members: { some: { userId: user.id } } } } : {}) },
      select: { company: { select: { locked: true } } },
    })
    if (!job) throw new NotFoundException('Không tìm thấy')
    if (act && user.role === 'recruiter' && job.company.locked) throw new ForbiddenException('Doanh nghiệp đang bị khóa')
  }

  async assertConnected(tx: Tx, jobId: string, seekerId: string) {
    const conn = await tx.connection.findUnique({ where: { jobId_seekerId: { jobId, seekerId } }, select: { jobId: true } })
    if (!conn) throw new ConflictException('Hai bên chưa kết nối')
  }

  /** Doanh nghiệp chỉ được chủ động tiếp cận hồ sơ đã công khai, cho phép hiển thị, tài khoản còn hoạt động */
  async assertDiscoverable(db: Tx, seekerId: string) {
    const s = await db.seekerProfile.findUnique({
      where: { userId: seekerId },
      select: { published: true, user: { select: { status: true, settings: { select: { visibility: true } } } } },
    })
    const visibility = s?.user.settings?.visibility ?? 'public'
    if (!s || !s.published || s.user.status !== 'active' || visibility !== 'public') throw new NotFoundException('Không tìm thấy ứng viên')
  }

  /**
   * Chạy thao tác trong giao dịch, giữ khóa theo cặp để hai phía bấm cùng lúc không bị lệch
   * (vd. cùng quan tâm mà không ai thấy ai nên mất kết nối). Commit xong mới đẩy socket.
   */
  async inPair<T>(jobId: string, seekerId: string, fn: (tx: Tx, fx: PairEffects) => Promise<T>): Promise<T> {
    let fx!: PairEffects
    const result = await this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`${jobId}|${seekerId}`}, 0))`
      fx = new PairEffects(tx, jobId, seekerId)
      return fn(tx, fx)
    })
    // Đẩy socket chỉ là phần phụ: dữ liệu đã lưu rồi nên lỗi ở đây không được làm hỏng phản hồi
    await this.publish(jobId, seekerId, fx).catch((e) => console.warn('Không đẩy được sự kiện:', (e as Error).message))
    return result
  }

  private async publish(jobId: string, seekerId: string, fx: PairEffects) {
    const members = await this.prisma.companyMember.findMany({ where: { company: { jobs: { some: { id: jobId } } } }, select: { userId: true } })
    const both = [seekerId, ...members.map((m) => m.userId)]
    for (const m of fx.messages) this.realtime.toUsers(both, 'message:new', messageView(m))

    if (fx.notifications.length) {
      const settings = await this.prisma.userSettings.findMany({
        where: { userId: { in: fx.notifications.map((n) => n.userId) } }, select: { userId: true, notify: true },
      })
      const prefs = new Map(settings.map((s) => [s.userId, s.notify as Record<string, boolean>]))
      for (const n of fx.notifications) {
        if (prefs.get(n.userId)?.[n.kind] === false) continue
        this.realtime.toUsers([n.userId], 'notification:new', {
          id: n.id, to: n.userId === seekerId ? 'seeker' : 'recruiter', kind: n.kind, jobId: n.jobId, seekerId: n.seekerId, at: n.at.toISOString(), read: n.read,
        })
      }
    }
    this.realtime.toUsers(both, 'pair:changed', { jobId, seekerId })
  }
}
