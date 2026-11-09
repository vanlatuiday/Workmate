import type { ExecutionContext } from '@nestjs/common'
import type { ThrottlerModuleOptions } from '@nestjs/throttler'

const MINUTE = 60_000
const HOUR = 3_600_000

/** Tên tài khoản trong body (đăng nhập bằng email hoặc tên đăng nhập); dữ liệu chưa qua kiểm tra nên phải thử kiểu */
const accountOf = (req: Record<string, any>): string | null =>
  typeof req.body?.email === 'string' && req.body.email.trim() ? req.body.email.trim().toLowerCase() : null

const hasAccount = (ctx: ExecutionContext) => !!accountOf(ctx.switchToHttp().getRequest())

/**
 * Ba bộ đếm, mỗi đường dẫn đếm riêng:
 * - `phut`, `gio`: theo IP, chặn dò hàng loạt. Giá trị dưới đây là mặc định, từng route ghi đè bằng @Throttle.
 * - `tai_khoan`: theo tài khoản nhập vào, chặn dò một người dù đổi IP. Không có tài khoản trong body thì bỏ qua.
 *
 * Bộ đếm nằm trong bộ nhớ của tiến trình: chạy nhiều máy chủ thì cần kho chung (Redis).
 * Lên mạng sau proxy phải bật `trust proxy` đúng số lớp, nếu không mọi người dùng chung một IP.
 * Hiện không bật nên header X-Forwarded-For không có tác dụng và không giả được IP.
 */
export const THROTTLE_OPTIONS: ThrottlerModuleOptions = {
  throttlers: [
    { name: 'phut', ttl: MINUTE, limit: 5 },
    { name: 'gio', ttl: HOUR, limit: 20 },
    { name: 'tai_khoan', ttl: HOUR, limit: 5, skipIf: (ctx) => !hasAccount(ctx), getTracker: (req) => accountOf(req) ?? '' },
  ],
  errorMessage: 'Bạn thao tác quá nhiều lần, vui lòng thử lại sau ít phút.',
}

const ipLimits = (perMinute: number, perHour: number) => ({
  phut: { limit: perMinute, ttl: MINUTE },
  gio: { limit: perHour, ttl: HOUR },
})

/** Giới hạn của từng thao tác đăng nhập / tài khoản — dùng với @Throttle */
export const AUTH_LIMITS = {
  login: {
    // IP chung (trường học, quán cà phê) vẫn đủ chỗ cho nhiều người đăng nhập
    ...ipLimits(20, 100),
    // Theo cặp IP + tài khoản: người lạ bấm sai liên tục không khóa được chủ tài khoản ở nơi khác
    tai_khoan: {
      limit: 10,
      ttl: 15 * MINUTE,
      getTracker: (req: Record<string, any>) => `${req.ip}|${accountOf(req) ?? ''}`,
    },
  },
  /** Mỗi lần xin là một mã mới và hủy mã cũ, nên giới hạn theo tài khoản bất kể IP */
  forgot: { ...ipLimits(10, 30), tai_khoan: { limit: 5, ttl: HOUR } },
  /** Mã 6 số, mỗi mã sai 5 lần là hủy; giới hạn này chặn tổng số lần đoán của một tài khoản */
  reset: { ...ipLimits(20, 60), tai_khoan: { limit: 10, ttl: 15 * MINUTE } },
  /** Mỗi lần gửi một thư: giới hạn theo email để không ai dùng web này spam hộp thư người khác */
  register: { ...ipLimits(5, 20), tai_khoan: { limit: 5, ttl: HOUR } },
  resendVerification: { ...ipLimits(10, 30), tai_khoan: { limit: 5, ttl: HOUR } },
  /** Mã 6 số, sai 5 lần là hủy bản chờ */
  verifyEmail: { ...ipLimits(20, 60), tai_khoan: { limit: 10, ttl: 15 * MINUTE } },
  changePassword: ipLimits(10, 30),
  /** Cần mật khẩu nên cũng là chỗ dò được mật khẩu nếu lộ phiên */
  deleteAccount: ipLimits(5, 20),
}
