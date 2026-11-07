import { Controller, Get } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

/** GET /api/health — kiểm tra backend và cơ sở dữ liệu còn sống */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    await this.prisma.$queryRaw`SELECT 1`
    return { ok: true, db: 'up', at: new Date().toISOString() }
  }
}
