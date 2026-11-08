import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import {
  AdminPairsController, CandidateMarksController, CandidatesController, ConnectionsController, HiresController, InterviewsController, MessagesController,
  NotificationsController, ReviewsController, SavedJobsController,
} from './connections.controller'
import { CandidatesService } from './candidates.service'
import { ConnectionsService } from './connections.service'
import { HiresService } from './hires.service'
import { InterviewsService } from './interviews.service'
import { MessagesService } from './messages.service'
import { NotificationsService } from './notifications.service'
import { PairService } from './pair.service'
import { RealtimeGateway } from './realtime.gateway'
import { ReviewsService } from './reviews.service'

/** Mọi thứ gắn với cặp (tin, người tìm việc): quan tâm, kết nối, tin nhắn, phỏng vấn, nhận việc, đánh giá, thông báo */
@Module({
  imports: [AuthModule],
  controllers: [
    ConnectionsController, SavedJobsController, CandidateMarksController, MessagesController,
    InterviewsController, HiresController, ReviewsController, NotificationsController,
    CandidatesController, AdminPairsController,
  ],
  providers: [RealtimeGateway, PairService, CandidatesService, ConnectionsService, MessagesService, InterviewsService, HiresService, ReviewsService, NotificationsService],
})
export class ConnectionsModule {}
