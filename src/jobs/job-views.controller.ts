import { Controller, HttpCode, Ip, Param, Post, UseGuards } from '@nestjs/common'
import { SkipThrottle, Throttle, ThrottlerGuard } from '@nestjs/throttler'
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator'
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard'
import { JobViewsService } from './job-views.service'

/** Trang chi tiết tin gọi một lần mỗi lần mở (khách cũng gọi được) */
@Controller('jobs')
export class JobViewsController {
  constructor(private views: JobViewsService) {}

  @Post(':id/view') @HttpCode(200)
  @UseGuards(ThrottlerGuard, OptionalJwtAuthGuard)
  @Throttle({ phut: { limit: 60, ttl: 60_000 }, gio: { limit: 600, ttl: 3_600_000 } }) @SkipThrottle({ tai_khoan: true })
  view(@Param('id') id: string, @CurrentUser() user: AuthUser | null, @Ip() ip: string) {
    return this.views.record(id, user, ip)
  }
}
