/**
 * Khi NODE_ENV=production: kiểm tra cấu hình ngay lúc khởi động, thiếu hoặc sai thì dừng hẳn
 * (thà không chạy còn hơn chạy với mật khẩu mẫu hoặc không gửi được email). Chỉ in tên biến, không in giá trị.
 */
const REQUIRED = [
  'DATABASE_URL', 'JWT_SECRET', 'CORS_ORIGIN',
  'STORAGE_ENDPOINT', 'STORAGE_ACCESS_KEY', 'STORAGE_SECRET_KEY', 'STORAGE_PUBLIC_URL',
  'SMTP_HOST', 'SMTP_FROM',
]

const isHttps = (url: string) => /^https:\/\//.test(url)

export function productionProblems(env: NodeJS.ProcessEnv = process.env): string[] {
  const problems = REQUIRED.filter((k) => !env[k]?.trim()).map((k) => `Thiếu ${k}`)
  const secret = env.JWT_SECRET ?? ''
  if (secret && (secret.length < 32 || secret.startsWith('doi-thanh'))) problems.push('JWT_SECRET phải là chuỗi ngẫu nhiên dài ít nhất 32 ký tự')
  if (env.DATABASE_URL?.includes('workmate_dev')) problems.push('DATABASE_URL đang dùng mật khẩu của máy cá nhân')
  const origins = (env.CORS_ORIGIN ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  if (origins.some((o) => !isHttps(o))) problems.push('CORS_ORIGIN phải là địa chỉ https của frontend')
  if (env.STORAGE_PUBLIC_URL && !isHttps(env.STORAGE_PUBLIC_URL)) problems.push('STORAGE_PUBLIC_URL phải là địa chỉ https')
  if (env.TRUST_PROXY && !/^\d+$/.test(env.TRUST_PROXY)) problems.push('TRUST_PROXY phải là số lớp proxy phía trước máy chủ (vd. 1)')
  return problems
}

export function assertProductionConfig() {
  if (process.env.NODE_ENV !== 'production') return
  const problems = productionProblems()
  if (!problems.length) return
  console.error(`Không khởi động được, cấu hình production chưa đúng:\n${problems.map((p) => `  - ${p}`).join('\n')}`)
  process.exit(1)
}
