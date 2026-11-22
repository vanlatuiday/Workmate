import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import type { Review, Side } from '@prisma/client'
import type { AuthUser } from '../auth/current-user.decorator'
import { SystemConfigService } from '../common/system-config.service'
import { phraseHits } from '../jobs/flags'
import { PrismaService } from '../prisma/prisma.service'
import type { ReviewDto, UpsertReviewDto } from './connections.dto'
import { otherSide, PairService } from './pair.service'

const view = (r: Review) => ({
  jobId: r.jobId, seekerId: r.seekerId, from: r.from, stars: r.stars, tags: r.tags,
  ...(r.comment ? { comment: r.comment } : {}), at: r.at.toISOString(), ...(r.editedAt ? { editedAt: r.editedAt.toISOString() } : {}),
})

/** "Nguyễn Văn An" → "N. V. A." — đánh giá công khai không lộ họ tên đầy đủ */
const abbreviate = (name: string) => name.trim().split(/\s+/).map((w) => `${w[0]?.toUpperCase() ?? ''}.`).join(' ')

/** Một cặp công ty ↔ người tìm việc, và phía đang viết */
type Target = { companyId: string; seekerId: string; from: Side }

/**
 * Đánh giá hai chiều giữa người tìm việc và DOANH NGHIỆP (chủ dự án 2026-11-22):
 * - Được viết khi hai bên đã quan tâm nhau (có Connection với ít nhất một tin của công ty) — không cần đã nhận việc.
 * - Mỗi người tìm việc một đánh giá cho mỗi công ty, mỗi công ty một đánh giá cho mỗi người tìm việc.
 *   Bảng Review vẫn khóa theo tin (jobId): đánh giá gắn với tin đã kết nối gần nhất, tính duy nhất theo công ty ở đây.
 * - Sao 1–5 bắt buộc, nhận xét tùy chọn (qua bộ lọc cụm từ cấm); người viết sửa / xóa được.
 */
@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService, private pairs: PairService, private config: SystemConfigService) {}

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
      ...(r.editedAt ? { editedAt: r.editedAt.toISOString() } : {}),
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

  /** Người tìm việc → công ty `companyId`; doanh nghiệp (công ty của mình) → người tìm việc `seekerId` */
  private async target(user: AuthUser, other: { companyId?: string; seekerId?: string }): Promise<Target> {
    if (user.role === 'jobseeker' && other.companyId) return { companyId: other.companyId, seekerId: user.id, from: 'seeker' }
    if (user.role === 'recruiter' && other.seekerId) {
      const m = await this.prisma.companyMember.findFirst({ where: { userId: user.id }, select: { company: { select: { id: true, locked: true } } } })
      if (!m) throw new ForbiddenException('Bạn chưa thuộc doanh nghiệp nào')
      if (m.company.locked) throw new ForbiddenException('Doanh nghiệp đang bị khóa')
      return { companyId: m.company.id, seekerId: other.seekerId, from: 'recruiter' }
    }
    throw new ForbiddenException('Không có quyền đánh giá')
  }

  /** Tin đã kết nối gần nhất giữa hai bên (null = chưa quan tâm đôi bên) */
  private async connectedJob({ companyId, seekerId }: Target) {
    const c = await this.prisma.connection.findFirst({ where: { seekerId, job: { companyId } }, orderBy: { at: 'desc' }, select: { jobId: true } })
    return c?.jobId ?? null
  }

  private existing({ companyId, seekerId, from }: Target) {
    return this.prisma.review.findFirst({ where: { seekerId, from, job: { companyId } }, orderBy: { at: 'desc' } })
  }

  /** Tôi có được đánh giá bên kia không, và đánh giá hiện có của tôi (để sửa / xóa) */
  async eligibility(user: AuthUser, other: { companyId?: string; seekerId?: string }) {
    const t = await this.target(user, other)
    const [jobId, mine] = await Promise.all([this.connectedJob(t), this.existing(t)])
    return { canReview: !!jobId || !!mine, ...(mine ? { mine: view(mine) } : {}) }
  }

  /** Viết mới hoặc sửa đánh giá của tôi */
  async upsert(user: AuthUser, other: { companyId?: string; seekerId?: string }, dto: UpsertReviewDto) {
    const t = await this.target(user, other)
    const comment = dto.comment?.trim() || null
    if (comment) {
      const { bannedWords } = await this.config.get()
      const hits = phraseHits(comment, bannedWords).hits
      if (hits.length) throw new BadRequestException(`Nhận xét chứa cụm từ không được phép: ${hits.join(', ')}`)
    }
    const prev = await this.existing(t)
    const jobId = prev?.jobId ?? (await this.connectedJob(t))
    if (!jobId) throw new ConflictException('Chỉ đánh giá được khi hai bên đã quan tâm nhau')
    const data = { stars: dto.stars, tags: dto.tags ?? prev?.tags ?? [], comment }
    return this.pairs.inPair(jobId, t.seekerId, async (tx, fx) => {
      // Đọc lại trong khóa của cặp: hai lần bấm gửi cùng lúc không tạo hai đánh giá
      const cur = await tx.review.findFirst({ where: { seekerId: t.seekerId, from: t.from, job: { companyId: t.companyId } } })
      if (cur) {
        const row = await tx.review.update({
          where: { jobId_seekerId_from: { jobId: cur.jobId, seekerId: cur.seekerId, from: cur.from } },
          data: { ...data, editedAt: fx.at },
        })
        return view(row)
      }
      const row = await tx.review.create({ data: { jobId, seekerId: t.seekerId, from: t.from, ...data, at: fx.at } })
      await fx.notify(otherSide(t.from), 'review')
      return view(row)
    })
  }

  /** Xóa đánh giá của tôi */
  async remove(user: AuthUser, other: { companyId?: string; seekerId?: string }) {
    const t = await this.target(user, other)
    const cur = await this.existing(t)
    if (!cur) throw new NotFoundException('Bạn chưa đánh giá')
    await this.prisma.review.delete({ where: { jobId_seekerId_from: { jobId: cur.jobId, seekerId: cur.seekerId, from: cur.from } } })
    return { ok: true }
  }

  /** Cách cũ (từ thẻ nhận việc): theo cặp tin ↔ người tìm việc → quy về đánh giá theo công ty của tin đó */
  async submit(user: AuthUser, dto: ReviewDto) {
    const { jobId, seekerId, stars, tags, comment } = dto
    await this.pairs.access(user, jobId, seekerId, true)
    const job = await this.prisma.job.findUniqueOrThrow({ where: { id: jobId }, select: { companyId: true } })
    return this.upsert(user, user.role === 'jobseeker' ? { companyId: job.companyId } : { seekerId }, { stars, tags, comment })
  }
}
