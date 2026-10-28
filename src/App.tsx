import { lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Layouts
import PublicLayout from '@components/layout/PublicLayout'
import JobseekerLayout from '@components/layout/JobseekerLayout'
import RecruiterLayout from '@components/layout/RecruiterLayout'
import AdminLayout from '@components/layout/AdminLayout'

// Public pages
import HomePage from '@pages/public/HomePage'
import JobsPage from '@pages/public/JobsPage'
import JobDetailPage from '@pages/public/JobDetailPage'
import CompaniesPage from '@pages/public/CompaniesPage'
import CompanyDetailPage from '@pages/public/CompanyDetailPage'
import PositionDetailPage from '@pages/public/PositionDetailPage'
import BlogPage from '@pages/public/BlogPage'
import LoginPage from '@pages/public/LoginPage'
import RegisterPage from '@pages/public/RegisterPage'
import PersonalPage from '@pages/public/PersonalPage'
import MatchPage from '@pages/public/MatchPage'
import MessagesPage from '@pages/public/MessagesPage'
import NotificationsPage from '@pages/public/NotificationsPage'
import SchedulePage from '@pages/public/SchedulePage'
import PostJobPage from '@pages/public/PostJobPage'
import ProfilePage from '@pages/public/ProfilePage'
import AboutPage from '@pages/public/content/AboutPage'
import ForRecruitersPage from '@pages/public/content/ForRecruitersPage'
import ArticlePage from '@pages/public/content/ArticlePage'
import HelpPage from '@pages/public/content/HelpPage'
import ContactPage from '@pages/public/content/ContactPage'
import TermsPage from '@pages/public/content/TermsPage'
import PrivacyPage from '@pages/public/content/PrivacyPage'

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
const PostJob = lazy(() => import('@pages/recruiter/PostJob'))
const JobListings = lazy(() => import('@pages/recruiter/JobListings'))
const SuggestedCandidates = lazy(() => import('@pages/recruiter/SuggestedCandidates'))
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

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/viec-lam" element={<JobsPage />} />
        <Route path="/viec-lam/:id" element={<JobDetailPage />} />
        <Route path="/cong-ty" element={<CompaniesPage />} />
        <Route path="/cong-ty/:id" element={<CompanyDetailPage />} />
        <Route path="/cam-nang" element={<BlogPage />} />
        <Route path="/dang-nhap" element={<LoginPage />} />
        <Route path="/dang-ky" element={<RegisterPage />} />
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
          <Route path="/tuyen-dung/dang-tin" element={<PostJob />} />
          <Route path="/tuyen-dung/tin-dang" element={<JobListings />} />
          <Route path="/tuyen-dung/ung-vien-phu-hop" element={<SuggestedCandidates />} />
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
