import { BadRequestException, ConflictException, Injectable } from '@nestjs/common'
import type { Hire } from '@prisma/client'
import type { AuthUser } from '../auth/current-user.decorator'
import { PrismaService } from '../prisma/prisma.service'
import type { OfferDto } from './connections.dto'
import { dayOf, fmtDay, isRealDay, todayVN } from './dates'
import { PairService, type PairEffects, type Tx } from './pair.service'

const view = (h: Hire) => ({
  jobId: h.jobId, seekerId: h.seekerId, status: h.status,
  ...(h.startDate ? { startDate: dayOf(h.startDate) } : {}),
  ...(h.note ? { note: h.note } : {}), ...(h.reason ? { reason: h.reason } : {}),
  at: h.at.toISOString(), updatedAt: h.updatedAt.toISOString(),
})

/** Nhận việc: offered → accepted | declined | withdrawn; rejected = không nhận. Mỗi cặp một bản ghi, trạng thái cuối không đổi nữa */
@Injectable()
export class HiresService {
  constructor(private prisma: PrismaService, private pairs: PairService) {}

  /** Mọi bản ghi của tôi, mới cập nhật trước */
  async list(user: AuthUser) {
    const rows = await this.prisma.hire.findMany({ where: this.pairs.scope(user), orderBy: { updatedAt: 'desc' } })
    return rows.map(view)
  }

  /** Cặp đã kết nối và chưa có bản ghi nhận việc */
  private async assertCanDecide(tx: Tx, jobId: string, seekerId: string) {
    await this.pairs.assertConnected(tx, jobId, seekerId)
    const hire = await tx.hire.findUnique({ where: { jobId_seekerId: { jobId, seekerId } }, select: { status: true } })
    if (hire) throw new ConflictException('Ứng viên này đã có quyết định nhận việc')
  }

  async offer(user: AuthUser, dto: OfferDto) {
    const { jobId, seekerId, startDate, note } = dto
    if (!isRealDay(startDate)) throw new BadRequestException('Ngày bắt đầu không hợp lệ')
    if (startDate < todayVN()) throw new BadRequestException('Ngày bắt đầu không được ở quá khứ')
    await this.pairs.access(user, jobId, seekerId, true)
    return this.pairs.inPair(jobId, seekerId, async (tx, fx) => {
      await this.assertCanDecide(tx, jobId, seekerId)
      const hire = await tx.hire.create({
        data: { jobId, seekerId, status: 'offered', startDate: new Date(`${startDate}T00:00:00Z`), note: note || null, at: fx.at },
      })
      await fx.notify('seeker', 'offer')
      await fx.system('recruiter', `Bên mình rất muốn nhận bạn vào làm, bắt đầu từ ${fmtDay(startDate)}. Bạn xem lời mời và xác nhận giúp mình nhé.`)
      return view(hire)
    })
  }

  async reject(user: AuthUser, jobId: string, seekerId: string, reason?: string) {
    await this.pairs.access(user, jobId, seekerId, true)
    return this.pairs.inPair(jobId, seekerId, async (tx, fx) => {
      await this.assertCanDecide(tx, jobId, seekerId)
      const hire = await tx.hire.create({ data: { jobId, seekerId, status: 'rejected', reason: reason || null, at: fx.at } })
      await fx.notify('seeker', 'rejected')
      await fx.system('recruiter', 'Cảm ơn bạn đã quan tâm, lần này bên mình chưa thấy phù hợp. Chúc bạn sớm tìm được công việc ưng ý.')
      return view(hire)
    })
  }

  /** Đổi trạng thái lời mời đang chờ */
  private async settle(
    user: AuthUser, jobId: string, seekerId: string,
    data: { status: 'accepted' | 'declined' | 'withdrawn'; reason?: string | null },
    after: (fx: PairEffects, hire: Hire) => Promise<void>,
  ) {
    await this.pairs.access(user, jobId, seekerId, true)
    return this.pairs.inPair(jobId, seekerId, async (tx, fx) => {
      const cur = await tx.hire.findUnique({ where: { jobId_seekerId: { jobId, seekerId } }, select: { status: true } })
      if (cur?.status !== 'offered') throw new ConflictException('Không có lời mời nhận việc đang chờ')
      const hire = await tx.hire.update({ where: { jobId_seekerId: { jobId, seekerId } }, data })
      await after(fx, hire)
      return view(hire)
    })
  }

  withdraw(user: AuthUser, jobId: string, seekerId: string) {
    return this.settle(user, jobId, seekerId, { status: 'withdrawn' }, async (fx) => {
      await fx.notify('seeker', 'offer_withdrawn')
      await fx.system('recruiter', 'Doanh nghiệp đã rút lời mời nhận việc.')
    })
  }

  accept(user: AuthUser, jobId: string, seekerId: string) {
    return this.settle(user, jobId, seekerId, { status: 'accepted' }, async (fx, h) => {
      await fx.notify('recruiter', 'offer_accepted')
      await fx.system('seeker', `Đã xác nhận đi làm${h.startDate ? ` từ ${fmtDay(dayOf(h.startDate))}` : ''}.`)
    })
  }

  decline(user: AuthUser, jobId: string, seekerId: string, reason?: string) {
    return this.settle(user, jobId, seekerId, { status: 'declined', reason: reason || null }, async (fx) => {
      await fx.notify('recruiter', 'offer_declined')
      await fx.system('seeker', 'Cảm ơn bên mình đã tin tưởng, nhưng mình xin phép từ chối lời mời nhận việc.')
    })
  }
}
