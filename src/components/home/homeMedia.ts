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
    match: { id: '1521791136064-7986c2920216', alt: 'Hai người bắt tay nhau trong buổi gặp' },
    guide: { id: '1434030216411-0b793f4b4173', alt: 'Người đang viết tay vào cuốn sổ trên bàn gỗ' },
    /** Hai khối cho nhà tuyển dụng (dùng lại ảnh lịch và bản đồ) */
    slots: { id: '1435527173128-983b87201f4d', alt: 'Cuốn sổ lịch mở trên bàn làm việc' },
    nearby: { id: '1476973422084-e0fa66ff9456', alt: 'Bản đồ giấy cắm ghim đánh dấu địa điểm' },
  },

  /** Ô nhóm ngành ở "Khám phá theo nhóm" */
  categories: {
    pha_che: { id: '1495474472287-4d71bcdd2085', alt: 'Hai bàn tay cầm hai ly latte có hình lá trên bàn gỗ' },
    ban_hang: { id: '1441986300917-64674bd600d8', alt: 'Cửa hàng quần áo với kệ gỗ và đèn treo' },
    giao_hang: { id: '1526367790999-0150786686a2', alt: 'Người giao hàng đạp xe với thùng hàng sau lưng trên phố nhỏ' },
    phuc_vu: { id: '1517248135467-4c7edcad34c4', alt: 'Phòng ăn nhà hàng với bàn gỗ và đèn vàng' },
    kho: { id: '1586528116311-ad8dd3c8310d', alt: 'Kho hàng với các kệ cao xếp đầy thùng hàng' },
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
