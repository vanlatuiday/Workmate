import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@context/authStore'

/** Trang chi tiết (tin, công ty) chỉ dành cho người đã đăng nhập; khách được đưa sang đăng nhập rồi quay lại đúng trang. Không kiểm tra vai trò. */
export default function RequireLogin() {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  // Chốt đích lúc vào trang: khi chuyển trang, trang cũ còn được giữ lại để mờ dần (PublicLayout) và nhận location MỚI
  // (/dang-nhap) — không chốt thì guard chạy lại và ghi đè `from` thành /dang-nhap
  const [from] = useState(() => location.pathname + location.search)
  if (!user) return <Navigate to="/dang-nhap" replace state={{ from }} />
  return <Outlet />
}
