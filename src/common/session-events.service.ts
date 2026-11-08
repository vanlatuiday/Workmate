import { Injectable } from '@nestjs/common'
import { Subject } from 'rxjs'

/** Báo mọi phiên của một tài khoản vừa mất hiệu lực. Socket nghe ở đây để ngắt kết nối đang mở */
@Injectable()
export class SessionEvents {
  private revokedSubject = new Subject<string>()
  readonly revoked$ = this.revokedSubject.asObservable()

  revoke(userId: string) {
    this.revokedSubject.next(userId)
  }
}
