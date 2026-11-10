import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

const TICK_MS = 60_000

/**
 * Đóng tin quá hạn nhận ứng viên (đang mở hoặc tạm dừng → đã đóng), kiểm tra mỗi phút và ngay khi khởi động.
 * Tin đã đóng không còn hiện công khai, không nhận ứng tuyển; cặp đã kết nối vẫn nhắn tin, phỏng vấn tiếp được.
 * Cố ý không gửi thông báo: đơn đang chờ vẫn giữ nguyên, người tìm việc thấy tin "đã ngừng hiển thị" ở trang chi tiết.
 */
@Injectable()
export class JobExpiryService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout

  constructor(private prisma: PrismaService) {}

  onModuleInit() {
    void this.closeExpired()
    this.timer = setInterval(() => void this.closeExpired(), TICK_MS)
    this.timer.unref()
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer)
  }

  async closeExpired(now = new Date()): Promise<number> {
    try {
      const { count } = await this.prisma.job.updateMany({
        where: { status: { in: ['open', 'paused'] }, expiresAt: { lte: now } },
        data: { status: 'closed' },
      })
      return count
    } catch (e) {
      console.warn('Không đóng được tin hết hạn:', (e as Error).message)
      return 0
    }
  }
}
