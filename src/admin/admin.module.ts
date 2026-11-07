import { Module } from '@nestjs/common'
import { CatalogModule } from '../catalog/catalog.module'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { PublicConfigController } from './public-config.controller'

@Module({ imports: [CatalogModule], controllers: [AdminController, PublicConfigController], providers: [AdminService] })
export class AdminModule {}
