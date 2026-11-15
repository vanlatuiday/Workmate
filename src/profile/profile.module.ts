import { Module } from '@nestjs/common'
import { ProfileController } from './profile.controller'
import { ProfileService } from './profile.service'
import { SeekerStatsController } from './seeker-stats.controller'
import { SeekerStatsService } from './seeker-stats.service'

@Module({ controllers: [ProfileController, SeekerStatsController], providers: [ProfileService, SeekerStatsService] })
export class ProfileModule {}
