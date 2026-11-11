import { Module } from '@nestjs/common'
import { CatalogModule } from '../catalog/catalog.module'
import { JobExpiryService } from './job-expiry.service'
import { JobViewsController } from './job-views.controller'
import { JobViewsService } from './job-views.service'
import { JobsController } from './jobs.controller'
import { JobsService } from './jobs.service'

@Module({ imports: [CatalogModule], controllers: [JobsController, JobViewsController], providers: [JobsService, JobExpiryService, JobViewsService] })
export class JobsModule {}
