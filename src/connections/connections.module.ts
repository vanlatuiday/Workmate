import { Module } from '@nestjs/common'
import { AuthModule } from '../auth/auth.module'
import {
  AccountController, AdminPairsController, CandidateMarksController, CandidatesController, ConnectionsController, HiresController, InterviewsController, MessagesController,
  NotificationsController, ReviewsController, SavedJobsController,
} from './connections.controller'
import { AccountService } from './account.service'
import { CandidatesService } from './candidates.service'
import { ConnectionsService } from './connections.service'
import { HiresService } from './hires.service'
import { InterviewsService } from './interviews.service'
import { MessagesService } from './messages.service'
import { NotificationMailService } from './notification-mail.service'
import { NotificationsService } from './notifications.service'
import { PairService } from './pair.service'
import { RealtimeGateway } from './realtime.gateway'
import { ReviewsService } from './reviews.service'
import { MatchAlertService } from '../matching/match-alert.service'
import { MatchingController } from '../matching/matching.controller'
import { MatchingService } from '../matching/matching.service'

/** Mọi thứ gắn với cặp (tin, người tìm việc): quan tâm, kết nối, tin nhắn, phỏng vấn, nhận việc, đánh giá, thông báo */
@Module({
  imports: [AuthModule],
  controllers: [
    ConnectionsController, SavedJobsController, CandidateMarksController, MessagesController,
    InterviewsController, HiresController, ReviewsController, NotificationsController,
    CandidatesController, AdminPairsController, AccountController, MatchingController,
  ],
  providers: [RealtimeGateway, PairService, AccountService, CandidatesService, ConnectionsService, MessagesService, InterviewsService, HiresService, ReviewsService, NotificationsService, NotificationMailService,
    // Điểm phù hợp phía máy chủ + thông báo việc/ứng viên mới (cần RealtimeGateway nên đặt chung module)
    MatchingService, MatchAlertService],
})
export class ConnectionsModule {}
