/** Nguồn được gọi API / socket. Trên máy (không phải production) nhận mọi cổng localhost — Vite tự đổi sang 5174, 5175… khi 5173 đã bận */
export function corsOrigin(origin: string | undefined, cb: (err: Error | null, allow?: boolean) => void) {
  const allowed = (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map((s) => s.trim())
  const devLocal = process.env.NODE_ENV !== 'production' ? /^http:\/\/(localhost|127\.0\.0\.1|\[::1\]):\d+$/ : null
  cb(null, !origin || allowed.includes(origin) || !!devLocal?.test(origin))
}
