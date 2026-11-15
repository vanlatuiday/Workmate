import DashboardShell from './DashboardShell'

export default function JobseekerLayout() {
  return (
    <DashboardShell
      sidebarRole="seeker" roleLabel="Người tìm việc"
      searchHref={(q) => `/viec-lam?q=${encodeURIComponent(q)}`} searchPlaceholder="Tìm việc làm…"
    />
  )
}
