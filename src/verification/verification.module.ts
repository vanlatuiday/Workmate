import { Module } from '@nestjs/common'
import { AdminVerificationController, RecruiterVerificationController } from './verification.controller'
import { VerificationService } from './verification.service'

@Module({ controllers: [RecruiterVerificationController, AdminVerificationController], providers: [VerificationService] })
export class VerificationModule {}
