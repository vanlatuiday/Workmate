import { useEffect } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@context/authStore'
import { useCompanyStore } from '@context/companyStore'
import Skeleton from '@components/dashboard/Skeleton'
import { BTN_PRIMARY } from '@utils/ui'

/** Khung chờ toàn trang: dùng khi hồ sơ công ty chưa về, để không nháy trang rồi mới chuyển hướng */
export function GateSkeleton() {
  return (
    <div role="status" aria-live="polite" className="theme-ivory min-h-screen bg-page-bg shell py-section-sm">
      <span className="sr-only">Đang tải hồ sơ công ty…</span>
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="mt-6 h-4 w-2/3" />
      <Skeleton className="mt-3 h-4 w-1/2" />
      <Skeleton className="mt-8 h-40 w-full rounded-card" />
    </div>
  )
}

/** Nạp hồ sơ công ty nếu chưa có (phiên đăng nhập thường đã nạp sẵn; request trùng được gộp trong store) */
export function useEnsureCompany() {
  const loaded = useCompanyStore((s) => s.loaded)
  const loadFailed = useCompanyStore((s) => s.loadFailed)
  useEffect(() => {
    if (!loaded && !loadFailed) void useCompanyStore.getState().load().catch(() => undefined)
  }, [loaded, loadFailed])
  return { loaded, loadFailed }
}

export function GateError() {
  return (
    <div role="alert" className="shell py-section-sm">
      <p className="text-page-fg">Chưa tải được hồ sơ công ty. Kiểm tra kết nối rồi thử lại.</p>
      <button type="button" className={`${BTN_PRIMARY} mt-4`} onClick={() => { void useCompanyStore.getState().load().catch(() => undefined) }}>Thử lại</button>
    </div>
  )
}

/** Chặn mọi trang riêng của nhà tuyển dụng cho tới khi họ xong form bắt đầu. Đặt BÊN TRONG ProtectedRoute role="recruiter". */
export default function OnboardingGate() {
  const { loaded, loadFailed } = useEnsureCompany()
  const needsOnboarding = useCompanyStore((s) => s.needsOnboarding)
  if (!loaded) return loadFailed ? <GateError /> : <GateSkeleton />
  if (needsOnboarding) return <Navigate to="/tuyen-dung/bat-dau" replace />
  return <Outlet />
}

/** Trang vẫn mở được khi chưa xong form bắt đầu (đọc điều khoản, xin hỗ trợ) */
const OPEN_WHILE_ONBOARDING = ['/tuyen-dung/bat-dau', '/dieu-khoan', '/bao-mat', '/ho-tro', '/lien-he', '/xem-thu']

/**
 * Nhà tuyển dụng chưa xong form bắt đầu mở BẤT KỲ trang nào (trang chủ sau khi đăng nhập, trang công khai…)
 * → đưa về form. Gọi một lần ở App. Các trang riêng của nhà tuyển dụng còn có thêm OnboardingGate.
 */
export function useOnboardingRedirect() {
  const role = useAuthStore((s) => s.user?.role)
  const loaded = useCompanyStore((s) => s.loaded)
  const needsOnboarding = useCompanyStore((s) => s.needsOnboarding)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const recruiter = role === 'recruiter'
  useEffect(() => {
    if (recruiter && !loaded) void useCompanyStore.getState().load().catch(() => undefined)
  }, [recruiter, loaded])
  useEffect(() => {
    if (!recruiter || !loaded || !needsOnboarding) return
    if (OPEN_WHILE_ONBOARDING.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return
    navigate('/tuyen-dung/bat-dau', { replace: true })
  }, [recruiter, loaded, needsOnboarding, pathname, navigate])
}
