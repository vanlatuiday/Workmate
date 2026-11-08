import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import * as bcrypt from 'bcryptjs'
import type { AuthUser } from '../auth/current-user.decorator'
import { StorageService } from '../common/storage.service'
import { PrismaService } from '../prisma/prisma.service'
import { RealtimeGateway } from './realtime.gateway'

const photoUrl = (photo: unknown) => (photo as { url?: string } | null)?.url

/** Người dùng tự xóa tài khoản: xóa thật dữ liệu cá nhân và file, không thể khôi phục */
@Injectable()
export class AccountService {
  constructor(private prisma: PrismaService, private storage: StorageService, private realtime: RealtimeGateway) {}

  /**
   * Khóa ngoại trong DB xóa dây chuyền: tài khoản → hồ sơ → CV, quan tâm, kết nối, tin nhắn, phỏng vấn, nhận việc, đánh giá, thông báo.
   * Doanh nghiệp là người quản lý duy nhất thì xóa cả công ty và các tin; còn người khác quản lý thì công ty ở lại.
   * Báo cáo vi phạm người này từng gửi vẫn giữ cho quản trị viên, chỉ bỏ liên kết tới người báo.
   */
  async deleteOwn(user: AuthUser, password: string) {
    // Giữ hệ thống luôn có người quản trị; muốn gỡ admin thì thao tác trực tiếp trên database
    if (user.role === 'admin') throw new ForbiddenException('Không thể tự xóa tài khoản quản trị viên')
    const row = await this.prisma.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } })
    if (!row) throw new UnauthorizedException('Phiên đăng nhập không hợp lệ')
    if (!(await bcrypt.compare(password, row.passwordHash))) throw new BadRequestException('Mật khẩu chưa đúng')

    const privateKeys: string[] = []
    const publicUrls: (string | null | undefined)[] = []
    // Người ở phía bên kia, để họ cập nhật lại danh sách ngay: userId → một cặp bất kỳ
    const affected = new Map<string, { jobId: string; seekerId: string }>()

    await this.prisma.$transaction(async (tx) => {
      const seeker = await tx.seekerProfile.findUnique({
        where: { userId: user.id },
        select: {
          avatarUrl: true,
          cvs: { select: { fileKey: true } },
          interests: { select: { jobId: true, seekerId: true, job: { select: { company: { select: { members: { select: { userId: true } } } } } } } },
        },
      })
      if (seeker) {
        publicUrls.push(seeker.avatarUrl)
        privateKeys.push(...seeker.cvs.map((c) => c.fileKey))
        for (const i of seeker.interests) for (const m of i.job.company.members) affected.set(m.userId, { jobId: i.jobId, seekerId: i.seekerId })
      }

      const memberships = await tx.companyMember.findMany({ where: { userId: user.id }, select: { companyId: true } })
      for (const { companyId } of memberships) {
        const others = await tx.companyMember.count({ where: { companyId, userId: { not: user.id } } })
        if (others) continue
        const company = await tx.company.findUniqueOrThrow({
          where: { id: companyId },
          select: {
            logoUrl: true, coverPhoto: true,
            jobs: { select: { id: true, photo: true, interests: { select: { seekerId: true } } } },
          },
        })
        publicUrls.push(company.logoUrl, photoUrl(company.coverPhoto))
        for (const j of company.jobs) {
          publicUrls.push(photoUrl(j.photo))
          for (const i of j.interests) affected.set(i.seekerId, { jobId: j.id, seekerId: i.seekerId })
        }
        await tx.company.delete({ where: { id: companyId } })
      }

      await tx.user.delete({ where: { id: user.id } })
    })

    // Dữ liệu đã xóa xong; lỗi xóa file chỉ ghi log (StorageService tự xử lý), không làm hỏng thao tác
    await Promise.all([
      ...privateKeys.map((k) => this.storage.deletePrivate(k)),
      ...publicUrls.map((u) => this.storage.publicKeyOf(u)).filter((k): k is string => !!k).map((k) => this.storage.deletePublic(k)),
    ])
    this.realtime.disconnectUser(user.id)
    affected.delete(user.id)
    for (const [userId, pair] of affected) this.realtime.toUsers([userId], 'pair:changed', pair)
    return { ok: true }
  }
}
