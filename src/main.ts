import './env'
import 'reflect-metadata'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  // Frontend gọi `${VITE_API_URL}` = http://localhost:8000/api (xem frontend/src/services/api.ts)
  app.setGlobalPrefix('api')
  // Trên máy (không phải production): nhận mọi cổng localhost — Vite tự đổi sang 5174, 5175… khi 5173 đã bận
  const allowed = (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map((s) => s.trim())
  const devLocal = process.env.NODE_ENV !== 'production' ? /^http:\/\/(localhost|127\.0\.0\.1|\[::1\]):\d+$/ : null
  app.enableCors({
    origin: (origin, cb) => cb(null, !origin || allowed.includes(origin) || !!devLocal?.test(origin)),
    credentials: true,
  })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  const port = Number(process.env.PORT ?? 8000)
  await app.listen(port)
  console.log(`Workmate API: http://localhost:${port}/api`)
}
bootstrap()
