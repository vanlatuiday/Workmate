import { Module } from '@nestjs/common'
import { JwtModule, type JwtSignOptions } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { JwtStrategy } from './jwt.strategy'
import { RolesGuard } from './roles.guard'

if (!process.env.JWT_SECRET) throw new Error('Thiếu JWT_SECRET trong .env')

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as JwtSignOptions['expiresIn'] },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard],
  exports: [AuthService, RolesGuard, JwtModule],
})
export class AuthModule {}
