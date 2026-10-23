import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@context/authStore'

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
import BlogPage from '@pages/public/BlogPage'
import LoginPage from '@pages/public/LoginPage'
import RegisterPage from '@pages/public/RegisterPage'

// Jobseeker pages
import JobseekerDashboard from '@pages/jobseeker/Dashboard'
import RecommendedJobs from '@pages/jobseeker/RecommendedJobs'
import SavedJobs from '@pages/jobseeker/SavedJobs'
import Applications from '@pages/jobseeker/Applications'
import JobseekerMatch from '@pages/jobseeker/Match'
import JobseekerMessages from '@pages/jobseeker/Messages'
import InterviewSchedule from '@pages/jobseeker/InterviewSchedule'
import CVManager from '@pages/jobseeker/CVManager'
import JobseekerProfile from '@pages/jobseeker/Profile'
import JobseekerSettings from '@pages/jobseeker/Settings'

// Recruiter pages
import RecruiterDashboard from '@pages/recruiter/Dashboard'
import PostJob from '@pages/recruiter/PostJob'
import JobListings from '@pages/recruiter/JobListings'
import SuggestedCandidates from '@pages/recruiter/SuggestedCandidates'
import FindCandidates from '@pages/recruiter/FindCandidates'
import SavedCandidates from '@pages/recruiter/SavedCandidates'
import RecruiterMatch from '@pages/recruiter/Match'
import RecruiterMessages from '@pages/recruiter/Messages'
import RecruiterInterviews from '@pages/recruiter/Interviews'
import CompanyProfile from '@pages/recruiter/CompanyProfile'
import RecruiterSettings from '@pages/recruiter/Settings'

// Admin pages
import AdminDashboard from '@pages/admin/Dashboard'
import AdminUsers from '@pages/admin/Users'
import AdminRecruiters from '@pages/admin/Recruiters'
import AdminJobs from '@pages/admin/Jobs'
import AdminCandidates from '@pages/admin/Candidates'
import AdminReports from '@pages/admin/Reports'
import AdminVerification from '@pages/admin/Verification'
import AdminModeration from '@pages/admin/Moderation'
import AdminStats from '@pages/admin/Stats'
import AdminConfig from '@pages/admin/Config'

// Guards
import ProtectedRoute from '@components/common/ProtectedRoute'

export default function App() {
  const { user } = useAuthStore()

  return (
    <Routes>
      {/* Public routes */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/viec-lam" element={<JobsPage />} />
        <Route path="/viec-lam/:id" element={<JobDetailPage />} />
        <Route path="/cong-ty" element={<CompaniesPage />} />
        <Route path="/cam-nang" element={<BlogPage />} />
        <Route path="/dang-nhap" element={<LoginPage />} />
        <Route path="/dang-ky" element={<RegisterPage />} />
      </Route>

      {/* Jobseeker routes */}
      <Route element={<ProtectedRoute role="jobseeker" />}>
        <Route element={<JobseekerLayout />}>
          <Route path="/tim-viec" element={<JobseekerDashboard />} />
          <Route path="/tim-viec/phu-hop" element={<RecommendedJobs />} />
          <Route path="/tim-viec/da-luu" element={<SavedJobs />} />
          <Route path="/tim-viec/ung-tuyen" element={<Applications />} />
          <Route path="/tim-viec/match" element={<JobseekerMatch />} />
          <Route path="/tim-viec/tin-nhan" element={<JobseekerMessages />} />
          <Route path="/tim-viec/lich-phong-van" element={<InterviewSchedule />} />
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
          <Route path="/tuyen-dung/tin-nhan" element={<RecruiterMessages />} />
          <Route path="/tuyen-dung/lich-phong-van" element={<RecruiterInterviews />} />
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
