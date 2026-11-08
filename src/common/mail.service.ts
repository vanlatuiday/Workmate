import { Injectable } from '@nestjs/common'
import { createTransport, type Transporter } from 'nodemailer'

/**
 * Gửi email qua SMTP (đổi nhà cung cấp chỉ cần đổi biến SMTP_*).
 * Trên máy không cấu hình SMTP thì `enabled` = false và nơi gọi tự xử lý; production bắt buộc có (xem production-check).
 */
@Injectable()
export class MailService {
  private transport: Transporter | null = process.env.SMTP_HOST
    ? createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: process.env.SMTP_SECURE === 'true',
        ...(process.env.SMTP_USER ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } } : {}),
      })
    : null

  get enabled() {
    return !!this.transport
  }

  async sendPasswordReset(to: string, code: string, minutes: number): Promise<void> {
    if (!this.transport) return
    await this.transport.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: `Mã đặt lại mật khẩu Workmate: ${code}`,
      text: [
        'Chào bạn,',
        '',
        `Mã đặt lại mật khẩu Workmate của bạn là: ${code}`,
        `Mã có hiệu lực trong ${minutes} phút và chỉ dùng được một lần.`,
        '',
        'Nếu bạn không yêu cầu, hãy bỏ qua email này. Mật khẩu của bạn vẫn giữ nguyên.',
      ].join('\n'),
    })
  }
}
