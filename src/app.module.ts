import { Module } from '@nestjs/common'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { CommonModule } from './common/common.module'
import { CatalogModule } from './catalog/catalog.module'
import { JobsModule } from './jobs/jobs.module'
import { AdminModule } from './admin/admin.module'
import { HealthController } from './health/health.controller'

@Module({
  imports: [PrismaModule, CommonModule, AuthModule, CatalogModule, JobsModule, AdminModule],
  controllers: [HealthController],
})
export class AppModule {}
