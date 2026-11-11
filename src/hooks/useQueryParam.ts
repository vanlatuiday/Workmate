import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Giá trị khởi tạo cho ô lọc lấy từ `?name=` trên URL. Người dùng vẫn gõ sửa bình thường;
 * khi URL đổi sang giá trị mới (tìm lại từ ô tìm kiếm trên thanh trên) thì ô lọc theo URL.
 */
export function useQueryParam(name: string): [string, (v: string) => void] {
  const fromUrl = useSearchParams()[0].get(name) ?? ''
  const [value, setValue] = useState(fromUrl)
  const [seen, setSeen] = useState(fromUrl)
  if (seen !== fromUrl) {
    setSeen(fromUrl)
    setValue(fromUrl)
  }
  return [value, setValue]
}
