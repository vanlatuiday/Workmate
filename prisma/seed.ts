/* eslint-disable @typescript-eslint/no-explicit-any */
// Nạp dữ liệu demo (xuất từ frontend vào seed-data.json) vào cơ sở dữ liệu.
// Chạy: npx prisma db seed — chạy lại nhiều lần được (xóa sạch mọi bảng rồi nạp lại).
// Nguồn dữ liệu: npm run db:export-demo (chỉ chạy lại khi dữ liệu demo ở frontend đổi).
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import { hashSync } from 'bcryptjs'
import { geo } from '../src/common/geo'

const prisma = new PrismaClient()
const d: any = JSON.parse(readFileSync(join(__dirname, 'seed-data.json'), 'utf8'))

// ─── Tiện ích ───────────────────────────────────────────────────────────────

let warnings = 0
const warn = (msg: string) => {
  warnings++
  console.warn(`  [cảnh báo] ${msg}`)
}

const JOB_TYPE: Record<string, string> = { 'full-time': 'full_time', 'part-time': 'part_time' }
const jobType = (t: string) => JOB_TYPE[t] ?? t

const COMPANY_SIZE: Record<string, string> = { '1-10': 's1_10', '11-50': 's11_50', '51-200': 's51_200', '201-500': 's201_500', '500+': 's500p' }

const date = (s: string) => new Date(s)
/** "dd/mm/yyyy" → Date; không đọc được (vd. "—") → undefined */
function dmy(s: string): Date | undefined {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s)
  return m ? new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00Z`) : undefined
}

// ─── Id cố định của tài khoản demo ──────────────────────────────────────────
const ME = 'me' // admin1 — frontend dùng 'me' làm seekerId ở mọi cặp
const RECRUITER = 'admin2'
const ADMIN = 'admin3'
const USER_ID: Record<string, string> = { admin1: ME, admin2: RECRUITER, admin3: ADMIN }
const sideUser = (side: string) => (side === 'seeker' ? ME : RECRUITER)

async function wipe() {
  // CASCADE nên thứ tự không quan trọng; liệt kê đủ bảng (trừ _prisma_migrations)
  const tables = [
    'User', 'PasswordReset', 'UserSettings', 'SeekerProfile', 'SeekerExperience', 'Cv', 'Company', 'CompanyMember', 'Job',
    'SavedJob', 'CandidateMark', 'Interest', 'Connection', 'Message', 'ConversationRead', 'Interview', 'Hire', 'Review',
    'Notification', 'Report', 'SystemConfig',
  ]
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`)
}

