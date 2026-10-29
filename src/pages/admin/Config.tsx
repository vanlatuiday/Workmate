import { useId, useState } from 'react'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'
import { PageHeader, Panel } from '@components/dashboard'
import { BTN_PRIMARY, BTN_SECONDARY, ConfirmDialog, FIELD } from '@components/admin/parts'
import { CRITERION_LABELS, type CriterionKey } from '@pages/public/match/score'
import { DEFAULT_CONFIG, resetAdminData, updateConfig, useAdmin, type SystemConfig } from '@services/adminService'
import { FOCUS } from '@utils/focus'

const KEYS = Object.keys(CRITERION_LABELS) as CriterionKey[]
type Confirm = 'defaults' | 'reset' | null

/** /admin/cau-hinh — cấu hình hệ thống; chỉnh trong form cục bộ, bấm "Lưu thay đổi" mới áp dụng. */
export default function Config() {
  const saved = useAdmin((s) => s.config)
  const [form, setForm] = useState<SystemConfig>(saved)
  const [word, setWord] = useState('')
  const [confirm, setConfirm] = useState<Confirm>(null)
  const uid = useId()

  const total = KEYS.reduce((s, k) => s + form.weights[k], 0)
  const weightsOk = total === 100
  const dirty = JSON.stringify(form) !== JSON.stringify(saved)
  const patch = (p: Partial<SystemConfig>) => setForm((f) => ({ ...f, ...p }))

  const addWord = () => {
    const w = word.trim()
    if (w && !form.bannedWords.some((x) => x.toLowerCase() === w.toLowerCase())) patch({ bannedWords: [...form.bannedWords, w] })
    setWord('')
  }

  const save = () => {
    if (!weightsOk) return
    updateConfig(form)
    toast.success('Đã lưu cấu hình')
  }

  const numField = (key: 'minWageK' | 'defaultRadiusKm', label: string, unit: string, hint: string) => (
    <div>
      <label htmlFor={`${uid}-${key}`} className="text-sm font-medium text-page-fg">{label}</label>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          id={`${uid}-${key}`} type="number" min={0} inputMode="numeric" value={form[key]}
          onChange={(e) => patch({ [key]: Math.max(0, Number(e.target.value) || 0) })}
          aria-describedby={`${uid}-${key}-h`} className={`tnum w-28 ${FIELD}`}
        />
        <span className="text-sm text-page-muted">{unit}</span>
      </div>
      <p id={`${uid}-${key}-h`} className="mt-1 text-xs text-page-muted">{hint}</p>
    </div>
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cấu hình hệ thống"
        description="Quy tắc chấm điểm và kiểm duyệt áp dụng cho toàn bộ Workmate."
        actions={<button type="button" onClick={save} disabled={!weightsOk || !dirty} className={`${BTN_PRIMARY} disabled:cursor-not-allowed disabled:opacity-40`}>Lưu thay đổi</button>}
      />

      <Panel title="Trọng số điểm phù hợp">
        <p className="text-sm text-page-muted">Mức quan trọng mặc định (%) của 5 tiêu chí, dùng khi người dùng không tự xếp ưu tiên.</p>
        <ul className="mt-4 space-y-4">
          {KEYS.map((k) => (
            <li key={k} className="grid grid-cols-[6rem_1fr_3rem] items-center gap-3 sm:grid-cols-[8rem_1fr_3rem]">
              <label htmlFor={`${uid}-w-${k}`} className="text-sm text-page-fg">{CRITERION_LABELS[k]}</label>
              <input
                id={`${uid}-w-${k}`} type="range" min={0} max={100} step={1} value={form.weights[k]}
                onChange={(e) => patch({ weights: { ...form.weights, [k]: Number(e.target.value) } })}
                className={`w-full accent-wm-charcoal ${FOCUS}`}
              />
              <span className="tnum text-right text-sm text-page-fg">{form.weights[k]}%</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-page-line pt-4">
          <p role="status" className={`text-sm ${weightsOk ? 'text-page-muted' : 'font-medium text-page-fg'}`}>
            {weightsOk ? <>Tổng: <span className="tnum">100%</span></> : <>Tổng phải bằng 100, hiện <span className="tnum">{total}</span></>}
          </p>
          <button type="button" onClick={() => patch({ weights: DEFAULT_CONFIG.weights })} className={BTN_SECONDARY}>Chia đều lại theo mặc định</button>
        </div>
      </Panel>

      <Panel title="Kiểm duyệt tin">
        <p className="text-sm font-medium text-page-fg" id={`${uid}-words`}>Từ cấm</p>
        <p className="mt-1 text-xs text-page-muted">Tin chứa từ này bị tự gắn cờ khi kiểm duyệt.</p>
        <ul aria-labelledby={`${uid}-words`} className="mt-3 flex flex-wrap gap-2">
          {form.bannedWords.map((w) => (
            <li key={w} className="inline-flex items-center gap-1 rounded-full border border-page-line py-1 pl-3 pr-1 text-sm text-page-fg">
              {w}
              <button type="button" onClick={() => patch({ bannedWords: form.bannedWords.filter((x) => x !== w) })} aria-label={`Xóa từ cấm ${w}`} className={`-m-1 rounded-full p-2 text-page-muted hover:text-page-fg ${FOCUS}`}>
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </li>
          ))}
          {!form.bannedWords.length && <li className="text-sm text-page-muted">Chưa có từ cấm nào.</li>}
        </ul>
        <div className="mt-3 flex gap-2">
          <label htmlFor={`${uid}-word`} className="sr-only">Thêm từ cấm</label>
          <input
            id={`${uid}-word`} value={word} onChange={(e) => setWord(e.target.value)} placeholder="Thêm từ cấm, nhấn Enter"
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addWord() } }}
            className={`min-w-0 flex-1 sm:max-w-xs ${FIELD}`}
          />
          <button type="button" onClick={addWord} className={BTN_SECONDARY}>Thêm</button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 border-t border-page-line pt-6 sm:grid-cols-2">
          {numField('minWageK', 'Ngưỡng lương gắn cờ', 'nghìn đồng/giờ', 'Lương tối đa thấp hơn mức này bị gắn cờ.')}
          {numField('defaultRadiusKm', 'Bán kính mặc định khi đăng tin', 'km', 'Bán kính tuyển gợi ý cho tin mới.')}
        </div>
      </Panel>

      <Panel title="Tài khoản">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p id={`${uid}-reg`} className="text-sm font-medium text-page-fg">Mở đăng ký tài khoản mới</p>
            <p className="mt-1 text-xs text-page-muted">Tắt thì trang đăng ký hiện thông báo tạm dừng.</p>
          </div>
          <button
            type="button" role="switch" aria-checked={form.registrationOpen} aria-labelledby={`${uid}-reg`}
            onClick={() => patch({ registrationOpen: !form.registrationOpen })}
            className={`relative h-6 w-11 flex-shrink-0 rounded-full border transition-colors duration-300 ${FOCUS} ${form.registrationOpen ? 'border-page-fg bg-page-fg' : 'border-page-edge bg-page-surface'}`}
          >
            <span aria-hidden="true" className={`absolute top-0.5 h-4 w-4 rounded-full transition-transform duration-300 motion-reduce:transition-none ${form.registrationOpen ? 'translate-x-[1.375rem] bg-page-bg' : 'translate-x-0.5 bg-page-fg'}`} />
          </button>
        </div>
      </Panel>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={() => setConfirm('defaults')} className={BTN_SECONDARY}>Khôi phục mặc định</button>
        <button type="button" onClick={() => setConfirm('reset')} className={BTN_SECONDARY}>Đặt lại dữ liệu quản trị</button>
      </div>

      {confirm === 'defaults' && (
        <ConfirmDialog
          title="Khôi phục mặc định" confirmLabel="Khôi phục" onCancel={() => setConfirm(null)}
          message="Đưa mọi cấu hình về giá trị ban đầu? Báo cáo và trạng thái kiểm duyệt giữ nguyên."
          onConfirm={() => { updateConfig(DEFAULT_CONFIG); setForm(DEFAULT_CONFIG); setConfirm(null); toast.success('Đã khôi phục cấu hình mặc định') }}
        />
      )}
      {confirm === 'reset' && (
        <ConfirmDialog
          title="Đặt lại dữ liệu quản trị" confirmLabel="Đặt lại" onCancel={() => setConfirm(null)}
          message="Xóa mọi thao tác quản trị (duyệt, ẩn, khóa, xác minh, báo cáo, cấu hình) và quay về dữ liệu mẫu ban đầu?"
          onConfirm={() => { resetAdminData(); setForm(DEFAULT_CONFIG); setConfirm(null); toast.success('Đã đặt lại dữ liệu quản trị') }}
        />
      )}
    </div>
  )
}
