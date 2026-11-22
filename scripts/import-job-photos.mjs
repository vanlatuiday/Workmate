import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { isDeepStrictEqual } from 'node:util'
import { assertLocalUrl, cleanDemoText } from './import-local-profiles.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const imageFolder = resolve(root, '../frontend/dangtin/optimized')
const sha = (body) => createHash('sha256').update(body).digest('hex')

export const PHOTO_SELECTION = Object.freeze(Object.fromEntries(Object.entries({
  highlands: [1, 2, 1], 'phuc-long': [1, 2, 1], cong: [1, 2, 2], 'gong-cha': [1, 2, 1],
  'pizza-4ps': [1, 2, 2], kfc: [1, 1, 2], lotteria: [1, 1, 2], 'winmart-plus': [2, 1, 2],
  coopmart: [1, 2, 1], 'lotte-mart': [1, 1, 2], furama: [1, 2, 1], 'hyatt-danang': [1, 2, 2],
  'danang-events': [1, 2, 1], 'sea-event': [1, 2, 2], ghn: [1, 1, 2], 'viettel-post': [1, 2, 1],
  apollo: [1, 2, 1], vus: [1, 2, 2], seodo: [1, 1, 2], danaseo: [1, 1, 2],
}).map(([slug, indexes]) => [slug, Object.freeze(indexes)])))

/** Pure plan: validate every target and image before writing storage or database. */
export function buildJobPhotoPlan({ jobs, assets, publicBase }) {
  assertLocalUrl(publicBase, 'STORAGE_PUBLIC_URL')
  const base = publicBase.replace(/\/$/, '')
  assert(assets.length === 40, 'Cần đúng 40 ảnh WebP')
  const prepared = assets.map(({ slug, index, body }) => {
    assert(Object.hasOwn(PHOTO_SELECTION, slug) && [1, 2].includes(index), 'Ảnh sai công ty hoặc số thứ tự')
    assert(Buffer.isBuffer(body) && body.length >= 20 && body.length <= 2 * 1024 * 1024, 'Ảnh WebP phải từ 20 byte đến 2 MB')
    assert(body.toString('latin1', 0, 4) === 'RIFF' && body.toString('latin1', 8, 12) === 'WEBP'
      && ['VP8 ', 'VP8L', 'VP8X'].includes(body.toString('latin1', 12, 16))
      && body.readUInt32LE(4) + 8 === body.length && body.readUInt32LE(16) <= body.length - 20, 'Sai định dạng WebP hoặc ảnh bị cắt')
    const hash = sha(body)
    const key = `job-photos/wm-demo-${slug}/${hash}.webp`
    return { slug, index, body, hash, key, url: `${base}/${key}` }
  })
  assert(new Set(prepared.map((asset) => `${asset.slug}:${asset.index}`)).size === 40, 'Trùng số thứ tự ảnh')
  assert(new Set(prepared.map((asset) => asset.key)).size === 40, 'Hai ảnh cùng công ty bị trùng nội dung')
  const changes = []
  const targetIds = []
  for (const [slug, indexes] of Object.entries(PHOTO_SELECTION)) {
    for (const [offset, imageIndex] of indexes.entries()) {
      const id = `wm-demo-${slug}-job-0${offset + 1}`
      const matching = jobs.filter((job) => job.id === id)
      assert(matching.length === 1, `Thiếu hoặc trùng tin: ${id}`)
      const job = matching[0]
      assert(job.companyId === `wm-demo-${slug}`, `Sai công ty của tin: ${id}`)
      // A photo edit must never make an imported job eligible for a new-job notification.
      assert(job.matchAlertedAt != null, `Tin chưa được chặn thông báo mới: ${id}`)
      assert(typeof job.title === 'string' && cleanDemoText(job.title), `Tin thiếu tiêu đề: ${id}`)
      const asset = prepared.find((image) => image.slug === slug && image.index === imageIndex)
      assert(asset, `Thiếu ảnh cho tin: ${id}`)
      const photo = { url: asset.url, alt: `Hình ảnh công việc: ${cleanDemoText(job.title)}` }
      targetIds.push(id)
      if (!isDeepStrictEqual(job.photo, photo)) changes.push({ id, companyId: job.companyId, photo })
    }
  }
  return { assets: prepared, changes, targetIds }
}

