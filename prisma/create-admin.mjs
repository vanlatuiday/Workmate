// Tạo tài khoản quản trị đầu tiên và dòng cấu hình hệ thống mặc định trên database thật.
// Chạy: ADMIN_EMAIL=ban@congty.vn ADMIN_PASSWORD='...' npm run admin:create
// Không có API nào tạo được admin, đây là cách duy nhất. Chạy lại với email đã có thì báo lỗi, không ghi đè.
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const envFile = resolve(process.cwd(), '.env')
if (existsSync(envFile)) process.loadEnvFile(envFile)

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
const password = process.env.ADMIN_PASSWORD ?? ''
if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error('Cần ADMIN_EMAIL hợp lệ.')
  process.exit(1)
}
if (password.length < 12 || password.length > 72) {
  console.error('ADMIN_PASSWORD cần từ 12 đến 72 ký tự.')
  process.exit(1)
}

const prisma = new PrismaClient()
try {
  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) {
    console.error(`Email ${email} đã có tài khoản, không ghi đè.`)
    process.exitCode = 1
  } else {
    const passwordHash = await bcrypt.hash(password, 10)
    await prisma.user.create({ data: { email, passwordHash, role: 'admin', settings: { create: {} } } })
    await prisma.systemConfig.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        weights: { skills: 35, schedule: 25, salary: 16, distance: 14, jobType: 10 },
        bannedWords: ['đặt cọc', 'phí giữ chỗ', 'việc nhẹ lương cao', 'chuyển khoản trước'],
      },
    })
    console.log(`Đã tạo quản trị viên ${email}.`)
  }
} finally {
  await prisma.$disconnect()
}
