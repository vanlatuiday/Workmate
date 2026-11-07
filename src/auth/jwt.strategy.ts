import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import type { Role } from '@prisma/client'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { PrismaService } from '../prisma/prisma.service'
import type { AuthUser } from './current-user.decorator'

/** Đọc Bearer token, rồi tra DB để chặn tài khoản đã xóa / bị khóa dù token còn hạn */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET as string,
    })
  }

  async validate(payload: { sub: string; role: Role }): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub }, select: { id: true, email: true, role: true, status: true } })
    if (!user) throw new UnauthorizedException('Phiên đăng nhập không hợp lệ')
    if (user.status === 'locked') throw new ForbiddenException('Tài khoản đã bị khóa')
    return { id: user.id, email: user.email, role: user.role }
  }
}
