import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import type { Prisma } from '@prisma/client'
import type { AuthUser } from '../auth/current-user.decorator'
import { CatalogService, JOB_INCLUDE, JOB_TYPE_ENUM } from '../catalog/catalog.service'
import type { CatalogJob } from '../catalog/catalog.types'
import { geo } from '../common/geo'
import { SystemConfigService } from '../common/system-config.service'
import { PrismaService } from '../prisma/prisma.service'
import { flagsOf } from './flags'
import { DEFAULT_DURATION_DAYS, type CreateJobDto, type UpdateJobDto } from './jobs.dto'
import { salaryLabelOf, shiftLabelOf } from './labels'

export type JobWithFlags = CatalogJob & { flags: string[] }

const DAY_MS = 86_400_000
/** Hạn nhận ứng viên tính từ lúc này */
export const expiryFrom = (now: Date, days: number) => new Date(now.getTime() + days * DAY_MS)

/** Kỹ năng bắt buộc chỉ giữ những cái có trong danh sách kỹ năng của tin (không phân biệt hoa thường), lấy đúng cách viết trong danh sách */
export function requiredOf(skills: string[], required: string[]): string[] {
  const want = new Set(required.map((s) => s.trim().toLowerCase()))
  return skills.filter((s) => want.has(s.trim().toLowerCase()))
}

/** Tin tuyển dụng do nhà tuyển dụng quản lý (chỉ trong công ty của mình) */
@Injectable()
export class JobsService {
  constructor(
    private prisma: PrismaService,
    private catalog: CatalogService,
    private config: SystemConfigService,
  ) {}

  private async myCompanyId(user: AuthUser): Promise<string> {
    const id = await this.catalog.companyIdOf(user.id)
    if (!id) throw new ForbiddenException('Tài khoản chưa thuộc doanh nghiệp nào')
    return id
  }

  /** Tin của công ty mình; tin của công ty khác (hoặc không có) → 404 */
  private async ownJob(user: AuthUser, id: string) {
    const companyId = await this.myCompanyId(user)
    const job = await this.prisma.job.findFirst({ where: { id, companyId }, include: JOB_INCLUDE })
    if (!job) throw new NotFoundException('Không tìm thấy tin tuyển dụng')
    return job
  }

  private checkSalary(min: number, max: number) {
    if (min > max) throw new BadRequestException('Lương tối thiểu không được lớn hơn lương tối đa')
  }

  private async withFlags(job: Parameters<CatalogService['toJob']>[0], user: AuthUser): Promise<JobWithFlags> {
    const dto = this.catalog.toJob(job, await this.catalog.originOf(user))
    return { ...dto, flags: flagsOf(dto, await this.config.get()) }
  }

  async list(user: AuthUser): Promise<CatalogJob[]> {
    const companyId = await this.myCompanyId(user)
    const jobs = await this.prisma.job.findMany({ where: { companyId }, include: JOB_INCLUDE, orderBy: { postedAt: 'desc' } })
    const origin = await this.catalog.originOf(user)
    return jobs.map((j) => this.catalog.toJob(j, origin))
  }

  async create(user: AuthUser, dto: CreateJobDto): Promise<JobWithFlags> {
    const companyId = await this.myCompanyId(user)
    this.checkSalary(dto.salaryMinK, dto.salaryMaxK)
    if (!dto.photo.id && !dto.photo.url) throw new BadRequestException('Ảnh minh họa cần có id hoặc url')
    const job = await this.prisma.job.create({
      data: {
        companyId, authorId: user.id, title: dto.title, description: dto.description, jobType: JOB_TYPE_ENUM[dto.jobType],
        district: dto.district, skills: dto.skills, slots: dto.slots,
        requiredSkills: requiredOf(dto.skills, dto.requiredSkills ?? []), requireAllSlots: dto.requireAllSlots ?? false, salaryMinK: dto.salaryMinK, salaryMaxK: dto.salaryMaxK,
        salaryLabel: dto.salaryLabel || salaryLabelOf(dto.salaryMinK, dto.salaryMaxK),
        shiftLabel: dto.shiftLabel ?? shiftLabelOf(dto.slots),
        quantity: dto.quantity, radiusKm: dto.radiusKm, photo: { ...dto.photo },
        status: 'open', moderation: 'pending',
        expiresAt: expiryFrom(new Date(), dto.durationDays ?? DEFAULT_DURATION_DAYS),
      },
      include: JOB_INCLUDE,
    })
    // Tọa độ cần id của tin (để lệch nhẹ theo id) nên gán ngay sau khi tạo
    const withGeo = await this.prisma.job.update({ where: { id: job.id }, data: geo(job.district, job.id), include: JOB_INCLUDE })
    return this.withFlags(withGeo, user)
  }

