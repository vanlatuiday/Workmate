import { ExecutionContext, Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

/**
 * Đăng nhập tùy chọn: có token hợp lệ thì gắn `request.user`, không có / sai / hết hạn / tài khoản bị khóa
 * thì coi là khách (user = null) và vẫn cho đi tiếp. Dùng cho các endpoint công khai có nội dung theo người xem.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Lỗi xác thực không chặn request
  handleRequest<T>(_err: unknown, user: T | false | null): T | null {
    return user || null
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    await super.canActivate(ctx)
    return true
  }
}
