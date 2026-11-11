import { Body, Controller, Delete, Get, Patch, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { Transform, Type } from 'class-transformer'
import { ArrayMaxSize, IsArray, IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength, ValidateIf, ValidateNested } from 'class-validator'
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { DISTRICT_GEO } from '../common/geo'
import { IMAGE_MAX_BYTES, type UploadedImage } from '../common/upload-check'
import { PhotoDto } from '../jobs/jobs.dto'
import { CompanyService, COMPANY_SIZES } from './company.service'

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value)

/** Sửa hồ sơ công ty: mọi trường tùy chọn */
export class UpdateCompanyDto {
  @IsOptional() @Transform(trim) @IsString() @MinLength(2) @MaxLength(120) name?: string
  @IsOptional() @Transform(trim) @IsString() @MaxLength(120) industry?: string
  @IsOptional() @IsIn(Object.keys(DISTRICT_GEO)) district?: string
  @IsOptional() @Transform(trim) @IsString() @MaxLength(300) address?: string
  @IsOptional() @IsIn(COMPANY_SIZES) size?: (typeof COMPANY_SIZES)[number]
  @IsOptional() @Transform(trim) @IsString() @MaxLength(200) tagline?: string
  @IsOptional() @Transform(trim) @IsString() @MaxLength(4000) about?: string
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) @MaxLength(200, { each: true }) environment?: string[]
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) @MaxLength(200, { each: true }) values?: string[]
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) @MaxLength(200, { each: true }) policies?: string[]
  @IsOptional() @Transform(trim) @IsString() @MaxLength(4000) culture?: string
  // Được phép để trống
  @IsOptional() @Transform(trim) @ValidateIf((o) => o.email !== '') @IsEmail({}, { message: 'Email không hợp lệ' }) @MaxLength(254) email?: string
  @IsOptional() @Transform(trim) @IsString() @MaxLength(30) phone?: string
  @IsOptional() @ValidateNested() @Type(() => PhotoDto) cover?: PhotoDto
}

/** Hồ sơ công ty của nhà tuyển dụng đang đăng nhập */
@Controller('recruiter/company')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('recruiter')
export class CompanyController {
  constructor(private company: CompanyService) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.company.get(user)
  }

  @Patch()
  update(@CurrentUser() user: AuthUser, @Body() dto: UpdateCompanyDto) {
    return this.company.update(user, dto)
  }

  /** Gửi multipart/form-data, trường `file` (JPG/PNG/WEBP ≤ 2MB). Vượt giới hạn → multer trả 413 */
  @Post('logo')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: IMAGE_MAX_BYTES, files: 1 } }))
  setLogo(@CurrentUser() user: AuthUser, @UploadedFile() file: UploadedImage | undefined) {
    return this.company.setLogo(user, file)
  }

  @Delete('logo')
  removeLogo(@CurrentUser() user: AuthUser) {
    return this.company.removeLogo(user)
  }
}
