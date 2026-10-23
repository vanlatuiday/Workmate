import api from './api'
import type { User } from '@/types'

export const authService = {
  login: (email: string, password: string) =>
    api.post<{ user: User; token: string }>('/auth/login', { email, password }),

  register: (data: { email: string; password: string; role: string }) =>
    api.post<{ user: User; token: string }>('/auth/register', data),

  logout: () => api.post('/auth/logout'),

  me: () => api.get<User>('/auth/me'),

  refreshToken: () => api.post<{ token: string }>('/auth/refresh'),
}