async function main() {
  await wipe()
  const admin = d.admin

  // ── Người dùng ──
  const demoHash = hashSync('123456', 10)
  const unusableHash = hashSync(randomBytes(24).toString('hex'), 10) // ứng viên mẫu: không đăng nhập được
  const users: any[] = d.demoAccounts.map((a: any) => ({
    id: USER_ID[a.username],
    username: a.username,
    email: `${a.username}@workmate.local`,
    passwordHash: demoHash,
    role: a.role,
  }))
  for (const c of d.candidates) {
    users.push({
      id: c.id, email: `${c.id}@workmate.local`, passwordHash: unusableHash, role: 'jobseeker',
      status: admin.lockedSeekers[c.id] ? 'locked' : 'active',
    })
  }
  if (admin.lockedSeekers[ME]) users[0].status = 'locked'
  await prisma.user.createMany({ data: users })

  // ── Hồ sơ người tìm việc ──
  const p = d.profile
  const seekers: any[] = [
    {
      userId: ME, fullName: p.fullName, phone: p.phone, showAvatar: p.showAvatar, intro: p.intro, about: p.about,
      area: p.area, ...geo(p.area, ME), salaryMinK: Math.round(p.salaryMin / 1000), maxDistanceKm: p.maxDistanceKm,
      jobTypes: p.jobTypes.map(jobType), skills: p.skills, availability: p.availability, published: p.published,
    },
    ...d.candidates.map((c: any) => ({
      userId: c.id, fullName: c.name, area: `${c.area}, Đà Nẵng`, ...geo(c.area, c.id), intro: c.summary,
      salaryMinK: c.criteria.salaryMinK, maxDistanceKm: c.criteria.maxDistanceKm, jobTypes: c.criteria.jobTypes.map(jobType),
      skills: c.criteria.skills, availability: c.criteria.slots, published: true,
    })),
  ]
  await prisma.seekerProfile.createMany({ data: seekers })
  const seekerIds = new Set<string>(seekers.map((s) => s.userId))
  await prisma.seekerExperience.createMany({
    data: p.experience.map((e: any, i: number) => ({ id: e.id, seekerId: ME, title: e.title, company: e.company, period: e.period, order: i })),
  })

  // ── Doanh nghiệp ──
  // Công ty demo (song-han) ghép hồ sơ đã sửa ở companyStore (có values/policies/culture/email/phone)
  const cp = d.companyProfile
  const demoCo = d.demoCompany
  const companyRows: any[] = d.companies.map((c: any) => ({
    id: c.id, slug: c.id, name: c.name, industry: c.industry, district: c.district, ...geo(c.district, c.id),
    size: COMPANY_SIZE[c.size], tagline: c.tagline, about: c.about, environment: c.environment, coverPhoto: c.cover,
    verified: !!admin.verifiedCompanies[c.id], locked: !!admin.lockedCompanies[c.id],
  }))
  // Trường `why` và ảnh phụ `more` của frontend chưa có cột tương ứng → bỏ qua
  companyRows.push({
    id: demoCo.id, slug: demoCo.id, name: cp.name, industry: cp.industry, district: cp.district, ...geo(cp.district, demoCo.id),
    size: COMPANY_SIZE[cp.size], tagline: cp.tagline, about: cp.about, environment: cp.environment, values: cp.values,
    policies: cp.policies, culture: cp.culture, email: cp.email, phone: cp.phone, coverPhoto: cp.cover,
    verified: !!admin.verifiedCompanies[demoCo.id], locked: !!admin.lockedCompanies[demoCo.id],
  })
  await prisma.company.createMany({ data: companyRows })
  const companyIds = new Set<string>(companyRows.map((c) => c.id))
  await prisma.companyMember.create({ data: { companyId: demoCo.id, userId: RECRUITER, role: 'owner' } })

  // ── Cài đặt ──
  const bySide = d.settings.bySide
  await prisma.userSettings.createMany({
    data: [
      { userId: ME, notify: bySide.seeker.notify, emailDigest: bySide.seeker.emailDigest, visibility: bySide.seeker.visibility },
      { userId: RECRUITER, notify: bySide.recruiter.notify, emailDigest: bySide.recruiter.emailDigest, visibility: bySide.recruiter.visibility },
    ],
  })

  // ── Tin tuyển dụng ──
  // Kiểm duyệt: khớp 1-1 với frontend (pending / approved / rejected / hidden). Tin chưa có bản ghi kiểm duyệt = đã duyệt.
  const modOf = (id: string) => {
    const m = admin.moderation[id]
    if (!m) return { moderation: 'approved', moderatedAt: new Date() }
    return { moderation: m.status, moderationReason: m.reason ?? null, moderatedAt: m.status === 'pending' ? null : date(m.at) }
  }
  const mockById: Record<string, any> = Object.fromEntries(d.mockJobs.map((j: any) => [j.id, j]))
  const posById: Record<string, any> = Object.fromEntries(d.positions.map((x: any) => [x.id, x]))
  const jobRows: any[] = []
  const baseJob = (j: any) => ({
    id: j.id, companyId: j.companyId, title: j.title, jobType: jobType(j.jobType), district: j.district, ...geo(j.district, j.id),
    salaryMinK: j.salaryMinK, salaryMaxK: j.salaryMaxK, salaryLabel: j.salaryLabel, shiftLabel: j.shiftLabel,
    slots: j.slots, skills: j.skills, photo: j.photo,
  })
  for (const j of d.matchJobs) {
    jobRows.push({ ...baseJob(j), status: admin.jobStatus[j.id] ?? 'open', ...modOf(j.id) })
  }
  for (const j of d.recruiterPositionJobs) {
    const mock = mockById[j.id]
    jobRows.push({
      ...baseJob(j), authorId: RECRUITER, radiusKm: posById[j.id]?.radiusKm ?? 8, postedAt: dmy(mock?.postedAt) ?? new Date(),
      // Trạng thái mở/tạm dừng: ưu tiên adminStore.jobStatus, không có thì lấy trạng thái trong MOCK_JOBS (j4 = tạm dừng)
      status: admin.jobStatus[j.id] ?? (mock?.status === 'paused' || mock?.status === 'closed' ? mock.status : 'open'),
      ...modOf(j.id),
    })
  }
  for (const j of admin.posted) {
    jobRows.push({
      ...baseJob(j), authorId: RECRUITER, description: j.description, quantity: j.quantity, radiusKm: j.radiusKm,
      postedAt: date(j.postedAt), status: admin.jobStatus[j.id] ?? 'open', ...modOf(j.id),
    })
  }
  const validJobs = jobRows.filter((j) => companyIds.has(j.companyId) || (warn(`tin ${j.id}: công ty ${j.companyId} không tồn tại`), false))
  await prisma.job.createMany({ data: validJobs })
  const jobIds = new Set<string>(validJobs.map((j) => j.id))

  // ── Dữ liệu theo cặp (jobId, seekerId) ──
  const pairOk = (what: string, r: { jobId: string; seekerId: string }) => {
    if (jobIds.has(r.jobId) && seekerIds.has(r.seekerId)) return true
    warn(`${what} (${r.jobId}, ${r.seekerId}): thiếu tin hoặc người tìm việc`)
    return false
  }
  const demo = d.demo
  await prisma.interest.createMany({
    data: demo.interests.filter((r: any) => pairOk('Interest', r)).map((r: any) => ({ jobId: r.jobId, seekerId: r.seekerId, from: r.from, at: date(r.at) })),
  })
  await prisma.connection.createMany({
    data: demo.connections.filter((r: any) => pairOk('Connection', r)).map((r: any) => ({ jobId: r.jobId, seekerId: r.seekerId, at: date(r.at) })),
  })
  await prisma.message.createMany({
    data: demo.messages.filter((r: any) => pairOk('Message', r)).map((r: any) => ({
      id: r.id, jobId: r.jobId, seekerId: r.seekerId, from: r.from, text: r.text, system: !!r.system, at: date(r.at),
    })),
  })
  await prisma.interview.createMany({
    data: demo.interviews.filter((r: any) => pairOk('Interview', r)).map((r: any) => ({
      id: r.id, jobId: r.jobId, seekerId: r.seekerId, slots: r.slots.map(date), chosen: r.chosen ? date(r.chosen) : null,
      mode: r.mode, place: r.place, note: r.note ?? null, status: r.status, createdAt: date(r.createdAt),
    })),
  })
  await prisma.hire.createMany({
    data: demo.hires.filter((r: any) => pairOk('Hire', r)).map((r: any) => ({
      jobId: r.jobId, seekerId: r.seekerId, status: r.status, startDate: r.startDate ? date(`${r.startDate}T00:00:00Z`) : null,
      note: r.note ?? null, reason: r.reason ?? null, at: date(r.at), updatedAt: date(r.updatedAt),
    })),
  })
  await prisma.review.createMany({
    data: demo.reviews.filter((r: any) => pairOk('Review', r)).map((r: any) => ({
      jobId: r.jobId, seekerId: r.seekerId, from: r.from, stars: r.stars, tags: r.tags, comment: r.comment ?? null, at: date(r.at),
    })),
  })
  await prisma.notification.createMany({
    data: demo.notifications.filter((r: any) => pairOk('Notification', r)).map((r: any) => ({
      id: r.id, userId: sideUser(r.to), kind: r.kind, jobId: r.jobId, seekerId: r.seekerId, read: r.read, at: date(r.at),
    })),
  })
  // lastRead: khóa `${side}|${jobId}|${seekerId}`
  const reads = Object.entries(demo.lastRead as Record<string, string>).flatMap(([k, at]) => {
    const [side, jobId, seekerId] = k.split('|')
    return pairOk('ConversationRead', { jobId, seekerId }) ? [{ userId: sideUser(side), jobId, seekerId, lastRead: date(at) }] : []
  })
  await prisma.conversationRead.createMany({ data: reads })

  // ── Đã lưu / đánh dấu ──
  const m = d.match
  await prisma.savedJob.createMany({
    data: m.savedJobs.filter((id: string) => jobIds.has(id) || (warn(`SavedJob: không có tin ${id}`), false)).map((jobId: string) => ({ seekerId: ME, jobId })),
  })
  // Khóa ứng viên: `${positionId}:${candidateId}` (candidateKey ở matchStore)
  const marks = (list: string[], kind: string) =>
    list.flatMap((k) => {
      const [jobId, seekerId] = k.split(':')
      return pairOk('CandidateMark', { jobId, seekerId }) ? [{ jobId, seekerId, kind, byUserId: RECRUITER }] : []
    })
  await prisma.candidateMark.createMany({ data: [...marks(m.savedCandidates, 'saved'), ...marks(m.skippedCandidates, 'skipped')] })

  // ── Báo cáo & cấu hình ──
  const REPORT_STATUS: Record<string, string> = { open: 'open', dismissed: 'dismissed', actioned: 'resolved' }
  const REPORTER: Record<string, string | null> = { guest: null, seeker: ME, recruiter: RECRUITER }
  await prisma.report.createMany({
    data: admin.reports.map((r: any) => ({
      id: r.id, target: r.target, targetId: r.targetId, reason: r.reason, note: r.note ?? null, reporterId: REPORTER[r.by] ?? null,
      status: REPORT_STATUS[r.status], resolution: r.resolution ?? null, at: date(r.at), resolvedAt: r.status === 'open' ? null : date(r.at),
    })),
  })
  const cfg = admin.config
  await prisma.systemConfig.create({
    data: { id: 1, weights: cfg.weights, bannedWords: cfg.bannedWords, minWageK: cfg.minWageK, defaultRadiusKm: cfg.defaultRadiusKm, registrationOpen: cfg.registrationOpen },
  })

  // ── Tóm tắt ──
  const models = ['user', 'seekerProfile', 'seekerExperience', 'company', 'companyMember', 'userSettings', 'job', 'savedJob', 'candidateMark',
    'interest', 'connection', 'message', 'conversationRead', 'interview', 'hire', 'review', 'notification', 'report', 'systemConfig']
  const rows: Record<string, number> = {}
  for (const name of models) rows[name] = await (prisma as any)[name].count()
  console.table(rows)
  console.log(`Cảnh báo / dòng bị bỏ qua: ${warnings}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
