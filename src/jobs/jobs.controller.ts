import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { CreateJobDto, JobStatusDto, UpdateJobDto } from './jobs.dto'
import { JobsService } from './jobs.service'

/** Tin tuyển dụng của doanh nghiệp đang đăng nhập */
@Controller('recruiter/jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('recruiter')
export class JobsController {
  constructor(private jobs: JobsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.jobs.list(user)
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateJobDto) {
    return this.jobs.create(user, dto)
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateJobDto) {
    return this.jobs.update(user, id, dto)
  }

  @Patch(':id/status')
  setStatus(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: JobStatusDto) {
    return this.jobs.setStatus(user, id, dto.status)
  }
}
