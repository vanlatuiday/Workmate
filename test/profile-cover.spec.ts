import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ProfileService } from '../src/profile/profile.service'
import type { PrismaService } from '../src/prisma/prisma.service'
import type { StorageService } from '../src/common/storage.service'

function setup({ failSave = false, missing = false } = {}) {
  let coverUrl: string | null = 'https://files.test/covers/owner/old.webp'
  const deleted: string[] = []
  const uploaded: string[] = []
  const prisma = { seekerProfile: {
    findUnique: async ({ where }: { where: { userId: string } }) => {
      assert.equal(where.userId, 'owner')
      return missing ? null : { coverUrl }
    },
    update: async ({ where, data }: { where: { userId: string }; data: { coverUrl: string | null } }) => {
      assert.equal(where.userId, 'owner')
      if (failSave) throw new Error('Lỗi cơ sở dữ liệu')
      coverUrl = data.coverUrl
      return { coverUrl }
    },
  } }
  const storage = {
    putPublic: async (key: string) => { uploaded.push(key); return `https://files.test/${key}` },
    publicKeyOf: (url: string | null) => url?.replace('https://files.test/', '') ?? null,
    deletePublic: async (key: string) => { deleted.push(key) },
  }
  const service = new ProfileService(prisma as unknown as PrismaService, storage as unknown as StorageService)
  return { service, uploaded, deleted, current: () => coverUrl }
}
const buffer = Buffer.from('RIFF1234WEBP1234')
const image = { buffer, mimetype: 'image/webp', size: buffer.length }

test('ảnh bìa gắn với đúng chủ hồ sơ, thay thành công mới xóa ảnh cũ', async () => {
  const { service, uploaded, deleted, current } = setup()
  const result = await service.setCover('owner', image)
  assert.match(uploaded[0], /^covers\/owner\/[a-f0-9]+\.webp$/)
  assert.equal(result.coverUrl, current())
  assert.deepEqual(deleted, ['covers/owner/old.webp'])
})

test('từ chối thiếu file, file giả ảnh và file vượt 2MB trước khi lưu', async () => {
  const { service, uploaded } = setup()
  await assert.rejects(() => service.setCover('owner', undefined), /Chưa chọn ảnh/)
  await assert.rejects(() => service.setCover('owner', { ...image, buffer: Buffer.from('fake') }), /Chỉ nhận ảnh/)
  await assert.rejects(() => service.setCover('owner', { ...image, size: 2 * 1024 * 1024 + 1 }), /lớn hơn 2MB/)
  assert.equal(uploaded.length, 0)
})

test('lưu thất bại giữ ảnh cũ và dọn file vừa tải lên', async () => {
  const { service, uploaded, deleted, current } = setup({ failSave: true })
  await assert.rejects(() => service.setCover('owner', image), /Lỗi cơ sở dữ liệu/)
  assert.equal(current(), 'https://files.test/covers/owner/old.webp')
  assert.deepEqual(deleted, [uploaded[0]])
})

test('không tải file lên khi không có hồ sơ', async () => {
  const { service, uploaded } = setup({ missing: true })
  await assert.rejects(() => service.setCover('owner', image), /Chưa có hồ sơ/)
  assert.equal(uploaded.length, 0)
})

test('gỡ ảnh bìa để dùng mặc định không ảnh hưởng ảnh đại diện', async () => {
  const { service, deleted, current } = setup()
  assert.deepEqual(await service.removeCover('owner'), { coverUrl: null })
  assert.equal(current(), null)
  assert.deepEqual(deleted, ['covers/owner/old.webp'])
})
