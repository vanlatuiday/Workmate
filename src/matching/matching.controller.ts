import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { MatchingService } from './matching.service'

/** Điểm phù hợp tính trên máy chủ (xem matching.service.ts) */
@Controller('matching')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MatchingController {
  constructor(private matching: MatchingService) {}

  /** Tin đang hiển thị chấm cho tôi (người tìm việc), điểm cao trước */
  @Get('jobs')
  @Roles('jobseeker')
  jobs(@CurrentUser() user: AuthUser) {
    return this.matching.jobsForSeeker(user)
  }

  /** Ứng viên chấm theo mọi tin của công ty tôi: { weights, jobs: { [jobId]: items } } */
  @Get('candidates')
  @Roles('recruiter')
  allCandidates(@CurrentUser() user: AuthUser) {
    return this.matching.candidatesForCompany(user)
  }

  /** Ứng viên chấm theo một tin của công ty tôi, điểm cao trước */
  @Get('jobs/:jobId/candidates')
  @Roles('recruiter')
  candidates(@CurrentUser() user: AuthUser, @Param('jobId') jobId: string) {
    return this.matching.candidatesForJob(user, jobId)
  }
}
