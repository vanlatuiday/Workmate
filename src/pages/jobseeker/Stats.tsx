import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, CalendarCheck, ClipboardList, Handshake, Mail, Star, Trophy } from 'lucide-react'
import { EmptyState, PageHeader, Panel, Skeleton, StatCard } from '@components/dashboard'
import { fetchSeekerStats, type SeekerStats } from '@services/statsService'
import { BTN_ACCENT, BTN_SECONDARY } from '@utils/ui'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'

const vi = (n: number) => n.toLocaleString('vi-VN')

/** Ba chuỗi của biểu đồ tuần. Màu lấy từ token (đã kiểm: ≥3:1 trên nền kem, ΔE CVD ≥13); danh tính còn nằm ở chú giải + tooltip + bảng. */
const SERIES = [
  { key: 'applied', label: 'Đơn bạn gửi', bar: 'bg-wm-fern', dot: 'bg-wm-fern' },
  { key: 'invited', label: 'Doanh nghiệp mời bạn', bar: 'bg-wm-violet', dot: 'bg-wm-violet' },
  { key: 'connected', label: 'Kết nối', bar: 'bg-wm-amber', dot: 'bg-wm-amber' },
] as const

/** 'YYYY-MM-DD' → 'DD/MM' (không qua Date để khỏi lệch múi giờ) */
const weekLabel = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`

/** Trục tung: làm tròn lên số chẵn (tối thiểu 4) để vạch giữa là số nguyên */
function niceMax(v: number) {
  if (v <= 4) return 4
  const step = v < 10 ? 1 : 10 ** Math.floor(Math.log10(v)) / 2
  const m = Math.ceil(v / step) * step
  return m % 2 === 0 ? m : m + 1
}

function WeeklyChart({ weekly }: { weekly: SeekerStats['weekly'] }) {
  const [active, setActive] = useState<number | null>(null)
  const max = niceMax(Math.max(0, ...weekly.flatMap((w) => [w.applied, w.invited, w.connected])))
  const ticks = [max, max / 2, 0]
  const plotH = 176
  const pct = (v: number) => (v / max) * 100
  const tip = active !== null ? weekly[active] : null
  // Tooltip bám giữa cột tuần đang chọn; ở hai đầu thì dịch vào trong để không tràn khung
  const centre = active !== null ? ((active + 0.5) / weekly.length) * 100 : 0
  const tipShift = centre < 20 ? '0%' : centre > 80 ? '-100%' : '-50%'

  return (
    <div>
      <ul className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-page-muted" aria-label="Chú giải">
        {SERIES.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span aria-hidden="true" className={cn('h-2.5 w-2.5 rounded-[3px]', s.dot)} />
            {s.label}
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        {/* Nhãn trục tung */}
        <div className="relative w-6 shrink-0 text-right text-xs text-page-muted tnum" style={{ height: plotH }} aria-hidden="true">
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2" style={{ top: `${100 - pct(t)}%` }}>{vi(t)}</span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1">
          {/* Đường lưới: 1px, nhạt */}
          <div className="relative" style={{ height: plotH }}>
            {ticks.map((t) => (
              <div key={t} aria-hidden="true" className="absolute inset-x-0 h-px bg-page-line" style={{ top: `${100 - pct(t)}%` }} />
            ))}
            <div className="absolute inset-0 flex" role="group" aria-label="Biểu đồ cột nhóm theo tuần. Dùng phím Tab để xem từng tuần.">
              {weekly.map((w, i) => (
                <div
                  key={w.weekStart}
                  tabIndex={0}
                  role="img"
                  aria-label={`Tuần từ ${weekLabel(w.weekStart)}: ${w.applied} đơn gửi, ${w.invited} lời mời, ${w.connected} kết nối`}
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className={cn('group relative flex flex-1 items-end justify-center gap-0.5 rounded-control px-0.5 outline-none sm:gap-[2px]', active === i && 'bg-page-bg', 'focus-visible:ring-2 focus-visible:ring-page-fg')}
                >
                  {SERIES.map((s) => (
                    <div
                      key={s.key}
                      className={cn('w-full max-w-[20px] rounded-t-[4px] transition-opacity duration-fast', s.bar, active !== null && active !== i && 'opacity-60')}
                      style={{ height: `${pct(w[s.key])}%`, minHeight: w[s.key] > 0 ? 2 : 0 }}
                    />
                  ))}
                </div>
              ))}
            </div>
            {tip && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute z-10 w-max max-w-[16rem] rounded-control border border-page-line bg-page-surface p-3 text-xs shadow-lg"
                style={{ left: `${centre}%`, top: 0, transform: `translateX(${tipShift})` }}
              >
                <p className="mb-2 text-page-muted">Tuần từ {weekLabel(tip.weekStart)}</p>
                {SERIES.map((s) => (
                  <p key={s.key} className="flex items-center justify-between gap-3 py-0.5">
                    <span className="flex items-center gap-2 text-page-muted">
                      <span className={cn('h-0.5 w-3 rounded-full', s.dot)} />
                      {s.label}
                    </span>
                    <span className="tnum text-sm font-medium text-page-fg">{tip[s.key]}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
          {/* Nhãn trục hoành */}
          <div className="mt-2 flex" aria-hidden="true">
            {weekly.map((w) => (
              <span key={w.weekStart} className="flex-1 text-center text-[11px] text-page-muted tnum max-sm:odd:invisible sm:text-xs">{weekLabel(w.weekStart)}</span>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-2 text-center text-xs text-page-muted">Tuần bắt đầu từ thứ Hai (ngày/tháng)</p>

      {/* Bảng dữ liệu thay thế cho trình đọc màn hình */}
      <table className="sr-only">
        <caption>Hoạt động 8 tuần gần nhất</caption>
        <thead>
          <tr>
            <th scope="col">Tuần từ</th>
            {SERIES.map((s) => <th key={s.key} scope="col">{s.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {weekly.map((w) => (
            <tr key={w.weekStart}>
              <th scope="row">{weekLabel(w.weekStart)}</th>
              {SERIES.map((s) => <td key={s.key}>{w[s.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Funnel({ t }: { t: SeekerStats['totals'] }) {
  // Kết nối đến từ cả đơn bạn gửi lẫn lời mời của doanh nghiệp, nên từ bước "Cơ hội" trở đi
  // % tính theo (đơn gửi + lời mời) — tính theo số đơn gửi sẽ có lúc vượt 100%
  const chances = t.applied + t.invited
  const ofApplied = (v: number) => (t.applied > 0 ? `${Math.round((v / t.applied) * 100)}% số đơn gửi` : '—')
  const ofChances = (v: number) => (chances > 0 ? `${Math.round((v / chances) * 100)}% số cơ hội` : '—')
  const steps = [
    { label: 'Đơn đã gửi', value: t.applied, note: '' },
    { label: 'Được doanh nghiệp xem', value: t.viewed, note: ofApplied(t.viewed) },
    { label: 'Đang được cân nhắc', value: t.considering, note: ofApplied(t.considering) },
    { label: 'Cơ hội (đơn gửi + lời mời)', value: chances, note: `${vi(t.invited)} lời mời` },
    { label: 'Kết nối', value: t.connected, note: ofChances(t.connected) },
    { label: 'Phỏng vấn', value: t.interviews, note: ofChances(t.interviews) },
    { label: 'Nhận việc', value: t.hired, note: ofChances(t.hired) },
  ]
  const top = Math.max(1, ...steps.map((s) => s.value))
  return (
    <ol className="space-y-4">
      {steps.map((s) => (
        <li key={s.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-page-fg">{s.label}</span>
            <span className="tnum text-page-muted">
              <span className="font-medium text-page-fg">{vi(s.value)}</span>
              {s.note && ` · ${s.note}`}
            </span>
          </div>
          <div aria-hidden="true" className="mt-1.5 h-2.5 rounded-full bg-page-line">
            <div className="h-full rounded-full bg-wm-fern" style={{ width: `${(s.value / top) * 100}%`, minWidth: s.value > 0 ? 6 : 0 }} />
          </div>
        </li>
      ))}
    </ol>
  )
}

function RateRow({ label, value, hint }: { label: string; value: number | null; hint: string }) {
  return (
    <div>
      <p className="text-sm text-page-muted">{label}</p>
      <p className="tnum mt-1 font-display text-3xl font-medium text-page-fg">{value === null ? '—' : `${value}%`}</p>
      <p className="mt-1 text-xs text-page-muted">{value === null ? 'Chưa có đơn nào' : hint}</p>
    </div>
  )
}

export default function JobseekerStats() {
  const [stats, setStats] = useState<SeekerStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    const res = await fetchSeekerStats()
    setStats(res.data)
    setError(res.error)
    setLoading(false)
  }, [])
  useEffect(() => { void load() }, [load])

  const t = stats?.totals
  const allZero = !!t && Object.values(t).every((v) => v === 0)

  return (
    <div>
      <PageHeader title="Thống kê" description="Theo dõi hành trình ứng tuyển của bạn: bao nhiêu đơn được xem, kết nối và đi tới phỏng vấn." />

      {loading && (
        <div role="status" aria-live="polite">
          <span className="sr-only">Đang tải thống kê…</span>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className={cn('rounded-card border border-page-line bg-page-surface p-5 md:p-6', i === 4 && 'col-span-2 lg:col-span-1')}>
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="mt-4 h-9 w-1/3" />
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-72 rounded-card" />
            <Skeleton className="h-72 rounded-card" />
          </div>
        </div>
      )}

      {!loading && error && (
        <div role="alert" className="rounded-card border border-danger bg-danger-soft p-6">
          <p className="font-medium text-page-fg">{error}</p>
          <button type="button" onClick={() => void load()} className={cn(BTN_SECONDARY, 'mt-4')}>Thử lại</button>
        </div>
      )}

      {!loading && !error && stats && t && (
        allZero ? (
          <EmptyState
            icon={BarChart3}
            title="Chưa có số liệu để thống kê"
            description="Khi bạn ứng tuyển hoặc doanh nghiệp quan tâm bạn, hành trình và biểu đồ hoạt động sẽ hiện ở đây."
            action={<Link to="/tim-viec/phu-hop" className={BTN_ACCENT}>Xem việc phù hợp</Link>}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
              <StatCard label="Đơn đã gửi" value={t.applied} icon={ClipboardList} href="/tim-viec/ung-tuyen" />
              <StatCard label="Lời mời" value={t.invited} hint="từ doanh nghiệp" icon={Mail} />
              <StatCard label="Kết nối" value={t.connected} icon={Handshake} href="/tim-viec/match" />
              <StatCard label="Phỏng vấn" value={t.interviews} icon={CalendarCheck} href="/lich-phong-van" hint={t.upcomingInterviews > 0 ? `${t.upcomingInterviews} sắp tới` : undefined} />
              <div className="col-span-2 lg:col-span-1 [&>*]:h-full">
                <StatCard label="Nhận việc" value={t.hired} icon={Trophy} hint={t.offers > 0 ? `${t.offers} lời mời nhận việc đang chờ` : undefined} />
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-5">
              <Panel title="Hoạt động 8 tuần" className="lg:col-span-3">
                <WeeklyChart weekly={stats.weekly} />
              </Panel>
              <Panel title="Hành trình ứng tuyển" className="lg:col-span-2">
                <Funnel t={t} />
              </Panel>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <Panel title="Tỉ lệ">
                <div className="grid grid-cols-2 gap-6">
                  <RateRow label="Đơn được xem" value={stats.rates.viewed} hint="doanh nghiệp đã mở xem đơn" />
                  <RateRow label="Thành kết nối" value={stats.rates.connected} hint="đơn gửi và lời mời được nhận" />
                </div>
              </Panel>
              <Panel title="Đánh giá từ doanh nghiệp">
                {stats.rating ? (
                  <div className="flex items-center gap-4">
                    <p className="tnum font-display text-3xl font-medium text-page-fg">{stats.rating.average.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}</p>
                    <div>
                      <div className="flex gap-0.5" role="img" aria-label={`${stats.rating.average.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} trên 5 sao`}>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} aria-hidden="true" className={cn('h-5 w-5', n <= Math.round(stats.rating!.average) ? 'fill-wm-amber text-wm-amber' : 'text-page-line')} />
                        ))}
                      </div>
                      <p className="mt-1 text-xs text-page-muted">{vi(stats.rating.count)} đánh giá</p>
                    </div>
                  </div>
                ) : (
                  <p className={cn('text-sm leading-relaxed text-page-muted', FOCUS)}>Chưa có đánh giá nào. Sau khi hoàn tất phỏng vấn hoặc làm việc, doanh nghiệp có thể đánh giá bạn.</p>
                )}
              </Panel>
            </div>
          </>
        )
      )}
    </div>
  )
}
