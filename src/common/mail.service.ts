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

  sendPasswordReset(to: string, code: string, minutes: number): Promise<void> {
    return this.sendCode(to, code, minutes, {
      subject: `${code} là mã đặt lại mật khẩu Workmate của bạn`,
      lead: 'Dùng mã dưới đây để đặt lại mật khẩu của bạn:',
      ignore: 'Nếu bạn không yêu cầu, hãy bỏ qua email này. Mật khẩu của bạn vẫn giữ nguyên.',
    })
  }

  sendEmailVerification(to: string, code: string, minutes: number): Promise<void> {
    return this.sendCode(to, code, minutes, {
      subject: `${code} là mã xác nhận đăng ký Workmate của bạn`,
      lead: 'Dùng mã dưới đây để xác nhận email và hoàn tất đăng ký tài khoản:',
      ignore: 'Nếu bạn không đăng ký, hãy bỏ qua email này. Sẽ không có tài khoản nào được tạo.',
    })
  }

  private async sendCode(to: string, code: string, minutes: number, copy: { subject: string; lead: string; ignore: string }) {
    if (!this.transport) return
    const note = `Mã có hiệu lực trong ${minutes} phút và chỉ dùng được một lần. Đừng chia sẻ mã này cho ai.`
    await this.transport.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject: copy.subject,
      text: ['Chào bạn,', '', `${copy.lead} ${code}`, note, '', copy.ignore].join('\n'),
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#242522">
  <p style="font-size:18px;font-weight:600;margin:0 0 16px">Workmate</p>
  <p style="margin:0 0 16px">${copy.lead}</p>
  <p style="font-size:32px;font-weight:700;letter-spacing:8px;margin:0 0 16px;padding:16px;background:#F3F0E9;border-radius:8px;text-align:center">${code}</p>
  <p style="margin:0 0 8px">${note}</p>
  <p style="margin:0;color:#454640;font-size:14px">${copy.ignore}</p>
</div>`,
    })
  }
}
