import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, Lock, LockOpen, UsersRound } from 'lucide-react'
import { PageHeader, StatusBadge, EmptyState, MockNotice } from '@components/dashboard'
import type { UserRole } from '@/types'
import {
  mockUsers, ROLE_LABELS, USER_STATUS_LABELS,
  type AdminUser, type UserStatus,
} from './mockData'
import { FOCUS } from '@utils/focus'

const FIELD =
  `rounded-card border border-page-edge bg-page-surface px-4 py-2.5 text-sm text-page-fg ${FOCUS}`
const BTN_SECONDARY =
  `rounded-full border border-page-line px-3.5 py-1.5 text-xs font-medium text-page-fg transition-colors duration-300 hover:border-page-fg ${FOCUS}`
const BTN_PRIMARY =
  `rounded-full bg-page-fg px-3.5 py-1.5 text-xs font-medium text-page-bg ${FOCUS}`

const STATUS_TONE: Record<UserStatus, 'strong' | 'default' | 'muted'> = {
  active: 'default',
  unverified: 'muted',
  locked: 'strong',
}

/** Nút Khóa / Mở khóa; bấm Khóa lần 1 hiện xác nhận ngay tại hàng. */
function RowAction({
  user, confirming, onAsk, onCancel, onToggle,
}: {
  user: AdminUser
  confirming: boolean
  onAsk: () => void
  onCancel: () => void
  onToggle: () => void
}) {
  // Nút Khóa/Mở khóa là phần tử khác nhau theo trạng thái; sau khi đóng xác nhận hoặc đổi trạng thái thì trả focus về nút gốc
  const mainBtn = useRef<HTMLButtonElement>(null)
  const refocus = useRef(false)
  useEffect(() => {
    if (refocus.current) {
      mainBtn.current?.focus()
      refocus.current = false
    }
  }, [confirming, user.status])
  const toggle = () => { refocus.current = true; onToggle() }
  const cancel = () => { refocus.current = true; onCancel() }

  if (user.role === 'admin') return <span className="text-xs text-page-muted">Không thể khóa</span>
  if (user.status === 'locked') {
    return (
      <button ref={mainBtn} type="button" onClick={toggle} className={BTN_SECONDARY}>
        <LockOpen className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
        Mở khóa<span className="sr-only"> {user.name}</span>
      </button>
    )
  }
  if (confirming) {
    return (
      <span className="inline-flex flex-wrap items-center gap-2" role="group" aria-label={`Xác nhận khóa ${user.name}`}>
        <span className="text-xs text-page-fg">Xác nhận khóa?</span>
        <button type="button" onClick={toggle} className={BTN_PRIMARY}>Khóa</button>
        {/* autoFocus: đưa focus vào cụm xác nhận ngay khi hiện (bản ẩn bằng CSS bỏ qua) */}
        <button type="button" autoFocus onClick={cancel} className={BTN_SECONDARY}>Hủy</button>
      </span>
    )
  }
  return (
    <button ref={mainBtn} type="button" onClick={onAsk} className={BTN_SECONDARY}>
      <Lock className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
      Khóa<span className="sr-only"> {user.name}</span>
    </button>
  )
}

