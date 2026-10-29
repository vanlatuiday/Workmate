import { Link } from 'react-router-dom'
import { Briefcase, UserCheck, Handshake, CalendarClock, Plus, Video, MapPin, Heart, CalendarX } from 'lucide-react'
import { PageHeader, Panel, StatCard, StatusBadge, MatchScore, EmptyState } from '@components/dashboard'
import { useCompanyJobs, useJobNumbers, type CompanyJobRow } from '@services/adminService'
import { useDemoStore } from '@context/demoStore'
import { useHires, useInterviews, usePairStatuses } from '@services/connectionService'
import { CANDIDATES, DEMO_COMPANY, ME_CANDIDATE } from '@pages/public/match/data'
import { scoreMatch } from '@pages/public/match/score'
import { findAnyJob } from '@pages/public/jobs/lookup'
import { fmtSlot, MODE_LABEL } from '@components/interview/format'
import { FOCUS } from '@utils/focus'

const LINK = `underline-offset-4 hover:underline text-page-fg rounded-control ${FOCUS}`

const DAY_MS = 86_400_000

/** Nhãn + màu huy hiệu của một tin (kiểm duyệt thắng trạng thái đăng tuyển) */
function badgeOf(r: CompanyJobRow): { label: string; tone: 'strong' | 'default' | 'muted' } {
  if (r.status === 'pending') return { label: 'Chờ duyệt', tone: 'muted' }
  if (r.status === 'rejected') return { label: 'Bị từ chối', tone: 'default' }
  if (r.status === 'hidden') return { label: 'Bị ẩn', tone: 'default' }
  if (r.jobStatus === 'paused') return { label: 'Tạm dừng', tone: 'default' }
  if (r.jobStatus === 'closed') return { label: 'Đã đóng', tone: 'muted' }
  return { label: 'Đang mở', tone: 'strong' }
}

const candidateOf = (seekerId: string) => [...CANDIDATES, ME_CANDIDATE].find((c) => c.id === seekerId)

