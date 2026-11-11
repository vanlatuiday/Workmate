import { Body, Controller, Delete, Get, Param, ParseBoolPipe, Patch, Post, Query, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator'
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { DOC_MAX_BYTES, DOC_MAX_COUNT, VerificationService, type UploadedDoc } from './verification.service'

export class DecideVerificationDto {
  @IsIn(['approved', 'rejected']) status!: 'approved' | 'rejected'
  @IsOptional() @IsString() @MaxLength(1000) reason?: string
}

/** Doanh nghiệp gửi giấy tờ xin xác minh */
@Controller('recruiter/company/verification')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('recruiter')
export class RecruiterVerificationController {
  constructor(private verification: VerificationService) {}

  @Get()
  mine(@CurrentUser() user: AuthUser) {
    return this.verification.mine(user)
  }

  /** multipart/form-data: `files` (1–5 file PDF/ảnh, mỗi file ≤ 5MB) + `note` (tùy chọn) */
  @Post()
  @UseInterceptors(FilesInterceptor('files', DOC_MAX_COUNT, { limits: { fileSize: DOC_MAX_BYTES, files: DOC_MAX_COUNT } }))
  submit(@CurrentUser() user: AuthUser, @UploadedFiles() files: UploadedDoc[] | undefined, @Body('note') note: unknown) {
    return this.verification.submit(user, files, typeof note === 'string' ? note : undefined)
  }

  /** Rút yêu cầu đang chờ duyệt */
  @Delete()
  withdraw(@CurrentUser() user: AuthUser) {
    return this.verification.withdraw(user)
  }
}

/** Admin xem giấy tờ, duyệt hoặc từ chối kèm lý do */
@Controller('admin/verifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminVerificationController {
  constructor(private verification: VerificationService) {}

  @Get()
  list(@Query('status') status?: string) {
    const s = status === 'pending' || status === 'approved' || status === 'rejected' ? status : undefined
    return this.verification.list(s)
  }

  @Get(':id/documents/:docId')
  document(@Param('id') id: string, @Param('docId') docId: string, @Query('download', new ParseBoolPipe({ optional: true })) download?: boolean) {
    return this.verification.documentLink(id, docId, !!download)
  }

  @Patch(':id')
  decide(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: DecideVerificationDto) {
    return this.verification.decide(user, id, dto.status, dto.reason)
  }
}
