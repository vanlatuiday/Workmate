import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import type { Interview } from '@prisma/client'
import type { AuthUser } from '../auth/current-user.decorator'
import { PrismaService } from '../prisma/prisma.service'
import type { InviteInterviewDto } from './connections.dto'
import { PairService } from './pair.service'

const view = (iv: Interview) => ({
  id: iv.id, jobId: iv.jobId, seekerId: iv.seekerId, slots: iv.slots.map((s) => s.toISOString()),
  ...(iv.chosen ? { chosen: iv.chosen.toISOString() } : {}),
  mode: iv.mode, place: iv.place, ...(iv.note ? { note: iv.note } : {}), status: iv.status, createdAt: iv.createdAt.toISOString(),
})

const whenLabel = (d: Date) =>
  d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

@Injectable()
export class InterviewsService {
  constructor(private prisma: PrismaService, private pairs: PairService) {}

  /** Mọi buổi phỏng vấn của tôi, sớm nhất trước */
  async list(user: AuthUser) {
    const rows = await this.prisma.interview.findMany({ where: this.pairs.scope(user) })
    const when = (iv: Interview) => (iv.chosen ?? iv.slots[0]).getTime()
    return rows.sort((a, b) => when(a) - when(b)).map(view)
  }

  /** Doanh nghiệp mời — cần đã kết nối, mỗi cặp chỉ một lời mời còn hiệu lực */
  async invite(user: AuthUser, dto: InviteInterviewDto) {
    const { jobId, seekerId } = dto
    const slots = [...new Set(dto.slots.map((s) => new Date(s).getTime()))].map((t) => new Date(t))
    if (slots.some((s) => s.getTime() <= Date.now())) throw new BadRequestException('Khung giờ phỏng vấn phải ở tương lai')
    await this.pairs.access(user, jobId, seekerId, true)
    return this.pairs.inPair(jobId, seekerId, async (tx, fx) => {
      await this.pairs.assertConnected(tx, jobId, seekerId)
      const active = await tx.interview.count({ where: { jobId, seekerId, status: { in: ['pending', 'confirmed'] } } })
      if (active) throw new ConflictException('Đang có lịch phỏng vấn còn hiệu lực với ứng viên này')
      const iv = await tx.interview.create({ data: { jobId, seekerId, slots, mode: dto.mode, place: dto.place, note: dto.note || null, createdAt: fx.at } })
      await fx.notify('seeker', 'interview_invited')
      await fx.system('recruiter', 'Đã gửi lời mời phỏng vấn — chọn một khung giờ phù hợp nhé.')
      return view(iv)
    })
  }

  /** Lấy buổi phỏng vấn thuộc về tôi, kiểm tra quyền rồi đổi trạng thái trong khóa của cặp */
  private async mine(user: AuthUser, id: string) {
    const iv = await this.prisma.interview.findUnique({ where: { id }, select: { jobId: true, seekerId: true } })
    if (!iv) throw new NotFoundException('Không tìm thấy lịch phỏng vấn')
    await this.pairs.access(user, iv.jobId, iv.seekerId, true)
    return iv
  }

  /** Người tìm việc chọn một khung giờ trong lời mời */
  async confirm(user: AuthUser, id: string, slot: string) {
    const { jobId, seekerId } = await this.mine(user, id)
    const chosen = new Date(slot)
    return this.pairs.inPair(jobId, seekerId, async (tx, fx) => {
      const iv = await tx.interview.findUniqueOrThrow({ where: { id } })
      if (iv.status !== 'pending') throw new ConflictException('Lời mời này không còn chờ xác nhận')
      if (!iv.slots.some((s) => s.getTime() === chosen.getTime())) throw new BadRequestException('Khung giờ không nằm trong lời mời')
      const updated = await tx.interview.update({ where: { id }, data: { status: 'confirmed', chosen } })
      await fx.notify('recruiter', 'interview_confirmed')
      await fx.system('seeker', `Đã xác nhận lịch phỏng vấn: ${whenLabel(chosen)}.`)
      return view(updated)
    })
  }

  async decline(user: AuthUser, id: string) {
    const { jobId, seekerId } = await this.mine(user, id)
    return this.pairs.inPair(jobId, seekerId, async (tx, fx) => {
      const iv = await tx.interview.findUniqueOrThrow({ where: { id } })
      if (iv.status !== 'pending') throw new ConflictException('Lời mời này không còn chờ xác nhận')
      const updated = await tx.interview.update({ where: { id }, data: { status: 'declined' } })
      await fx.notify('recruiter', 'interview_declined')
      await fx.system('seeker', 'Đã từ chối lời mời phỏng vấn.')
      return view(updated)
    })
  }

  /** Doanh nghiệp hủy lịch đang chờ hoặc đã xác nhận */
  async cancel(user: AuthUser, id: string) {
    const { jobId, seekerId } = await this.mine(user, id)
    return this.pairs.inPair(jobId, seekerId, async (tx, fx) => {
      const iv = await tx.interview.findUniqueOrThrow({ where: { id } })
      if (iv.status !== 'pending' && iv.status !== 'confirmed') throw new ConflictException('Lịch này đã kết thúc')
      const updated = await tx.interview.update({ where: { id }, data: { status: 'cancelled' } })
      await fx.notify('seeker', 'interview_cancelled')
      await fx.system('recruiter', 'Đã hủy lịch phỏng vấn.')
      return view(updated)
    })
  }
}
