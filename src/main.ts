import './env'
import 'reflect-metadata'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { corsOrigin } from './common/cors'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  // Frontend gọi `${VITE_API_URL}` = http://localhost:8000/api (xem frontend/src/services/api.ts)
  app.setGlobalPrefix('api')
  app.enableCors({ origin: corsOrigin, credentials: true })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  const port = Number(process.env.PORT ?? 8000)
  await app.listen(port)
  console.log(`Workmate API: http://localhost:${port}/api`)
}
bootstrap()