export function verifyJobPhotoSnapshot(before, after, plan) {
  const changes = new Map(plan.changes.map((change) => [change.id, change]))
  const expectedJobs = before.jobs.map((job) => {
    const change = changes.get(job.id)
    return change ? { ...job, photo: change.photo, updatedAt: null } : job
  })
  const actualJobs = after.jobs.map((job) => changes.has(job.id) ? { ...job, updatedAt: null } : job)
  assert(isDeepStrictEqual(expectedJobs, actualJobs), 'Có dữ liệu tin thay đổi ngoài ảnh đã chọn; dừng để kiểm tra')
  for (const table of ['users', 'profiles', 'companies', 'settings']) {
    assert(isDeepStrictEqual(before[table], after[table]), `Dữ liệu ${table} thay đổi trong lúc nạp; dừng để kiểm tra`)
  }
  assert(after.notifications === before.notifications, 'Số thông báo thay đổi trong lúc nạp; dừng để kiểm tra')
}

async function snapshot(db) {
  const [users, profiles, companies, jobs, settings, notifications] = await Promise.all([
    db.user.findMany({ orderBy: { id: 'asc' } }), db.seekerProfile.findMany({ orderBy: { userId: 'asc' } }),
    db.company.findMany({ orderBy: { id: 'asc' } }), db.job.findMany({ orderBy: { id: 'asc' } }),
    db.userSettings.findMany({ orderBy: { userId: 'asc' } }), db.notification.count(),
  ])
  return { users, profiles, companies, jobs, settings, notifications }
}

async function main() {
  assert(process.argv.slice(2).every((arg) => arg === '--apply'), 'Chỉ hỗ trợ --apply; mặc định xem trước')
  const apply = process.argv.includes('--apply')
  process.loadEnvFile(join(root, '.env'))
  for (const key of ['DATABASE_URL', 'STORAGE_ENDPOINT', 'STORAGE_PUBLIC_URL']) assertLocalUrl(process.env[key], key)
  const assets = await Promise.all(Object.keys(PHOTO_SELECTION).flatMap((slug) => [1, 2].map(async (index) => ({
    slug, index, body: await readFile(join(imageFolder, slug, `anh-0${index}.webp`)),
  }))))
  const require = createRequire(import.meta.url)
  require('reflect-metadata')
  require('ts-node/register/transpile-only')
  const { PrismaClient } = require('@prisma/client')
  const { StorageService } = require('../src/common/storage.service.ts')
  const db = new PrismaClient()
  try {
    const before = await snapshot(db)
    const plan = buildJobPhotoPlan({ jobs: before.jobs, assets, publicBase: process.env.STORAGE_PUBLIC_URL })
    console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', images: plan.assets.length, jobs: plan.targetIds.length,
      update: plan.changes.length, skip: plan.targetIds.length - plan.changes.length,
      imageBytes: plan.assets.reduce((sum, asset) => sum + asset.body.length, 0) }, null, 2))
    if (!apply) return
    const storage = new StorageService()
    // All uploads and HTTP hash checks finish before the transaction; retain old shared images.
    if (plan.changes.length) {
      for (const asset of plan.assets) assert(await storage.putPublic(asset.key, asset.body, 'image/webp') === asset.url, 'URL kho ảnh khác kế hoạch')
    }
    for (const asset of plan.assets) {
      const response = await fetch(asset.url, { redirect: 'error', signal: globalThis.AbortSignal.timeout(15000) })
      assert(response.ok && response.headers.get('content-type')?.split(';')[0].trim() === 'image/webp', 'Ảnh công khai không tải được đúng định dạng')
      assert(sha(Buffer.from(await response.arrayBuffer())) === asset.hash, 'SHA256 ảnh công khai khác nguồn')
    }
    await db.$transaction(async (tx) => {
      const current = await snapshot(tx)
      assert(isDeepStrictEqual(before, current), 'Dữ liệu thay đổi sau xem trước; chạy lại để kiểm tra')
      for (const change of plan.changes) await tx.job.update({ where: { id: change.id }, data: { photo: change.photo } })
      verifyJobPhotoSnapshot(before, await snapshot(tx), plan)
    }, { isolationLevel: 'Serializable', timeout: 30000 })
    verifyJobPhotoSnapshot(before, await snapshot(db), plan)
    console.log(JSON.stringify({ imagesVerified: 40, jobsVerified: 60, updated: plan.changes.length,
      otherFieldsUnchanged: true, otherRowsUnchanged: true, notificationsUnchanged: true }, null, 2))
  } finally { await db.$disconnect() }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => {
  console.error(error instanceof assert.AssertionError ? error.message : `Nạp ảnh thất bại (${error.code ?? error.name}); không ghi thông tin đăng nhập ra log.`)
  process.exitCode = 1
})
