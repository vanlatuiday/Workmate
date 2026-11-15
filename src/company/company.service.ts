import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common'
import { Prisma, type Company } from '@prisma/client'
import { randomBytes } from 'crypto'
import type { AuthUser } from '../auth/current-user.decorator'
import { geo } from '../common/geo'
import { checkImage, type UploadedImage } from '../common/upload-check'
import { StorageService } from '../common/storage.service'
import type { PhotoDto } from '../jobs/jobs.dto'
import { PrismaService } from '../prisma/prisma.service'
import { SystemConfigService } from '../common/system-config.service'
import { phraseHits } from '../jobs/flags'
import { isValidTaxCode, namesMatch, normalizeTaxCode } from '../tax/tax-code'
import { TaxLookupService, type TaxLookup } from '../tax/tax-lookup.service'
import type { UpdateCompanyDto } from './company.controller'

export const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'] as const
const SIZE_ENUM: Record<(typeof COMPANY_SIZES)[number], Company['size']> = {
  '1-10': 's1_10', '11-50': 's11_50', '51-200': 's51_200', '201-500': 's201_500', '500+': 's500p',
}
const SIZE_LABEL = Object.fromEntries(Object.entries(SIZE_ENUM).map(([label, e]) => [e, label])) as Record<Company['size'], string>

/** Khớp CompanyProfile ở frontend (companyStore) + các cờ do admin đặt */
const view = (c: Company, bannedWords: string[]) => {
  /** Cụm cấm tuyệt đối trong tên hiện tại → bắt đặt lại tên (đưa về form bắt đầu, bước Tên & logo) */
  const nameBanned = phraseHits(c.name, bannedWords).hits
  return {
  id: c.id, slug: c.slug, name: c.name, industry: c.industry, district: c.district, address: c.address, size: SIZE_LABEL[c.size],
  tagline: c.tagline, about: c.about, environment: c.environment, values: c.values, policies: c.policies, culture: c.culture,
  email: c.email, phone: c.phone, logoUrl: c.logoUrl, cover: (c.coverPhoto as unknown as PhotoDto | null) ?? { alt: c.name }, verified: c.verified, locked: c.locked,
  taxCode: c.taxCode, taxLookup: taxLookupOf(c), taxNameMatches: taxNameMatches(c),
  onboardedAt: c.onboardedAt?.toISOString() ?? null,
  nameBanned,
  /** Chưa xong form bắt đầu, hoặc tên đang vi phạm → frontend đưa vào form trước khi vào trang nào khác */
  needsOnboarding: !c.onboardedAt || nameBanned.length > 0,
  /** Thông tin bắt buộc còn thiếu (để form biết bước nào chưa xong) */
  missingRequired: missingRequired(c, bannedWords),
  }
}

/** Mã số được chấp nhận: đang hoạt động, hoặc lúc lưu không tra được (admin kiểm tra tay) */
const USABLE_TAX = new Set(['active', 'unavailable'])

/** Ba thông tin bắt buộc của form bắt đầu: mã số dùng được, tên, logo */
export function missingRequired(c: Pick<Company, 'taxCode' | 'taxLookup' | 'name' | 'logoUrl'>, bannedWords: string[] = []): ('taxCode' | 'name' | 'logo')[] {
  const missing: ('taxCode' | 'name' | 'logo')[] = []
  const result = taxLookupOf(c)?.result
  if (!c.taxCode || !result || !USABLE_TAX.has(result)) missing.push('taxCode')
  if (c.name.trim().length < 2 || phraseHits(c.name, bannedWords).hits.length) missing.push('name')
  if (!c.logoUrl) missing.push('logo')
  return missing
}

export const taxLookupOf = (c: Pick<Company, 'taxLookup'>) => (c.taxLookup as unknown as TaxLookup | null) ?? null

/** null = chưa có tên trên dữ liệu thuế để so */
export function taxNameMatches(c: Pick<Company, 'name' | 'taxLookup'>): boolean | null {
  const t = taxLookupOf(c)
  return t?.name ? namesMatch(c.name, t.name, t.shortName) : null
}

