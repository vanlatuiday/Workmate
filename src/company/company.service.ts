import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common'
import type { Company, Prisma } from '@prisma/client'
import type { AuthUser } from '../auth/current-user.decorator'
import { geo } from '../common/geo'
import type { PhotoDto } from '../jobs/jobs.dto'
import { PrismaService } from '../prisma/prisma.service'
import type { UpdateCompanyDto } from './company.controller'

export const COMPANY_SIZES = ['1-10', '11-50', '51-200', '201-500', '500+'] as const
const SIZE_ENUM: Record<(typeof COMPANY_SIZES)[number], Company['size']> = {
  '1-10': 's1_10', '11-50': 's11_50', '51-200': 's51_200', '201-500': 's201_500', '500+': 's500p',
}
const SIZE_LABEL = Object.fromEntries(Object.entries(SIZE_ENUM).map(([label, e]) => [e, label])) as Record<Company['size'], string>

/** Khớp CompanyProfile ở frontend (companyStore) + các cờ do admin đặt */
const view = (c: Company) => ({
  id: c.id, slug: c.slug, name: c.name, industry: c.industry, district: c.district, address: c.address, size: SIZE_LABEL[c.size],
  tagline: c.tagline, about: c.about, environment: c.environment, values: c.values, policies: c.policies, culture: c.culture,
  email: c.email, phone: c.phone, cover: (c.coverPhoto as unknown as PhotoDto | null) ?? { alt: c.name }, verified: c.verified, locked: c.locked,
})

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  private async own(user: AuthUser): Promise<Company> {
    const company = await this.prisma.company.findFirst({ where: { members: { some: { userId: user.id } } } })
    if (!company) throw new ForbiddenException('Tài khoản chưa thuộc doanh nghiệp nào')
    return company
  }

  async get(user: AuthUser) {
    return view(await this.own(user))
  }

  /** Không đổi được slug, xác minh, khóa — hai cờ sau thuộc quyền admin */
  async update(user: AuthUser, dto: UpdateCompanyDto) {
    const company = await this.own(user)
    if (company.locked) throw new ForbiddenException('Doanh nghiệp đang bị khóa')
    if (dto.cover && !dto.cover.id && !dto.cover.url) throw new BadRequestException('Ảnh bìa cần có id hoặc url')
    const { size, cover, district, ...rest } = dto
    const data: Prisma.CompanyUpdateInput = {
      ...rest,
      ...(size !== undefined && { size: SIZE_ENUM[size] }),
      ...(cover !== undefined && { coverPhoto: { ...cover } }),
      ...(district !== undefined && { district, ...geo(district, company.id) }),
    }
    return view(await this.prisma.company.update({ where: { id: company.id }, data }))
  }
}
