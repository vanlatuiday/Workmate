import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import type { Review } from '@prisma/client'
import type { AuthUser } from '../auth/current-user.decorator'
import { PrismaService } from '../prisma/prisma.service'
import type { ReviewDto } from './connections.dto'
import { dayOf, todayVN } from './dates'
import { otherSide, PairService, sideOf } from './pair.service'

const view = (r: Review) => ({
  jobId: r.jobId, seekerId: r.seekerId, from: r.from, stars: r.stars, tags: r.tags,
  ...(r.comment ? { comment: r.comment } : {}), at: r.at.toISOString(),
})

/** "Nguyễn Văn An" → "N. V. A." — đánh giá công khai không lộ họ tên đầy đủ */
const abbreviate = (name: string) => name.trim().split(/\s+/).map((w) => `${w[0]?.toUpperCase() ?? ''}.`).join(' ')

/** Đánh giá hai chiều sau khi đi làm; mỗi (cặp, phía viết) một lần, không sửa */
@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService, private pairs: PairService) {}

  /** Đánh giá trên các cặp của tôi (cả mình viết lẫn viết về mình) */
  async mine(user: AuthUser) {
    const rows = await this.prisma.review.findMany({ where: this.pairs.scope(user), orderBy: { at: 'desc' } })
    return rows.map(view)
  }

  /** Trang công ty, ai cũng xem được: không kèm id người viết */
  async ofCompany(companyId: string) {
    const rows = await this.prisma.review.findMany({
      where: { from: 'seeker', job: { companyId } },
      include: { seeker: { select: { fullName: true } } },
      orderBy: { at: 'desc' },
    })
    return rows.map((r) => ({
      jobId: r.jobId, stars: r.stars, tags: r.tags, ...(r.comment ? { comment: r.comment } : {}), at: r.at.toISOString(),
      authorName: abbreviate(r.seeker.fullName),
    }))
  }

  /** Đánh giá về một người tìm việc: chính họ, admin, hoặc doanh nghiệp được phép xem hồ sơ */
  async ofSeeker(user: AuthUser, seekerId: string) {
    if (user.role === 'jobseeker' && user.id !== seekerId) throw new ForbiddenException('Không có quyền xem')
    if (user.role === 'recruiter') await this.pairs.assertRecruiterCanView(user.id, seekerId)
    const rows = await this.prisma.review.findMany({
      where: { from: 'recruiter', seekerId },
      include: { job: { select: { company: { select: { name: true } } } } },
      orderBy: { at: 'desc' },
    })
    return rows.map((r) => ({ ...view(r), authorName: r.job.company.name }))
  }

  /** Chỉ khi cặp đã xác nhận đi làm và đã tới ngày bắt đầu */
  async submit(user: AuthUser, dto: ReviewDto) {
    const { jobId, seekerId, stars, tags, comment } = dto
    const from = sideOf(user)
    await this.pairs.access(user, jobId, seekerId, true)
    return this.pairs.inPair(jobId, seekerId, async (tx, fx) => {
      const hire = await tx.hire.findUnique({ where: { jobId_seekerId: { jobId, seekerId } }, select: { status: true, startDate: true } })
      if (!hire) throw new NotFoundException('Hai bên chưa có quyết định nhận việc')
      if (hire.status !== 'accepted') throw new ConflictException('Chỉ đánh giá được sau khi đã xác nhận đi làm')
      if (hire.startDate && dayOf(hire.startDate) > todayVN()) throw new ConflictException('Chưa tới ngày bắt đầu làm')
      const dup = await tx.review.findUnique({ where: { jobId_seekerId_from: { jobId, seekerId, from } }, select: { stars: true } })
      if (dup) throw new ConflictException('Bạn đã gửi đánh giá này rồi')
      const review = await tx.review.create({ data: { jobId, seekerId, from, stars, tags, comment: comment || null, at: fx.at } })
      await fx.notify(otherSide(from), 'review')
      return view(review)
    })
  }
}
