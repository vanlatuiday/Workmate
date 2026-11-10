import { Module } from '@nestjs/common'
import { CatalogModule } from '../catalog/catalog.module'
import { JobExpiryService } from './job-expiry.service'
import { JobsController } from './jobs.controller'
import { JobsService } from './jobs.service'

@Module({ imports: [CatalogModule], controllers: [JobsController], providers: [JobsService, JobExpiryService] })
export class JobsModule {}
