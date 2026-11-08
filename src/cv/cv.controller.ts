import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Transform } from 'class-transformer'
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator'
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { CV_MAX_BYTES, CvService, type UploadedFile as CvFile } from './cv.service'

class UpdateCvDto {
  @IsOptional() @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value)) @IsString() @MaxLength(120)
  name?: string

  @IsOptional() @IsBoolean()
  isDefault?: boolean
}

const wantsDownload = (v?: string) => v === '1' || v === 'true'

/** CV của người tìm việc đang đăng nhập */
@Controller('seeker/cvs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('jobseeker')
export class CvController {
  constructor(private cvs: CvService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.cvs.list(user.id)
  }

  /** multipart/form-data, trường `file`. Vượt 5MB → multer trả 413 */
  @Post()
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: CV_MAX_BYTES, files: 1 } }))
  upload(@CurrentUser() user: AuthUser, @UploadedFile() file: CvFile | undefined) {
    return this.cvs.upload(user.id, file)
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateCvDto) {
    return this.cvs.update(user.id, id, dto)
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.cvs.remove(user.id, id)
  }

  /** Link xem (mặc định) hoặc tải (?download=1), hết hạn sau 5 phút */
  @Get(':id/url')
  url(@CurrentUser() user: AuthUser, @Param('id') id: string, @Query('download') download?: string) {
    return this.cvs.ownUrl(user.id, id, wantsDownload(download))
  }
}

/** Nhà tuyển dụng xem CV mặc định của ứng viên đã kết nối */
@Controller('recruiter/candidates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('recruiter')
export class CandidateCvController {
  constructor(private cvs: CvService) {}

  @Get(':seekerId/cv')
  cv(@CurrentUser() user: AuthUser, @Param('seekerId') seekerId: string, @Query('download') download?: string) {
    return this.cvs.candidateCv(user.id, seekerId, wantsDownload(download))
  }
}
