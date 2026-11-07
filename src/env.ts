/*
 * Nạp file .env (Nest không tự nạp). Phải được import đầu tiên trong main.ts.
 * Dùng loadEnvFile có sẵn của Node ≥ 20.12 nên không cần thêm package.
 */
import { existsSync } from 'fs'
import { resolve } from 'path'

const file = resolve(process.cwd(), '.env')
if (existsSync(file)) {
  const load = (process as unknown as { loadEnvFile?: (p: string) => void }).loadEnvFile
  load?.call(process, file)
}
