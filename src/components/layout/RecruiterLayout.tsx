import DashboardShell from './DashboardShell'

export default function RecruiterLayout() {
  return (
    <DashboardShell
      sidebarRole="recruiter" roleLabel="Nhà tuyển dụng"
      searchHref={(q) => `/tuyen-dung/tim-ung-vien?q=${encodeURIComponent(q)}`} searchPlaceholder="Tìm ứng viên…"
    />
  )
}
