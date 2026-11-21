import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma, type SeekerExperience, type SeekerProfile } from '@prisma/client'
import { randomBytes } from 'crypto'
import { JOB_TYPE_ENUM, JOB_TYPE_LABEL } from '../catalog/catalog.service'
import type { JobTypeLabel } from '../catalog/catalog.types'
import { geo } from '../common/geo'
import { checkImage, type UploadedImage } from '../common/upload-check'
import { StorageService } from '../common/storage.service'
import { PrismaService } from '../prisma/prisma.service'
import type { UpdateProfileDto } from './profile.dto'

/** Hồ sơ trả về cho frontend (tên trường khớp SeekerProfile ở profileStore, lương tính bằng nghìn đồng) */
export interface ProfileView {
  fullName: string
  phone: string
  intro: string
  about: string
  showAvatar: boolean
  published: boolean
  area: string
  jobTypes: JobTypeLabel[]
  salaryMinK: number
  maxDistanceKm: number
  skills: string[]
  availability: string[]
  /** YYYY-MM-DD; null = có thể bắt đầu ngay */
  availableFrom: string | null
  avatarUrl: string | null
  coverUrl: string | null
  headline: string
  /** YYYY-MM-DD hoặc null */
  birthDate: string | null
  gender: 'nam' | 'nu' | 'khac' | null
  showPersonal: boolean
  skillLevels: Record<string, number>
  hobbies: string[]
  experience: { id: string; title: string; company: string; period: string; bullets: string[] }[]
  updatedAt: string
}

export { IMAGE_MAX_BYTES as AVATAR_MAX_BYTES, type UploadedImage } from '../common/upload-check'

const dateOnly = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null)

/** Chỉ giữ khóa nằm trong skills, giá trị nguyên 1..5 */
export function cleanSkillLevels(raw: unknown, skills: string[]): Record<string, number> {
  const out: Record<string, number> = {}
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out
  for (const [k, v] of Object.entries(raw)) {
    if (skills.includes(k) && typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 5) out[k] = v
  }
  return out
}

const view = (p: SeekerProfile & { experiences: SeekerExperience[] }): ProfileView => ({
  fullName: p.fullName, phone: p.phone, intro: p.intro, about: p.about, showAvatar: p.showAvatar, published: p.published,
  area: p.area, jobTypes: p.jobTypes.map((t) => JOB_TYPE_LABEL[t]), salaryMinK: p.salaryMinK, maxDistanceKm: p.maxDistanceKm,
  skills: p.skills, availability: p.availability, availableFrom: dateOnly(p.availableFrom), avatarUrl: p.avatarUrl, coverUrl: p.coverUrl,
  headline: p.headline, birthDate: dateOnly(p.birthDate), gender: p.gender as ProfileView['gender'], showPersonal: p.showPersonal,
  skillLevels: cleanSkillLevels(p.skillLevels, p.skills), hobbies: p.hobbies,
  experience: p.experiences.map((e) => ({ id: e.id, title: e.title, company: e.company, period: e.period, bullets: e.bullets })),
  updatedAt: p.updatedAt.toISOString(),
})

