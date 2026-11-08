import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import type { MarkKind } from '@prisma/client'
import type { AuthUser } from '../auth/current-user.decorator'
import { VISIBLE_WHERE } from '../catalog/catalog.service'
import { PrismaService } from '../prisma/prisma.service'
import { otherSide, PairService, sideOf } from './pair.service'

/** Quan tâm → kết nối, cùng phần lưu tin / đánh dấu ứng viên */
@Injectable()
export class ConnectionsService {
  constructor(private prisma: PrismaService, private pairs: PairService) {}

  /** Mọi quan tâm và kết nối của tôi — frontend tự suy ra trạng thái từng cặp từ đây */
  async state(user: AuthUser) {
    const where = this.pairs.scope(user)
    const [interests, connections] = await Promise.all([
      this.prisma.interest.findMany({ where, orderBy: { at: 'desc' } }),
      this.prisma.connection.findMany({ where, orderBy: { at: 'desc' } }),
    ])
    return {
      interests: interests.map((i) => ({ from: i.from, jobId: i.jobId, seekerId: i.seekerId, at: i.at.toISOString() })),
      connections: connections.map((c) => ({ jobId: c.jobId, seekerId: c.seekerId, at: c.at.toISOString() })),
    }
  }

  /** Bày tỏ quan tâm; bấm lại không có tác dụng. Hai bên cùng quan tâm → tạo kết nối + báo cả hai phía */
  async express(user: AuthUser, jobId: string, seekerId: string) {
    const side = sideOf(user)
    const other = otherSide(side)
    await this.pairs.access(user, jobId, seekerId, true)
    return this.pairs.inPair(jobId, seekerId, async (tx, fx) => {
      const [conn, interests] = await Promise.all([
        tx.connection.findUnique({ where: { jobId_seekerId: { jobId, seekerId } }, select: { jobId: true } }),
        tx.interest.findMany({ where: { jobId, seekerId }, select: { from: true } }),
      ])
      if (conn) return { status: 'connected' as const }
      if (interests.some((i) => i.from === side)) return { status: 'sent' as const }

      const open = await tx.job.findFirst({ where: { id: jobId, ...VISIBLE_WHERE }, select: { id: true } })
      if (!open) throw new ConflictException('Tin này hiện không tuyển')
      const mutual = interests.some((i) => i.from === other)
      // Ứng viên đã ứng tuyển thì doanh nghiệp luôn đáp lại được, kể cả khi hồ sơ không công khai
      if (side === 'recruiter' && !mutual) await this.pairs.assertDiscoverable(tx, seekerId)

      await tx.interest.create({ data: { jobId, seekerId, from: side, at: fx.at } })
      if (!mutual) {
        await fx.notify(other, 'interest')
        return { status: 'sent' as const }
      }
      await tx.connection.create({ data: { jobId, seekerId, at: fx.at } })
      await fx.notify('seeker', 'connected')
      await fx.notify('recruiter', 'connected')
      return { status: 'connected' as const }
    })
  }

  /** Rút quan tâm của phía mình — không rút được khi đã kết nối */
  async withdraw(user: AuthUser, jobId: string, seekerId: string) {
    await this.pairs.access(user, jobId, seekerId, true)
    return this.pairs.inPair(jobId, seekerId, async (tx) => {
      const conn = await tx.connection.findUnique({ where: { jobId_seekerId: { jobId, seekerId } }, select: { jobId: true } })
      if (conn) throw new ConflictException('Đã kết nối nên không rút quan tâm được')
      await tx.interest.deleteMany({ where: { jobId, seekerId, from: sideOf(user) } })
      const theirs = await tx.interest.count({ where: { jobId, seekerId } })
      return { status: theirs ? ('received' as const) : ('none' as const) }
    })
  }

  // ─── Tin đã lưu (người tìm việc) ─────────────────────────────────────────

  async savedJobs(seekerId: string) {
    const rows = await this.prisma.savedJob.findMany({ where: { seekerId }, orderBy: { at: 'desc' } })
    return rows.map((r) => ({ jobId: r.jobId, at: r.at.toISOString() }))
  }

  /** Chỉ lưu được tin đang hiển thị; bấm lại không có tác dụng */
  async saveJob(seekerId: string, jobId: string) {
    const job = await this.prisma.job.findFirst({ where: { id: jobId, ...VISIBLE_WHERE }, select: { id: true } })
    if (!job) throw new NotFoundException('Không tìm thấy tin tuyển dụng')
    await this.prisma.savedJob.createMany({ data: [{ seekerId, jobId }], skipDuplicates: true })
    return this.savedJobs(seekerId)
  }

  async unsaveJob(seekerId: string, jobId: string) {
    await this.prisma.savedJob.deleteMany({ where: { seekerId, jobId } })
    return this.savedJobs(seekerId)
  }

  // ─── Lưu / bỏ qua ứng viên theo từng tin (doanh nghiệp) ──────────────────

  async marks(user: AuthUser) {
    const rows = await this.prisma.candidateMark.findMany({ where: this.pairs.scope(user) as { job: object }, orderBy: { at: 'desc' } })
    return rows.map((r) => ({ jobId: r.jobId, seekerId: r.seekerId, kind: r.kind, at: r.at.toISOString() }))
  }

  async setMark(user: AuthUser, jobId: string, seekerId: string, kind: MarkKind) {
    await this.pairs.access(user, jobId, seekerId, true)
    await this.pairs.assertDiscoverable(this.prisma, seekerId)
    await this.prisma.candidateMark.createMany({ data: [{ jobId, seekerId, kind, byUserId: user.id }], skipDuplicates: true })
    return this.marks(user)
  }

  async removeMark(user: AuthUser, jobId: string, seekerId: string, kind: MarkKind) {
    await this.pairs.access(user, jobId, seekerId)
    await this.prisma.candidateMark.deleteMany({ where: { jobId, seekerId, kind } })
    return this.marks(user)
  }
}
