import { BadRequestException, Body, Controller, Get, Injectable, Module, Patch, UseGuards } from '@nestjs/common'
import { NotificationKind, type Prisma, type UserSettings } from '@prisma/client'
import { IsIn, IsObject, IsOptional } from 'class-validator'
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { PrismaService } from '../prisma/prisma.service'

class UpdateSettingsDto {
  /** Chỉ cần gửi loại muốn đổi: { "interest": false } */
  @IsOptional() @IsObject() notify?: Record<string, unknown>
  @IsOptional() @IsIn(['instant', 'daily', 'off']) emailDigest?: 'instant' | 'daily' | 'off'
  @IsOptional() @IsIn(['public', 'connected', 'hidden']) visibility?: 'public' | 'connected' | 'hidden'
}

/** Khớp SideSettings ở frontend (settingsStore) */
const view = (s: Pick<UserSettings, 'notify' | 'emailDigest' | 'visibility'>) => ({ notify: s.notify, emailDigest: s.emailDigest, visibility: s.visibility })
const DEFAULTS = { notify: {}, emailDigest: 'daily', visibility: 'public' } as const

@Injectable()
class SettingsService {
  constructor(private prisma: PrismaService) {}

  async get(userId: string) {
    const s = await this.prisma.userSettings.findUnique({ where: { userId } })
    return view(s ?? DEFAULTS)
  }

  async update(userId: string, dto: UpdateSettingsDto) {
    for (const [kind, on] of Object.entries(dto.notify ?? {})) {
      if (!Object.keys(NotificationKind).includes(kind) || typeof on !== 'boolean') throw new BadRequestException(`Cài đặt thông báo không hợp lệ: ${kind}`)
    }
    const cur = await this.prisma.userSettings.findUnique({ where: { userId }, select: { notify: true } })
    const notify = { ...((cur?.notify ?? {}) as Record<string, boolean>), ...dto.notify } as Prisma.InputJsonObject
    const fields = { notify, ...(dto.emailDigest && { emailDigest: dto.emailDigest }), ...(dto.visibility && { visibility: dto.visibility }) }
    return view(await this.prisma.userSettings.upsert({ where: { userId }, create: { userId, ...fields }, update: fields }))
  }
}

/** Cài đặt của tài khoản đang đăng nhập */
@Controller('settings')
@UseGuards(JwtAuthGuard)
class SettingsController {
  constructor(private settings: SettingsService) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.settings.get(user.id)
  }

  @Patch()
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateSettingsDto) {
    return this.settings.update(user.id, dto)
  }
}

@Module({ controllers: [SettingsController], providers: [SettingsService] })
export class SettingsModule {}
