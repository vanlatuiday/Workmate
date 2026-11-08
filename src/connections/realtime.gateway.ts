import { JwtService } from '@nestjs/jwt'
import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets'
import type { Server, Socket } from 'socket.io'
import { corsOrigin } from '../common/cors'
import { PrismaService } from '../prisma/prisma.service'

/**
 * Đẩy sự kiện tức thời tới trình duyệt. Kết nối: io(url, { auth: { token } }).
 * Server → client: `message:new` (Message) · `notification:new` (Notification) ·
 * `pair:changed` ({ jobId, seekerId } — tải lại kết nối / phỏng vấn / nhận việc / đánh giá) ·
 * `typing` ({ jobId, seekerId, from }).
 * Client → server: `typing` ({ jobId, seekerId }).
 */
@WebSocketGateway({ cors: { origin: corsOrigin, credentials: true } })
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer() private server!: Server

  constructor(private jwt: JwtService, private prisma: PrismaService) {}

  /** Token sai / hết hạn hoặc tài khoản bị khóa → ngắt ngay */
  async handleConnection(client: Socket) {
    try {
      const { sub } = await this.jwt.verifyAsync<{ sub: string }>(String(client.handshake.auth?.token ?? ''))
      const user = await this.prisma.user.findUnique({ where: { id: sub }, select: { id: true, role: true, status: true } })
      if (!user || user.status === 'locked') throw new Error('locked')
      client.data.user = { id: user.id, role: user.role }
      await client.join(`user:${user.id}`)
    } catch {
      client.disconnect(true)
    }
  }

  toUsers(userIds: string[], event: string, payload: unknown) {
    if (userIds.length) this.server.to(userIds.map((id) => `user:${id}`)).emit(event, payload)
  }

  disconnectUser(userId: string) {
    this.server.in(`user:${userId}`).disconnectSockets(true)
  }

  /** Chỉ chuyển tiếp khi người gửi thuộc đúng một phía của kết nối này */
  @SubscribeMessage('typing')
  async typing(@ConnectedSocket() client: Socket, @MessageBody() body: { jobId?: unknown; seekerId?: unknown }) {
    const me = client.data.user as { id: string; role: string } | undefined
    const { jobId, seekerId } = body ?? {}
    if (!me || typeof jobId !== 'string' || typeof seekerId !== 'string') return
    const conn = await this.prisma.connection.findUnique({
      where: { jobId_seekerId: { jobId, seekerId } },
      select: { job: { select: { company: { select: { members: { select: { userId: true } } } } } } },
    })
    if (!conn) return
    const recruiters = conn.job.company.members.map((m) => m.userId)
    const from = me.role === 'jobseeker' && me.id === seekerId ? 'seeker' : me.role === 'recruiter' && recruiters.includes(me.id) ? 'recruiter' : null
    if (!from) return
    this.toUsers(from === 'seeker' ? recruiters : [seekerId], 'typing', { jobId, seekerId, from })
  }
}
