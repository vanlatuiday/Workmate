// Kiểm tra cấu hình SMTP (vd. Gmail): đăng nhập máy chủ thư rồi gửi một thư thử.
// Chạy: MAIL_TEST_TO=ban@gmail.com npm run mail:test
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createTransport } from 'nodemailer'

const envFile = resolve(process.cwd(), '.env')
if (existsSync(envFile)) process.loadEnvFile(envFile)
const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, MAIL_TEST_TO } = process.env

if (!SMTP_HOST || !SMTP_FROM) {
  console.error('Thiếu SMTP_HOST hoặc SMTP_FROM trong .env')
  process.exit(1)
}
const to = MAIL_TEST_TO || SMTP_USER
if (!to) {
  console.error('Cần MAIL_TEST_TO (địa chỉ nhận thư thử).')
  process.exit(1)
}
const transport = createTransport({
  host: SMTP_HOST,
  port: Number(SMTP_PORT ?? 587),
  secure: SMTP_SECURE === 'true',
  ...(SMTP_USER ? { auth: { user: SMTP_USER, pass: SMTP_PASSWORD } } : {}),
})
try {
  await transport.verify()
  console.log(`Kết nối và đăng nhập ${SMTP_HOST} thành công.`)
  await transport.sendMail({ from: SMTP_FROM, to, subject: 'Workmate: thư thử', text: 'Cấu hình email của Workmate hoạt động. Bạn có thể xóa thư này.' })
  console.log(`Đã gửi thư thử tới ${to}. Kiểm tra hộp thư, kể cả mục Thư rác.`)
} catch (e) {
  console.error('Chưa gửi được:', e.message)
  if (/Username and Password not accepted|Invalid login|535/i.test(e.message)) {
    console.error('Với Gmail: SMTP_PASSWORD phải là Mật khẩu ứng dụng 16 ký tự, không phải mật khẩu đăng nhập Gmail.')
  }
  process.exitCode = 1
}
