import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/pages/public/personal/companyProfileEditing.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
const { companyProfileDraft, companySectionPatch, companyCurrentYear } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
const profile = {
  name: 'Công ty thật', email: '', phone: '', industry: '', district: 'Hải Châu', size: '11-50',
  tagline: '', about: '', foundedYear: null, culture: '', values: ['Tôn trọng'],
  environment: [], policies: [], cover: { id: 'cover', alt: 'Quán' },
}

test('nháp giữ dữ liệu đã lưu độc lập, mỗi mục chỉ gửi các trường thuộc mục đó', () => {
  const draft = companyProfileDraft(profile, '123 Đường thật')
  draft.cover.alt = 'Ảnh mới'
  assert.equal(profile.cover.alt, 'Quán')
  const fields = {
    general: ['name', 'email', 'phone'], about: ['tagline', 'about', 'industry', 'size', 'foundedYear'],
    culture: ['culture', 'values', 'environment'], location: ['district', 'address'],
    benefits: ['policies'], cover: ['cover'],
  }
  for (const [section, expected] of Object.entries(fields)) {
    const result = companySectionPatch(section, draft, 2026)
    assert.deepEqual(result.errors, {})
    assert.deepEqual(Object.keys(result.patch).sort(), expected.sort())
  }
})

test('chuẩn hóa dòng danh sách, cho phép xóa danh sách và email công khai', () => {
  const draft = companyProfileDraft(profile, '')
  draft.values = '  Tôn trọng  \r\n\n Chủ động \n'
  draft.environment = '\n  '
  assert.deepEqual(companySectionPatch('culture', draft, 2026).patch, {
    culture: '', values: ['Tôn trọng', 'Chủ động'], environment: [],
  })
  assert.equal(companySectionPatch('general', draft, 2026).patch.email, '')
})

test('năm để trống xóa thành null, kiểm tra số nguyên và giới hạn theo giờ Việt Nam', () => {
  const draft = companyProfileDraft(profile, '')
  assert.equal(companySectionPatch('about', draft, 2026).patch.foundedYear, null)
  for (const invalid of ['999', '2027', '2020.5', '1e3', 'abc']) {
    draft.foundedYear = invalid
    assert.ok(companySectionPatch('about', draft, 2026).errors.foundedYear, invalid)
  }
  for (const valid of ['1000', '2026']) {
    draft.foundedYear = valid
    assert.equal(companySectionPatch('about', draft, 2026).patch.foundedYear, Number(valid))
  }
  assert.equal(companyCurrentYear(new Date('2026-12-31T17:00:00Z')), 2027)
})

test('chặn danh sách quá dài, mục quá dài và nội dung vượt giới hạn DTO', () => {
  const draft = companyProfileDraft(profile, '')
  draft.policies = Array.from({ length: 21 }, (_, i) => `Mục ${i}`).join('\n')
  assert.ok(companySectionPatch('benefits', draft, 2026).errors.policies)
  draft.policies = 'a'.repeat(201)
  assert.ok(companySectionPatch('benefits', draft, 2026).errors.policies)
  draft.about = 'a'.repeat(4001)
  draft.tagline = 'a'.repeat(201)
  const result = companySectionPatch('about', draft, 2026)
  assert.ok(result.errors.about)
  assert.ok(result.errors.tagline)
  assert.equal(result.patch, undefined)
  assert.deepEqual(companySectionPatch('location', draft, 2026).errors, {})
})

test('kiểm tra tên, email và độ dài địa chỉ, vẫn cho phép lưu địa chỉ trống', () => {
  const draft = companyProfileDraft(profile, '')
  draft.name = ' '
  draft.email = 'email-sai'
  draft.phone = '0'.repeat(31)
  assert.deepEqual(Object.keys(companySectionPatch('general', draft, 2026).errors).sort(), ['email', 'name', 'phone'])
  draft.address = 'x'.repeat(301)
  assert.ok(companySectionPatch('location', draft, 2026).errors.address)
  draft.address = '  '
  assert.equal(companySectionPatch('location', draft, 2026).patch.address, '')
})
