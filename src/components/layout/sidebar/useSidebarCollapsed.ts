import { useCallback, useState } from 'react'

const KEY = 'workmate-sidebar-collapsed'

/** Trạng thái thu gọn thanh bên, nhớ qua lần tải lại (localStorage có thể bị chặn nên bọc try/catch). */
export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(KEY) === '1'
    } catch {
      return false
    }
  })
  const set = useCallback((v: boolean) => {
    setCollapsed(v)
    try {
      localStorage.setItem(KEY, v ? '1' : '0')
    } catch {
      /* bỏ qua */
    }
  }, [])
  return [collapsed, set] as const
}
