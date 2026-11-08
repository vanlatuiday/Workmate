import { Body, Controller, Delete, Get, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { UpdateProfileDto } from './profile.dto'
import { AVATAR_MAX_BYTES, ProfileService, type UploadedImage } from './profile.service'

/** Hồ sơ của người tìm việc đang đăng nhập */
@Controller('seeker/profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('jobseeker')
export class ProfileController {
  constructor(private profile: ProfileService) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.profile.get(user.id)
  }

  @Patch()
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.profile.update(user.id, dto)
  }

  /** Gửi multipart/form-data, trường `file`. Vượt giới hạn → multer trả 413 */
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: AVATAR_MAX_BYTES, files: 1 } }))
  setAvatar(@CurrentUser() user: AuthUser, @UploadedFile() file: UploadedImage | undefined) {
    return this.profile.setAvatar(user.id, file)
  }

  @Delete('avatar')
  removeAvatar(@CurrentUser() user: AuthUser) {
    return this.profile.removeAvatar(user.id)
  }
}
