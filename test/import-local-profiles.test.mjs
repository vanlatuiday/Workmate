import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { assertIdentity, assertLocalUrl, companyData, jobData, sameIdentifier, seekerIdOf } from '../scripts/import-local-profiles.mjs'

const folder = new URL('../../frontend/workmate_20_logos/', import.meta.url)
const companies = JSON.parse(await readFile(new URL('doanh-nghiep.json', folder)))
const jobs = JSON.parse(await readFile(new URL('viec-lam.json', folder)))
const manifest = JSON.parse(await readFile(new URL('manifest.json', folder)))

test('nội dung nạp vào web không còn nhãn demo hoặc email liên hệ mẫu không nhận thư', () => {
  for (const c of companies) {
    const data = companyData(c, null, {})
    for (const key of ['name', 'tagline', 'about', 'email']) assert(!/\bdemo\b/i.test(data[key]), `${c.id}: ${key}`)
    assert.equal(data.email, '')
    assert(data.about.includes('Nhiệm vụ') || data.about.length > 40)
  }
  for (const j of jobs) {
    const data = jobData(j, manifest.generatedAt, new Date('2030-01-01T00:00:00Z'), {})
    assert(!/\bdemo\b/i.test(data.title + data.description))
    assert(data.description.includes('MÔ TẢ CÔNG VIỆC') && data.description.includes(j.salaryLabel))
  }
})

test('ID người tìm việc ổn định theo ảnh và không chứa tên/email', () => {
  assert.match(seekerIdOf(Buffer.from('portrait')), /^wm-import-seeker-[a-f0-9]{24}$/)
  assert.equal(seekerIdOf(Buffer.from('portrait')), seekerIdOf(Buffer.from('portrait')))
  assert.notEqual(seekerIdOf(Buffer.from('portrait')), seekerIdOf(Buffer.from('different portrait')))
})

test('Chặn ghi lên server ngoài máy local', () => {
  assertLocalUrl('postgresql://user:pass@127.0.0.1:5432/workmate', 'DB')
  assert.throws(() => assertLocalUrl('https://storage.example.org', 'S3'))
  assert.throws(() => assertLocalUrl(undefined, 'DB'))
})

test('Trùng id/email/slug khác chủ sở hữu phải dừng; bản ghi đúng được bỏ qua', () => {
  assertIdentity(null, { id: 'a' }, ['id'])
  assertIdentity({ id: 'a', email: 'a@test.invalid' }, { id: 'a', email: 'a@test.invalid' }, ['id', 'email'])
  assert.throws(() => assertIdentity({ id: 'existing', email: 'a@test.invalid' }, { id: 'imported', email: 'a@test.invalid' }, ['id', 'email']))
  assert.throws(() => assertIdentity({ id: 'a', slug: 'other' }, { id: 'a', slug: 'import' }, ['id', 'slug']))
  assert(sameIdentifier({ id: 'other', email: 'other@test.invalid', username: 'IMPORTED' }, { id: 'new', email: 'new@test.invalid', username: 'imported' }))
})

test('20 công ty giữ logo, bìa, nội dung; không cấp xác minh hay nhập metadata', () => {
  for (const c of companies) {
    const result = companyData(c, 'http://localhost/logo.png', { lat: 16, lng: 108 })
    assert.equal(result.name, c.brandName)
    assert.equal(result.logoUrl, 'http://localhost/logo.png')
    assert.equal(result.verified, false)
    assert.deepEqual(result.coverPhoto, c.cover)
    assert(!('isDemo' in result) && !('taxValid' in result))
  }
})

test('60 tin đúng enum, làm mới hạn theo thời điểm nạp và giữ thứ tự đăng', () => {
  const now = new Date('2030-01-01T00:00:00Z')
  for (const j of jobs) {
    const result = jobData(j, manifest.generatedAt, now, {})
    assert(result.expiresAt > now)
    assert.equal(result.expiresAt - result.postedAt, 30 * 86400000)
    assert.equal(result.postedAt.getTime(), now.getTime() - Math.max(0, new Date(manifest.generatedAt) - new Date(j.postedAt)))
    assert.equal(result.moderation, 'approved')
    assert(!('distanceKm' in result) && !('views' in result))
  }
  assert.throws(() => jobData({ ...jobs[0], jobType: 'invalid' }, manifest.generatedAt, now, {}))
  assert.throws(() => jobData({ ...jobs[0], slots: ['8-0'] }, manifest.generatedAt, now, {}))
})
