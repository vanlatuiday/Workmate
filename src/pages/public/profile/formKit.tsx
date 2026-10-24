// Bộ khung form sửa: lỗi theo tên trường, focus vào trường lỗi đầu tiên, danh sách thêm/xóa mục.
import { createContext, useContext, useId, useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@utils/cn'
import type { FieldErrors } from './logic'
import { Btn, FOCUS } from './ui'

const ErrorsCtx = createContext<FieldErrors>({})

/** Tách chuỗi "a, b, c" thành mảng, bỏ mục rỗng */
export const splitList = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean)

/** Gộp lỗi của một mục trong danh sách vào lỗi chung với tiền tố, vd. "skills.0." */
export function mergeErrors(into: FieldErrors, prefix: string, from: FieldErrors) {
  for (const [k, v] of Object.entries(from)) into[`${prefix}${k}`] = v
}

/**
 * Khung form: giữ lỗi, chạy `check` khi bấm Lưu; hợp lệ thì gọi `save` rồi đóng.
 * Có lỗi → hiện dưới trường và đưa focus vào trường lỗi đầu tiên.
 */
export function FormShell({
  check,
  save,
  onClose,
  children,
}: {
  check: () => FieldErrors
  save: () => void
  onClose: () => void
  children: React.ReactNode
}) {
  const [errors, setErrors] = useState<FieldErrors>({})
  const form = useRef<HTMLFormElement>(null)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const found = check()
    setErrors(found)
    if (Object.keys(found).length) {
      // Chờ React vẽ xong aria-invalid rồi mới tìm trường lỗi đầu tiên
      window.setTimeout(() => form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0)
      return
    }
    save()
    onClose()
  }

  return (
    <ErrorsCtx.Provider value={errors}>
      <form ref={form} onSubmit={submit} noValidate className="space-y-5">
        {children}
        <div className="sticky -bottom-5 -mx-5 flex justify-end gap-2 border-t border-page-line bg-page-bg px-5 py-4 sm:-mx-6 sm:px-6">
          <Btn onClick={onClose}>Hủy</Btn>
          <button
            type="submit"
            className={cn('inline-flex items-center rounded-full bg-page-fg px-6 py-2.5 text-sm font-medium text-page-bg hover:opacity-90', FOCUS)}
          >
            Lưu
          </button>
        </div>
      </form>
    </ErrorsCtx.Provider>
  )
}

const INPUT =
  'w-full rounded-control border border-page-edge bg-page-bg px-3 py-2 text-sm text-page-fg aria-[invalid=true]:border-2 aria-[invalid=true]:border-page-fg ' +
  FOCUS

/** Ô nhập một dòng / nhiều dòng / chọn; `name` cũng là khóa lỗi */
export function Field({
  name,
  label,
  value,
  onChange,
  type = 'text',
  multiline,
  hint,
  options,
  className,
}: {
  name: string
  label: string
  value: string | number
  onChange: (v: string) => void
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'month'
  multiline?: boolean
  hint?: string
  options?: { value: string; text: string }[]
  className?: string
}) {
  const id = useId()
  const error = useContext(ErrorsCtx)[name]
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(' ') || undefined
  const common = {
    id,
    value: typeof value === 'number' && Number.isNaN(value) ? '' : value,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    className: INPUT,
  }
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-page-fg">
        {label}
      </label>
      {options ? (
        <select {...common} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.text}
            </option>
          ))}
        </select>
      ) : multiline ? (
        <textarea {...common} rows={3} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input {...common} type={type} step={type === 'number' ? 'any' : undefined} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-page-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="mt-1 text-sm font-medium text-page-fg">
          {error}
        </p>
      )}
    </div>
  )
}

/** Chuyển chuỗi nhập thành số (rỗng → NaN để `validate` bắt lỗi) */
export const toNum = (v: string) => (v.trim() === '' ? NaN : Number(v))

/** Danh sách mục có thêm/xóa. `render` vẽ các trường của một mục. */
export function ListEditor<T extends { id: string }>({
  legend,
  itemName,
  items,
  onChange,
  make,
  render,
}: {
  legend: string
  /** Tên một mục, dùng cho nhãn nút ("Thêm kỹ năng", "Xóa kỹ năng 2") */
  itemName: string
  items: T[]
  onChange: (items: T[]) => void
  make: () => T
  render: (item: T, index: number, set: (patch: Partial<T>) => void) => React.ReactNode
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 font-display text-base font-semibold">{legend}</legend>
      {items.length === 0 && <p className="text-sm text-page-muted">Chưa có {itemName} nào.</p>}
      {items.map((it, i) => (
        <div key={it.id} className="space-y-3 rounded-card border border-page-line p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {render(it, i, (patch) => onChange(items.map((x) => (x.id === it.id ? { ...x, ...patch } : x))))}
          </div>
          <button
            type="button"
            onClick={() => onChange(items.filter((x) => x.id !== it.id))}
            aria-label={`Xóa ${itemName} ${i + 1}`}
            className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm text-page-muted hover:text-page-fg', FOCUS)}
          >
            <Trash2 className="h-4 w-4" aria-hidden />
            Xóa
          </button>
        </div>
      ))}
      <Btn onClick={() => onChange([...items, make()])}>
        <Plus className="h-4 w-4" aria-hidden />
        Thêm {itemName}
      </Btn>
    </fieldset>
  )
}
