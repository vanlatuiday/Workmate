// Mã số doanh nghiệp (= mã số thuế) Việt Nam: 10 chữ số, hoặc 10 số + "-" + 3 số cho chi nhánh.
// Chữ số thứ 10 là số kiểm tra tính từ 9 số đầu, nên mã gõ bừa phần lớn bị bắt mà không cần tra mạng.

const WEIGHTS = [31, 29, 23, 19, 17, 13, 7, 5, 3]

/** Bỏ khoảng trắng, dấu chấm; giữ dạng "0123456789" hoặc "0123456789-001" */
export function normalizeTaxCode(raw: string): string {
  return raw.replace(/[\s.]/g, '').replace(/[–—_]/g, '-')
}

/** Đúng định dạng và đúng số kiểm tra */
export function isValidTaxCode(code: string): boolean {
  const m = /^(\d{10})(?:-(\d{3}))?$/.exec(code)
  if (!m) return false
  const d = m[1]
  const sum = WEIGHTS.reduce((s, w, i) => s + Number(d[i]) * w, 0)
  const check = 10 - (sum % 11)
  // Kết quả 10 không phải một chữ số → không có mã nào như vậy được cấp
  return check !== 10 && check === Number(d[9])
}

/** Bỏ dấu, viết hoa, bỏ phần loại hình (Công ty, TNHH, Cổ phần…) để so tên */
function nameCore(name: string): string[] {
  const plain = name
    .normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'D')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
  const drop = [
    'CONG TY', 'TRACH NHIEM HUU HAN', 'TNHH', 'CO PHAN', 'MOT THANH VIEN', 'HAI THANH VIEN TRO LEN',
    'MTV', 'CP', 'JSC', 'CO LTD', 'LTD', 'DOANH NGHIEP TU NHAN', 'DNTN', 'HO KINH DOANH', 'HKD', 'CHI NHANH',
  ]
  let s = ` ${plain} `
  for (const w of drop) s = s.replaceAll(` ${w} `, ' ')
  return s.split(/\s+/).filter(Boolean)
}

/**
 * Tên công ty nhập vào có khớp tên trên dữ liệu thuế không (khớp lỏng: bỏ loại hình, bỏ dấu).
 * Khớp khi phần lõi tên này nằm trọn trong tên kia, hoặc ≥ 60% từ trùng nhau.
 */
export function namesMatch(entered: string, official: string, shortName?: string | null): boolean {
  const a = nameCore(entered)
  if (!a.length) return false
  return [official, shortName].filter((n): n is string => !!n).some((n) => {
    const b = nameCore(n)
    if (!b.length) return false
    const sa = a.join(' '), sb = b.join(' ')
    if (sa.includes(sb) || sb.includes(sa)) return true
    const setB = new Set(b)
    const shared = a.filter((t) => setB.has(t)).length
    return shared / Math.max(a.length, b.length) >= 0.6
  })
}
