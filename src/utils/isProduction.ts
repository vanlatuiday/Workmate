/**
 * Đang chạy bản build cho người dùng thật. Khi đó KHÔNG được rơi về dữ liệu mẫu trong code.
 * Dùng `?.` vì script `db:export-demo` của backend chạy các file này ngoài Vite (không có import.meta.env).
 */
export const IS_PRODUCTION = import.meta.env?.PROD === true
