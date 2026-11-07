import { Transform } from 'class-transformer'
import { IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator'

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value)

export class LoginDto {
  /** Email hoặc tên đăng nhập */
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(254)
  email!: string

  @IsString() @MinLength(1) @MaxLength(128)
  password!: string
}

export class RegisterDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Email không hợp lệ' }) @MaxLength(254)
  email!: string

  // Khớp quy tắc của form đăng ký (tối thiểu 8 ký tự). 72 = giới hạn byte của bcrypt
  @IsString() @MinLength(8, { message: 'Mật khẩu cần ít nhất 8 ký tự' }) @MaxLength(72)
  password!: string

  @IsIn(['jobseeker', 'recruiter'], { message: 'Vai trò không hợp lệ' })
  role!: 'jobseeker' | 'recruiter'

  @IsOptional() @Transform(trim) @IsString() @MaxLength(100)
  name?: string
}

export class ForgotPasswordDto {
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(254)
  email!: string
}

export class ResetPasswordDto {
  @Transform(trim) @IsString() @MinLength(1) @MaxLength(254)
  email!: string

  @Transform(trim) @Matches(/^\d{6}$/, { message: 'Mã không đúng hoặc đã hết hạn' })
  code!: string

  @IsString() @MinLength(6, { message: 'Mật khẩu mới cần ít nhất 6 ký tự' }) @MaxLength(72)
  newPassword!: string
}

export class ChangePasswordDto {
  @IsString() @MinLength(1) @MaxLength(128)
  currentPassword!: string

  @IsString() @MinLength(6, { message: 'Mật khẩu mới cần ít nhất 6 ký tự' }) @MaxLength(72)
  newPassword!: string
}
