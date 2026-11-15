import DashboardShell from './DashboardShell'

export default function AdminLayout() {
  return (
    <DashboardShell
      sidebarRole="admin" roleLabel="Quản trị viên"
      searchHref={(q) => `/admin/nguoi-dung?q=${encodeURIComponent(q)}`} searchPlaceholder="Tìm người dùng…"
    />
  )
}