/** Kiểm tra định dạng + số kiểm tra; trả mã đã chuẩn hóa */
export function parseTaxCode(raw: string): string {
  const code = normalizeTaxCode(raw)
  if (!isValidTaxCode(code)) throw new BadRequestException('Mã số doanh nghiệp không hợp lệ: cần 10 chữ số (chi nhánh: thêm -001…) và đúng số kiểm tra')
  return code
}

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService, private storage: StorageService, private tax: TaxLookupService, private config: SystemConfigService) {}

  private async out(c: Company) {
    return view(c, (await this.config.get()).bannedWords)
  }

  private async own(user: AuthUser): Promise<Company> {
    const company = await this.prisma.company.findFirst({ where: { members: { some: { userId: user.id } } } })
    if (!company) throw new ForbiddenException('Tài khoản chưa thuộc doanh nghiệp nào')
    return company
  }

  async get(user: AuthUser) {
    return this.out(await this.own(user))
  }

  /** Không đổi được slug, xác minh, khóa — hai cờ sau thuộc quyền admin */
  async update(user: AuthUser, dto: UpdateCompanyDto) {
    const company = await this.own(user)
    if (company.locked) throw new ForbiddenException('Doanh nghiệp đang bị khóa')
    if (dto.cover && !dto.cover.id && !dto.cover.url) throw new BadRequestException('Ảnh bìa cần có id hoặc url')
    await this.assertNoBannedWords(company, dto)
    const { size, cover, district, taxCode, ...rest } = dto
    const data: Prisma.CompanyUpdateInput = {
      ...rest,
      ...(taxCode !== undefined && (await this.taxCodeChange(company, taxCode))),
      ...(size !== undefined && { size: SIZE_ENUM[size] }),
      ...(cover !== undefined && { coverPhoto: { ...cover } }),
      ...(district !== undefined && { district, ...geo(district, company.id) }),
    }
    return this.out(await this.prisma.company.update({ where: { id: company.id }, data }))
  }

  /**
   * Tên + phần giới thiệu công ty không được chứa cụm từ cấm tuyệt đối (cùng danh sách và cách dò với tin đăng).
   * Xét giá trị SAU khi sửa của các ô chữ, để công ty đang có tên vi phạm phải sửa tên mới lưu được.
   */
  private async assertNoBannedWords(company: Company, dto: UpdateCompanyDto) {
    const fields: [string, string | string[]][] = [
      ['Tên công ty', dto.name ?? company.name],
      ['Câu giới thiệu', dto.tagline ?? company.tagline],
      ['Giới thiệu', dto.about ?? company.about],
      ['Văn hóa', dto.culture ?? company.culture],
      ['Môi trường làm việc', dto.environment ?? company.environment],
      ['Giá trị', dto.values ?? company.values],
      ['Chính sách', dto.policies ?? company.policies],
    ]
    const { bannedWords } = await this.config.get()
    const problems = fields
      .map(([label, v]) => [label, phraseHits(Array.isArray(v) ? v.join('\n') : v, bannedWords).hits] as const)
      .filter(([, hits]) => hits.length)
    if (problems.length) {
      throw new BadRequestException(`Có cụm từ không được phép: ${problems.map(([label, hits]) => `${label} (${hits.join(', ')})`).join('; ')}. Hãy sửa rồi lưu lại.`)
    }
  }

  /** Đổi mã số: kiểm tra số kiểm tra rồi tra ngay, lưu kết quả. Chuỗi rỗng = xóa mã */
  private async taxCodeChange(company: Company, raw: string): Promise<Prisma.CompanyUpdateInput> {
    const code = raw.trim() ? parseTaxCode(raw) : null
    if (code === company.taxCode) return {}
    // Mã số là thứ quản trị viên đã đối chiếu khi xác minh. Công ty xác minh từ trước khi có mã số được nhập lần đầu
    if (company.verified && company.taxCode) throw new ForbiddenException('Doanh nghiệp đã được xác minh, liên hệ quản trị viên nếu cần đổi mã số')
    if (!code) {
      if (company.onboardedAt) throw new BadRequestException('Mã số doanh nghiệp là thông tin bắt buộc, không xóa được. Hãy nhập mã khác để thay.')
      return { taxCode: null, taxLookup: Prisma.DbNull }
    }
    const lookup = await this.tax.lookup(code)
    if (lookup.result === 'not_found') throw new BadRequestException('Không tìm thấy mã số này trên dữ liệu thuế')
    if (lookup.result === 'inactive') throw new BadRequestException(`Mã số này không còn hoạt động (${lookup.statusText ?? 'ngừng hoạt động'})`)
    return { taxCode: code, taxLookup: { ...lookup } }
  }

  /** Tra thử trước khi lưu (ô nhập ở hồ sơ công ty) */
  async previewTaxCode(user: AuthUser, raw: string) {
    const company = await this.own(user)
    const code = parseTaxCode(raw)
    const lookup = await this.tax.lookup(code)
    return {
      taxCode: code,
      lookup,
      nameMatches: lookup.name ? namesMatch(company.name, lookup.name, lookup.shortName) : null,
      usedByOther: (await this.prisma.company.count({ where: { taxCode: code, id: { not: company.id } } })) > 0,
    }
  }

  /** Kết thúc phần bắt buộc của form bắt đầu. Thiếu mã số / tên / logo → 400 kèm danh sách còn thiếu */
  async completeOnboarding(user: AuthUser) {
    const company = await this.own(user)
    const missing = missingRequired(company, (await this.config.get()).bannedWords)
    if (company.onboardedAt && !missing.length) return this.out(company)
    if (missing.length) {
      const label = { taxCode: 'mã số doanh nghiệp đang hoạt động', name: 'tên doanh nghiệp hợp lệ', logo: 'logo' }
      throw new BadRequestException(`Còn thiếu: ${missing.map((m) => label[m]).join(', ')}`)
    }
    return this.out(await this.prisma.company.update({ where: { id: company.id }, data: { onboardedAt: new Date() } }))
  }

  async setLogo(user: AuthUser, upload: UploadedImage | undefined) {
    const company = await this.own(user)
    if (company.locked) throw new ForbiddenException('Doanh nghiệp đang bị khóa')
    const { file, ext } = checkImage(upload)
    // Tên file ngẫu nhiên: đổi logo thì URL đổi, không bị bộ nhớ đệm giữ ảnh cũ
    const url = await this.storage.putPublic(`logos/${company.id}/${randomBytes(8).toString('hex')}.${ext}`, file.buffer, file.mimetype)
    const updated = await this.prisma.company.update({ where: { id: company.id }, data: { logoUrl: url } })
    await this.dropFile(company.logoUrl)
    return this.out(updated)
  }

  async removeLogo(user: AuthUser) {
    const company = await this.own(user)
    if (company.locked) throw new ForbiddenException('Doanh nghiệp đang bị khóa')
    if (company.onboardedAt) throw new BadRequestException('Logo là thông tin bắt buộc. Hãy tải logo khác lên để thay.')
    const updated = await this.prisma.company.update({ where: { id: company.id }, data: { logoUrl: null } })
    await this.dropFile(company.logoUrl)
    return this.out(updated)
  }

  private async dropFile(url: string | null) {
    const key = this.storage.publicKeyOf(url)
    if (key) await this.storage.deletePublic(key)
  }
}
