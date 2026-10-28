import { useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, X } from 'lucide-react'
import { describeConversation } from '@pages/public/messages/describe'
import { inviteInterview, type InterviewMode } from '@services/connectionService'
import { cn } from '@utils/cn'
import { FOCUS } from '@utils/focus'
import DialogShell from './DialogShell'
import { MODE_LABEL } from './format'

type Props = { jobId: string; seekerId: string; onClose: () => void }
type Row = { id: number; date: string; time: string }

const pad = (n: number) => String(n).padStart(2, '0')
const dateStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
/** Mặc định: 2, 3, 4 ngày tới lúc 15:00 */
const defaultRows = (): Row[] =>
  [2, 3, 4].map((n, i) => {
    const d = new Date()
    d.setDate(d.getDate() + n)
    return { id: i, date: dateStr(d), time: '15:00' }
  })

const FIELD = cn('block w-full rounded-control border border-page-edge bg-page-bg px-3 py-2 text-sm text-page-fg placeholder:text-page-muted', FOCUS)
const MAX_SLOTS = 3

/** Hộp thoại doanh nghiệp mời ứng viên đã kết nối phỏng vấn: 1–3 khung giờ, hình thức, địa điểm, ghi chú. */
export default function InviteInterviewDialog({ jobId, seekerId, onClose }: Props) {
  const info = describeConversation('recruiter', jobId, seekerId)
  const [rows, setRows] = useState<Row[]>(defaultRows)
  const [nextId, setNextId] = useState(3)
  const [mode, setMode] = useState<InterviewMode>('onsite')
  const [place, setPlace] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const today = dateStr(new Date())

  const update = (id: number, patch: Partial<Row>) => setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  const addRow = () => {
    setRows((r) => [...r, { id: nextId, date: r[r.length - 1]?.date ?? today, time: '15:00' }])
    setNextId((n) => n + 1)
  }

  const submit = () => {
    const slots = rows.map((r) => (r.date && r.time ? new Date(`${r.date}T${r.time}`) : null))
    if (slots.some((d) => !d || Number.isNaN(d.getTime()))) return setError('Hãy chọn đủ ngày và giờ cho mỗi khung.')
    if (slots.some((d) => d!.getTime() <= Date.now())) return setError('Khung giờ phải ở tương lai.')
    const place1 = place.trim() || (mode === 'online' ? 'Gọi video trong ứng dụng' : '')
    if (!place1) return setError('Hãy nhập địa điểm phỏng vấn.')
    inviteInterview({ jobId, seekerId, slots: slots.map((d) => d!.toISOString()), mode, place: place1, note: note.trim() || undefined })
    toast.success(`Đã gửi lời mời phỏng vấn tới ${info.name}`)
    onClose()
  }

  return (
    <DialogShell titleId="invite-title" title={`Mời ${info.name} phỏng vấn`} subtitle={info.subtitle} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="space-y-6"
      >
        <fieldset>
          <legend className="text-sm font-medium text-page-fg">Khung giờ đề xuất (1–3)</legend>
          <ul className="mt-3 space-y-2">
            {rows.map((r, i) => (
              <li key={r.id} className="flex items-center gap-2">
                <label className="flex-1">
                  <span className="sr-only">Ngày {i + 1}</span>
                  <input type="date" min={today} value={r.date} onChange={(e) => update(r.id, { date: e.target.value })} className={FIELD} />
                </label>
                <label className="w-28">
                  <span className="sr-only">Giờ {i + 1}</span>
                  <input type="time" value={r.time} onChange={(e) => update(r.id, { time: e.target.value })} className={FIELD} />
                </label>
                {rows.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Bỏ khung giờ ${i + 1}`}
                    onClick={() => setRows((cur) => cur.filter((x) => x.id !== r.id))}
                    className={cn('rounded-control p-1.5 text-page-muted hover:text-page-fg', FOCUS)}
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
          {rows.length < MAX_SLOTS && (
            <button type="button" onClick={addRow} className={cn('mt-3 inline-flex items-center gap-1 rounded-control text-sm text-page-muted underline underline-offset-4 hover:text-page-fg', FOCUS)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Thêm khung giờ
            </button>
          )}
        </fieldset>

        <fieldset>
          <legend className="text-sm font-medium text-page-fg">Hình thức</legend>
          <div className="mt-3 flex gap-2">
            {(['onsite', 'online'] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={cn(
                  'rounded-full border px-4 py-1.5 text-sm transition-colors duration-300',
                  mode === m ? 'border-page-fg bg-page-fg text-page-bg' : 'border-page-edge text-page-fg hover:border-page-fg',
                  FOCUS,
                )}
              >
                {MODE_LABEL[m]}
              </button>
            ))}
          </div>
        </fieldset>

        <label className="block">
          <span className="text-sm font-medium text-page-fg">Địa điểm</span>
          <input
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder={mode === 'online' ? 'Gọi video trong ứng dụng' : 'Địa chỉ phỏng vấn'}
            className={cn(FIELD, 'mt-2')}
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-page-fg">Ghi chú <span className="font-normal text-page-muted">(không bắt buộc)</span></span>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Vd. mang theo giấy tờ, đến sớm 10 phút" className={cn(FIELD, 'mt-2 resize-none')} />
        </label>

        {error && <p role="alert" className="text-sm text-page-fg">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={cn('rounded-full border border-page-line px-5 py-2.5 text-sm font-medium text-page-fg hover:border-page-fg', FOCUS)}>
            Để sau
          </button>
          <button type="submit" className={cn('rounded-full border border-page-fg bg-page-fg px-5 py-2.5 text-sm font-medium text-page-bg transition-colors duration-300 hover:bg-page-bg hover:text-page-fg', FOCUS)}>
            Gửi lời mời
          </button>
        </div>
      </form>
    </DialogShell>
  )
}
