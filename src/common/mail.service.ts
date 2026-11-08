import { Injectable } from '@nestjs/common'
import { createTransport, type Transporter } from 'nodemailer'

/**
 * Gửi email qua SMTP (đổi nhà cung cấp chỉ cần đổi biến SMTP_*).
 * Trên máy không cấu hình SMTP thì `enabled` = false và nơi gọi tự xử lý; production bắt buộc có (xem production-check).
 * Gmail: xem hướng dẫn trong `.env.example`.
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
      subject: `${code} là mã đặt lại mật khẩu Workmate của bạn`,
      text: [
        'Chào bạn,',
        '',
        `Mã xác nhận để đặt lại mật khẩu Workmate của bạn là: ${code}`,
        `Mã có hiệu lực trong ${minutes} phút và chỉ dùng được một lần. Đừng chia sẻ mã này cho ai.`,
        '',
        'Nếu bạn không yêu cầu, hãy bỏ qua email này. Mật khẩu của bạn vẫn giữ nguyên.',
      ].join('\n'),
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#242522">
  <p style="font-size:18px;font-weight:600;margin:0 0 16px">Workmate</p>
  <p style="margin:0 0 16px">Dùng mã dưới đây để đặt lại mật khẩu của bạn:</p>
  <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:0 0 16px;padding:16px;background:#F3F0E9;border-radius:8px;text-align:center">${code}</p>
  <p style="margin:0 0 8px">Mã có hiệu lực trong ${minutes} phút và chỉ dùng được một lần. Đừng chia sẻ mã này cho ai.</p>
  <p style="margin:0;color:#454640;font-size:14px">Nếu bạn không yêu cầu, hãy bỏ qua email này. Mật khẩu của bạn vẫn giữ nguyên.</p>
</div>`,
    })
  }
}