export default function Users() {
  // Dữ liệu mẫu — thay bằng API. Chỉ 12 dòng nên không phân trang.
  const [users, setUsers] = useState<AdminUser[]>(mockUsers)
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<'all' | UserRole>('all')
  const [status, setStatus] = useState<'all' | UserStatus>('all')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users.filter(
      (u) =>
        (role === 'all' || u.role === role) &&
        (status === 'all' || u.status === status) &&
        (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)),
    )
  }, [users, query, role, status])

  const toggleLock = (u: AdminUser) => {
    const locking = u.status !== 'locked'
    // Khóa: nhớ trạng thái cũ; mở khóa: khôi phục đúng trạng thái đó
    setUsers((prev) =>
      prev.map((x) => {
        if (x.id !== u.id) return x
        if (locking) return { ...x, status: 'locked', prevStatus: x.status === 'unverified' ? 'unverified' : 'active' }
        return { ...x, status: x.prevStatus ?? 'active', prevStatus: undefined }
      }),
    )
    setConfirmId(null)
    setNotice(locking ? `Đã khóa tài khoản ${u.name}.` : `Đã mở khóa tài khoản ${u.name}.`)
  }

  const actionFor = (u: AdminUser) => (
    <RowAction
      user={u}
      confirming={confirmId === u.id}
      onAsk={() => setConfirmId(u.id)}
      onCancel={() => setConfirmId(null)}
      onToggle={() => toggleLock(u)}
    />
  )

  return (
    <div>
      <PageHeader title="Người dùng" description="Tra cứu tài khoản, lọc theo vai trò và trạng thái, khóa hoặc mở khóa khi cần." />

      <div className="flex flex-wrap gap-3">
        <div className="min-w-[12rem] flex-1">
          <label htmlFor="user-search" className="sr-only">Tìm theo tên hoặc email</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-page-muted" aria-hidden="true" />
            <input
              id="user-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên hoặc email" className={`w-full pl-10 ${FIELD}`}
            />
          </div>
        </div>
        <div className="w-full sm:w-auto">
          <label htmlFor="user-role" className="sr-only">Lọc theo vai trò</label>
          <select id="user-role" value={role} onChange={(e) => setRole(e.target.value as 'all' | UserRole)} className={`w-full ${FIELD}`}>
            <option value="all">Mọi vai trò</option>
            {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
          </select>
        </div>
        <div className="w-full sm:w-auto">
          <label htmlFor="user-status" className="sr-only">Lọc theo trạng thái</label>
          <select id="user-status" value={status} onChange={(e) => setStatus(e.target.value as 'all' | UserStatus)} className={`w-full ${FIELD}`}>
            <option value="all">Mọi trạng thái</option>
            {(Object.keys(USER_STATUS_LABELS) as UserStatus[]).map((s) => <option key={s} value={s}>{USER_STATUS_LABELS[s]}</option>)}
          </select>
        </div>
      </div>

      <p className="mt-4 text-sm text-page-muted" aria-live="polite">{filtered.length} người dùng</p>
      <p role="status" className="min-h-5 text-sm text-page-fg">{notice}</p>

      {filtered.length === 0 ? (
        <div className="mt-2">
          <EmptyState
            icon={UsersRound}
            title="Không có người dùng phù hợp"
            description="Thử đổi từ khóa hoặc bỏ bớt bộ lọc."
            action={
              <button type="button" className={BTN_SECONDARY} onClick={() => { setQuery(''); setRole('all'); setStatus('all') }}>
                Xóa bộ lọc
              </button>
            }
          />
        </div>
      ) : (
        <>
          {/* Từ 1024px: bảng */}
          <div className="relative mt-2 hidden overflow-x-auto rounded-card border border-page-line bg-page-surface xl:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">Danh sách người dùng</caption>
              <thead className="border-b border-page-line text-xs text-page-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Người dùng</th>
                  <th scope="col" className="px-4 py-3 font-medium">Vai trò</th>
                  <th scope="col" className="px-4 py-3 font-medium">Ngày tham gia</th>
                  <th scope="col" className="px-4 py-3 font-medium">Trạng thái</th>
                  <th scope="col" className="px-4 py-3 font-medium">Hoạt động gần nhất</th>
                  <th scope="col" className="px-4 py-3 font-medium">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-page-line">
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <th scope="row" className="px-4 py-3 font-normal">
                      <span className="block font-medium text-page-fg">{u.name}</span>
                      <span className="block text-xs text-page-muted">{u.email}</span>
                    </th>
                    <td className="px-4 py-3 text-page-fg">{ROLE_LABELS[u.role]}</td>
                    <td className="tnum px-4 py-3 text-page-muted">{u.joinedAt}</td>
                    <td className="px-4 py-3"><StatusBadge tone={STATUS_TONE[u.status]}>{USER_STATUS_LABELS[u.status]}</StatusBadge></td>
                    <td className="px-4 py-3 text-page-muted">{u.lastActive}</td>
                    <td className="px-4 py-3">{actionFor(u)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Dưới 1024px: danh sách thẻ */}
          <ul className="mt-2 space-y-3 xl:hidden">
            {filtered.map((u) => (
              <li key={u.id} className="rounded-card border border-page-line bg-page-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-page-fg">{u.name}</p>
                    <p className="break-all text-xs text-page-muted">{u.email}</p>
                  </div>
                  <StatusBadge tone={STATUS_TONE[u.status]}>{USER_STATUS_LABELS[u.status]}</StatusBadge>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div><dt className="text-page-muted">Vai trò</dt><dd className="text-page-fg">{ROLE_LABELS[u.role]}</dd></div>
                  <div><dt className="text-page-muted">Ngày tham gia</dt><dd className="text-page-fg">{u.joinedAt}</dd></div>
                  <div className="col-span-2"><dt className="text-page-muted">Hoạt động gần nhất</dt><dd className="text-page-fg">{u.lastActive}</dd></div>
                </dl>
                <div className="mt-3">{actionFor(u)}</div>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-6"><MockNotice /></div>
    </div>
  )
}