export default function RecruiterDashboard() {
  const rows = useCompanyJobs(DEMO_COMPANY.id)
  // Người đã xác nhận đi làm — thước đo chính của Workmate
  const working = useHires('recruiter').filter((h) => h.status === 'accepted').length
  const numbers = useJobNumbers(rows.map((r) => r.job))
  const interviews = useInterviews('recruiter')
  const interests = useDemoStore((s) => s.interests)
  const connections = useDemoStore((s) => s.connections)
  const statusOf = usePairStatuses('recruiter')

  const jobIds = new Set(rows.map((r) => r.job.id))
  const openRows = rows.filter((r) => r.status === 'approved' && r.jobStatus === 'open')
  const fitTotal = openRows.reduce((n, r) => n + (numbers[r.job.id]?.fit ?? 0), 0)
  const connectedTotal = connections.filter((c) => jobIds.has(c.jobId)).length

  // Phỏng vấn: đã xác nhận có giờ trong 7 ngày tới; chờ ứng viên chọn giờ tính riêng làm gợi ý
  const nowMs = Date.now()
  const upcoming = interviews.filter((iv) => iv.status === 'confirmed' && iv.chosen && new Date(iv.chosen).getTime() >= nowMs)
  const in7Days = upcoming.filter((iv) => new Date(iv.chosen as string).getTime() <= nowMs + 7 * DAY_MS)
  const pendingCount = interviews.filter((iv) => iv.status === 'pending').length

  // Ứng viên vừa quan tâm tin của mình mà mình chưa phản hồi (trạng thái "received"), mới nhất trước
  const seen = new Set<string>()
  const interested = interests
    .filter((i) => i.from === 'seeker' && jobIds.has(i.jobId) && statusOf(i.jobId, i.seekerId) === 'received')
    .sort((a, b) => b.at.localeCompare(a.at))
    .filter((i) => {
      const k = `${i.jobId}|${i.seekerId}`
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    .slice(0, 4)
    .flatMap((i) => {
      const c = candidateOf(i.seekerId)
      // Chỉ tin đang mở mới hiện ở danh sách này
      const row = rows.find((r) => r.job.id === i.jobId)
      const job = row && row.status === 'approved' && row.jobStatus === 'open' ? row.job : undefined
      return c && job ? [{ key: `${i.jobId}|${i.seekerId}`, c, job, score: scoreMatch(c.criteria, job, c.distanceKm).score }] : []
    })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tổng quan tuyển dụng"
        description="Theo dõi tin đang mở, ứng viên phù hợp và lịch phỏng vấn trong tuần."
        actions={
          <Link
            to="/dang-tin"
            className={`inline-flex items-center gap-2 rounded-full bg-page-fg px-5 py-2.5 text-sm font-medium text-page-bg ${FOCUS}`}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Đăng tin mới
          </Link>
        }
      />
      <p className="text-xs text-page-muted">Dữ liệu demo trên trình duyệt này — dùng chung với Kết nối và trang Ghép việc.</p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tin đang mở" value={openRows.length} icon={Briefcase} href="/tuyen-dung/tin-dang" hint={`Trên tổng ${rows.length} tin`} />
        <StatCard label="Ứng viên phù hợp" value={fitTotal} icon={UserCheck} href="/match" hint="Điểm từ 60%, trên các tin đang mở" />
        <StatCard label="Kết nối" value={connectedTotal} icon={Handshake} href="/tuyen-dung/match" hint={working > 0 ? `${working} người đã đi làm` : 'Hai bên cùng quan tâm'} />
        <StatCard
          label="Phỏng vấn 7 ngày tới"
          value={in7Days.length}
          icon={CalendarClock}
          href="/lich-phong-van"
          hint={pendingCount > 0 ? `${pendingCount} lời mời chờ ứng viên chọn giờ` : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          title="Ứng viên vừa quan tâm"
          action={<Link to="/match" className={LINK}>Xem tất cả</Link>}
        >
          {interested.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="Chưa có ứng viên mới quan tâm"
              description="Khi có người tìm việc ứng tuyển tin của bạn, họ sẽ hiện ở đây."
            />
          ) : (
            <ul className="divide-y divide-page-line">
              {interested.map(({ key, c, job, score }) => (
                <li key={key} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span
                    aria-hidden="true"
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-page-line text-sm font-medium text-page-fg"
                  >
                    {c.name.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-page-fg">{c.name}</p>
                    <p className="truncate text-xs text-page-muted">{job.title}</p>
                  </div>
                  <MatchScore score={score} size="sm" />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Tin tuyển dụng"
          action={<Link to="/tuyen-dung/tin-dang" className={LINK}>Quản lý tin</Link>}
        >
          <ul className="divide-y divide-page-line">
            {rows.slice(0, 5).map((r) => {
              const b = badgeOf(r)
              return (
                <li key={r.job.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-page-fg">{r.job.title}</p>
                    <p className="text-xs text-page-muted">
                      {r.status === 'approved' && r.jobStatus === 'open'
                        ? `${numbers[r.job.id]?.fit ?? 0} ứng viên phù hợp`
                        : r.status === 'approved' ? (r.jobStatus === 'paused' ? 'Đang tạm dừng' : 'Đã đóng') : 'Chưa hiển thị công khai'}
                    </p>
                  </div>
                  <StatusBadge tone={b.tone}>{b.label}</StatusBadge>
                </li>
              )
            })}
          </ul>
        </Panel>
      </div>

      <Panel
        title="Lịch phỏng vấn sắp tới"
        action={<Link to="/lich-phong-van" className={LINK}>Xem lịch</Link>}
      >
        {upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarX}
            title="Chưa có lịch phỏng vấn"
            description="Mời ứng viên đã kết nối phỏng vấn, lịch đã xác nhận sẽ hiện ở đây."
          />
        ) : (
          <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {upcoming.slice(0, 3).map((iv) => {
              const Icon = iv.mode === 'online' ? Video : MapPin
              return (
                <li key={iv.id} className="rounded-card border border-page-line p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-page-fg">{candidateOf(iv.seekerId)?.name ?? 'Ứng viên'}</p>
                    <StatusBadge tone="default">{MODE_LABEL[iv.mode]}</StatusBadge>
                  </div>
                  <p className="mt-1 text-xs text-page-muted">{findAnyJob(iv.jobId)?.title ?? ''}</p>
                  <p className="tnum mt-3 text-sm text-page-fg">{fmtSlot(iv.chosen as string)}</p>
                  <p className="mt-1 flex items-start gap-1.5 text-xs text-page-muted">
                    <Icon className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
                    {iv.place}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </Panel>
    </div>
  )
}
