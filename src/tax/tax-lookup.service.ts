import { Injectable, Logger } from '@nestjs/common'

/**
 * Kết quả tra mã số doanh nghiệp.
 * - active: đang hoạt động · inactive: ngừng / tạm ngừng / đã đóng mã · not_found: không có mã này
 * - unavailable: không tra được lúc này (mất mạng, dịch vụ lỗi) → để quản trị viên kiểm tra tay
 */
export interface TaxLookup {
  result: 'active' | 'inactive' | 'not_found' | 'unavailable'
  name?: string
  shortName?: string | null
  address?: string
  /** Chữ trạng thái gốc từ dữ liệu thuế, vd. "NNT đang hoạt động" */
  statusText?: string
  /** ISO */
  checkedAt: string
  source: 'vietqr' | 'mock'
}

type Found = Omit<TaxLookup, 'checkedAt' | 'source'>

/**
 * Bảng giả lập (TAX_LOOKUP_MODE=mock) để demo đủ mọi trường hợp mà không cần mạng.
 * Mã đều đúng số kiểm tra; mã khác không có trong bảng → "không tồn tại".
 * Ghi lại trong docs/tax-lookup.md nếu thêm/đổi.
 */
export const MOCK_TAX_CODES: Record<string, Found> = {
  '0401112222': { result: 'active', name: 'CÔNG TY TNHH NHÓM DỊCH VỤ SÔNG HÀN', shortName: 'SÔNG HÀN GROUP', address: '25 Bạch Đằng, Phường Hải Châu, TP Đà Nẵng', statusText: 'NNT đang hoạt động' },
  '0402223334': { result: 'inactive', name: 'CÔNG TY TNHH DỊCH VỤ BIỂN XANH', shortName: null, address: '102 Võ Nguyên Giáp, Phường Sơn Trà, TP Đà Nẵng', statusText: 'NNT ngừng hoạt động và đã hoàn thành thủ tục chấm dứt hiệu lực MST' },
  '0403334446': { result: 'inactive', name: 'CÔNG TY CỔ PHẦN NHÀ HÀNG MIỀN TRUNG', shortName: null, address: '8 Lê Duẩn, Phường Hải Châu, TP Đà Nẵng', statusText: 'NNT tạm nghỉ kinh doanh có thời hạn' },
  '0404445558': { result: 'active', name: 'CÔNG TY TNHH THƯƠNG MẠI MINH PHÁT', shortName: null, address: '45 Nguyễn Văn Linh, Phường Thanh Khê, TP Đà Nẵng', statusText: 'NNT đang hoạt động' },
  '0406667771': { result: 'active', name: 'CÔNG TY TNHH BÁN LẺ HÀN GIANG', shortName: 'HÀN GIANG MART', address: '120 Hùng Vương, Phường Hải Châu, TP Đà Nẵng', statusText: 'NNT đang hoạt động' },
}

const FOUND_TTL_MS = 6 * 3_600_000
const NOT_FOUND_TTL_MS = 10 * 60_000
const TIMEOUT_MS = 6_000

/** Chữ trạng thái của Cục Thuế → nhóm kết quả. Chỉ "đang hoạt động" (không kèm "tạm") mới là active */
export function classifyStatus(statusText: string): 'active' | 'inactive' {
  const s = statusText.toLowerCase()
  return s.includes('đang hoạt động') && !s.includes('tạm') && !s.includes('ngừng') ? 'active' : 'inactive'
}

@Injectable()
export class TaxLookupService {
  private log = new Logger('TaxLookup')
  private cache = new Map<string, { value: TaxLookup; until: number }>()

  get mode(): 'vietqr' | 'mock' {
    return process.env.TAX_LOOKUP_MODE === 'mock' ? 'mock' : 'vietqr'
  }

  /** `code` phải đã qua isValidTaxCode. Không bao giờ ném lỗi: tra hỏng → result 'unavailable' */
  async lookup(code: string, source = this.mode): Promise<TaxLookup> {
    const key = source + ":" + code
    const now = Date.now()
    const hit = this.cache.get(key)
    if (hit && hit.until > now) return hit.value

    const found = source === 'mock' ? (MOCK_TAX_CODES[code] ?? { result: 'not_found' as const }) : await this.viaVietQr(code)
    const value: TaxLookup = { ...found, checkedAt: new Date().toISOString(), source }
    if (value.result !== 'unavailable') {
      this.cache.set(key, { value, until: now + (value.result === 'not_found' ? NOT_FOUND_TTL_MS : FOUND_TTL_MS) })
      if (this.cache.size > 5000) this.cache.delete(this.cache.keys().next().value!)
    }
    return value
  }

  /** api.vietqr.io: dữ liệu tổng hợp từ trang Cục Thuế (có thể chậm vài ngày), không cần khóa */
  private async viaVietQr(code: string): Promise<Found> {
    try {
      const res = await fetch(`https://api.vietqr.io/v2/business/${encodeURIComponent(code)}`, {
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const body = (await res.json()) as {
        code?: string
        data?: { name?: string; shortName?: string | null; address?: string; status?: string } | null
      }
      if (body.code === '51') return { result: 'not_found' }
      const d = body.data
      if (body.code !== '00' || !d?.name) throw new Error(`mã phản hồi ${body.code ?? '?'}`)
      const statusText = d.status ?? ''
      return {
        result: statusText ? classifyStatus(statusText) : 'active',
        name: d.name, shortName: d.shortName ?? null, address: d.address ?? '', statusText,
      }
    } catch (e) {
      this.log.warn(`Không tra được mã số doanh nghiệp: ${(e as Error).message}`)
      return { result: 'unavailable' }
    }
  }
}