  async update(user: AuthUser, id: string, dto: UpdateJobDto): Promise<JobWithFlags> {
    const cur = await this.ownJob(user, id)
    const min = dto.salaryMinK ?? cur.salaryMinK
    const max = dto.salaryMaxK ?? cur.salaryMaxK
    this.checkSalary(min, max)
    if (dto.photo && !dto.photo.id && !dto.photo.url) throw new BadRequestException('Ảnh minh họa cần có id hoặc url')
    const slots = dto.slots ?? cur.slots
    const data: Prisma.JobUpdateInput = {
      ...(dto.title !== undefined && { title: dto.title }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.jobType !== undefined && { jobType: JOB_TYPE_ENUM[dto.jobType] }),
      ...(dto.skills !== undefined && { skills: dto.skills }),
      // Đổi danh sách kỹ năng thì bỏ các kỹ năng bắt buộc không còn trong danh sách
      ...((dto.skills !== undefined || dto.requiredSkills !== undefined) && {
        requiredSkills: requiredOf(dto.skills ?? cur.skills, dto.requiredSkills ?? cur.requiredSkills),
      }),
      ...(dto.requireAllSlots !== undefined && { requireAllSlots: dto.requireAllSlots }),
      ...(dto.slots !== undefined && { slots: dto.slots }),
      ...(dto.quantity !== undefined && { quantity: dto.quantity }),
      ...(dto.radiusKm !== undefined && { radiusKm: dto.radiusKm }),
      ...(dto.photo !== undefined && { photo: { ...dto.photo } }),
      ...(dto.durationDays !== undefined && { expiresAt: expiryFrom(new Date(), dto.durationDays) }),
      salaryMinK: min,
      salaryMaxK: max,
      // Không gửi nhãn mới mà lương / ca đổi → dựng lại nhãn từ giá trị mới
      salaryLabel: dto.salaryLabel || (dto.salaryMinK !== undefined || dto.salaryMaxK !== undefined ? salaryLabelOf(min, max) : cur.salaryLabel),
      shiftLabel: dto.shiftLabel ?? (dto.slots !== undefined ? shiftLabelOf(slots) : cur.shiftLabel),
      // Sửa xong phải được quản trị viên duyệt lại; xóa lý do từ chối / ẩn cũ
      moderation: 'pending',
      moderationReason: null,
      moderatedAt: null,
    }
    if (dto.district !== undefined) Object.assign(data, { district: dto.district, ...geo(dto.district, id) })
    const job = await this.prisma.job.update({ where: { id }, data, include: JOB_INCLUDE })
    return this.withFlags(job, user)
  }

  async setStatus(user: AuthUser, id: string, status: 'open' | 'paused' | 'closed'): Promise<CatalogJob> {
    const cur = await this.ownJob(user, id)
    // Mở lại tin đã hết hạn → gia hạn mặc định, nếu không tin sẽ bị đóng lại ngay ở lượt kiểm tra kế tiếp
    const now = new Date()
    const renew = status !== 'closed' && cur.expiresAt && cur.expiresAt <= now ? { expiresAt: expiryFrom(now, DEFAULT_DURATION_DAYS) } : {}
    const job = await this.prisma.job.update({ where: { id }, data: { status, ...renew }, include: JOB_INCLUDE })
    return this.catalog.toJob(job, await this.catalog.originOf(user))
  }
}
