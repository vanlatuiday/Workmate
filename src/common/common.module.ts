import { Global, Module } from '@nestjs/common'
import { MailService } from './mail.service'
import { SessionEvents } from './session-events.service'
import { StorageService } from './storage.service'
import { SystemConfigService } from './system-config.service'

/** Dịch vụ dùng chung toàn app (cấu hình hệ thống, kho file) */
@Global()
@Module({ providers: [SystemConfigService, StorageService, MailService, SessionEvents], exports: [SystemConfigService, StorageService, MailService, SessionEvents] })
export class CommonModule {}
