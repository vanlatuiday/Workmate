import { Module } from '@nestjs/common'
import { CandidateCvController, CvController } from './cv.controller'
import { CvService } from './cv.service'

@Module({ controllers: [CvController, CandidateCvController], providers: [CvService] })
export class CvModule {}
