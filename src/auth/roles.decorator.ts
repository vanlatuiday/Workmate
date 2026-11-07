import { SetMetadata } from '@nestjs/common'
import type { Role } from '@prisma/client'

export const ROLES_KEY = 'roles'
/** Giới hạn theo vai trò, dùng cùng JwtAuthGuard + RolesGuard: `@Roles('admin')` */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles)
