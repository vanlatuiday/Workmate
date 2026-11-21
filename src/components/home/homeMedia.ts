import type { Photo } from '@components/discover/types'

/**
 * NƠI DUY NHẤT liệt kê ảnh minh họa của trang chủ (trừ ảnh trong thẻ việc làm — ảnh đó
 * đi theo từng tin trong danh mục việc làm). Toàn bộ là ảnh Unsplash dùng tạm, mượn từ
 * các trang khác trong dự án; chủ dự án sẽ thay bằng ảnh thật sau — chỉ cần đổi `id`
 * (phần sau "photo-" trong URL Unsplash) và `alt` ở đây, không phải sửa component.
 */
export const homeMedia = {
  /** Ảnh nền khối hero: quán cà phê, quầy pha chế phía sau */
  hero: { id: '1554118811-1e0d58224f24', alt: 'Không gian quán cà phê nhiều cây xanh, quầy pha chế phía sau' },

  /** Bốn khối ảnh + chữ xen kẽ */
  blocks: {
    schedule: { id: '1435527173128-983b87201f4d', alt: 'Cuốn sổ lịch mở trên bàn làm việc' },
    near: { id: '1476973422084-e0fa66ff9456', alt: 'Bản đồ giấy cắm ghim đánh dấu địa điểm' },
    /** Hai người chạm hai điện thoại vào nhau ở quán: "kết nối rồi mới trò chuyện" (Unsplash License, thay ảnh bắt tay 2026-11-21) */
    match: { id: '1571867424488-4565932edb41', alt: 'Hai người đưa hai chiếc điện thoại lại gần nhau để kết nối' },
    guide: { id: '1434030216411-0b793f4b4173', alt: 'Người đang viết tay vào cuốn sổ trên bàn gỗ' },
    /** Hai khối cho nhà tuyển dụng (dùng lại ảnh lịch và bản đồ) */
    slots: { id: '1435527173128-983b87201f4d', alt: 'Cuốn sổ lịch mở trên bàn làm việc' },
    nearby: { id: '1476973422084-e0fa66ff9456', alt: 'Bản đồ giấy cắm ghim đánh dấu địa điểm' },
  },

  /** Ô nhóm kỹ năng ở "Tìm ứng viên theo nhóm" (ngoài các ảnh nhóm ngành ở trên) */
  candidateGroups: {
    thu_ngan: { id: '1556745757-8d76bdb6984b', alt: 'Bàn tay đặt thẻ lên máy thanh toán ở quầy thu ngân' },
  },

  /** Tấm "Hoàn thiện trang công ty" cho nhà tuyển dụng: hai người bắt tay */
  company: { id: '1521791136064-7986c2920216', alt: 'Hai người bắt tay nhau trong buổi gặp' },

  /** Tấm "Bạn đang tìm việc?" cho người tìm việc: pha chế ở quầy */
  seeker: { id: '1442512595331-e89e73853f31', alt: 'Tay rót nước nóng qua phễu lọc cà phê, bình rót cổ ngỗng bên cạnh' },

  /** Khối dành cho nhà tuyển dụng: chủ cửa hàng sau quầy */
  recruiter: { id: '1556745757-8d76bdb6984b', alt: 'Bàn tay đặt thẻ lên máy thanh toán ở quầy thu ngân' },
} satisfies Record<string, Photo | Record<string, Photo>>
