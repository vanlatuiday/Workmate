import { useEffect, useRef } from 'react'
import { useDemoStore, type Connection } from '@context/demoStore'

/**
 * Gọi `onConnect` mỗi khi kho có thêm kết nối mới so với lúc trước (không gọi cho các kết nối
 * đã có sẵn lúc mount). Dùng để báo "Kết nối thành công" kể cả khi phía kia đáp lại muộn.
 */
export function useOnNewConnection(onConnect: (c: Connection) => void) {
  const cb = useRef(onConnect)
  cb.current = onConnect
  useEffect(() => {
    let prev = useDemoStore.getState().connections.length
    return useDemoStore.subscribe((s) => {
      if (s.connections.length > prev) s.connections.slice(prev).forEach((c) => cb.current(c))
      prev = s.connections.length
    })
  }, [])
}
