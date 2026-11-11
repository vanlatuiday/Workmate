import { BadRequestException } from '@nestjs/common'

/** Ảnh nhận vào từ multer (FileInterceptor) */
export interface UploadedImage { buffer: Buffer; mimetype: string; size: number }

/** Giới hạn chung cho ảnh đại diện và logo */
export const IMAGE_MAX_BYTES = 2 * 1024 * 1024

const IMAGE_EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

/** Kiểm tra vài byte đầu đúng loại như khai báo (không tin hẳn Content-Type của trình duyệt) */
export function looksLike(mime: string, b: Buffer): boolean {
  if (mime === 'application/pdf') return b.length > 5 && b.toString('ascii', 0, 5) === '%PDF-'
  if (mime === 'image/jpeg') return b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff
  if (mime === 'image/png') return b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  if (mime === 'image/webp') return b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP'
  return false
}

/** Kiểm tra ảnh JPG/PNG/WEBP ≤ 2MB, trả về chính ảnh đó kèm đuôi file */
export function checkImage(file: UploadedImage | undefined): { file: UploadedImage; ext: string } {
  if (!file) throw new BadRequestException('Chưa chọn ảnh')
  const ext = IMAGE_EXT[file.mimetype]
  if (!ext || !looksLike(file.mimetype, file.buffer)) throw new BadRequestException('Chỉ nhận ảnh JPG, PNG hoặc WEBP')
  if (file.size > IMAGE_MAX_BYTES) throw new BadRequestException('Ảnh lớn hơn 2MB')
  return { file, ext }
}

/** Tên hiển thị từ tên file gốc: bỏ đuôi, bỏ ký tự điều khiển, tối đa 120 ký tự */
export function fileDisplayName(original: string, fallback: string): string {
  // multer đọc tên file theo latin1; đổi lại UTF-8 để giữ dấu tiếng Việt
  const utf8 = Buffer.from(original, 'latin1').toString('utf8')
  return utf8.replace(/\.[^.]+$/, '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 120) || fallback
}
