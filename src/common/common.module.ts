import { Global, Module } from '@nestjs/common'
import { StorageService } from './storage.service'
import { SystemConfigService } from './system-config.service'

/** Dịch vụ dùng chung toàn app (cấu hình hệ thống, kho file) */
@Global()
@Module({ providers: [SystemConfigService, StorageService], exports: [SystemConfigService, StorageService] })
export class CommonModule {}
