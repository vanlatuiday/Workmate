import { createContext, useContext } from 'react'

/**
 * Trang đang nằm trong chế độ "ban ngày" (nền sáng xanh, DayBackdrop)? PublicLayout đặt giá trị này
 * BÊN TRONG khung chuyển trang, nên trang cũ đang mờ đi giữ nguyên giá trị của chính nó.
 * PageCover / DarkPageBody / IvoryPageBody đọc để chọn kiểu sáng; ngoài PublicLayout (dashboard) luôn false.
 */
export const DayContext = createContext(false)
export const useIsDay = () => useContext(DayContext)
