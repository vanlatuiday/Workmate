// Hiệu ứng và hằng dùng chung cho khung nổi (tin nhắn, thông báo): bung từ nút tròn, thu về nút.

// Bung ra: phóng nhanh rồi chậm dần, nảy nhẹ ở cuối (đàn hồi); thu về nhanh và gọn hơn
export const PANEL_OPEN = 'transform 560ms cubic-bezier(0.32, 1.32, 0.6, 1), opacity 220ms ease-out, visibility 0s'
export const PANEL_CLOSE = 'transform 260ms cubic-bezier(0.4, 0, 1, 1), opacity 200ms ease-in 60ms, visibility 0s linear 260ms'
// Nội dung trong khung hiện sau khi khung đã gần bung xong
export const CONTENT_OPEN = 'opacity 260ms ease-out 180ms'
export const CONTENT_CLOSE = 'opacity 120ms ease-in'

export const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
