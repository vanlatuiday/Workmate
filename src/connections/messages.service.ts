import { Injectable } from '@nestjs/common'
import { Prisma, type Message } from '@prisma/client'
import type { AuthUser } from '../auth/current-user.decorator'
import { PrismaService } from '../prisma/prisma.service'
import { messageView, otherSide, PairService, sideOf } from './pair.service'

const PAGE_MAX = 100
const pairKey = (jobId: string, seekerId: string) => `${jobId}|${seekerId}`

/** Tin nhắn — chỉ giữa hai bên đã kết nối */
@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService, private pairs: PairService) {}

  /** Các cuộc trò chuyện của tôi kèm tin cuối + số chưa đọc, mới hoạt động nhất trước */
  async conversations(user: AuthUser) {
    const side = sideOf(user)
    const connections = await this.prisma.connection.findMany({
      where: this.pairs.scope(user),
      include: {
        job: { select: { title: true, companyId: true, company: { select: { name: true, logoUrl: true } } } },
        seeker: { select: { fullName: true, avatarUrl: true, showAvatar: true } },
      },
    })
    const mine = side === 'seeker'
      ? Prisma.sql`m."seekerId" = ${user.id}`
      : Prisma.sql`m."jobId" IN (SELECT j."id" FROM "Job" j JOIN "CompanyMember" cm ON cm."companyId" = j."companyId" WHERE cm."userId" = ${user.id})`
    const [lasts, unreads] = await Promise.all([
      this.prisma.$queryRaw<Message[]>`
        SELECT DISTINCT ON (m."jobId", m."seekerId") m.* FROM "Message" m
        WHERE ${mine} ORDER BY m."jobId", m."seekerId", m."at" DESC, m."id" DESC`,
      this.prisma.$queryRaw<{ jobId: string; seekerId: string; unread: number }[]>`
        SELECT m."jobId", m."seekerId", COUNT(*)::int AS unread FROM "Message" m
        LEFT JOIN "ConversationRead" r ON r."userId" = ${user.id} AND r."jobId" = m."jobId" AND r."seekerId" = m."seekerId"
        WHERE ${mine} AND m."from" = ${otherSide(side)}::"Side" AND (r."lastRead" IS NULL OR m."at" > r."lastRead")
        GROUP BY m."jobId", m."seekerId"`,
    ])
    const lastOf = new Map(lasts.map((m) => [pairKey(m.jobId, m.seekerId), m]))
    const unreadOf = new Map(unreads.map((u) => [pairKey(u.jobId, u.seekerId), u.unread]))

    return connections
      .map((c) => {
        const key = pairKey(c.jobId, c.seekerId)
        const last = lastOf.get(key)
        return {
          key, jobId: c.jobId, seekerId: c.seekerId, at: c.at.toISOString(), jobTitle: c.job.title,
          // Phía kia của cuộc trò chuyện; ảnh ứng viên chỉ gửi khi họ cho phép doanh nghiệp thấy
          peer: side === 'seeker'
            ? { name: c.job.company.name, avatarUrl: c.job.company.logoUrl, companyId: c.job.companyId }
            : { name: c.seeker.fullName, avatarUrl: c.seeker.showAvatar ? c.seeker.avatarUrl : null },
          ...(last ? { last: messageView(last) } : {}),
          unread: unreadOf.get(key) ?? 0,
        }
      })
      .sort((a, b) => (b.last?.at ?? b.at).localeCompare(a.last?.at ?? a.at))
  }

  /** Một trang tin nhắn, cũ trước mới sau; `before` = id tin cũ nhất đang có để tải tiếp */
  async list(user: AuthUser, jobId: string, seekerId: string, before?: string, limit = 50) {
    await this.pairs.access(user, jobId, seekerId)
    const take = Math.min(Math.max(Math.trunc(limit) || 50, 1), PAGE_MAX)
    const rows = await this.prisma.message.findMany({
      where: { jobId, seekerId },
      orderBy: [{ at: 'desc' }, { id: 'desc' }],
      take,
      ...(before ? { cursor: { id: before }, skip: 1 } : {}),
    })
    return rows.reverse().map(messageView)
  }

  async send(user: AuthUser, jobId: string, seekerId: string, text: string) {
    await this.pairs.access(user, jobId, seekerId, true)
    return this.pairs.inPair(jobId, seekerId, async (tx, fx) => {
      await this.pairs.assertConnected(tx, jobId, seekerId)
      const m = await tx.message.create({ data: { jobId, seekerId, from: sideOf(user), text, at: fx.at } })
      fx.addMessage(m)
      // Tin của chính mình coi như đã đọc
      await tx.conversationRead.upsert({
        where: { userId_jobId_seekerId: { userId: user.id, jobId, seekerId } },
        create: { userId: user.id, jobId, seekerId, lastRead: fx.at },
        update: { lastRead: fx.at },
      })
      return messageView(m)
    })
  }

  async markRead(user: AuthUser, jobId: string, seekerId: string) {
    await this.pairs.access(user, jobId, seekerId)
    const lastRead = new Date()
    await this.prisma.conversationRead.upsert({
      where: { userId_jobId_seekerId: { userId: user.id, jobId, seekerId } },
      create: { userId: user.id, jobId, seekerId, lastRead },
      update: { lastRead },
    })
    return { lastRead: lastRead.toISOString() }
  }
}
