import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { buildJobPhotoPlan, PHOTO_SELECTION, verifyJobPhotoSnapshot } from '../scripts/import-job-photos.mjs'

const publicBase = 'http://localhost:8333/workmate-public'
const slugs = ['highlands', 'phuc-long', 'cong', 'gong-cha', 'pizza-4ps', 'kfc', 'lotteria', 'winmart-plus', 'coopmart', 'lotte-mart', 'furama', 'hyatt-danang', 'danang-events', 'sea-event', 'ghn', 'viettel-post', 'apollo', 'vus', 'seodo', 'danaseo']
const selected = [[1, 2, 1], [1, 2, 1], [1, 2, 2], [1, 2, 1], [1, 2, 2], [1, 1, 2], [1, 1, 2], [2, 1, 2], [1, 2, 1], [1, 1, 2], [1, 2, 1], [1, 2, 2], [1, 2, 1], [1, 2, 2], [1, 1, 2], [1, 2, 1], [1, 2, 1], [1, 2, 2], [1, 1, 2], [1, 1, 2]]

// WebP container bytes; vary one opaque payload byte to exercise content addressing.
const webp = Buffer.from('UklGRiIAAABXRUJQVlA4TBUAAAAvAAAAAAfQ//73v/+BiOh/AAA=', 'base64')
webp.writeUInt32LE(webp.length - 8, 4)
webp.writeUInt32LE(webp.length - 20, 16)
function fixture() {
  const assets = slugs.flatMap((slug) => [1, 2].map((index) => {
    const body = Buffer.from(webp)
    body[body.length - 1] = index
    return { slug, index, body }
  }))
  const jobs = slugs.flatMap((slug) => [1, 2, 3].map((index) => ({
    id: `wm-demo-${slug}-job-0${index}`, companyId: `wm-demo-${slug}`, title: 'Pha chế ca sáng',
    photo: { id: 'old-unsplash', alt: 'old' }, status: 'open', moderation: 'approved',
    expiresAt: new Date('2026-12-22T00:00:00Z'), matchAlertedAt: new Date('2026-11-22T00:00:00Z'),
    updatedAt: new Date('2026-11-22T00:00:00Z'),
  })))
  return { jobs, assets, publicBase }
}

test('all 60 jobs select the semantically assigned image, and all 40 assets are used', () => {
  const input = fixture()
  const unchanged = { ...input, jobs: globalThis.structuredClone(input.jobs), assets: input.assets.map((asset) => ({ ...asset, body: Buffer.from(asset.body) })) }
  const plan = buildJobPhotoPlan(input)
  assert.equal(plan.assets.length, 40)
  assert.equal(plan.changes.length, 60)
  assert.equal(new Set(plan.changes.map((change) => change.photo.url)).size, 40)
  for (const [companyIndex, slug] of slugs.entries()) {
    for (const [jobIndex, imageIndex] of selected[companyIndex].entries()) {
      const asset = input.assets.find((asset) => asset.slug === slug && asset.index === imageIndex)
      const hash = createHash('sha256').update(asset.body).digest('hex')
      const change = plan.changes.find((row) => row.id === `wm-demo-${slug}-job-0${jobIndex + 1}`)
      assert.deepEqual(change.photo, { url: `${publicBase}/job-photos/wm-demo-${slug}/${hash}.webp`, alt: 'Hình ảnh công việc: Pha chế ca sáng' })
      assert.deepEqual(Object.keys(change).sort(), ['companyId', 'id', 'photo'])
    }
  }
  assert.deepEqual(input, unchanged)
  assert.equal(Object.keys(PHOTO_SELECTION).length, 20)
})

test('reruns skip correct photos and never select unrelated jobs', () => {
  const input = fixture()
  const unrelated = { id: 'real-job', companyId: 'real-company', photo: { url: 'https://example.org/old.jpg' } }
  input.jobs.push(unrelated)
  const first = buildJobPhotoPlan(input)
  for (const change of first.changes) input.jobs.find((job) => job.id === change.id).photo = { ...change.photo }
  assert.equal(buildJobPhotoPlan(input).changes.length, 0)
  assert.deepEqual(unrelated.photo, { url: 'https://example.org/old.jpg' })
})

test('missing targets, wrong owners, duplicate rows and unalerted targets stop before any mutation', () => {
  for (const mutate of [
    (input) => input.jobs.pop(),
    (input) => { input.jobs[0].companyId = 'another-company' },
    (input) => input.jobs.push({ ...input.jobs[0] }),
    (input) => { input.jobs[0].matchAlertedAt = null },
  ]) {
    const input = fixture()
    mutate(input)
    assert.throws(() => buildJobPhotoPlan(input))
  }
})

test('rejects incomplete assets, duplicate images, forged WebP, oversized files and remote public URLs', () => {
  for (const mutate of [
    (input) => input.assets.pop(),
    (input) => { input.assets[1].body = input.assets[0].body },
    (input) => { input.assets[0].body = Buffer.from('not-webp') },
    (input) => { input.assets[0].body = Buffer.concat([webp, Buffer.alloc(2 * 1024 * 1024)]) },
    (input) => { input.publicBase = 'https://storage.example.org' },
  ]) {
    const input = fixture()
    mutate(input)
    assert.throws(() => buildJobPhotoPlan(input))
  }
})

test('photo alt removes demo labels without changing the actual job title', () => {
  const input = fixture()
  input.jobs[0].title = '[DEMO] Nhân viên phục vụ'
  const change = buildJobPhotoPlan(input).changes[0]
  assert.equal(change.photo.alt, 'Hình ảnh công việc: Nhân viên phục vụ')
  assert.equal(input.jobs[0].title, '[DEMO] Nhân viên phục vụ')
})

test('snapshot verification permits only planned photos and their updatedAt, guarding every other row and field', () => {
  const input = fixture()
  input.jobs.push({ id: 'unrelated', title: 'Other', photo: { url: 'old' }, updatedAt: new Date(0) })
  const before = { users: [{ id: 'user' }], profiles: [], companies: [{ id: 'company' }], settings: [], jobs: input.jobs, notifications: 4 }
  const plan = buildJobPhotoPlan(input)
  const after = globalThis.structuredClone(before)
  for (const change of plan.changes) Object.assign(after.jobs.find((job) => job.id === change.id), { photo: change.photo, updatedAt: new Date('2026-11-23T00:00:00Z') })
  verifyJobPhotoSnapshot(before, after, plan)
  for (const mutate of [
    (value) => { value.jobs[0].title = 'changed' },
    (value) => { value.jobs[0].matchAlertedAt = null },
    (value) => { value.jobs.at(-1).updatedAt = new Date() },
    (value) => { value.jobs[0].photo.url = 'wrong' },
    (value) => value.jobs.pop(),
    (value) => { value.users[0].id = 'changed' },
    (value) => { value.companies[0].id = 'changed' },
    (value) => { value.notifications++ },
  ]) {
    const corrupted = globalThis.structuredClone(after)
    mutate(corrupted)
    assert.throws(() => verifyJobPhotoSnapshot(before, corrupted, plan))
  }
})
