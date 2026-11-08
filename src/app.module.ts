import { Module } from '@nestjs/common'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { CommonModule } from './common/common.module'
import { CatalogModule } from './catalog/catalog.module'
import { JobsModule } from './jobs/jobs.module'
import { AdminModule } from './admin/admin.module'
import { ProfileModule } from './profile/profile.module'
import { CvModule } from './cv/cv.module'
import { ConnectionsModule } from './connections/connections.module'
import { CompanyModule } from './company/company.module'
import { SettingsModule } from './settings/settings.module'
import { ReportsModule } from './reports/reports.module'
import { HealthController } from './health/health.controller'

@Module({
  imports: [
    PrismaModule, CommonModule, AuthModule, CatalogModule, JobsModule, AdminModule, ProfileModule, CvModule,
    ConnectionsModule, CompanyModule, SettingsModule, ReportsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
