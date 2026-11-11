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
  experience: { id: string; title: string; company: string; period: string }[]
  updatedAt: string
}

export { IMAGE_MAX_BYTES as AVATAR_MAX_BYTES, type UploadedImage } from '../common/upload-check'

const dateOnly = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null)

const view = (p: SeekerProfile & { experiences: SeekerExperience[] }): ProfileView => ({
  fullName: p.fullName, phone: p.phone, intro: p.intro, about: p.about, showAvatar: p.showAvatar, published: p.published,
  area: p.area, jobTypes: p.jobTypes.map((t) => JOB_TYPE_LABEL[t]), salaryMinK: p.salaryMinK, maxDistanceKm: p.maxDistanceKm,
  skills: p.skills, availability: p.availability, availableFrom: dateOnly(p.availableFrom), avatarUrl: p.avatarUrl,
  experience: p.experiences.map((e) => ({ id: e.id, title: e.title, company: e.company, period: e.period })),
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
    const { experience, jobTypes, area, availableFrom, ...rest } = dto
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
    try {
      const p = await this.prisma.$transaction(async (tx) => {
        await tx.seekerProfile.update({ where: { userId }, data })
        if (experience) {
          await tx.seekerExperience.deleteMany({ where: { seekerId: userId } })
          await tx.seekerExperience.createMany({
            data: experience.map((e, order) => ({ ...(e.id && { id: e.id }), seekerId: userId, title: e.title, company: e.company, period: e.period, order })),
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
}
