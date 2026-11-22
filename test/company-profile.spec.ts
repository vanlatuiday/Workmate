import assert from 'node:assert/strict'
import { test } from 'node:test'
import { plainToInstance } from 'class-transformer'
import { validate } from 'class-validator'
import type { Company } from '@prisma/client'
import { UpdateCompanyDto } from '../src/company/company.controller'
import { CatalogService } from '../src/catalog/catalog.service'
import type { PrismaService } from '../src/prisma/prisma.service'

const year = Number(new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()))

test('năm thành lập chỉ nhận số nguyên từ 1000 tới năm hiện tại', async () => {
  for (const foundedYear of [0, 999, year + 1, 2015.5, '2015']) {
    const errors = await validate(plainToInstance(UpdateCompanyDto, { foundedYear }))
    assert(errors.some((e) => e.property === 'foundedYear'), `Phải từ chối ${foundedYear}`)
  }
  for (const foundedYear of [undefined, null, 1000, 2015, year]) {
    assert.equal((await validate(plainToInstance(UpdateCompanyDto, { foundedYear }))).length, 0)
  }
})

const company = {
  id: 'company', name: 'Công ty', industry: 'Dịch vụ', district: 'Hải Châu', size: 's11_50',
  tagline: 'Giới thiệu ngắn', about: 'Giới thiệu dài', environment: ['Không gian thoáng'],
  values: ['Đúng giờ'], policies: ['Có đào tạo'], culture: 'Hỗ trợ nhau',
  address: 'Địa chỉ công ty', email: 'tuyendung@company.invalid', phone: '02360000000',
  foundedYear: 2015, coverPhoto: { url: 'https://files.test/cover.webp', alt: 'Ảnh bìa' },
  verified: false, locked: false, logoUrl: null, taxCode: 'private-tax-code', taxLookup: null,
} as unknown as Company

test('catalog hiển thị đầy đủ nội dung doanh nghiệp đã lưu, không xuất mã số/thuộc tính quản trị', () => {
  const service = new CatalogService({} as PrismaService)
  const data = service.toCompany(company)
  for (const key of ['foundedYear', 'address', 'email', 'phone', 'culture', 'values', 'policies'] as const) {
    assert.deepEqual(data[key], company[key])
  }
  assert(!('taxCode' in data) && !('taxLookup' in data) && !('members' in data))
})

test('catalog có thể giữ tên công ty cho tin cũ mà không lộ phần hồ sơ đang ẩn', () => {
  const service = new CatalogService({} as PrismaService)
  const data = service.toCompany(company, false)
  assert.equal(data.name, company.name)
  for (const key of ['foundedYear', 'address', 'email', 'phone', 'culture', 'values', 'policies']) assert(!(key in data))
})
