// Xóa hẳn tài khoản (không phải admin) cùng dữ liệu + file, dùng đúng logic "Xóa tài khoản" của web.
// Chạy trên máy chủ: npm run user:delete -- email1@gmail.com email2@gmail.com        (chỉ liệt kê)
//                    npm run user:delete -- email1@gmail.com --yes                  (xóa thật)
// Cũng xóa đăng ký đang chờ xác nhận email của các địa chỉ đó.
import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../src/app.module'
import { AccountService } from '../src/connections/account.service'
import { PrismaService } from '../src/prisma/prisma.service'

async function main() {
  const args = process.argv.slice(2)
  const yes = args.includes('--yes')
  const ids = args.filter((a) => a !== '--yes').map((a) => a.trim().toLowerCase()).filter(Boolean)
  if (!ids.length) {
    console.error('Cần ít nhất một email hoặc tên đăng nhập.')
    process.exit(1)
  }
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] })
  try {
    const prisma = app.get(PrismaService)
    const accounts = app.get(AccountService, { strict: false })
    for (const id of ids) {
      const user = await prisma.user.findFirst({
        where: { OR: [{ email: { equals: id, mode: 'insensitive' } }, { username: { equals: id, mode: 'insensitive' } }] },
        select: { id: true, email: true, role: true, memberships: { select: { company: { select: { name: true } } } } },
      })
      const pending = await prisma.pendingRegistration.count({ where: { email: { equals: id, mode: 'insensitive' } } })
      if (!user) {
        console.log(`${id}: không có tài khoản${pending ? `, ${pending} đăng ký đang chờ` : ''}`)
      } else {
        const company = user.memberships.map((m) => m.company.name).join(', ')
        console.log(`${user.email}: ${user.role}${company ? ` · công ty ${company}` : ''}${pending ? ` · ${pending} đăng ký đang chờ` : ''}`)
        if (user.role === 'admin') { console.log('  → bỏ qua: tài khoản quản trị viên'); continue }
      }
      if (!yes || (!user && !pending)) continue
      if (user) await accounts.deleteUser(user.id)
      if (pending) await prisma.pendingRegistration.deleteMany({ where: { email: { equals: id, mode: 'insensitive' } } })
      console.log('  → đã xóa')
    }
    if (!yes) console.log('\nChưa xóa gì. Thêm --yes để xóa thật (không khôi phục được).')
  } finally {
    await app.close()
  }
}

void main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1) })
