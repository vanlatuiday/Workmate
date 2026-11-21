import { createContext, useContext } from 'react'
import { matchPath } from 'react-router-dom'

/**
 * Trang đang nằm trong chế độ "ban ngày" (nền sáng xanh, DayBackdrop)? PublicLayout đặt giá trị này
 * BÊN TRONG khung chuyển trang, nên trang cũ đang mờ đi giữ nguyên giá trị của chính nó.
 * PageCover / DarkPageBody / IvoryPageBody đọc để chọn kiểu sáng; ngoài PublicLayout (dashboard) luôn false.
 */
export const DayContext = createContext(false)
export const useIsDay = () => useContext(DayContext)

/** Trang ban ngày (nền sáng xanh, DayBackdrop). Danh sách dùng chung cho PublicLayout và màn chuyển trang. */
export const DAY_PATHS = [
  '/viec-lam', '/viec-lam/:id', '/cong-ty', '/cong-ty/:id', '/match', '/nha-tuyen-dung', '/gioi-thieu',
  '/lien-he', '/ho-tro', '/cam-nang', '/cam-nang/:slug', '/dieu-khoan', '/bao-mat', '/ho-so', '/dang-tin',
]
/** Trang còn lại trong PublicLayout giữ kiểu cũ. Đường dẫn không thuộc cả hai danh sách = 404 → ban ngày */
export const NON_DAY_PATHS = [
  '/', '/ca-nhan', '/trang-ca-nhan', '/tin-nhan', '/lich-phong-van',
  '/vi-tri/:id', '/ung-vien/:id', '/xem-thu',
]
export const matchesAny = (list: string[], pathname: string) => list.some((p) => matchPath({ path: p, end: true }, pathname))
export const isDayPath = (pathname: string) => matchesAny(DAY_PATHS, pathname) || !matchesAny(NON_DAY_PATHS, pathname)
