import { Global, Module } from '@nestjs/common'
import { SystemConfigService } from './system-config.service'

/** Dịch vụ dùng chung toàn app (cấu hình hệ thống) */
@Global()
@Module({ providers: [SystemConfigService], exports: [SystemConfigService] })
export class CommonModule {}
