// Kết nối socket tới máy chủ: nhận tin nhắn, thông báo, thay đổi trên cặp ngay khi có.
import { io, type Socket } from 'socket.io-client'

const URL = import.meta.env.VITE_SOCKET_URL ?? String(import.meta.env.VITE_API_URL ?? '').replace(/\/api\/?$/, '')

let socket: Socket | null = null

export interface RealtimeHandlers {
  /** Kết nối lại sau khi rớt mạng: có thể đã lỡ sự kiện nên nạp lại dữ liệu */
  onReconnect: () => void
  on: Record<string, (payload: never) => void>
}

export function connectRealtime(token: string, handlers: RealtimeHandlers) {
  disconnectRealtime()
  let first = true
  socket = io(URL || window.location.origin, { auth: { token }, transports: ['websocket', 'polling'] })
  socket.on('connect', () => {
    if (!first) handlers.onReconnect()
    first = false
  })
  for (const [event, fn] of Object.entries(handlers.on)) socket.on(event, fn as (...args: unknown[]) => void)
}

export function disconnectRealtime() {
  socket?.disconnect()
  socket = null
}

export function emitTyping(jobId: string, seekerId: string) {
  socket?.emit('typing', { jobId, seekerId })
}
