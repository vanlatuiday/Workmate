import { useEffect, useId, useState } from 'react'
import { INPUT } from './ui'

/**
 * Ô thời gian kinh nghiệm: chọn tháng/năm bắt đầu – kết thúc (hoặc "Đang làm ở đây").
 * Giá trị lưu vẫn là CHUỖI: "MM/YYYY – MM/YYYY" hoặc "MM/YYYY – nay" (backend giữ nguyên, ≤ 60 ký tự).
 */

type Parts = { sm: string; sy: string; em: string; ey: string; current: boolean }

const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
const NOW_YEAR = new Date().getFullYear()
const YEARS = Array.from({ length: NOW_YEAR - 1979 }, (_, i) => String(NOW_YEAR - i))
const EMPTY: Parts = { sm: '', sy: '', em: '', ey: '', current: false }

/** Đọc chuỗi chuẩn; không đúng định dạng → null (giữ nguyên văn cho người dùng chọn lại) */
export function parsePeriod(v: string): Parts | null {
  const m = v.trim().match(/^(\d{2})\/(\d{4})\s*[–-]\s*(?:(\d{2})\/(\d{4})|(nay))$/i)
  if (!m) return null
  if (+m[1] < 1 || +m[1] > 12 || (m[3] && (+m[3] < 1 || +m[3] > 12))) return null
  return { sm: m[1], sy: m[2], em: m[3] ?? '', ey: m[4] ?? '', current: !!m[5] }
}

const fmt = (p: Parts) => (p.current ? `${p.sm}/${p.sy} – nay` : `${p.sm}/${p.sy} – ${p.em}/${p.ey}`)
const ord = (m: string, y: string) => +y * 12 + +m

/** Trả chuỗi lưu được, hoặc thông báo lỗi / null khi chưa chọn đủ */
function validate(p: Parts): { value?: string; error?: string } {
  if (!p.sm || !p.sy) return {}
  if (!p.current && (!p.em || !p.ey)) return {}
  if (!p.current && ord(p.em, p.ey) < ord(p.sm, p.sy)) return { error: 'Thời gian kết thúc không được trước thời gian bắt đầu.' }
  return { value: fmt(p) }
}

export default function PeriodField({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const parsed = parsePeriod(value)
  const legacy = value.trim() !== '' && !parsed
  const [parts, setParts] = useState<Parts>(parsed ?? EMPTY)
  const errId = useId()

  // Giá trị đổi từ ngoài (vd. tải hồ sơ từ máy chủ) → đồng bộ lại bộ chọn
  useEffect(() => {
    const p = parsePeriod(value)
    if (p) setParts((cur) => (validate(cur).value === value ? cur : p))
  }, [value])

  const { error } = validate(parts)
  const update = (patch: Partial<Parts>) => {
    const next = { ...parts, ...patch }
    setParts(next)
    const r = validate(next)
    if (r.value) onChange(r.value)
  }

  const sel = `${INPUT} !w-auto min-w-0 flex-1`
  const opt = (list: string[], label: string) => (
    <>
      <option value="">{label}</option>
      {list.map((x) => <option key={x} value={x}>{x}</option>)}
    </>
  )

  return (
    <div role="group" aria-label="Thời gian làm việc" className="space-y-2">
      {legacy && !parts.sm && (
        <p className="text-sm text-page-fg">
          {value} <span className="text-page-muted">· Chọn lại thời gian để lưu theo định dạng mới.</span>
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-full text-xs text-page-muted sm:w-auto">Từ</span>
        <select id={id} aria-label="Tháng bắt đầu" aria-describedby={error ? errId : undefined} value={parts.sm} onChange={(e) => update({ sm: e.target.value })} className={sel}>{opt(MONTHS, 'Tháng')}</select>
        <select aria-label="Năm bắt đầu" value={parts.sy} onChange={(e) => update({ sy: e.target.value })} className={sel}>{opt(YEARS, 'Năm')}</select>
      </div>
      {!parts.current && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-full text-xs text-page-muted sm:w-auto">Đến</span>
          <select aria-label="Tháng kết thúc" aria-invalid={!!error} aria-describedby={error ? errId : undefined} value={parts.em} onChange={(e) => update({ em: e.target.value })} className={sel}>{opt(MONTHS, 'Tháng')}</select>
          <select aria-label="Năm kết thúc" aria-invalid={!!error} aria-describedby={error ? errId : undefined} value={parts.ey} onChange={(e) => update({ ey: e.target.value })} className={sel}>{opt(YEARS, 'Năm')}</select>
        </div>
      )}
      <label className="flex min-h-11 items-center gap-2 text-sm text-page-fg">
        <input type="checkbox" checked={parts.current} onChange={(e) => update({ current: e.target.checked })} className="h-4 w-4 accent-page-fg" />
        Đang làm ở đây
      </label>
      {error && <p id={errId} role="alert" className="text-sm text-danger">{error}</p>}
    </div>
  )
}
