import axios from 'axios'
import api from './api'
import type { User } from '@/types'

export interface AuthResponse { user: User; token: string }
/** `devCode`: CHỈ có khi máy chủ chạy ngoài production (bản demo chưa có email thật) */
export interface ForgotPasswordResponse { ok: true; devCode?: string }

/** Lấy thông báo lỗi tiếng Việt từ phản hồi của máy chủ; mất kết nối thì báo riêng */
export function apiErrorMessage(err: unknown, fallback = 'Có lỗi xảy ra, vui lòng thử lại.'): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) return 'Không kết nối được máy chủ'
    const msg = (err.response.data as { message?: string | string[] } | undefined)?.message
    if (Array.isArray(msg)) return msg[0] ?? fallback
    if (typeof msg === 'string' && msg) return msg
  }
  return fallback
}

export const authService = {
  /** `email` có thể là email hoặc tên đăng nhập */
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),

  register: (data: { email: string; password: string; role: string; name?: string }) =>
    api.post<AuthResponse>('/auth/register', data),

  logout: () => api.post('/auth/logout'),

  me: () => api.get<User>('/auth/me'),

  // Luôn trả thành công để không lộ tài khoản nào tồn tại
  forgotPassword: (email: string) => api.post<ForgotPasswordResponse>('/auth/forgot-password', { email }),

  resetPassword: (email: string, code: string, newPassword: string) =>
    api.post<{ ok: true }>('/auth/reset-password', { email, code, newPassword }),

  changePassword: (currentPassword: string, newPassword: string) =>
    api.post<AuthResponse>('/auth/change-password', { currentPassword, newPassword }),

  /** Xóa thật tài khoản và dữ liệu, không khôi phục được */
  deleteAccount: (password: string) => api.post<{ ok: true }>('/account/delete', { password }),

  refreshToken: () => api.post<{ token: string }>('/auth/refresh'),
}
