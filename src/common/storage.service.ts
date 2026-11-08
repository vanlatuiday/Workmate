import { Injectable } from '@nestjs/common'
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

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
  private privateBucket = process.env.STORAGE_BUCKET_PRIVATE ?? 'workmate-private'
  private publicBase =(process.env.STORAGE_PUBLIC_URL ?? '').replace(/\/$/, '')

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
  deletePublic(key: string): Promise<void> {
    return this.remove(this.publicBucket, key)
  }

  /** Tải file lên bucket riêng tư (CV) — chỉ xem được qua link ký tạm thời */
  async putPrivate(key: string, body: Buffer, contentType: string): Promise<void> {
    await this.s3.send(new PutObjectCommand({ Bucket: this.privateBucket, Key: key, Body: body, ContentType: contentType }))
  }

  deletePrivate(key: string): Promise<void> {
    return this.remove(this.privateBucket, key)
  }

  /**
   * Link xem/tải file riêng tư, hết hạn sau `seconds` giây.
   * `download` = true → trình duyệt tải về với tên `filename`; false → mở xem ngay (PDF/ảnh).
   */
  signedUrl(key: string, filename: string, download: boolean, seconds = 300): Promise<string> {
    // Tên file có dấu tiếng Việt: dùng filename* (RFC 5987), kèm tên ASCII dự phòng
    const ascii = filename.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^\w.\- ]/g, '_')
    const disposition = `${download ? 'attachment' : 'inline'}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`
    return getSignedUrl(this.s3, new GetObjectCommand({ Bucket: this.privateBucket, Key: key, ResponseContentDisposition: disposition }), { expiresIn: seconds })
  }

  private async remove(Bucket: string, key: string): Promise<void> {
    try {
      await this.s3.send(new DeleteObjectCommand({ Bucket, Key: key }))
    } catch (e) {
      console.warn(`Không xóa được file ${key}:`, (e as Error).message)
    }
  }
}
