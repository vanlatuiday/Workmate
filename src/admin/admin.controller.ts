import { Body, Controller, Get, Param, Patch, Put, UseGuards } from '@nestjs/common'
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { SystemConfigService } from '../common/system-config.service'
import { CompanyAdminDto, ConfigDto, ModerationDto } from './admin.dto'
import { AdminService } from './admin.service'

/** Khu quản trị: kiểm duyệt tin, khóa / xác minh doanh nghiệp, cấu hình hệ thống */
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(
    private admin: AdminService,
    private config: SystemConfigService,
  ) {}

  @Get('jobs')
  jobs(@CurrentUser() user: AuthUser) {
    return this.admin.listJobs(user)
  }

  @Patch('jobs/:id/moderation')
  moderation(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ModerationDto) {
    return this.admin.setModeration(user, id, dto)
  }

  @Patch('companies/:id')
  company(@Param('id') id: string, @Body() dto: CompanyAdminDto) {
    return this.admin.patchCompany(id, dto)
  }

  @Get('config')
  getConfig() {
    return this.config.get()
  }

  @Put('config')
  putConfig(@Body() dto: ConfigDto) {
    return this.config.update(dto)
  }
}
