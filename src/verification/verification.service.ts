import { BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import type { CompanyVerification, Prisma, VerificationDocument } from '@prisma/client'
import { randomBytes } from 'crypto'
import type { AuthUser } from '../auth/current-user.decorator'
import { MailService } from '../common/mail.service'
import { StorageService } from '../common/storage.service'
import { fileDisplayName, looksLike } from '../common/upload-check'
import { PrismaService } from '../prisma/prisma.service'

export interface UploadedDoc { buffer: Buffer; mimetype: string; size: number; originalname: string }

export const DOC_MAX_BYTES = 5 * 1024 * 1024
export const DOC_MAX_COUNT = 5
const DOC_EXT: Record<string, string> = { 'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }

type WithDocs = CompanyVerification & { documents: VerificationDocument[] }
const WITH_DOCS = { documents: { orderBy: { name: 'asc' } } } satisfies Prisma.CompanyVerificationInclude

/** Lần gửi xác minh, dạng trả cho cả nhà tuyển dụng và admin */
export interface VerificationView {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  note: string
  rejectReason: string | null
  submittedAt: string
  reviewedAt: string | null
  documents: { id: string; name: string; type: string; size: number }[]
}

const view = (v: WithDocs): VerificationView => ({
  id: v.id, status: v.status, note: v.note, rejectReason: v.rejectReason,
  submittedAt: v.submittedAt.toISOString(), reviewedAt: v.reviewedAt?.toISOString() ?? null,
  documents: v.documents.map((d) => ({ id: d.id, name: d.name, type: d.mimeType, size: d.size })),
})

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

@Injectable()
export class VerificationService {
  private log = new Logger('Verification')

  constructor(private prisma: PrismaService, private storage: StorageService, private mail: MailService) {}

  private async ownCompany(user: AuthUser) {
    const company = await this.prisma.company.findFirst({ where: { members: { some: { userId: user.id } } }, select: { id: true, verified: true, locked: true } })
    if (!company) throw new ForbiddenException('Tài khoản chưa thuộc doanh nghiệp nào')
    return company
  }

  // ───────────── Nhà tuyển dụng ─────────────

  /** Lần gửi gần nhất (null = chưa gửi bao giờ) + cờ xác minh hiện tại */
  async mine(user: AuthUser): Promise<{ verified: boolean; latest: VerificationView | null }> {
    const company = await this.ownCompany(user)
    const latest = await this.prisma.companyVerification.findFirst({ where: { companyId: company.id }, orderBy: { submittedAt: 'desc' }, include: WITH_DOCS })
    return { verified: company.verified, latest: latest && view(latest) }
  }

  async submit(user: AuthUser, files: UploadedDoc[] | undefined, note: string | undefined) {
    const company = await this.ownCompany(user)
    if (company.locked) throw new ForbiddenException('Doanh nghiệp đang bị khóa')
    if (company.verified) throw new ConflictException('Doanh nghiệp đã được xác minh')
    if (!files?.length) throw new BadRequestException('Chưa chọn giấy tờ nào')
    if (files.length > DOC_MAX_COUNT) throw new BadRequestException(`Tối đa ${DOC_MAX_COUNT} file`)
    for (const f of files) {
      if (!DOC_EXT[f.mimetype] || !looksLike(f.mimetype, f.buffer)) throw new BadRequestException('Chỉ nhận file PDF hoặc ảnh (PNG, JPG, WEBP).')
      if (f.size > DOC_MAX_BYTES) throw new BadRequestException('Mỗi file tối đa 5MB.')
    }
    const text = (note ?? '').trim().slice(0, 1000)

    const docs = files.map((f) => ({
      name: fileDisplayName(f.originalname, 'Giấy tờ'),
      fileKey: `verifications/${company.id}/${randomBytes(12).toString('hex')}.${DOC_EXT[f.mimetype]}`,
      mimeType: f.mimetype,
      size: f.size,
      file: f,
    }))
    await Promise.all(docs.map((d) => this.storage.putPrivate(d.fileKey, d.file.buffer, d.file.mimetype)))
    try {
      const created = await this.prisma.$transaction(async (tx) => {
        // Khóa theo doanh nghiệp: hai lần gửi cùng lúc không tạo ra hai yêu cầu chờ duyệt
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`verify|${company.id}`}, 0))`
        if (await tx.companyVerification.count({ where: { companyId: company.id, status: 'pending' } })) {
          throw new ConflictException('Đang có một yêu cầu chờ duyệt')
        }
        return tx.companyVerification.create({
          data: {
            companyId: company.id, note: text, submittedById: user.id,
            documents: { create: docs.map(({ name, fileKey, mimeType, size }) => ({ name, fileKey, mimeType, size })) },
          },
          include: WITH_DOCS,
        })
      })
      return view(created)
    } catch (e) {
      await Promise.all(docs.map((d) => this.storage.deletePrivate(d.fileKey))) // không để file mồ côi
      throw e
    }
  }

  /** Rút yêu cầu đang chờ (gửi nhầm giấy tờ) — xóa luôn file */
  async withdraw(user: AuthUser) {
    const company = await this.ownCompany(user)
    const pending = await this.prisma.companyVerification.findFirst({ where: { companyId: company.id, status: 'pending' }, include: WITH_DOCS })
    if (!pending) throw new NotFoundException('Không có yêu cầu nào đang chờ duyệt')
    // deleteMany + điều kiện status: admin vừa duyệt xong thì không xóa nữa
    const { count } = await this.prisma.companyVerification.deleteMany({ where: { id: pending.id, status: 'pending' } })
    if (!count) throw new ConflictException('Yêu cầu vừa được xử lý, hãy tải lại trang')
    await Promise.all(pending.documents.map((d) => this.storage.deletePrivate(d.fileKey)))
    return this.mine(user)
  }

  // ───────────── Admin ─────────────

  async list(status: 'pending' | 'approved' | 'rejected' | undefined) {
    const rows = await this.prisma.companyVerification.findMany({
      where: status ? { status } : {},
      orderBy: { submittedAt: status === 'pending' ? 'asc' : 'desc' },
      take: 200,
      include: { ...WITH_DOCS, company: { select: { id: true, name: true, industry: true, district: true, verified: true, locked: true } } },
    })
    return rows.map((r) => ({ ...view(r), company: r.company }))
  }

  /** Link xem giấy tờ (5 phút) */
  async documentLink(verificationId: string, docId: string, download: boolean) {
    const d = await this.prisma.verificationDocument.findFirst({ where: { id: docId, verificationId } })
    if (!d) throw new NotFoundException('Không tìm thấy giấy tờ')
    const url = await this.storage.signedUrl(d.fileKey, `${d.name}.${DOC_EXT[d.mimeType] ?? 'pdf'}`, download)
    return { url, expiresIn: 300 }
  }

  async decide(admin: AuthUser, id: string, status: 'approved' | 'rejected', reason: string | undefined) {
    const why = reason?.trim() ?? ''
    if (status === 'rejected' && !why) throw new BadRequestException('Cần ghi lý do từ chối')
    const result = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.companyVerification.updateMany({
        where: { id, status: 'pending' },
        data: { status, rejectReason: status === 'rejected' ? why.slice(0, 1000) : null, reviewedById: admin.id, reviewedAt: new Date() },
      })
      if (!count) {
        const exists = await tx.companyVerification.findUnique({ where: { id }, select: { id: true } })
        throw exists ? new ConflictException('Yêu cầu này đã được xử lý') : new NotFoundException('Không tìm thấy yêu cầu')
      }
      const v = await tx.companyVerification.findUniqueOrThrow({
        where: { id },
        include: { ...WITH_DOCS, company: { select: { id: true, name: true, industry: true, district: true, verified: true, locked: true, members: { select: { user: { select: { email: true } } } } } } },
      })
      if (status === 'approved') await tx.company.update({ where: { id: v.companyId }, data: { verified: true } })
      return v
    })
    const { members, ...company } = result.company
    void this.notify(members.map((m) => m.user.email), company.name, status, why)
    return { ...view(result), company: { ...company, verified: company.verified || status === 'approved' } }
  }

  /** Báo kết quả qua email; lỗi chỉ ghi log */
  private async notify(to: string[], companyName: string, status: 'approved' | 'rejected', reason: string) {
    if (!this.mail.enabled) return
    const ok = status === 'approved'
    const subject = ok ? `${companyName} đã được xác minh trên Workmate` : `Yêu cầu xác minh ${companyName} chưa được duyệt`
    const lines = ok
      ? ['Giấy tờ của doanh nghiệp đã được duyệt. Trang công ty và các tin tuyển dụng giờ hiện dấu Đã xác minh.']
      : ['Yêu cầu xác minh doanh nghiệp chưa được duyệt.', `Lý do: ${reason}`, 'Bạn có thể bổ sung giấy tờ và gửi lại trong trang Hồ sơ công ty.']
    for (const email of to) {
      try {
        await this.mail.send(email, {
          subject,
          text: lines.join('\n\n'),
          html: lines.map((l) => `<p>${escapeHtml(l)}</p>`).join(''),
        })
      } catch (e) {
        this.log.warn(`Không gửi được email kết quả xác minh: ${(e as Error).message}`)
      }
    }
  }
}
