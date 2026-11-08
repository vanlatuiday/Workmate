import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { Prisma, type SeekerExperience, type SeekerProfile } from '@prisma/client'
import { randomBytes } from 'crypto'
import { JOB_TYPE_ENUM, JOB_TYPE_LABEL } from '../catalog/catalog.service'
import type { JobTypeLabel } from '../catalog/catalog.types'
import { geo } from '../common/geo'
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
  avatarUrl: string | null
  experience: { id: string; title: string; company: string; period: string }[]
  updatedAt: string
}

/** Ảnh đại diện nhận vào */
export interface UploadedImage { buffer: Buffer; mimetype: string; size: number }
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024

const IMAGE_EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

/** Kiểm tra vài byte đầu đúng là ảnh như khai báo (không tin hẳn Content-Type của trình duyệt) */
function looksLike(mime: string, b: Buffer): boolean {
  if (mime === 'image/jpeg') return b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff
  if (mime === 'image/png') return b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (mime === 'image/webp') return b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP'
  return false
}

const view = (p: SeekerProfile & { experiences: SeekerExperience[] }): ProfileView => ({
  fullName: p.fullName, phone: p.phone, intro: p.intro, about: p.about, showAvatar: p.showAvatar, published: p.published,
  area: p.area, jobTypes: p.jobTypes.map((t) => JOB_TYPE_LABEL[t]), salaryMinK: p.salaryMinK, maxDistanceKm: p.maxDistanceKm,
  skills: p.skills, availability: p.availability, avatarUrl: p.avatarUrl,
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
    const { experience, jobTypes, area, ...rest } = dto
    const data: Prisma.SeekerProfileUpdateInput = {
      ...rest,
      ...(jobTypes && { jobTypes: [...new Set(jobTypes)].map((t) => JOB_TYPE_ENUM[t]) }),
      // Bỏ kỹ năng trùng (không phân biệt hoa thường), giữ cách viết đầu tiên
      ...(rest.skills && { skills: rest.skills.filter((s, i, a) => s && a.findIndex((x) => x.toLowerCase() === s.toLowerCase()) === i) }),
      ...(rest.availability && { availability: [...new Set(rest.availability)] }),
      // Tọa độ tạm lấy theo quận; khu vực lạ → bỏ tọa độ
      ...(area !== undefined && { area, ...geo(area, userId) }),
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

  async setAvatar(userId: string, file: UploadedImage | undefined): Promise<ProfileView> {
    if (!file) throw new BadRequestException('Chưa chọn ảnh')
    const ext = IMAGE_EXT[file.mimetype]
    if (!ext || !looksLike(file.mimetype, file.buffer)) throw new BadRequestException('Chỉ nhận ảnh JPG, PNG hoặc WEBP')
    if (file.size > AVATAR_MAX_BYTES) throw new BadRequestException('Ảnh lớn hơn 2MB')

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
