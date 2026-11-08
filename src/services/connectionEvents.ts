import { useEffect, useRef } from 'react'
import { useConnectionStore, type Connection } from '@context/connectionStore'

const keysOf = (list: Connection[]) => new Set(list.map((c) => `${c.jobId}|${c.seekerId}`))

/**
 * Gọi `onConnect` mỗi khi có kết nối mới so với lúc trước (không gọi cho các kết nối đã có sẵn,
 * kể cả lần nạp đầu từ máy chủ). Dùng để báo "Kết nối thành công" kể cả khi phía kia đáp lại muộn.
 */
export function useOnNewConnection(onConnect: (c: Connection) => void) {
  const cb = useRef(onConnect)
  cb.current = onConnect
  useEffect(() => {
    let prev = keysOf(useConnectionStore.getState().connections)
    let wasHydrated = useConnectionStore.getState().hydrated
    return useConnectionStore.subscribe((s) => {
      const next = keysOf(s.connections)
      if (wasHydrated && s.hydrated) s.connections.forEach((c) => { if (!prev.has(`${c.jobId}|${c.seekerId}`)) cb.current(c) })
      prev = next
      wasHydrated = s.hydrated
    })
  }, [])
}