const withExperiences = { experiences: { orderBy: { order: 'asc' } } } satisfies Prisma.SeekerProfileInclude

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService, private storage: StorageService) {}

  async get(userId: string): Promise<ProfileView> {
    const p = await this.prisma.seekerProfile.findUnique({ where: { userId }, include: withExperiences })
    if (!p) throw new NotFoundException('Chưa có hồ sơ người tìm việc')
    return view(p)
  }

  async update(userId: string, dto: UpdateProfileDto): Promise<ProfileView> {
    const { experience, jobTypes, area, availableFrom, birthDate, skillLevels, ...rest } = dto
    const data: Prisma.SeekerProfileUpdateInput = {
      ...rest,
      ...(jobTypes && { jobTypes: [...new Set(jobTypes)].map((t) => JOB_TYPE_ENUM[t]) }),
      // Bỏ kỹ năng trùng (không phân biệt hoa thường), giữ cách viết đầu tiên
      ...(rest.skills && { skills: rest.skills.filter((s, i, a) => s && a.findIndex((x) => x.toLowerCase() === s.toLowerCase()) === i) }),
      ...(rest.availability && { availability: [...new Set(rest.availability)] }),
      // Tọa độ tạm lấy theo quận; khu vực lạ → bỏ tọa độ
      ...(area !== undefined && { area, ...geo(area, userId) }),
      ...(availableFrom !== undefined && { availableFrom: availableFrom ? new Date(availableFrom) : null }),
    }
    if (birthDate !== undefined) data.birthDate = birthDate ? new Date(birthDate) : null
    if (rest.hobbies) data.hobbies = rest.hobbies.filter(Boolean)
    try {
      const p = await this.prisma.$transaction(async (tx) => {
        // Mức kỹ năng bám theo danh sách kỹ năng sau khi lưu (mới gửi hoặc hiện có)
        if (skillLevels !== undefined || rest.skills) {
          const cur = await tx.seekerProfile.findUniqueOrThrow({ where: { userId }, select: { skills: true, skillLevels: true } })
          const skills = (data.skills as string[] | undefined) ?? cur.skills
          data.skillLevels = cleanSkillLevels(skillLevels !== undefined ? skillLevels : cur.skillLevels, skills)
        }
        await tx.seekerProfile.update({ where: { userId }, data })
        if (experience) {
          await tx.seekerExperience.deleteMany({ where: { seekerId: userId } })
          await tx.seekerExperience.createMany({
            data: experience.map((e, order) => ({ ...(e.id && { id: e.id }), seekerId: userId, title: e.title, company: e.company, period: e.period, bullets: (e.bullets ?? []).filter(Boolean), order })),
          })
        }
        return tx.seekerProfile.findUniqueOrThrow({ where: { userId }, include: withExperiences })
      })
      return view(p)
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025') throw new NotFoundException('Chưa có hồ sơ người tìm việc')
        if (e.code === 'P2002') throw new BadRequestException('Mã dòng kinh nghiệm bị trùng, hãy tải lại trang')
      }
      throw e
    }
  }

  async setAvatar(userId: string, upload: UploadedImage | undefined): Promise<ProfileView> {
    const { file, ext } = checkImage(upload)

    const old = await this.prisma.seekerProfile.findUnique({ where: { userId }, select: { avatarUrl: true } })
    if (!old) throw new NotFoundException('Chưa có hồ sơ người tìm việc')
    // Tên file ngẫu nhiên: đổi ảnh thì URL đổi, không bị bộ nhớ đệm giữ ảnh cũ
    const url = await this.storage.putPublic(`avatars/${userId}/${randomBytes(8).toString('hex')}.${ext}`, file.buffer, file.mimetype)
    const p = await this.prisma.seekerProfile.update({ where: { userId }, data: { avatarUrl: url }, include: withExperiences })
    const oldKey = this.storage.publicKeyOf(old.avatarUrl)
    if (oldKey) await this.storage.deletePublic(oldKey)
    return view(p)
  }

  async removeAvatar(userId: string): Promise<ProfileView> {
    const old = await this.prisma.seekerProfile.findUnique({ where: { userId }, select: { avatarUrl: true } })
    if (!old) throw new NotFoundException('Chưa có hồ sơ người tìm việc')
    const p = await this.prisma.seekerProfile.update({ where: { userId }, data: { avatarUrl: null }, include: withExperiences })
    const oldKey = this.storage.publicKeyOf(old.avatarUrl)
    if (oldKey) await this.storage.deletePublic(oldKey)
    return view(p)
  }

  async setCover(userId: string, upload: UploadedImage | undefined): Promise<{ coverUrl: string }> {
    const { file, ext } = checkImage(upload)
    const old = await this.prisma.seekerProfile.findUnique({ where: { userId }, select: { coverUrl: true } })
    if (!old) throw new NotFoundException('Chưa có hồ sơ người tìm việc')
    const key = `covers/${userId}/${randomBytes(8).toString('hex')}.${ext}`
    const coverUrl = await this.storage.putPublic(key, file.buffer, file.mimetype)
    try {
      await this.prisma.seekerProfile.update({ where: { userId }, data: { coverUrl } })
    } catch (err) {
      await this.storage.deletePublic(key)
      throw err
    }
    const oldKey = this.storage.publicKeyOf(old.coverUrl)
    if (oldKey) await this.storage.deletePublic(oldKey)
    return { coverUrl }
  }

  async removeCover(userId: string): Promise<{ coverUrl: null }> {
    const old = await this.prisma.seekerProfile.findUnique({ where: { userId }, select: { coverUrl: true } })
    if (!old) throw new NotFoundException('Chưa có hồ sơ người tìm việc')
    await this.prisma.seekerProfile.update({ where: { userId }, data: { coverUrl: null } })
    const oldKey = this.storage.publicKeyOf(old.coverUrl)
    if (oldKey) await this.storage.deletePublic(oldKey)
    return { coverUrl: null }
  }
}
