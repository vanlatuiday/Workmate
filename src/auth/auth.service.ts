import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Prisma, type Role, type User } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { randomInt } from 'crypto'
import { MailService } from '../common/mail.service'
import { PrismaService } from '../prisma/prisma.service'
import type { RegisterDto } from './dto/auth.dto'

const BCRYPT_COST = 10
const RESET_TTL_MS = 15 * 60 * 1000
const MAX_RESET_ATTEMPTS = 5
const BAD_RESET = 'Mã không đúng hoặc đã hết hạn'

// Hash giả để so sánh khi không có người dùng — thời gian phản hồi gần như nhau, không lộ tài khoản nào tồn tại
const DUMMY_HASH = bcrypt.hashSync('workmate-dummy-password', BCRYPT_COST)

export interface AuthUserDto {
  id: string
  email: string
  role: Role
  createdAt: string
  username: string | null
  displayName: string
}

/** Chuyển slug tiếng Việt → ASCII gạch nối */
function slugify(name: string): string {
  return name
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    .slice(0, 50)
}

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService, private mail: MailService) {}

  /** Tìm theo email hoặc tên đăng nhập, không phân biệt hoa thường */
  private findByIdentifier(identifier: string) {
    return this.prisma.user.findFirst({
      where: { OR: [{ email: { equals: identifier, mode: 'insensitive' } }, { username: { equals: identifier, mode: 'insensitive' } }] },
    })
  }

  /** Tên hiển thị: họ tên người tìm việc / tên công ty / "Quản trị viên" */
  private async toDto(user: User): Promise<AuthUserDto> {
    let displayName = 'Quản trị viên'
    if (user.role === 'jobseeker') {
      const p = await this.prisma.seekerProfile.findUnique({ where: { userId: user.id }, select: { fullName: true } })
      displayName = p?.fullName || user.email.split('@')[0]
    } else if (user.role === 'recruiter') {
      const m = await this.prisma.companyMember.findFirst({ where: { userId: user.id }, select: { company: { select: { name: true } } } })
      displayName = m?.company.name || user.email.split('@')[0]
    }
    return { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt.toISOString(), username: user.username, displayName }
  }

  private async issue(user: User) {
    return { user: await this.toDto(user), token: await this.jwt.signAsync({ sub: user.id, role: user.role }) }
  }

  async login(identifier: string, password: string) {
    const user = await this.findByIdentifier(identifier)
    const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH)
    if (!user || !ok) throw new UnauthorizedException('Sai tên đăng nhập hoặc mật khẩu')
    // Kiểm tra khóa SAU khi mật khẩu đúng để người lạ không dò được tài khoản nào bị khóa
    if (user.status === 'locked') throw new ForbiddenException('Tài khoản đã bị khóa')
    return this.issue(user)
  }

  async register(dto: RegisterDto) {
    const cfg = await this.prisma.systemConfig.findUnique({ where: { id: 1 }, select: { registrationOpen: true } })
    if (cfg && !cfg.registrationOpen) throw new ForbiddenException('Workmate tạm dừng đăng ký tài khoản mới')

    const exists = await this.prisma.user.findFirst({ where: { OR: [{ email: dto.email }, { username: { equals: dto.email, mode: 'insensitive' } }] }, select: { id: true } })
    if (exists) throw new ConflictException('Email đã được dùng')

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_COST)
    const name = dto.name?.trim() || dto.email.split('@')[0]
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const u = await tx.user.create({ data: { email: dto.email, passwordHash, role: dto.role } })
        if (dto.role === 'jobseeker') {
          await tx.seekerProfile.create({ data: { userId: u.id, fullName: name } })
        } else {
          // slug từ tên; trùng hoặc rỗng thì dùng mã ngẫu nhiên
          let slug = slugify(name)
          if (!slug || (await tx.company.findUnique({ where: { slug }, select: { id: true } }))) slug = `cty-${u.id}`
          const company = await tx.company.create({ data: { slug, name } })
          await tx.companyMember.create({ data: { companyId: company.id, userId: u.id, role: 'owner' } })
        }
        await tx.userSettings.create({ data: { userId: u.id } })
        return u
      })
      return this.issue(user)
    } catch (e) {
      // Hai yêu cầu đăng ký cùng email chạy song song
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') throw new ConflictException('Email đã được dùng')
      throw e
    }
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new UnauthorizedException('Phiên đăng nhập không hợp lệ')
    return this.toDto(user)
  }

  /**
   * Quên mật khẩu: luôn trả { ok: true }, thời gian phản hồi như nhau, để không lộ tài khoản nào tồn tại.
   * Email gửi ở nền vì SMTP chậm hơn hẳn và lỗi gửi không được làm khác phản hồi.
   */
  async forgotPassword(identifier: string) {
    const user = await this.findByIdentifier(identifier)
    const code = String(randomInt(100000, 1000000))
    const codeHash = await bcrypt.hash(code, BCRYPT_COST)
    if (!user || user.status !== 'active') return { ok: true }
    await this.prisma.$transaction([
      // Hủy các mã cũ chưa dùng
      this.prisma.passwordReset.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } }),
      this.prisma.passwordReset.create({ data: { userId: user.id, codeHash, expiresAt: new Date(Date.now() + RESET_TTL_MS) } }),
    ])
    if (this.mail.enabled) {
      this.mail.sendPasswordReset(user.email, code, RESET_TTL_MS / 60_000).catch((e) => {
        // Không ghi địa chỉ email và mã vào log
        console.error(`[auth] Không gửi được email đặt lại mật khẩu cho tài khoản ${user.id}:`, (e as Error).message)
      })
    }
    // CẢNH BÁO BẢO MẬT: chỉ trên máy cá nhân mới được hiện mã (frontend hiện trên màn hình khi chưa cấu hình email).
    // Trả mã về client trên production thì ai gọi API cũng đặt lại được mật khẩu người khác.
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[auth] Mã đặt lại mật khẩu của ${user.email}: ${code} (hiệu lực 15 phút)`)
      return { ok: true, devCode: code }
    }
    return { ok: true }
  }

  async resetPassword(identifier: string, code: string, newPassword: string) {
    const user = await this.findByIdentifier(identifier)
    const reset = user
      ? await this.prisma.passwordReset.findFirst({
          where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() }, attempts: { lt: MAX_RESET_ATTEMPTS } },
          orderBy: { createdAt: 'desc' },
        })
      : null
    const ok = await bcrypt.compare(code, reset?.codeHash ?? DUMMY_HASH)
    if (!user || !reset || user.status !== 'active') throw new BadRequestException(BAD_RESET)
    if (!ok) {
      // Đếm lần sai; đủ 5 lần thì hủy mã
      const attempts = reset.attempts + 1
      await this.prisma.passwordReset.update({
        where: { id: reset.id },
        data: { attempts, ...(attempts >= MAX_RESET_ATTEMPTS ? { usedAt: new Date() } : {}) },
      })
      throw new BadRequestException(BAD_RESET)
    }
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST)
    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: user.id }, data: { passwordHash } }),
      this.prisma.passwordReset.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } }),
    ])
    return { ok: true }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new UnauthorizedException('Phiên đăng nhập không hợp lệ')
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) throw new BadRequestException('Mật khẩu hiện tại chưa đúng')
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(newPassword, BCRYPT_COST) } })
    return { ok: true }
  }
}
