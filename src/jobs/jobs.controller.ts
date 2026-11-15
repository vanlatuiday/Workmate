import { Body, Controller, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { Throttle, ThrottlerGuard } from '@nestjs/throttler'
import { IsString, MaxLength } from 'class-validator'
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { CreateJobDto, JobStatusDto, UpdateJobDto } from './jobs.dto'
import { JobsService } from './jobs.service'

export class CheckTextDto {
  @IsString() @MaxLength(12000) text!: string
}

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

  /** Cảnh báo cụm từ cấm lúc đang soạn (frontend gọi khi người dùng ngừng gõ) */
  @Post('check')
  @HttpCode(200)
  @UseGuards(ThrottlerGuard) @Throttle({ phut: { limit: 60, ttl: 60_000 }, gio: { limit: 1000, ttl: 3_600_000 } })
  check(@Body() dto: CheckTextDto) {
    return this.jobs.check(dto.text)
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
