import { useMemo, type ReactNode } from 'react'
import { PageHeader, Panel, StatCard } from '@components/dashboard'
import { JOB_TYPES } from '@constants/index'
import { useConnectionStore } from '@context/connectionStore'
import { useAdmin, useAdminJobs, useSignupsPerDay, useVisibleJobs } from '@services/adminService'

// Thống kê toàn hệ thống. Biểu đồ vẽ bằng div, màu chỉ page-fg/page-line.

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0)

function fmtDuration(ms: number) {
  const min = Math.round(ms / 60_000)
  if (min < 60) return `${min} phút`
  const h = min / 60
  return h < 48 ? `${h.toFixed(1).replace('.0', '')} giờ` : `${Math.round(h / 24)} ngày`
}

type Row = { label: string; value: number; note?: string }

/** Thanh ngang: nhãn + số trực tiếp; bọc role="img" kèm tóm tắt cho trình đọc màn hình */
function BarList({ rows, max, summary }: { rows: Row[]; max: number; summary: string }) {
  return (
    <ul role="img" aria-label={summary} className="space-y-3">
      {rows.map((r) => (
        <li key={r.label} aria-hidden="true">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-page-fg">{r.label}</span>
            <span className="tnum text-page-fg">{r.value}{r.note && <span className="ml-1.5 text-xs text-page-muted">{r.note}</span>}</span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-page-line">
            <div className="h-2 rounded-full bg-page-fg" style={{ width: `${max ? Math.max((r.value / max) * 100, r.value ? 2 : 0) : 0}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

const Empty = ({ children }: { children: ReactNode }) => <p className="text-sm text-page-muted">{children}</p>

/** /admin/thong-ke */
export default function Stats() {
  const USERS_14 = useSignupsPerDay(14)
  const interests = useConnectionStore((s) => s.interests)
  const connections = useConnectionStore((s) => s.connections)
  const interviews = useConnectionStore((s) => s.interviews)
  const hires = useConnectionStore((s) => s.hires)
  const reports = useAdmin((s) => s.reports)
  const visible = useVisibleJobs()
  const adminJobs = useAdminJobs()

  const funnel = useMemo(() => {
    const k = (j: string, s: string) => `${j}|${s}`
    const pairs = new Set(interests.map((i) => k(i.jobId, i.seekerId)))
    const interviewed = new Set(interviews.map((i) => k(i.jobId, i.seekerId)))
    const confirmed = new Set(interviews.filter((i) => i.status === 'confirmed').map((i) => k(i.jobId, i.seekerId)))
    // Được nhận = đã có lời mời nhận việc (dù sau đó ra sao); Đã đi làm = ứng viên đã xác nhận
    const offered = hires.filter((h) => h.status !== 'rejected').length
    const working = hires.filter((h) => h.status === 'accepted').length
    return [
      { label: 'Quan tâm / ứng tuyển', value: pairs.size },
      { label: 'Kết nối', value: connections.length },
      { label: 'Có lịch phỏng vấn', value: interviewed.size },
      { label: 'Phỏng vấn đã xác nhận', value: confirmed.size },
      { label: 'Được nhận', value: offered },
      { label: 'Đã đi làm', value: working },
    ]
  }, [interests, connections, interviews, hires])

  // Thời gian phản hồi = từ lượt quan tâm đầu tiên của một cặp đến lúc thành kết nối
  const avgResponse = useMemo(() => {
    const diffs = connections.flatMap((c) => {
      const first = Math.min(...interests.filter((i) => i.jobId === c.jobId && i.seekerId === c.seekerId).map((i) => +new Date(i.at)))
      return Number.isFinite(first) ? [Math.max(0, +new Date(c.at) - first)] : []
    })
    return diffs.length ? diffs.reduce((a, b) => a + b, 0) / diffs.length : null
  }, [connections, interests])

  const byDistrict = useMemo(() => countBy(visible.map((j) => j.district)), [visible])
  const byType = useMemo(
    () => countBy(visible.map((j) => JOB_TYPES.find((t) => t.value === j.jobType)?.label ?? j.jobType)),
    [visible],
  )

  const flagged = adminJobs.filter((r) => r.flags.length).length
  const openReports = reports.filter((r) => r.status === 'open').length
  const maxUsers = Math.max(1, ...USERS_14.map((d) => d.count))
  const totalUsers = USERS_14.reduce((s, d) => s + d.count, 0)
  const top = funnel[0].value

  return (
    <div className="space-y-6">
      <PageHeader title="Thống kê" description="Phễu kết nối, người dùng mới, tin đang hiện và chất lượng nội dung." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Thời gian phản hồi trung bình" value={avgResponse === null ? '—' : fmtDuration(avgResponse)} hint="Từ lượt quan tâm đầu tiên đến khi kết nối" />
        <StatCard label="Tin bị gắn cờ" value={`${pct(flagged, adminJobs.length)}%`} hint={`${flagged}/${adminJobs.length} tin có cảnh báo tự động`} />
        <StatCard label="Báo cáo đang mở" value={openReports} href="/admin/bao-cao" hint="Bấm để xử lý" />
      </div>

      <Panel title="Phễu kết nối">
        <BarList
          max={top}
          rows={funnel.map((f) => ({ ...f, note: `${pct(f.value, top)}%` }))}
          summary={`Phễu kết nối: ${funnel.map((f) => `${f.label} ${f.value} (${pct(f.value, top)}%)`).join('; ')}`}
        />
      </Panel>

      <Panel title="Người dùng mới 14 ngày">
        <div role="img" aria-label={`Người dùng mới 14 ngày gần nhất, tổng ${totalUsers}. ${USERS_14.map((d) => `${d.date}: ${d.count}`).join('; ')}`}>
          <div aria-hidden="true" className="flex h-44 items-end gap-1 sm:gap-2">
            {USERS_14.map((d) => (
              <div key={d.date} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                <span className="tnum text-[10px] text-page-fg sm:text-xs">{d.count}</span>
                <div className="w-full max-w-8 rounded-t-control bg-page-fg" style={{ height: `${(d.count / maxUsers) * 78}%` }} />
              </div>
            ))}
          </div>
          <div aria-hidden="true" className="mt-2 flex gap-1 border-t border-page-line pt-2 sm:gap-2">
            {USERS_14.map((d) => (
              <span key={d.date} className="tnum min-w-0 flex-1 text-center text-[10px] text-page-muted sm:text-xs">{d.date.slice(0, 2)}</span>
            ))}
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel title="Tin đang hiện theo quận">
          {byDistrict.length ? (
            <BarList max={byDistrict[0].value} rows={byDistrict} summary={`Tin đang hiện theo quận: ${byDistrict.map((r) => `${r.label} ${r.value}`).join('; ')}`} />
          ) : <Empty>Chưa có tin nào đang hiện.</Empty>}
        </Panel>
        <Panel title="Tin đang hiện theo loại việc">
          {byType.length ? (
            <BarList max={byType[0].value} rows={byType} summary={`Tin đang hiện theo loại việc: ${byType.map((r) => `${r.label} ${r.value}`).join('; ')}`} />
          ) : <Empty>Chưa có tin nào đang hiện.</Empty>}
        </Panel>
      </div>
    </div>
  )
}

/** Đếm theo nhãn, xếp giảm dần */
function countBy(labels: string[]): Row[] {
  const m = new Map<string, number>()
  labels.forEach((l) => m.set(l, (m.get(l) ?? 0) + 1))
  return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
}
