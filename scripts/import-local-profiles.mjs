import assert from 'node:assert/strict'
import { createHash, randomBytes } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { basename, dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { parseSeeker } from './import-profiles-parse.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const frontend = resolve(root, '../frontend')
const companyFolder = join(frontend, 'workmate_20_logos')
const sha = (value) => createHash('sha256').update(value).digest('hex')
const jobTypes = { 'full-time': 'full_time', 'part-time': 'part_time', shift: 'shift', seasonal: 'seasonal', flexible: 'flexible', event: 'event', freelance: 'freelance' }
const sizes = { '1-10': 's1_10', '11-50': 's11_50', '51-200': 's51_200', '201-500': 's201_500', '500+': 's500p' }

// ID công khai không chứa tên/email; cùng file nguồn giữ cùng ID khi chạy lại.
export const seekerIdOf = (portrait) => `wm-import-seeker-${sha(portrait).slice(0, 24)}`

/** Dọn nhãn trong nội dung hiển thị; không đổi mã liên kết hoặc đường dẫn tài nguyên. */
export function cleanDemoText(text) {
  if (!/\bdemo\b/i.test(text)) return text
  return text.replace(/\[demo\]|\(demo\)/gi, '')
    .split('\n').filter((line) => !/\b(?:bản|tin)\s+demo\b/i.test(line)).join('\n')
    .replace(/\bdemo\b/gi, '').replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+([,.;:!?])/g, '$1').replace(/\n{3,}/g, '\n\n').trim()
}

export function companyData(source, logoUrl, location) {
  assert(sizes[source.size], 'Quy mô công ty không hợp lệ')
  const fields = ['id', 'slug', 'name', 'industry', 'district', 'address', 'tagline', 'about', 'environment', 'values', 'policies', 'culture', 'email', 'phone']
  return { ...Object.fromEntries(fields.map((key) => [key, source[key]])),
    name: cleanDemoText(source.name), tagline: cleanDemoText(source.tagline), about: cleanDemoText(source.about),
    email: /@workmate-demo\.invalid$/i.test(source.email) ? '' : source.email,
    ...location, size: sizes[source.size], logoUrl, coverPhoto: source.cover, verified: false, locked: false }
}

export function jobData(source, generatedAt, now, location) {
  assert(jobTypes[source.jobType], 'Loại việc không hợp lệ')
  assert(Number.isInteger(source.salaryMinK) && source.salaryMinK > 0 && source.salaryMaxK >= source.salaryMinK, 'Lương không hợp lệ')
  assert(source.slots.every((slot) => /^[0-6]-[0-3]$/.test(slot)), 'Ca không hợp lệ')
  const age = Math.max(0, new Date(generatedAt).getTime() - new Date(source.postedAt).getTime())
  assert(Number.isFinite(age) && source.durationDays > 0, 'Ngày đăng không hợp lệ')
  const postedAt = new Date(now.getTime() - age)
  const fields = ['id', 'companyId', 'title', 'description', 'district', 'salaryMinK', 'salaryMaxK', 'salaryLabel', 'shiftLabel', 'slots', 'skills', 'requiredSkills', 'requireAllSlots', 'quantity', 'radiusKm', 'photo']
  return { ...Object.fromEntries(fields.map((key) => [key, source[key]])), title: cleanDemoText(source.title), description: cleanDemoText(source.description), ...location, jobType: jobTypes[source.jobType], status: 'open', moderation: 'approved', postedAt, expiresAt: new Date(postedAt.getTime() + source.durationDays * 86400000), moderatedAt: now }
}

export function assertLocalUrl(value, label) {
  assert(value, `Thiếu ${label}`)
  assert(['localhost', '127.0.0.1', '[::1]'].includes(new URL(value).hostname), `${label} phải trỏ về máy local`)
}

export function assertIdentity(existing, incoming, fields) {
  if (existing) assert(fields.every((key) => existing[key] === incoming[key]), `Trùng dữ liệu khác tại ${incoming.id}; dừng để bảo toàn dữ liệu`)
}

export function sameIdentifier(existing, incoming) {
  return existing.id === incoming.id || existing.email.toLowerCase() === incoming.email.toLowerCase() || existing.username?.toLowerCase() === incoming.username.toLowerCase()
}

