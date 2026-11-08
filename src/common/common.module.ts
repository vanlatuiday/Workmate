import { Global, Module } from '@nestjs/common'
import { MailService } from './mail.service'
import { StorageService } from './storage.service'
import { SystemConfigService } from './system-config.service'

/** Dịch vụ dùng chung toàn app (cấu hình hệ thống, kho file) */
@Global()
@Module({ providers: [SystemConfigService, StorageService, MailService], exports: [SystemConfigService, StorageService, MailService] })
export class CommonModule {}
