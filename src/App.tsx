import { lazy, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Messenger from '@components/messenger/Messenger'
import NotificationCenter from '@components/notifications/NotificationCenter'
import { useAuthStore } from '@context/authStore'
import { authService } from '@services/authService'
import { loadCatalog } from '@services/catalogService'
import { loadProfile } from '@services/profileService'
import { loadSessionData } from '@services/sessionData'
import { useCvStore } from '@context/cvStore'

// Layouts
import PublicLayout from '@components/layout/PublicLayout'
import JobseekerLayout from '@components/layout/JobseekerLayout'
import RecruiterLayout from '@components/layout/RecruiterLayout'
import AdminLayout from '@components/layout/AdminLayout'

// Public pages: trang chủ nạp sẵn (khung hình đầu tiên + intro GSAP không chờ thêm request);
// các trang còn lại tải theo nhu cầu, Suspense nằm trong PublicLayout (không làm trống header/footer).
import HomePage from '@pages/public/HomePage'
const loadJobsPage = () => import('@pages/public/JobsPage')
const JobsPage = lazy(loadJobsPage)
const JobDetailPage = lazy(() => import('@pages/public/JobDetailPage'))
const CompaniesPage = lazy(() => import('@pages/public/CompaniesPage'))
const CompanyDetailPage = lazy(() => import('@pages/public/CompanyDetailPage'))
const PositionDetailPage = lazy(() => import('@pages/public/PositionDetailPage'))
const BlogPage = lazy(() => import('@pages/public/BlogPage'))
const loadAuthPage = () => import('@pages/public/auth/AuthPage')
const AuthPage = lazy(loadAuthPage)
const PersonalPage = lazy(() => import('@pages/public/PersonalPage'))
const MatchPage = lazy(() => import('@pages/public/MatchPage'))
const MessagesPage = lazy(() => import('@pages/public/MessagesPage'))
const NotificationsPage = lazy(() => import('@pages/public/NotificationsPage'))
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
const NotFoundPage = lazy(() => import('@pages/public/NotFoundPage'))

// Trang dashboard: tải theo nhu cầu (Suspense nằm trong DashboardShell),
// khách vào trang công khai không phải tải code của ba khu làm việc.

// Jobseeker pages
const JobseekerDashboard = lazy(() => import('@pages/jobseeker/Dashboard'))
const RecommendedJobs = lazy(() => import('@pages/jobseeker/RecommendedJobs'))
const SavedJobs = lazy(() => import('@pages/jobseeker/SavedJobs'))
const Applications = lazy(() => import('@pages/jobseeker/Applications'))
const JobseekerMatch = lazy(() => import('@pages/jobseeker/Match'))
const CVManager = lazy(() => import('@pages/jobseeker/CVManager'))
const JobseekerProfile = lazy(() => import('@pages/jobseeker/Profile'))
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
const CandidateProfile = lazy(() => import('@pages/recruiter/CandidateProfile'))

export default function App() {
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

  // Sau khi trang chủ rảnh: tải trước hai trang hay vào tiếp theo để lần bấm đầu tiên tức thì
  useEffect(() => {
    const warm = () => {
      void loadJobsPage()
      void loadAuthPage()
    }
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(warm, { timeout: 4000 })
      return () => window.cancelIdleCallback(id)
    }
    const t = window.setTimeout(warm, 2500)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <>
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/viec-lam" element={<JobsPage />} />
        <Route path="/viec-lam/:id" element={<JobDetailPage />} />
        <Route path="/cong-ty" element={<CompaniesPage />} />
        <Route path="/cong-ty/:id" element={<CompanyDetailPage />} />
        <Route path="/cam-nang" element={<BlogPage />} />
        {/* Đăng nhập / quên mật khẩu / đăng ký: cùng MỘT thẻ AuthPage (giữ nguyên khi chuyển qua lại) */}
        <Route path="/dang-nhap" element={<AuthPage />} />
        <Route path="/quen-mat-khau" element={<AuthPage />} />
        <Route path="/dang-ky" element={<AuthPage />} />
        <Route path="/ca-nhan" element={<PersonalPage />} />
        <Route path="/match" element={<MatchPage />} />
        <Route path="/tin-nhan" element={<MessagesPage />} />
        <Route path="/thong-bao" element={<NotificationsPage />} />
        <Route path="/lich-phong-van" element={<SchedulePage />} />
        <Route path="/gioi-thieu" element={<AboutPage />} />
        <Route path="/nha-tuyen-dung" element={<ForRecruitersPage />} />
        <Route path="/cam-nang/:slug" element={<ArticlePage />} />
        <Route path="/ho-tro" element={<HelpPage />} />
        <Route path="/lien-he" element={<ContactPage />} />
        <Route path="/dieu-khoan" element={<TermsPage />} />
        <Route path="/bao-mat" element={<PrivacyPage />} />
        {/* Bản bento cũ — đã thay bằng /ca-nhan */}
        <Route path="/trang-ca-nhan" element={<Navigate to="/ca-nhan" replace />} />
        <Route element={<ProtectedRoute role="recruiter" />}>
          <Route path="/vi-tri/:id" element={<PositionDetailPage />} />
          <Route path="/dang-tin" element={<PostJobPage />} />
          <Route path="/ung-vien/:id" element={<CandidateProfile />} />
        </Route>
        <Route element={<ProtectedRoute role="jobseeker" />}>
          <Route path="/ho-so" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* Jobseeker routes */}
      <Route element={<ProtectedRoute role="jobseeker" />}>
        <Route element={<JobseekerLayout />}>
          <Route path="/tim-viec" element={<JobseekerDashboard />} />
          <Route path="/tim-viec/phu-hop" element={<RecommendedJobs />} />
          <Route path="/tim-viec/da-luu" element={<SavedJobs />} />
          <Route path="/tim-viec/ung-tuyen" element={<Applications />} />
          <Route path="/tim-viec/match" element={<JobseekerMatch />} />
          <Route path="/tim-viec/tin-nhan" element={<Navigate to="/tin-nhan" replace />} />
          <Route path="/tim-viec/lich-phong-van" element={<Navigate to="/lich-phong-van" replace />} />
          <Route path="/tim-viec/cv" element={<CVManager />} />
          <Route path="/tim-viec/ho-so" element={<JobseekerProfile />} />
          <Route path="/tim-viec/cai-dat" element={<JobseekerSettings />} />
        </Route>
      </Route>

      {/* Recruiter routes */}
      <Route element={<ProtectedRoute role="recruiter" />}>
        <Route element={<RecruiterLayout />}>
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

      {/* Admin routes */}
      <Route element={<ProtectedRoute role="admin" />}>
        <Route element={<AdminLayout />}>
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
    {/* Tin nhắn nổi: một bản duy nhất cho mọi trang */}
    <Messenger />
    {/* Thông báo nổi: nút chuông nằm trên nút tin nhắn */}
    <NotificationCenter />
    </>
  )
}