async function asset(path, ownerId, mime) {
  const body = await readFile(path)
  assert(mime === 'image/png' ? body.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) : body[0] === 255 && body[1] === 216 && body[2] === 255, `Sai định dạng ảnh: ${basename(path)}`)
  assert(body.length < 8 * 1024 * 1024, 'Ảnh vượt 8 MB')
  return { body, mime, key: `imports/workmate-2026/${ownerId}/${sha(body)}.${mime === 'image/png' ? 'png' : 'jpg'}` }
}

async function loadInput() {
  const json = async (name) => JSON.parse(await readFile(join(companyFolder, name), 'utf8'))
  const [companies, jobs, manifest] = await Promise.all(['doanh-nghiep.json', 'viec-lam.json', 'manifest.json'].map(json))
  assert(companies.length === 20 && jobs.length === 60, 'Bộ doanh nghiệp thiếu dữ liệu')
  const seekers = []
  const seekerFolder = join(frontend, 'nguoi-tim-viec')
  for (const entry of (await readdir(seekerFolder, { withFileTypes: true })).filter((e) => e.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const folder = join(seekerFolder, entry.name)
    const parsed = parseSeeker(await readFile(join(folder, 'thong-tin.txt'), 'utf8'))
    const photos = (await readdir(folder)).filter((name) => /\.jpe?g$/i.test(name))
    assert(photos.length === 1, 'Mỗi hồ sơ cần đúng một ảnh')
    const id = seekerIdOf(await readFile(join(folder, photos[0])))
    seekers.push({ id, username: id, ...parsed, asset: await asset(join(folder, photos[0]), id, 'image/jpeg') })
  }
  assert(seekers.length === 20, 'Bộ người tìm việc cần đủ 20 hồ sơ')
  for (const values of [seekers.map((s) => s.id), seekers.map((s) => s.email), companies.map((c) => c.id), companies.map((c) => c.slug), jobs.map((j) => j.id)]) assert(new Set(values).size === values.length, 'Trùng khóa trong bộ dữ liệu')
  for (const company of companies) {
    assert(company.id.startsWith('wm-demo-') && company.isDemo && !company.verified, 'Chỉ nhập doanh nghiệp demo')
    assert(basename(company.logoFile) === company.logoFile, 'Tên logo không hợp lệ')
    company.asset = await asset(join(companyFolder, company.logoFile), company.id, 'image/png')
    const expected = manifest.logoFiles.find((logo) => logo.file === company.logoFile)
    assert(expected?.sha256 === sha(company.asset.body), `Logo đã khác manifest: ${company.id}`)
  }
  for (const job of jobs) assert(job.id.startsWith('wm-demo-') && job.isDemo && companies.some((c) => c.id === job.companyId), 'Tin demo sai công ty')
  return { companies, jobs, seekers, manifest }
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
  const input = await loadInput()
  const require = createRequire(import.meta.url)
  require('reflect-metadata')
  require('ts-node/register/transpile-only')
  const { PrismaClient, Prisma } = require('@prisma/client')
  const { StorageService } = require('../src/common/storage.service.ts')
  const { geo } = require('../src/common/geo.ts')
  const { hashSync } = require('bcryptjs')
  const db = new PrismaClient()
  try {
    const before = await snapshot(db)
    const newSeekers = input.seekers.filter((s) => {
      const related = before.users.filter((u) => sameIdentifier(u, s))
      for (const existing of related) assertIdentity(existing, { ...s, role: 'jobseeker' }, ['id', 'email', 'username', 'role'])
      if (related.length) assert(before.profiles.some((p) => p.userId === s.id), `Thiếu hồ sơ tại ${s.id}`)
      return !related.length
    })
    const newCompanies = input.companies.filter((c) => {
      const related = before.companies.filter((old) => old.id === c.id || old.slug === c.slug)
      for (const old of related) assertIdentity(old, c, ['id', 'slug'])
      return !related.length
    })
    const newJobs = input.jobs.filter((j) => {
      const old = before.jobs.find((row) => row.id === j.id)
      assertIdentity(old, j, ['id', 'companyId'])
      return !old
    })
    const now = new Date()
    // Kiểm tra toàn bộ payload trước khi chạm kho ảnh/database.
    input.companies.forEach((c) => companyData(c, null, geo(c.district, c.id)))
    input.jobs.forEach((j) => jobData(j, input.manifest.generatedAt, now, geo(j.district, j.id)))
    const summary = { mode: apply ? 'apply' : 'dry-run', create: { seekers: newSeekers.length, companies: newCompanies.length, jobs: newJobs.length }, skip: { seekers: 20 - newSeekers.length, companies: 20 - newCompanies.length, jobs: 60 - newJobs.length }, imageBytes: [...newSeekers, ...newCompanies].reduce((sum, row) => sum + row.asset.body.length, 0), profilesWithoutFullSession: input.seekers.filter((s) => !s.profile.availability.length).length }
    console.log(JSON.stringify(summary, null, 2))
    if (!apply) return
    const storage = new StorageService()
    for (const row of [...newSeekers, ...newCompanies]) row.imageUrl = await storage.putPublic(row.asset.key, row.asset.body, row.asset.mime)
    await db.$transaction(async (tx) => {
      for (const seeker of newSeekers) await tx.user.create({ data: {
        id: seeker.id, username: seeker.username, email: seeker.email,
        passwordHash: hashSync(randomBytes(32).toString('hex'), 10), role: 'jobseeker',
        // Không nhận cả gợi ý từ tin cũ mà worker có thể đang xử lý khi import.
        settings: { create: { emailDigest: 'off', visibility: 'public', notify: { job_match: false } } },
        seeker: { create: { ...seeker.profile, ...geo(seeker.profile.area, seeker.id), avatarUrl: seeker.imageUrl, coverUrl: null, showAvatar: true, showPersonal: false, published: true } },
      } })
      for (const c of newCompanies) await tx.company.create({ data: companyData(c, c.imageUrl, geo(c.district, c.id)) })
      for (const j of newJobs) await tx.job.create({ data: jobData(j, input.manifest.generatedAt, now, geo(j.district, j.id)) })
      // Ghi trước commit: worker mỗi phút không phát thông báo/email vì lần nạp này.
      if (newSeekers.length) await tx.$executeRaw(Prisma.sql`UPDATE "SeekerProfile" SET "matchAlertedAt" = "updatedAt" WHERE "userId" IN (${Prisma.join(newSeekers.map((s) => s.id))})`)
      if (newJobs.length) await tx.$executeRaw(Prisma.sql`UPDATE "Job" SET "matchAlertedAt" = "updatedAt" WHERE "id" IN (${Prisma.join(newJobs.map((j) => j.id))})`)
    }, { timeout: 30000 })
    const after = await snapshot(db)
    const report = {}
    for (const [table, key, added] of [['users', 'id', newSeekers.length], ['profiles', 'userId', newSeekers.length], ['companies', 'id', newCompanies.length], ['jobs', 'id', newJobs.length], ['settings', 'userId', newSeekers.length]]) {
      assert(after[table].length === before[table].length + added, `Số lượng ${table} không khớp`)
      const ids = new Set(before[table].map((row) => row[key]))
      assert(sha(JSON.stringify(before[table])) === sha(JSON.stringify(after[table].filter((row) => ids.has(row[key])))), `Dữ liệu cũ ${table} thay đổi trong lúc nạp; cần kiểm tra`)
      report[table] = { before: before[table].length, after: after[table].length, existingUnchanged: true }
    }
    assert(after.notifications === before.notifications, 'Số thông báo thay đổi trong lúc nạp; cần kiểm tra')
    const images = [...newSeekers, ...newCompanies]
    for (const row of images) {
      const response = await fetch(row.imageUrl)
      assert(response.ok && sha(Buffer.from(await response.arrayBuffer())) === sha(row.asset.body), `Ảnh tải lên chưa đúng: ${row.id}`)
    }
    console.log(JSON.stringify({ verified: report, notificationsUnchanged: true, imagesVerified: images.length, completedAt: new Date().toISOString() }, null, 2))
  } finally { await db.$disconnect() }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => {
  console.error(error instanceof assert.AssertionError ? error.message : `Nạp dữ liệu thất bại (${error.code ?? error.name}); không ghi thông tin đăng nhập ra log.`)
  process.exitCode = 1
})
