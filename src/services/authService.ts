import api from './api'
import type { User } from '@/types'

export const authService = {
  login: (email: string, password: string) =>
    api.post<{ user: User; token: string }>('/auth/login', { email, password }),

  register: (data: { email: string; password: string; role: string }) =>
    api.post<{ user: User; token: string }>('/auth/register', data),

  logout: () => api.post('/auth/logout'),

  me: () => api.get<User>('/auth/me'),

  // TODO: gọi khi có backend — gửi mã xác nhận 6 số tới email đăng ký (luôn trả thành công để không lộ tài khoản nào tồn tại)
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),

  // TODO: gọi khi có backend — đổi mật khẩu bằng mã xác nhận
  resetPassword: (email: string, code: string, newPassword: string) =>
    api.post('/auth/reset-password', { email, code, newPassword }),

  refreshToken: () => api.post<{ token: string }>('/auth/refresh'),
}
