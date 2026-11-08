import { Injectable, NotFoundException } from '@nestjs/common'
import type { NotificationKind } from '@prisma/client'
import type { AuthUser } from '../auth/current-user.decorator'
import { PrismaService } from '../prisma/prisma.service'
import { sideOf } from './pair.service'

const PAGE = 100

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  /** Thông báo mới nhất + số chưa đọc; loại đã tắt trong Cài đặt thì không hiện và không tính */
  async list(user: AuthUser) {
    const settings = await this.prisma.userSettings.findUnique({ where: { userId: user.id }, select: { notify: true } })
    const muted = Object.entries((settings?.notify ?? {}) as Record<string, boolean>).filter(([, on]) => on === false).map(([k]) => k as NotificationKind)
    const where = { userId: user.id, kind: { notIn: muted } }
    const [rows, unread] = await Promise.all([
      this.prisma.notification.findMany({ where, orderBy: [{ at: 'desc' }, { id: 'desc' }], take: PAGE }),
      this.prisma.notification.count({ where: { ...where, read: false } }),
    ])
    const to = sideOf(user)
    return {
      unread,
      items: rows.map((n) => ({ id: n.id, to, kind: n.kind, jobId: n.jobId, seekerId: n.seekerId, at: n.at.toISOString(), read: n.read })),
    }
  }

  async markRead(user: AuthUser, id: string) {
    const { count } = await this.prisma.notification.updateMany({ where: { id, userId: user.id }, data: { read: true } })
    if (!count) throw new NotFoundException('Không tìm thấy thông báo')
    return { ok: true }
  }

  async markAllRead(user: AuthUser) {
    await this.prisma.notification.updateMany({ where: { userId: user.id, read: false }, data: { read: true } })
    return { ok: true }
  }
}
