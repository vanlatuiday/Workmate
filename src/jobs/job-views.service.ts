import { Injectable, NotFoundException, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common'
import { createHmac } from 'crypto'
import type { AuthUser } from '../auth/current-user.decorator'
import { VISIBLE_WHERE } from '../catalog/catalog.service'
import { PrismaService } from '../prisma/prisma.service'

const DAY_MS = 86_400_000
/** Ngày theo giờ Việt Nam, dạng Date nửa đêm UTC cho cột @db.Date */
const vnDay = (now: Date) => new Date(now.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }))

/**
 * Đếm lượt xem trang chi tiết tin. Mỗi người xem (tài khoản, hoặc IP với khách) tính tối đa 1 lần/tin/ngày.
 * Không tính người trong công ty đăng tin và admin; chỉ tính tin đang hiển thị công khai.
 */
@Injectable()
export class JobViewsService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.prune(), 6 * 3_600_000)
    this.timer.unref()
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer)
  }

  async record(jobId: string, user: AuthUser | null, ip: string | undefined): Promise<{ counted: boolean }> {
    const job = await this.prisma.job.findFirst({ where: { id: jobId, ...VISIBLE_WHERE }, select: { companyId: true } })
    if (!job) throw new NotFoundException('Không tìm thấy tin tuyển dụng')
    if (user?.role === 'admin') return { counted: false }
    if (user?.role === 'recruiter' && (await this.prisma.companyMember.count({ where: { companyId: job.companyId, userId: user.id } }))) {
      return { counted: false }
    }
    // IP băm bằng khóa bí mật: không lưu IP thật, không dò ngược được
    const viewerKey = user ? `u:${user.id}` : `ip:${createHmac('sha256', process.env.JWT_SECRET ?? 'workmate').update(ip ?? '').digest('hex').slice(0, 32)}`
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.jobView.createMany({ data: [{ jobId, viewerKey, day: vnDay(new Date()) }], skipDuplicates: true })
      if (count) await tx.job.update({ where: { id: jobId }, data: { viewCount: { increment: 1 } } })
      return { counted: count > 0 }
    })
  }

  /** Chỉ cần dữ liệu hôm nay để chống trùng; giữ thêm 1 ngày cho chắc */
  async prune(now = new Date()) {
    try {
      await this.prisma.jobView.deleteMany({ where: { day: { lt: new Date(vnDay(now).getTime() - DAY_MS) } } })
    } catch (e) {
      console.warn('Không dọn được bảng lượt xem:', (e as Error).message)
    }
  }
}
