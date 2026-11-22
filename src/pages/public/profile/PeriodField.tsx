import { useEffect, useId, useState } from 'react'
import { INPUT } from './ui'

/**
 * Ô thời gian kinh nghiệm: hai ô tháng "Từ" và "Đến" (hoặc tick "Đang làm ở đây").
 * Giá trị lưu vẫn là CHUỖI: "MM/YYYY – MM/YYYY" hoặc "MM/YYYY – nay" (backend giữ nguyên, ≤ 60 ký tự).
 * Giá trị cũ dạng tự do ("2024 – 2025", "06/2025 – nay"…) được đọc rộng rãi rồi viết lại đúng chuẩn khi mở ra.
 */

/** `from` / `to` dạng "YYYY-MM" (đúng định dạng của <input type="month">) */
type Parts = { from: string; to: string; current: boolean }

const EMPTY: Parts = { from: '', to: '', current: false }
const YM = /^\d{4}-(0[1-9]|1[0-2])$/

/** Một mốc thời gian: "06/2025" → 2025-06, "2024" → năm trần (đầu/cuối năm tùy vị trí), "nay" → hiện tại */
function parseToken(t: string, end: boolean): string | 'now' | null {
  const s = t.trim()
  if (/^(nay|hiện tại|hien tai|now|present)$/i.test(s)) return 'now'
  let m = s.match(/^(\d{1,2})\/(\d{4})$/)
  if (m && +m[1] >= 1 && +m[1] <= 12) return `${m[2]}-${m[1].padStart(2, '0')}`
  m = s.match(/^(\d{4})-(\d{2})$/)
  if (m && +m[2] >= 1 && +m[2] <= 12) return s
  m = s.match(/^(\d{4})$/)
  if (m) return `${m[1]}-${end ? '12' : '01'}`
  return null
}

/** Đọc chuỗi đã lưu (chuẩn hoặc cũ); không hiểu được → null (ô để trống) */
function parsePeriod(v: string): Parts | null {
  const raw = v.trim()
  if (!raw) return null
  const bits = raw.split(/\s*[–—-]\s*/).filter(Boolean)
  if (bits.length < 1 || bits.length > 2) return null
  const from = parseToken(bits[0], false)
  if (!from || from === 'now') return null
  if (bits.length === 1) return { from, to: '', current: false }
  const to = parseToken(bits[1], true)
  if (!to) return null
  return to === 'now' ? { from, to: '', current: true } : { from, to, current: false }
}

const mmYYYY = (ym: string) => `${ym.slice(5, 7)}/${ym.slice(0, 4)}`

/** Trả chuỗi lưu được, '' khi cả hai ô trống, hoặc lỗi khi "Đến" trước "Từ" */
function validate(p: Parts): { value?: string; error?: string } {
  if (!p.from && !p.to && !p.current) return { value: '' }
  if (!YM.test(p.from)) return {}
  if (p.current) return { value: `${mmYYYY(p.from)} – nay` }
  if (!YM.test(p.to)) return {}
  if (p.to < p.from) return { error: 'Thời gian kết thúc không được trước thời gian bắt đầu.' }
  return { value: `${mmYYYY(p.from)} – ${mmYYYY(p.to)}` }
}

export default function PeriodField({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const [parts, setParts] = useState<Parts>(() => parsePeriod(value) ?? EMPTY)
  const errId = useId()
  const toId = `${id}-den`

  // Giá trị đổi từ ngoài (tải hồ sơ từ máy chủ) hoặc còn ở dạng cũ → đồng bộ ô nhập và viết lại đúng chuẩn
  useEffect(() => {
    const p = parsePeriod(value)
    if (!p) return
    setParts((cur) => (validate(cur).value === value ? cur : p))
    const canon = validate(p).value
    if (canon && canon !== value) onChange(canon)
    // onChange đổi mỗi lần render ở nơi gọi; chỉ cần chạy khi giá trị đổi
  }, [value])

  const { error } = validate(parts)
  const update = (patch: Partial<Parts>) => {
    const next = { ...parts, ...patch }
    setParts(next)
    const r = validate(next)
    if (r.value !== undefined) onChange(r.value)
  }

  return (
    <div role="group" aria-label="Thời gian làm việc" className="space-y-2">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={id} className="mb-1 block text-xs text-page-muted">Từ</label>
          <input id={id} type="month" placeholder="yyyy-mm" max="2099-12" value={parts.from} onChange={(e) => update({ from: e.target.value })} className={INPUT} />
        </div>
        <div>
          <label htmlFor={toId} className="mb-1 block text-xs text-page-muted">Đến</label>
          <input
            id={toId} type="month" placeholder="yyyy-mm" min={parts.from || undefined} disabled={parts.current}
            value={parts.current ? '' : parts.to} onChange={(e) => update({ to: e.target.value })}
            aria-invalid={!!error} aria-describedby={error ? errId : undefined}
            className={`${INPUT} disabled:cursor-not-allowed disabled:opacity-50`}
          />
        </div>
      </div>
      <label className="flex min-h-11 items-center gap-2 text-sm text-page-fg">
        <input type="checkbox" checked={parts.current} onChange={(e) => update({ current: e.target.checked })} className="h-4 w-4 accent-page-fg" />
        Đang làm ở đây
      </label>
      {error && <p id={errId} role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  )
}
