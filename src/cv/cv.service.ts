import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import type { Cv } from '@prisma/client'
import { randomBytes } from 'crypto'
import { StorageService } from '../common/storage.service'
import { fileDisplayName, looksLike } from '../common/upload-check'
import { PrismaService } from '../prisma/prisma.service'

/** Khớp CvMeta ở frontend (cvStore) */
export interface CvView {
  id: string
  name: string
  type: string
  size: number
  uploadedAt: string
  isDefault: boolean
}

export interface UploadedFile { buffer: Buffer; mimetype: string; size: number; originalname: string }

export const CV_MAX_BYTES = 5 * 1024 * 1024
export const CV_MAX_COUNT = 5
const CV_EXT: Record<string, string> = { 'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }

const displayName = (original: string) => fileDisplayName(original, 'CV')

const view = (c: Cv): CvView => ({ id: c.id, name: c.name, type: c.mimeType, size: c.size, uploadedAt: c.uploadedAt.toISOString(), isDefault: c.isDefault })

@Injectable()
export class CvService {
  constructor(private prisma: PrismaService, private storage: StorageService) {}

  async list(seekerId: string): Promise<CvView[]> {
    const rows = await this.prisma.cv.findMany({ where: { seekerId }, orderBy: { uploadedAt: 'desc' } })
    return rows.map(view)
  }

  async upload(seekerId: string, file: UploadedFile | undefined): Promise<CvView> {
    if (!file) throw new BadRequestException('Chưa chọn file')
    const ext = CV_EXT[file.mimetype]
    if (!ext || !looksLike(file.mimetype, file.buffer)) throw new BadRequestException('Chỉ nhận file PDF hoặc ảnh (PNG, JPG, WEBP).')
    if (file.size > CV_MAX_BYTES) throw new BadRequestException('File lớn hơn 5MB.')
    if (await this.prisma.cv.count({ where: { seekerId } }) >= CV_MAX_COUNT) {
      throw new BadRequestException(`Tối đa ${CV_MAX_COUNT} CV — xóa bớt rồi tải lên.`)
    }

    const fileKey = `cvs/${seekerId}/${randomBytes(12).toString('hex')}.${ext}`
    await this.storage.putPrivate(fileKey, file.buffer, file.mimetype)
    try {
      const cv = await this.prisma.$transaction(async (tx) => {
        const hasDefault = await tx.cv.count({ where: { seekerId, isDefault: true } })
        return tx.cv.create({
          data: { seekerId, name: displayName(file.originalname), fileKey, mimeType: file.mimetype, size: file.size, isDefault: hasDefault === 0 },
        })
      })
      return view(cv)
    } catch (e) {
      await this.storage.deletePrivate(fileKey) // không để file mồ côi trên kho
      throw e
    }
  }

  private async own(seekerId: string, id: string): Promise<Cv> {
    const cv = await this.prisma.cv.findFirst({ where: { id, seekerId } })
    if (!cv) throw new NotFoundException('Không tìm thấy CV')
    return cv
  }

  async update(seekerId: string, id: string, patch: { name?: string; isDefault?: boolean }): Promise<CvView[]> {
    await this.own(seekerId, id)
    await this.prisma.$transaction(async (tx) => {
      if (patch.name !== undefined && patch.name.trim()) await tx.cv.update({ where: { id }, data: { name: patch.name.trim() } })
      if (patch.isDefault) {
        await tx.cv.updateMany({ where: { seekerId, isDefault: true }, data: { isDefault: false } })
        await tx.cv.update({ where: { id }, data: { isDefault: true } })
      }
    })
    return this.list(seekerId)
  }

  /** Xóa; nếu là CV mặc định thì CV mới nhất còn lại thành mặc định */
  async remove(seekerId: string, id: string): Promise<CvView[]> {
    const cv = await this.own(seekerId, id)
    await this.prisma.$transaction(async (tx) => {
      await tx.cv.delete({ where: { id } })
      if (cv.isDefault) {
        const next = await tx.cv.findFirst({ where: { seekerId }, orderBy: { uploadedAt: 'desc' } })
        if (next) await tx.cv.update({ where: { id: next.id }, data: { isDefault: true } })
      }
    })
    await this.storage.deletePrivate(cv.fileKey)
    return this.list(seekerId)
  }

  private async link(cv: Cv, download: boolean) {
    const url = await this.storage.signedUrl(cv.fileKey, `${cv.name}.${CV_EXT[cv.mimeType] ?? 'pdf'}`, download)
    return { url, expiresIn: 300 }
  }

  /** Người tìm việc xem / tải CV của chính mình */
  async ownUrl(seekerId: string, id: string, download: boolean) {
    return this.link(await this.own(seekerId, id), download)
  }

  /** Nhà tuyển dụng xem CV mặc định của ứng viên — chỉ khi ứng viên đã kết nối với một tin của công ty mình */
  async candidateCv(recruiterId: string, seekerId: string, download: boolean) {
    const connected = await this.prisma.connection.findFirst({
      where: { seekerId, job: { company: { members: { some: { userId: recruiterId } } } } },
      select: { jobId: true },
    })
    if (!connected) throw new ForbiddenException('Chỉ xem được CV của ứng viên đã kết nối với tin của bạn')
    const cv = await this.prisma.cv.findFirst({ where: { seekerId }, orderBy: [{ isDefault: 'desc' }, { uploadedAt: 'desc' }] })
    if (!cv) throw new NotFoundException('Ứng viên chưa tải CV lên')
    return { ...view(cv), ...(await this.link(cv, download)) }
  }
}
