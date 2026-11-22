import assert from 'node:assert/strict'
import { test } from 'node:test'
import { CompanyService } from '../src/company/company.service'
import type { PrismaService } from '../src/prisma/prisma.service'
import type { StorageService } from '../src/common/storage.service'
import type { TaxLookupService } from '../src/tax/tax-lookup.service'
import type { SystemConfigService } from '../src/common/system-config.service'
import type { UploadedImage } from '../src/common/upload-check'

const user = { id: 'recruiter-1', email: 'recruiter@test.invalid', role: 'recruiter' as const }
const buffer = Buffer.from('RIFF1234WEBP1234')
const image = { buffer, mimetype: 'image/webp', size: buffer.length }

function setup({ missing = false, locked = false, storageFail = false } = {}) {
  const files = new Map<string, Buffer>()
  const prisma = { company: {
    findFirst: async ({ where }: { where: { members: { some: { userId: string } } } }) => {
      assert.equal(where.members.some.userId, user.id)
      return missing ? null : { id: 'company-1', locked }
    },
    update: () => { throw new Error('Chưa được sửa hồ sơ khi chỉ tải ảnh nháp') },
  } }
  const storage = { putPublic: async (key: string, body: Buffer, contentType: string) => {
    if (storageFail) throw new Error('Kho ảnh đang lỗi')
    assert.equal(contentType, 'image/webp')
    files.set(key, body)
    return `https://files.test/${key}`
  } }
  const service = new CompanyService(prisma as unknown as PrismaService, storage as unknown as StorageService, {} as TaxLookupService, {} as SystemConfigService)
  return { service, files }
}

test('ảnh tải lên thuộc đúng doanh nghiệp, dùng URL mới và chưa ghi đè ảnh bìa/logo', async () => {
  const { service, files } = setup()
  const first = await service.uploadImage(user, image)
  const second = await service.uploadImage(user, image)
  assert.match(first.url!, /^https:\/\/files.test\/company-images\/company-1\/[a-f0-9]+\.webp$/)
  assert.notEqual(first.url, second.url)
  assert.equal(first.alt, 'Ảnh doanh nghiệp')
  assert.equal(files.size, 2)
  assert.deepEqual([...files.values()][0], buffer)
})

test('chặn thiếu file, ảnh giả và vượt 2MB trước khi ghi kho', async () => {
  const { service, files } = setup()
  await assert.rejects(() => service.uploadImage(user, undefined), /Chưa chọn ảnh/)
  await assert.rejects(() => service.uploadImage(user, { ...image, buffer: Buffer.from('fake') }), /Chỉ nhận ảnh/)
  await assert.rejects(() => service.uploadImage(user, { ...image, size: 2 * 1024 * 1024 + 1 }), /lớn hơn 2MB/)
  assert.equal(files.size, 0)
})

test('không upload khi chưa có doanh nghiệp hoặc doanh nghiệp bị khóa', async () => {
  for (const options of [{ missing: true }, { locked: true }]) {
    const { service, files } = setup(options)
    await assert.rejects(() => service.uploadImage(user, image), /chưa thuộc|bị khóa/)
    assert.equal(files.size, 0)
  }
})

test('kho ảnh lỗi phải báo thất bại, không trả URL giả', async () => {
  const { service } = setup({ storageFail: true })
  await assert.rejects(() => service.uploadImage(user, image as UploadedImage), /Kho ảnh đang lỗi/)
})
