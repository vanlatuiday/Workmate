/**
 * Nhóm nghề của tin tuyển dụng, nhà tuyển dụng chọn khi đăng tin.
 * Khóa + từ khóa trùng với HOME_CATEGORIES ở frontend (src/components/home/categories.ts).
 * `inferCategory` chỉ dùng cho tin cũ / dữ liệu mẫu chưa có nhóm: nhóm ĐẦU TIÊN có từ khóa nằm trong tên việc.
 */
export const JOB_CATEGORIES = [
  { key: 'pha_che', words: ['pha che', 'barista'] },
  { key: 'phuc_vu', words: ['phuc vu', 'mang di'] },
  { key: 'phu_bep', words: ['bep', 'nguyen lieu', 'topping'] },
  { key: 'thu_ngan', words: ['thu ngan'] },
  { key: 'ban_hang', words: ['ban hang', 'cua hang', 'quay hang', 'quay thuc pham'] },
  { key: 'giao_hang', words: ['giao hang', 'tai xe', 'lai xe', 'shipper', 'giao nhan', 'buu gui', 'diem nhan'] },
  { key: 'kho', words: ['kho', 'phan loai hang', 'sap xep hang', 'dong goi', 'kiem ke', 'nhap hang'] },
  { key: 'le_tan', words: ['le tan', 'don khach', 'buong phong', 'dich vu khach hang'] },
  { key: 'su_kien', words: ['su kien', 'tiec', 'san khau', 'khach moi'] },
  { key: 'hanh_chinh', words: ['hanh chinh', 'van phong', 'nhap lieu', 'tiep nhan don', 'cham soc don hang'] },
  { key: 'marketing', words: ['marketing', 'noi dung', 'thiet ke', 'truyen thong', 'chien dich', 'tu khoa'] },
  { key: 'tro_giang', words: ['tro giang', 'gia su', 'giang', 'hoc vien', 'khoa hoc'] },
  { key: 'khac', words: [] as string[] },
] as const

export const JOB_CATEGORY_KEYS = JOB_CATEGORIES.map((c) => c.key)
export type JobCategory = (typeof JOB_CATEGORY_KEYS)[number]

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'd').toLowerCase()

export function inferCategory(title: string): JobCategory {
  // Khớp NGUYÊN TỪ (đệm khoảng trắng hai đầu): "kho" không được khớp "khóa học"
  const t = ` ${norm(title).replace(/[^a-z0-9]+/g, ' ')} `
  return JOB_CATEGORIES.find((c) => c.words.some((w) => t.includes(` ${w} `)))?.key ?? 'khac'
}
