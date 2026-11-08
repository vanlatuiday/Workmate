import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common'
import { SkipThrottle, Throttle, ThrottlerGuard } from '@nestjs/throttler'
import { AUTH_LIMITS } from '../common/throttle'
import { AuthService } from './auth.service'
import { CurrentUser, type AuthUser } from './current-user.decorator'
import { ChangePasswordDto, ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from './dto/auth.dto'
import { JwtAuthGuard } from './jwt-auth.guard'

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login') @HttpCode(200) @UseGuards(ThrottlerGuard) @Throttle(AUTH_LIMITS.login)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password)
  }

  @Post('register') @HttpCode(200) @UseGuards(ThrottlerGuard) @Throttle(AUTH_LIMITS.register) @SkipThrottle({ tai_khoan: true })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto)
  }

  @Get('me') @UseGuards(JwtAuthGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id)
  }

  @Post('forgot-password') @HttpCode(200) @UseGuards(ThrottlerGuard) @Throttle(AUTH_LIMITS.forgot)
  forgot(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email)
  }

  @Post('reset-password') @HttpCode(200) @UseGuards(ThrottlerGuard) @Throttle(AUTH_LIMITS.reset)
  reset(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.email, dto.code, dto.newPassword)
  }

  @Post('change-password') @HttpCode(200) @UseGuards(ThrottlerGuard, JwtAuthGuard) @Throttle(AUTH_LIMITS.changePassword) @SkipThrottle({ tai_khoan: true })
  change(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(user.id, dto.currentPassword, dto.newPassword)
  }

  /** JWT không lưu phía máy chủ: frontend chỉ cần bỏ token */
  @Post('logout') @HttpCode(200)
  logout() {
    return { ok: true }
  }
}
