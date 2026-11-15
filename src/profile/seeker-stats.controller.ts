import { Controller, Get, UseGuards } from '@nestjs/common'
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { SeekerStatsService } from './seeker-stats.service'

/** Thống kê của người tìm việc đang đăng nhập (/tim-viec/thong-ke) */
@Controller('seeker/stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('jobseeker')
export class SeekerStatsController {
  constructor(private stats: SeekerStatsService) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.stats.get(user.id)
  }
}
