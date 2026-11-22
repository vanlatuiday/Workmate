// Chỉ đọc và kiểm tra bộ dữ liệu; không gọi API hoặc ghi database.
import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.dirname(fileURLToPath(import.meta.url))
const readJson = async (name) => JSON.parse(await readFile(path.join(root, name), 'utf8'))
const [companies, jobs, manifest] = await Promise.all(['doanh-nghiep.json', 'viec-lam.json', 'manifest.json'].map(readJson))
const districts = new Set(['Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn', 'Liên Chiểu', 'Cẩm Lệ', 'Hòa Vang'])
const types = new Set(['full-time', 'part-time', 'shift', 'seasonal', 'flexible', 'event', 'freelance'])
const sizes = new Set(['1-10', '11-50', '51-200', '201-500', '500+'])
const industries = new Set(['Bán hàng / Bán lẻ', 'Nhà hàng / Cà phê / F&B', 'Marketing / Truyền thông', 'Giáo dục / Gia sư', 'Vận chuyển / Giao hàng', 'Tổ chức sự kiện', 'Khác'])
assert.equal(companies.length, 20)
assert.equal(jobs.length, 60)
assert.equal(manifest.counts.companies, companies.length)
assert.equal(manifest.counts.jobs, jobs.length)
assert.equal(manifest.counts.logos, companies.length)
assert.equal(new Set([...companies, ...jobs].map((r) => r.id)).size, 80, 'Mã bản ghi bị trùng')
assert.equal(new Set(companies.map((c) => c.logoFile)).size, 20)
assert.equal(manifest.importPolicy.resetDatabase, false)
assert.equal(manifest.importPolicy.sendNotifications, false)
assert.equal(manifest.importPolicy.overwriteExistingRealData, false)
const countBy = (records, key) => records.reduce((out, item) => ({ ...out, [item[key]]: (out[item[key]] ?? 0) + 1 }), {})
assert.deepEqual(countBy(companies, 'category'), manifest.categories)
assert.deepEqual(countBy(jobs, 'jobType'), manifest.jobTypes)
assert.deepEqual(countBy(jobs, 'district'), manifest.districts)

for (const company of companies) {
  const label = company.brandName
  assert(company.id.startsWith('wm-demo-'), label)
  assert(company.isDemo && company.name.endsWith('(Demo)') && company.tagline.startsWith('[DEMO]'), label)
  assert(company.name.length <= 120 && company.tagline.length <= 200 && company.about.length <= 4000, label)
  assert(districts.has(company.district) && sizes.has(company.size) && industries.has(company.industry), label)
  for (const key of ['environment', 'values', 'policies']) {
    assert(company[key].length >= 3 && company[key].length <= 20, `${label}: ${key}`)
    assert(company[key].every((item) => item.length > 0 && item.length <= 200), `${label}: ${key}`)
  }
  assert(company.about.includes('minh họa') && company.culture && company.address.includes('minh họa'), label)
  assert(company.email.endsWith('@workmate-demo.invalid') && company.phone === '', label)
  assert(company.verified === false && company.taxValid === false && company.taxCode === null, label)
  assert(company.logoUrl === null && company.cover.id && company.cover.alt.includes('minh họa'), label)
  const logoPath = path.resolve(root, company.logoFile)
  assert.equal(path.dirname(logoPath), root, 'Logo phải nằm trong folder bộ dữ liệu')
  const logo = await readFile(logoPath)
  const asset = manifest.logoFiles.find((entry) => entry.file === company.logoFile)
  assert(asset, label)
  assert.equal(logo.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', label)
  assert.equal(logo.readUInt32BE(16), asset.width, label)
  assert.equal(logo.readUInt32BE(20), asset.height, label)
  assert.equal(logo.length, asset.bytes, label)
  assert.equal(createHash('sha256').update(logo).digest('hex'), asset.sha256, `Logo bị thay đổi: ${label}`)
  const folder = company.id.slice('wm-demo-'.length)
  const [profileText, jobText] = await Promise.all(['thong-tin.txt', 'viec-lam.txt'].map((name) => readFile(path.join(root, 'ho-so', folder, name), 'utf8')))
  assert(profileText.includes(label) && profileText.includes(company.logoFile), label)
  const companyJobs = jobs.filter((job) => job.companyId === company.id)
  assert.equal(companyJobs.length, 3, `${label}: cần đúng 3 tin`)
  assert(companyJobs.every((job) => jobText.includes(job.id) && jobText.includes(job.salaryLabel)), label)
}

for (const job of jobs) {
  const label = job.id
  assert(companies.some((company) => company.id === job.companyId), label)
  assert(job.isDemo && job.title.startsWith('[DEMO]') && job.description.includes('minh họa'), label)
  assert(job.title.length >= 3 && job.title.length <= 120 && job.description.length <= 4000, label)
  assert(types.has(job.jobType) && districts.has(job.district), label)
  assert(Number.isInteger(job.salaryMinK) && Number.isInteger(job.salaryMaxK), label)
  assert(job.salaryMinK >= 20 && job.salaryMinK <= job.salaryMaxK && job.salaryMaxK <= 10000, label)
  assert.equal(job.salaryLabel, `${job.salaryMinK}.000–${job.salaryMaxK}.000đ/giờ`, label)
  assert(job.salaryUnit === 'hour' && job.currency === 'VND', label)
  assert(job.skills.length > 0 && job.skills.length <= 20 && job.skills.every((skill) => skill.length <= 60), label)
  assert(job.requiredSkills.every((skill) => job.skills.includes(skill)), label)
  assert(job.slots.length > 0 && job.slots.length <= 28 && new Set(job.slots).size === job.slots.length, label)
  assert(job.slots.every((slot) => /^[0-6]-[0-3]$/.test(slot)), label)
  assert(job.shiftLabel.length > 0 && job.shiftLabel.length <= 120, label)
  assert(Number.isInteger(job.quantity) && job.quantity >= 1 && job.quantity <= 20, label)
  assert(Number.isInteger(job.radiusKm) && job.radiusKm >= 1 && job.radiusKm <= 15, label)
  assert(job.photo.id && job.photo.alt.includes('minh họa') && job.photo.alt.length <= 300, label)
  assert(job.visible && job.status === 'open' && job.moderation === 'approved' && job.views === 0, label)
  assert.equal(Date.parse(job.expiresAt) - Date.parse(job.postedAt), job.durationDays * 86400000, label)
  assert.equal(job.requireAllSlots, job.jobType === 'full-time', label)
}
assert.equal(new Set(jobs.map((job) => job.jobType)).size, types.size)
assert.equal(new Set(jobs.map((job) => job.district)).size, districts.size)
assert.equal((await readdir(root)).filter((name) => name.endsWith('.png')).length, 20)
console.log('Đạt: 20 hồ sơ, 60 tin, 20 logo nguyên vẹn, 40 file TXT; đủ 8 nhóm ngành, 7 loại việc và 7 khu vực.')
console.log('Mã liên kết, ca làm, lương theo giờ, hạn tham chiếu và nhãn demo hợp lệ. Không gọi API/ghi database.')
