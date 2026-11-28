import { useId } from 'react'
import { AlertCircle } from 'lucide-react'
import { FOCUS } from '@utils/focus'

const FIELD = `w-full rounded-control border border-page-edge bg-page-surface px-3 py-2 text-sm text-page-fg ${FOCUS}`

/** Ô mật khẩu có nhãn và lỗi gắn aria-describedby */
export default function PasswordField({ label, value, onChange, error, autoComplete }: { label: string; value: string; onChange: (v: string) => void; error?: string; autoComplete: string }) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm text-page-muted">{label}</label>
      <input id={id} type="password" value={value} autoComplete={autoComplete} onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-err` : undefined} className={FIELD} />
      {error && (
        <p id={`${id}-err`} role="alert" className="flex items-center gap-1.5 text-sm font-medium text-page-fg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />{error}
        </p>
      )}
    </div>
  )
}
