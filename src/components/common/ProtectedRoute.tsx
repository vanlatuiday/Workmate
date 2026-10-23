import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '@context/authStore'
import type { UserRole } from '@/types'

interface Props {
  role: UserRole
}

export default function ProtectedRoute({ role }: Props) {
  const { user } = useAuthStore()

  if (!user) return <Navigate to="/dang-nhap" replace />
  if (user.role !== role) return <Navigate to="/" replace />

  return <Outlet />
}
