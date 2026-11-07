import axios from 'axios'
import { useAuthStore } from '@context/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // 401 từ chính các form đăng nhập/đăng ký là "sai thông tin", không phải hết phiên:
    // để form tự hiện lỗi. Đang ở trang đăng nhập rồi thì không chuyển trang nữa (tránh vòng lặp).
    const url: string = err.config?.url ?? ''
    const isAuthForm = /^\/auth\/(login|register|forgot-password|reset-password)/.test(url)
    if (err.response?.status === 401 && !isAuthForm) {
      useAuthStore.getState().logout()
      if (window.location.pathname !== '/dang-nhap') window.location.href = '/dang-nhap'
    }
    return Promise.reject(err)
  },
)

export default api
