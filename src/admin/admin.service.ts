import { Injectable, NotFoundException } from '@nestjs/common'
import type { AuthUser } from '../auth/current-user.decorator'
import { CatalogService, JOB_INCLUDE } from '../catalog/catalog.service'
import type { AdminJobRow, CatalogCompany } from '../catalog/catalog.types'
import { SystemConfigService } from '../common/system-config.service'
import { flagsOf } from '../jobs/flags'
import { PrismaService } from '../prisma/prisma.service'
import type { CompanyAdminDto, ModerationDto } from './admin.dto'

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private catalog: CatalogService,
    private config: SystemConfigService,
  ) {}

  private row(job: Parameters<CatalogService['toJob']>[0], origin: { lat: number; lng: number }, cfg: Awaited<ReturnType<SystemConfigService['get']>>): AdminJobRow {
    const dto = this.catalog.toJob(job, origin, true)
    return { job: dto, flags: flagsOf(dto, cfg), companyLocked: job.company.locked }
  }

  /** Mọi tin (kể cả chờ / từ chối / ẩn) kèm cờ tự động */
  async listJobs(user: AuthUser): Promise<AdminJobRow[]> {
    const [jobs, origin, cfg] = await Promise.all([
      this.prisma.job.findMany({ include: JOB_INCLUDE, orderBy: { postedAt: 'desc' } }),
      this.catalog.originOf(user),
      this.config.get(),
    ])
    return jobs.map((j) => this.row(j, origin, cfg))
  }

  async setModeration(user: AuthUser, id: string, dto: ModerationDto): Promise<AdminJobRow> {
    if (!(await this.prisma.job.findUnique({ where: { id }, select: { id: true } }))) throw new NotFoundException('Không tìm thấy tin tuyển dụng')
    const job = await this.prisma.job.update({
      where: { id },
      data: {
        moderation: dto.status,
        // Lý do chỉ có nghĩa khi từ chối / ẩn
        moderationReason: dto.status === 'rejected' || dto.status === 'hidden' ? dto.reason || null : null,
        // Đưa về "chờ duyệt" = chưa có quyết định nên không có ngày xử lý
        moderatedAt: dto.status === 'pending' ? null : new Date(),
      },
      include: JOB_INCLUDE,
    })
    return this.row(job, await this.catalog.originOf(user), await this.config.get())
  }

  async patchCompany(id: string, dto: CompanyAdminDto): Promise<CatalogCompany> {
    if (!(await this.prisma.company.findUnique({ where: { id }, select: { id: true } }))) throw new NotFoundException('Không tìm thấy doanh nghiệp')
    const c = await this.prisma.company.update({
      where: { id },
      data: { ...(dto.verified !== undefined && { verified: dto.verified }), ...(dto.locked !== undefined && { locked: dto.locked }) },
    })
    return this.catalog.toCompany(c)
  }
}
