import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { Role } from '@prisma/client'

/** Người dùng đã xác thực, gắn vào request bởi JwtStrategy */
export interface AuthUser {
  id: string
  email: string
  role: Role
}

/** Lấy người dùng hiện tại trong controller: `@CurrentUser() user: AuthUser` */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
  return ctx.switchToHttp().getRequest().user
})
