import './env'
import 'reflect-metadata'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import type { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module'
import { corsOrigin } from './common/cors'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  // Số lớp proxy phía trước (Cloudflare, Nginx…): cần để giới hạn tần suất thấy đúng IP người dùng.
  // Không đặt thì không tin header X-Forwarded-For, sau proxy mọi người sẽ chung một IP
  if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY))
  app.disable('x-powered-by')
  app.enableShutdownHooks()
  // Frontend gọi `${VITE_API_URL}` = http://localhost:8000/api (xem frontend/src/services/api.ts)
  app.setGlobalPrefix('api')
  app.enableCors({ origin: corsOrigin, credentials: true })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  const port = Number(process.env.PORT ?? 8000)
  await app.listen(port)
  console.log(`Workmate API: http://localhost:${port}/api`)
}
bootstrap()
