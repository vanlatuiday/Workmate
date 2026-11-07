import { Controller, Get, UseGuards } from '@nestjs/common'
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator'
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard'
import { CatalogService } from './catalog.service'

@Controller('catalog')
export class CatalogController {
  constructor(private catalog: CatalogService) {}

  /** Danh mục tin + công ty theo người xem (khách vẫn gọi được, không cần token) */
  @UseGuards(OptionalJwtAuthGuard)
  @Get()
  list(@CurrentUser() user: AuthUser | null) {
    return this.catalog.catalogFor(user)
  }
}
