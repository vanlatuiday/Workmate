import { Body, Controller, Get, Injectable, Module, NotFoundException, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler'
import type { Report, ReportStatus, ReportTarget } from '@prisma/client'
import { Transform } from 'class-transformer'
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { PrismaService } from '../prisma/prisma.service'

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value)

class CreateReportDto {
  @IsIn(['job', 'company', 'seeker']) target!: ReportTarget
  @IsString() @MinLength(1) @MaxLength(64) targetId!: string
  @Transform(trim) @IsString() @MinLength(1, { message: 'Cần chọn lý do' }) @MaxLength(200) reason!: string
  @IsOptional() @Transform(trim) @IsString() @MaxLength(1000) note?: string
}

class ResolveReportDto {
  /** Frontend gọi "actioned"; trong DB là resolved */
  @IsIn(['dismissed', 'actioned']) status!: 'dismissed' | 'actioned'
  @IsOptional() @Transform(trim) @IsString() @MaxLength(1000) resolution?: string
}

type ReportRow = Report & { reporter: { role: string } | null }
const BY: Record<string, string> = { jobseeker: 'seeker', recruiter: 'recruiter', admin: 'admin' }

/** Khớp Report ở frontend (adminStore) */
const view = (r: ReportRow) => ({
  id: r.id, target: r.target, targetId: r.targetId, reason: r.reason, ...(r.note ? { note: r.note } : {}),
  by: r.reporter ? BY[r.reporter.role] : 'guest', at: r.at.toISOString(),
  status: r.status === 'resolved' ? 'actioned' : r.status, ...(r.resolution ? { resolution: r.resolution } : {}),
})
const REPORTER = { reporter: { select: { role: true } } }

@Injectable()
class ReportsService {
  constructor(private prisma: PrismaService) {}

  private async targetExists(target: ReportTarget, id: string) {
    const where = { where: { id }, select: { id: true } }
    if (target === 'job') return !!(await this.prisma.job.findUnique(where))
    if (target === 'company') return !!(await this.prisma.company.findUnique(where))
    return !!(await this.prisma.seekerProfile.findUnique({ where: { userId: id }, select: { userId: true } }))
  }

  /** Không trả lại nội dung cho người báo: khách cũng gọi được */
  async create(user: AuthUser | null, dto: CreateReportDto) {
    if (!(await this.targetExists(dto.target, dto.targetId))) throw new NotFoundException('Không tìm thấy đối tượng cần báo cáo')
    const { id } = await this.prisma.report.create({
      data: { target: dto.target, targetId: dto.targetId, reason: dto.reason, note: dto.note || null, reporterId: user?.id ?? null },
      select: { id: true },
    })
    return { id }
  }

  async list(status?: string) {
    const db: ReportStatus | undefined = status === 'actioned' ? 'resolved' : status === 'open' || status === 'dismissed' ? status : undefined
    const rows = await this.prisma.report.findMany({ where: db ? { status: db } : {}, include: REPORTER, orderBy: { at: 'desc' } })
    return rows.map(view)
  }

  async resolve(id: string, dto: ResolveReportDto) {
    const found = await this.prisma.report.findUnique({ where: { id }, select: { id: true } })
    if (!found) throw new NotFoundException('Không tìm thấy báo cáo')
    const row = await this.prisma.report.update({
      where: { id },
      data: { status: dto.status === 'actioned' ? 'resolved' : 'dismissed', resolution: dto.resolution || null, resolvedAt: new Date() },
      include: REPORTER,
    })
    return view(row)
  }
}

/** Ai cũng báo cáo được, kể cả khách chưa đăng nhập */
@Controller('reports')
class ReportsController {
  constructor(private reports: ReportsService) {}

  /** Khách cũng gửi được nên giới hạn theo IP: mức mặc định 5 lần/phút, 20 lần/giờ */
  @Post()
  @UseGuards(ThrottlerGuard, OptionalJwtAuthGuard)
  @SkipThrottle({ tai_khoan: true })
  create(@CurrentUser() user: AuthUser | null, @Body() dto: CreateReportDto) {
    return this.reports.create(user, dto)
  }
}

@Controller('admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
class AdminReportsController {
  constructor(private reports: ReportsService) {}

  @Get()
  list(@Query('status') status?: string) {
    return this.reports.list(status)
  }

  @Patch(':id')
  resolve(@Param('id') id: string, @Body() dto: ResolveReportDto) {
    return this.reports.resolve(id, dto)
  }
}

@Module({ controllers: [ReportsController, AdminReportsController], providers: [ReportsService] })
export class ReportsModule {}
