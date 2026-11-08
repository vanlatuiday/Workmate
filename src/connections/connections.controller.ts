import { BadRequestException, Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common'
import type { MarkKind } from '@prisma/client'
import { CurrentUser, type AuthUser } from '../auth/current-user.decorator'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { Roles } from '../auth/roles.decorator'
import { RolesGuard } from '../auth/roles.guard'
import { IsBoolean } from 'class-validator'
import { CandidatesService } from './candidates.service'
import { ConfirmInterviewDto, InviteInterviewDto, OfferDto, ReasonDto, ReviewDto, SendMessageDto } from './connections.dto'
import { ConnectionsService } from './connections.service'
import { HiresService } from './hires.service'
import { InterviewsService } from './interviews.service'
import { MessagesService } from './messages.service'
import { NotificationsService } from './notifications.service'
import { ReviewsService } from './reviews.service'

/** Quan tâm → kết nối. Phía hành động suy từ vai trò của tài khoản, không nhận từ client */
@Controller('connections')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('jobseeker', 'recruiter')
export class ConnectionsController {
  constructor(private connections: ConnectionsService) {}

  @Get()
  state(@CurrentUser() user: AuthUser) {
    return this.connections.state(user)
  }

  @Post(':jobId/:seekerId/interest')
  @HttpCode(200)
  express(@CurrentUser() user: AuthUser, @Param('jobId') jobId: string, @Param('seekerId') seekerId: string) {
    return this.connections.express(user, jobId, seekerId)
  }

  @Delete(':jobId/:seekerId/interest')
  withdraw(@CurrentUser() user: AuthUser, @Param('jobId') jobId: string, @Param('seekerId') seekerId: string) {
    return this.connections.withdraw(user, jobId, seekerId)
  }
}

@Controller('seeker/saved-jobs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('jobseeker')
export class SavedJobsController {
  constructor(private connections: ConnectionsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.connections.savedJobs(user.id)
  }

  @Put(':jobId')
  save(@CurrentUser() user: AuthUser, @Param('jobId') jobId: string) {
    return this.connections.saveJob(user.id, jobId)
  }

  @Delete(':jobId')
  unsave(@CurrentUser() user: AuthUser, @Param('jobId') jobId: string) {
    return this.connections.unsaveJob(user.id, jobId)
  }
}

const markKind = (kind: string): MarkKind => {
  if (kind !== 'saved' && kind !== 'skipped') throw new BadRequestException('Loại đánh dấu không hợp lệ')
  return kind
}

@Controller('recruiter/candidate-marks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('recruiter')
export class CandidateMarksController {
  constructor(private connections: ConnectionsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.connections.marks(user)
  }

  @Put(':jobId/:seekerId/:kind')
  set(@CurrentUser() user: AuthUser, @Param('jobId') jobId: string, @Param('seekerId') seekerId: string, @Param('kind') kind: string) {
    return this.connections.setMark(user, jobId, seekerId, markKind(kind))
  }

  @Delete(':jobId/:seekerId/:kind')
  remove(@CurrentUser() user: AuthUser, @Param('jobId') jobId: string, @Param('seekerId') seekerId: string, @Param('kind') kind: string) {
    return this.connections.removeMark(user, jobId, seekerId, markKind(kind))
  }
}

@Controller('conversations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('jobseeker', 'recruiter')
export class MessagesController {
  constructor(private messages: MessagesService) {}

  @Get()
  conversations(@CurrentUser() user: AuthUser) {
    return this.messages.conversations(user)
  }

  @Get(':jobId/:seekerId/messages')
  list(
    @CurrentUser() user: AuthUser, @Param('jobId') jobId: string, @Param('seekerId') seekerId: string,
    @Query('before') before?: string, @Query('limit') limit?: string,
  ) {
    return this.messages.list(user, jobId, seekerId, before, limit ? Number(limit) : undefined)
  }

  @Post(':jobId/:seekerId/messages')
  send(@CurrentUser() user: AuthUser, @Param('jobId') jobId: string, @Param('seekerId') seekerId: string, @Body() dto: SendMessageDto) {
    return this.messages.send(user, jobId, seekerId, dto.text)
  }

  @Post(':jobId/:seekerId/read')
  @HttpCode(200)
  read(@CurrentUser() user: AuthUser, @Param('jobId') jobId: string, @Param('seekerId') seekerId: string) {
    return this.messages.markRead(user, jobId, seekerId)
  }
}

@Controller('interviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('jobseeker', 'recruiter')
export class InterviewsController {
  constructor(private interviews: InterviewsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.interviews.list(user)
  }

  @Post()
  @Roles('recruiter')
  invite(@CurrentUser() user: AuthUser, @Body() dto: InviteInterviewDto) {
    return this.interviews.invite(user, dto)
  }

  @Post(':id/confirm')
  @HttpCode(200)
  @Roles('jobseeker')
  confirm(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: ConfirmInterviewDto) {
    return this.interviews.confirm(user, id, dto.slot)
  }

  @Post(':id/decline')
  @HttpCode(200)
  @Roles('jobseeker')
  decline(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.interviews.decline(user, id)
  }

  @Post(':id/cancel')
  @HttpCode(200)
  @Roles('recruiter')
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.interviews.cancel(user, id)
  }
}

@Controller('hires')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('jobseeker', 'recruiter')
export class HiresController {
  constructor(private hires: HiresService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.hires.list(user)
  }

  @Post('offer')
  @Roles('recruiter')
  offer(@CurrentUser() user: AuthUser, @Body() dto: OfferDto) {
    return this.hires.offer(user, dto)
  }

  @Post(':jobId/:seekerId/reject')
  @HttpCode(200)
  @Roles('recruiter')
  reject(@CurrentUser() user: AuthUser, @Param('jobId') jobId: string, @Param('seekerId') seekerId: string, @Body() dto: ReasonDto) {
    return this.hires.reject(user, jobId, seekerId, dto.reason)
  }

  @Post(':jobId/:seekerId/withdraw')
  @HttpCode(200)
  @Roles('recruiter')
  withdraw(@CurrentUser() user: AuthUser, @Param('jobId') jobId: string, @Param('seekerId') seekerId: string) {
    return this.hires.withdraw(user, jobId, seekerId)
  }

  @Post(':jobId/:seekerId/accept')
  @HttpCode(200)
  @Roles('jobseeker')
  accept(@CurrentUser() user: AuthUser, @Param('jobId') jobId: string, @Param('seekerId') seekerId: string) {
    return this.hires.accept(user, jobId, seekerId)
  }

  @Post(':jobId/:seekerId/decline')
  @HttpCode(200)
  @Roles('jobseeker')
  decline(@CurrentUser() user: AuthUser, @Param('jobId') jobId: string, @Param('seekerId') seekerId: string, @Body() dto: ReasonDto) {
    return this.hires.decline(user, jobId, seekerId, dto.reason)
  }
}

@Controller('reviews')
export class ReviewsController {
  constructor(private reviews: ReviewsService) {}

  /** Công khai, không cần đăng nhập */
  @Get('companies/:companyId')
  ofCompany(@Param('companyId') companyId: string) {
    return this.reviews.ofCompany(companyId)
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('jobseeker', 'recruiter')
  mine(@CurrentUser() user: AuthUser) {
    return this.reviews.mine(user)
  }

  @Get('seekers/:seekerId')
  @UseGuards(JwtAuthGuard)
  ofSeeker(@CurrentUser() user: AuthUser, @Param('seekerId') seekerId: string) {
    return this.reviews.ofSeeker(user, seekerId)
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('jobseeker', 'recruiter')
  submit(@CurrentUser() user: AuthUser, @Body() dto: ReviewDto) {
    return this.reviews.submit(user, dto)
  }
}

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('jobseeker', 'recruiter')
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.notifications.list(user)
  }

  // Đặt trước ':id/read' cho dễ đọc; hai đường dẫn không trùng nhau
  @Patch('read-all')
  readAll(@CurrentUser() user: AuthUser) {
    return this.notifications.markAllRead(user)
  }

  @Patch(':id/read')
  read(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.notifications.markRead(user, id)
  }
}

/** Ứng viên doanh nghiệp được thấy (khác đường dẫn với CV: recruiter/candidates/:seekerId/cv) */
@Controller('recruiter/candidates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('recruiter')
export class CandidatesController {
  constructor(private candidates: CandidatesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.candidates.forRecruiter(user)
  }

  @Get(':seekerId/profile')
  profile(@CurrentUser() user: AuthUser, @Param('seekerId') seekerId: string) {
    return this.candidates.profile(user, seekerId)
  }
}

class SeekerLockDto {
  @IsBoolean()
  locked!: boolean
}

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminPairsController {
  constructor(private candidates: CandidatesService) {}

  @Get('seekers')
  seekers() {
    return this.candidates.forAdmin()
  }

  @Patch('seekers/:id')
  lock(@Param('id') id: string, @Body() dto: SeekerLockDto) {
    return this.candidates.setLocked(id, dto.locked)
  }

  @Get('users')
  users() {
    return this.candidates.allUsers()
  }

  @Patch('users/:id')
  lockUser(@Param('id') id: string, @Body() dto: SeekerLockDto) {
    return this.candidates.setLocked(id, dto.locked)
  }

  @Get('pairs')
  pairs() {
    return this.candidates.allPairs()
  }
}
