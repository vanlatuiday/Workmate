import { Injectable } from '@nestjs/common'
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'

/**
 * Kho file chuẩn S3 (trên máy: SeaweedFS; lên mạng: R2/S3 — chỉ đổi biến STORAGE_*).
 * Bucket công khai cho ảnh (xem trực tiếp qua STORAGE_PUBLIC_URL), bucket riêng tư cho CV.
 */
@Injectable()
export class StorageService {
  private s3 = new S3Client({
    endpoint: process.env.STORAGE_ENDPOINT,
    region: process.env.STORAGE_REGION ?? 'auto',
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY ?? '',
      secretAccessKey: process.env.STORAGE_SECRET_KEY ?? '',
    },
  })
  private publicBucket = process.env.STORAGE_BUCKET_PUBLIC ?? 'workmate-public'
  private publicBase = (process.env.STORAGE_PUBLIC_URL ?? '').replace(/\/$/, '')

  /** Tải file lên bucket công khai, trả về URL xem được */
  async putPublic(key: string, body: Buffer, contentType: string): Promise<string> {
    await this.s3.send(new PutObjectCommand({
      Bucket: this.publicBucket, Key: key, Body: body, ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    }))
    return `${this.publicBase}/${key}`
  }

  /** URL công khai -> khóa file, nếu URL thuộc kho của mình (ảnh ngoài như Unsplash → null) */
  publicKeyOf(url: string | null | undefined): string | null {
    if (!url || !this.publicBase || !url.startsWith(this.publicBase + '/')) return null
    return url.slice(this.publicBase.length + 1)
  }

  /** Xóa file công khai; lỗi chỉ ghi log vì không đáng chặn thao tác chính */
  async deletePublic(key: string): Promise<void> {
    try {
      await this.s3.send(new DeleteObjectCommand({ Bucket: this.publicBucket, Key: key }))
    } catch (e) {
      console.warn(`Không xóa được file ${key}:`, (e as Error).message)
    }
  }
}
