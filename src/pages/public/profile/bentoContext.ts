import { createContext, useContext } from 'react'

/** Trạng thái chung của lưới bento: khối nào đang mở rộng để sửa, . */
export type BentoState = {
  editingId: string | null
  setEditingId: (id: string | null) => void
}

export const BentoContext = createContext<BentoState | null>(null)

export function useBento() {
  const v = useContext(BentoContext)
  if (!v) throw new Error('Thiếu BentoContext')
  return v
}
