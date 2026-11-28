import EffectsPreferenceDialog from '@components/layout/EffectsPreferenceDialog'
import { Suspense, lazy, useEffect, useLayoutEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { jobDetailHref } from '@components/jobs/jobDetailHref'
import { useAuthStore } from '@context/authStore'
import { authService } from '@services/authService'
import { loadCatalog } from '@services/catalogService'
import { loadProfile } from '@services/profileService'
import { loadSessionData } from '@services/sessionData'
import { useCvStore } from '@context/cvStore'

// Khách chưa đăng nhập không cần tải khung chat và thông báo.
const Messenger = lazy(() => import('@components/messenger/Messenger'))
const NotificationCenter = lazy(() => import('@components/notifications/NotificationCenter'))

// Layouts
import PublicLayout from '@components/layout/PublicLayout'
// Khung dashboard tải khi cần (khách lần đầu vào web không phải tải kèm 3 khung dashboard)
const JobseekerLayout = lazy(() => import('@components/layout/JobseekerLayout'))
const RecruiterLayout = lazy(() => import('@components/layout/RecruiterLayout'))
const AdminLayout = lazy(() => import('@components/layout/AdminLayout'))
/** Nền chờ khi khung dashboard đang tải: cùng màu nền dashboard, không nháy trắng */
function DashboardLoading({ admin = false }: { admin?: boolean }) {
  return (
    <div role="status" aria-live="polite" className={admin ? 'min-h-screen bg-wm-day' : 'min-h-screen bg-wm-abyss'}>
      <span className="sr-only">Đang tải…</span>
    </div>
  )
}

// Public pages: trang chủ nạp sẵn (khung hình đầu tiên + intro GSAP không chờ thêm request);
// các trang còn lại tải theo nhu cầu, Suspense nằm trong PublicLayout (không làm trống header/footer).
import { IS_PRODUCTION } from '@utils/isProduction'
import HomePage from '@pages/public/HomePage'
const loadJobsPage = () => import('@pages/public/JobsPage')
const JobsPage = lazy(loadJobsPage)
const JobDetailDialog = lazy(() => import('@components/jobs/JobDetailDialog'))
const CompanyDetailPage = lazy(() => import('@pages/public/CompanyDetailPage'))
const PositionDetailPage = lazy(() => import('@pages/public/PositionDetailPage'))
const BlogPage = lazy(() => import('@pages/public/BlogPage'))
const loadAuthPage = () => import('@pages/public/auth/AuthPage')
const AuthPage = lazy(loadAuthPage)
const PersonalPage = lazy(() => import('@pages/public/PersonalPage'))
const MatchPage = lazy(() => import('@pages/public/MatchPage'))
const MessagesPage = lazy(() => import('@pages/public/MessagesPage'))
const SchedulePage = lazy(() => import('@pages/public/SchedulePage'))
const PostJobPage = lazy(() => import('@pages/public/PostJobPage'))
const ProfilePage = lazy(() => import('@pages/public/ProfilePage'))
const AboutPage = lazy(() => import('@pages/public/content/AboutPage'))
const ForRecruitersPage = lazy(() => import('@pages/public/content/ForRecruitersPage'))
const ArticlePage = lazy(() => import('@pages/public/content/ArticlePage'))
const HelpPage = lazy(() => import('@pages/public/content/HelpPage'))
const ContactPage = lazy(() => import('@pages/public/content/ContactPage'))
const TermsPage = lazy(() => import('@pages/public/content/TermsPage'))
const PrivacyPage = lazy(() => import('@pages/public/content/PrivacyPage'))
const PreviewPage = lazy(() => import('@pages/public/preview/PreviewPage'))
const NotFoundPage = lazy(() => import('@pages/public/NotFoundPage'))

// Trang dashboard: tải theo nhu cầu (Suspense nằm trong DashboardShell),
// khách vào trang công khai không phải tải code của ba khu làm việc.

// Jobseeker pages
const JobseekerDashboard = lazy(() => import('@pages/jobseeker/Dashboard'))
const RecommendedJobs = lazy(() => import('@pages/jobseeker/RecommendedJobs'))
const SavedJobs = lazy(() => import('@pages/jobseeker/SavedJobs'))
const Applications = lazy(() => import('@pages/jobseeker/Applications'))
const JobseekerStats = lazy(() => import('@pages/jobseeker/Stats'))
const JobseekerMatch = lazy(() => import('@pages/jobseeker/Match'))
const CVManager = lazy(() => import('@pages/jobseeker/CVManager'))
const JobseekerSettings = lazy(() => import('@pages/jobseeker/Settings'))

// Recruiter pages
const RecruiterDashboard = lazy(() => import('@pages/recruiter/Dashboard'))
const JobListings = lazy(() => import('@pages/recruiter/JobListings'))
const FindCandidates = lazy(() => import('@pages/recruiter/FindCandidates'))
const SavedCandidates = lazy(() => import('@pages/recruiter/SavedCandidates'))
const RecruiterMatch = lazy(() => import('@pages/recruiter/Match'))
const CompanyProfile = lazy(() => import('@pages/recruiter/CompanyProfile'))
const RecruiterSettings = lazy(() => import('@pages/recruiter/Settings'))

// Admin pages
const AdminDashboard = lazy(() => import('@pages/admin/Dashboard'))
const AdminUsers = lazy(() => import('@pages/admin/Users'))
const AdminRecruiters = lazy(() => import('@pages/admin/Recruiters'))
const AdminJobs = lazy(() => import('@pages/admin/Jobs'))
const AdminCandidates = lazy(() => import('@pages/admin/Candidates'))
const AdminReports = lazy(() => import('@pages/admin/Reports'))
const AdminVerification = lazy(() => import('@pages/admin/Verification'))
const AdminModeration = lazy(() => import('@pages/admin/Moderation'))
const AdminStats = lazy(() => import('@pages/admin/Stats'))
const AdminConfig = lazy(() => import('@pages/admin/Config'))

// Guards
import ProtectedRoute from '@components/common/ProtectedRoute'
import RequireLogin from '@components/common/RequireLogin'
import OnboardingGate, { GateSkeleton, useOnboardingRedirect } from '@components/common/OnboardingGate'
const OnboardingPage = lazy(() => import('@pages/recruiter/onboarding/OnboardingPage'))
const CandidateProfile = lazy(() => import('@pages/recruiter/CandidateProfile'))

/** /tim-viec/ho-so cũ → /ho-so, giữ nguyên #neo */
function ProfileRedirect() {
  const { hash } = useLocation()
  return <Navigate to={`/ho-so${hash}`} replace />
}

function LegacyJobDetailRedirect() {
  const { id } = useParams()
  return <Navigate to={jobDetailHref(id ?? null, { pathname: '/viec-lam', search: '', hash: '' })} replace />
}

export default function App() {
  const location = useLocation()
  const navigate = useNavigate()
  useLayoutEffect(() => {
    const path = location.pathname.replace(/\/+$/, '') || '/'
    const dark = path === '/' || /^\/(dang-nhap|dang-ky|quen-mat-khau|tim-viec|tuyen-dung)(\/|$)/.test(path)
    document.documentElement.dataset.initialSurface = dark ? 'dark' : 'light'
  }, [location.pathname])
  const requestedJob = new URLSearchParams(location.search).get('tin')
  const closeJobDetail = () => {
    const background = jobDetailHref(null, location)
    if (location.state?.jobDetailFrom === background) navigate(-1)
    else navigate(background, { replace: true, state: null })
  }
  // Có token lưu sẵn: hỏi máy chủ một lần để làm mới thông tin người dùng (token hỏng/hết hạn → interceptor tự đăng xuất)
  useEffect(() => {
    if (!useAuthStore.getState().token) return
    authService.me().then((res) => {
      const { token, setUser } = useAuthStore.getState()
      if (token) setUser(res.data, token)
    }).catch(() => { /* 401 đã được xử lý ở interceptor; lỗi mạng thì giữ thông tin cũ */ })
  }, [])

  // Danh mục tin / công ty / cấu hình theo người đang xem: nạp khi mở web và nạp lại mỗi khi đăng nhập/đăng xuất/đổi tài khoản
  const userId = useAuthStore((s) => s.user?.id)
  const role = useAuthStore((s) => s.user?.role)
  // Nhà tuyển dụng chưa xong form bắt đầu: trang nào cũng đưa về form (kể cả trang chủ sau khi đăng nhập)
  useOnboardingRedirect()
  // Màu nhấn theo vai trò (tokens.json → roles): người tìm việc xanh lá, còn lại cam
  useEffect(() => {
    document.documentElement.dataset.role = role === 'jobseeker' ? 'seeker' : 'default'
  }, [role])
  useEffect(() => {
    void loadCatalog(role === 'admin')
    // Hồ sơ người tìm việc: nạp từ máy chủ; khách / tài khoản khác → hồ sơ mẫu trên máy
    void loadProfile()
    // CV chỉ nạp trên trang Quản lý CV; đổi tài khoản / đăng xuất thì xóa danh sách cũ khỏi bộ nhớ
    useCvStore.getState().clear()
    // Kết nối, tin nhắn, thông báo, đã lưu, cài đặt… của tài khoản này (và mở socket)
    loadSessionData(role)
  }, [userId, role])

  // Tải trước khi người dùng hướng tới liên kết, tránh tải trang chưa cần trên mạng di động.
  useEffect(() => {
    const warm = (event: Event) => {
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null
      if (!(link instanceof HTMLAnchorElement) || link.origin !== window.location.origin) return
      if (link.pathname === '/viec-lam') void loadJobsPage().catch(() => undefined)
      if (['/dang-nhap', '/dang-ky', '/quen-mat-khau'].includes(link.pathname)) void loadAuthPage().catch(() => undefined)
    }
    const events = ['pointerover', 'focusin', 'touchstart'] as const
    for (const event of events) document.addEventListener(event, warm, { passive: true })
    return () => {
      for (const event of events) document.removeEventListener(event, warm)
    }
  }, [])

  return (
    <>
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/viec-lam" element={<JobsPage />} />
        {/* Trang danh sách công ty đã bỏ (chủ dự án 2026-11-22) — link cũ chuyển về Việc làm; chi tiết /cong-ty/:id vẫn giữ */}
        <Route path="/cong-ty" element={<Navigate to="/viec-lam" replace />} />
        {/* Trang chi tiết: khách phải đăng nhập (xong quay lại đúng trang) */}
        <Route element={<RequireLogin />}>
          <Route path="/viec-lam/:id" element={<LegacyJobDetailRedirect />} />
          <Route path="/cong-ty/:id" element={<CompanyDetailPage />} />
        </Route>
        <Route path="/cam-nang" element={<BlogPage />} />
        {/* Đăng nhập / quên mật khẩu / đăng ký: cùng MỘT thẻ AuthPage (giữ nguyên khi chuyển qua lại) */}
        <Route path="/dang-nhap" element={<AuthPage />} />
        <Route path="/quen-mat-khau" element={<AuthPage />} />
        <Route path="/dang-ky" element={<AuthPage />} />
        <Route path="/ca-nhan" element={<PersonalPage />} />
        <Route path="/match" element={<MatchPage />} />
        <Route path="/tin-nhan" element={<MessagesPage />} />
        {/* Liên kết cũ: trang thông báo riêng đã bỏ, chỉ xem qua nút chuông. */}
        <Route path="/thong-bao" element={<Navigate to="/ca-nhan" replace />} />
        <Route path="/lich-phong-van" element={<SchedulePage />} />
        <Route path="/gioi-thieu" element={<AboutPage />} />
        <Route path="/nha-tuyen-dung" element={<ForRecruitersPage />} />
        <Route path="/cam-nang/:slug" element={<ArticlePage />} />
        <Route path="/ho-tro" element={<HelpPage />} />
        <Route path="/lien-he" element={<ContactPage />} />
        <Route path="/dieu-khoan" element={<TermsPage />} />
        <Route path="/bao-mat" element={<PrivacyPage />} />
        {/* Trang xem thử giao diện — chỉ khi chạy trên máy */}
        {!IS_PRODUCTION && <Route path="/xem-thu" element={<PreviewPage />} />}
        {/* Bản bento cũ — đã thay bằng /ca-nhan */}
        <Route path="/trang-ca-nhan" element={<Navigate to="/ca-nhan" replace />} />
        <Route element={<ProtectedRoute role="recruiter" />}>
          <Route element={<OnboardingGate />}>
            <Route path="/vi-tri/:id" element={<PositionDetailPage />} />
            <Route path="/dang-tin" element={<PostJobPage />} />
            <Route path="/ung-vien/:id" element={<CandidateProfile />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute role="jobseeker" />}>
          <Route path="/ho-so" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Jobseeker routes */}
      <Route element={<ProtectedRoute role="jobseeker" />}>
        {/* Link bắt đầu cũ mở thẳng trình viết CV. */}
        <Route path="/tim-viec/bat-dau" element={<Navigate to="/ho-so" replace />} />
        <Route element={<Suspense fallback={<DashboardLoading />}><JobseekerLayout /></Suspense>}>
          <Route path="/tim-viec" element={<JobseekerDashboard />} />
          <Route path="/tim-viec/phu-hop" element={<RecommendedJobs />} />
          <Route path="/tim-viec/da-luu" element={<SavedJobs />} />
          <Route path="/tim-viec/ung-tuyen" element={<Applications />} />
          <Route path="/tim-viec/thong-ke" element={<JobseekerStats />} />
          <Route path="/tim-viec/match" element={<JobseekerMatch />} />
          <Route path="/tim-viec/tin-nhan" element={<Navigate to="/tin-nhan" replace />} />
          <Route path="/tim-viec/lich-phong-van" element={<Navigate to="/lich-phong-van" replace />} />
          <Route path="/tim-viec/cv" element={<CVManager />} />
          {/* Trình sửa hồ sơ duy nhất là /ho-so; giữ #neo cũ (thong-tin, kinh-nghiem, lich-ranh) */}
          <Route path="/tim-viec/ho-so" element={<ProfileRedirect />} />
          <Route path="/tim-viec/cai-dat" element={<JobseekerSettings />} />
        </Route>
      </Route>

      {/* Recruiter routes */}
      <Route element={<ProtectedRoute role="recruiter" />}>
        {/* Form bắt đầu: toàn trang, ngoài khung dashboard; nhà tuyển dụng chưa xong form bị đưa về đây */}
        <Route path="/tuyen-dung/bat-dau" element={<Suspense fallback={<GateSkeleton />}><OnboardingPage /></Suspense>} />
        <Route element={<OnboardingGate />}>
        <Route element={<Suspense fallback={<DashboardLoading />}><RecruiterLayout /></Suspense>}>
          <Route path="/tuyen-dung" element={<RecruiterDashboard />} />
          <Route path="/tuyen-dung/dang-tin" element={<Navigate to="/dang-tin" replace />} />
          <Route path="/tuyen-dung/tin-dang" element={<JobListings />} />
          <Route path="/tuyen-dung/ung-vien-phu-hop" element={<Navigate to="/match" replace />} />
          <Route path="/tuyen-dung/tim-ung-vien" element={<FindCandidates />} />
          <Route path="/tuyen-dung/ung-vien-da-luu" element={<SavedCandidates />} />
          <Route path="/tuyen-dung/match" element={<RecruiterMatch />} />
          <Route path="/tuyen-dung/tin-nhan" element={<Navigate to="/tin-nhan" replace />} />
          <Route path="/tuyen-dung/lich-phong-van" element={<Navigate to="/lich-phong-van" replace />} />
          <Route path="/tuyen-dung/ho-so-cong-ty" element={<CompanyProfile />} />
          <Route path="/tuyen-dung/cai-dat" element={<RecruiterSettings />} />
        </Route>
        </Route>
      </Route>

      {/* Admin routes */}
      <Route element={<ProtectedRoute role="admin" />}>
        <Route element={<Suspense fallback={<DashboardLoading admin />}><AdminLayout /></Suspense>}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/nguoi-dung" element={<AdminUsers />} />
          <Route path="/admin/nha-tuyen-dung" element={<AdminRecruiters />} />
          <Route path="/admin/tin-tuyen-dung" element={<AdminJobs />} />
          <Route path="/admin/ung-vien" element={<AdminCandidates />} />
          <Route path="/admin/bao-cao" element={<AdminReports />} />
          <Route path="/admin/xac-minh" element={<AdminVerification />} />
          <Route path="/admin/kiem-duyet" element={<AdminModeration />} />
          <Route path="/admin/thong-ke" element={<AdminStats />} />
          <Route path="/admin/cau-hinh" element={<AdminConfig />} />
        </Route>
      </Route>

      <Route element={<PublicLayout />}>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
    <EffectsPreferenceDialog />
    {requestedJob && (userId ? (
      <Suspense fallback={null}>
        <JobDetailDialog key={userId} jobId={requestedJob} onClose={closeJobDetail} />
      </Suspense>
    ) : <Navigate to="/dang-nhap" replace state={{ from: `${location.pathname}${location.search}${location.hash}` }} />)}
    {/* Hai công cụ của tài khoản tải độc lập, không làm trang hiện tại phải chờ. */}
    {(role === 'jobseeker' || role === 'recruiter') && (
      <Suspense fallback={null}>
        <Messenger />
        <NotificationCenter />
      </Suspense>
    )}
    </>
  )
}
