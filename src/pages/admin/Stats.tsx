import { useMemo, type ReactNode } from 'react'
import { PageHeader, Panel, StatCard } from '@components/dashboard'
import { JOB_TYPES } from '@constants/index'
import { useDemoStore } from '@context/demoStore'
import { useAdmin, useAdminJobs, useVisibleJobs } from '@services/adminService'
import { newUsersPerDay } from './mockData'

// Thống kê: số liệu lấy từ kho dữ liệu thật của demo (kết nối, phỏng vấn, tin đang hiện, báo cáo).
// Riêng "người dùng mới" là MẪU (chưa có API người dùng). Biểu đồ vẽ bằng div, màu chỉ page-fg/page-line.

/** 7 ngày trước 17/10 (mẫu) để đủ 14 ngày */
const EARLIER_SAMPLE = [
  { day: 'T7', date: '10/10', count: 47 }, { day: 'CN', date: '11/10', count: 33 }, { day: 'T2', date: '12/10', count: 78 },
  { day: 'T3', date: '13/10', count: 82 }, { day: 'T4', date: '14/10', count: 90 }, { day: 'T5', date: '15/10', count: 85 },
  { day: 'T6', date: '16/10', count: 66 },
]
const USERS_14 = [...EARLIER_SAMPLE, ...newUsersPerDay]

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
  const interests = useDemoStore((s) => s.interests)
  const connections = useDemoStore((s) => s.connections)
  const interviews = useDemoStore((s) => s.interviews)
  const reports = useAdmin((s) => s.reports)
  const visible = useVisibleJobs()
  const adminJobs = useAdminJobs()

  const funnel = useMemo(() => {
    const k = (j: string, s: string) => `${j}|${s}`
    const pairs = new Set(interests.map((i) => k(i.jobId, i.seekerId)))
    const interviewed = new Set(interviews.map((i) => k(i.jobId, i.seekerId)))
    const confirmed = new Set(interviews.filter((i) => i.status === 'confirmed').map((i) => k(i.jobId, i.seekerId)))
    return [
      { label: 'Quan tâm / ứng tuyển', value: pairs.size },
      { label: 'Kết nối', value: connections.length },
      { label: 'Có lịch phỏng vấn', value: interviewed.size },
      { label: 'Phỏng vấn đã xác nhận', value: confirmed.size },
    ]
  }, [interests, connections, interviews])

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
  const maxUsers = Math.max(...USERS_14.map((d) => d.count))
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

      <Panel title="Người dùng mới 14 ngày (số liệu mẫu)">
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
        <p className="mt-2 text-xs text-page-muted">Ngày trong tháng 10/2026; 7 ngày đầu là số liệu mẫu bổ sung.</p>
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
