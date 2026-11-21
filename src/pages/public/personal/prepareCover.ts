/** Giữ tỉ lệ ảnh, bỏ metadata và giới hạn kích thước trước khi tải lên. */
export async function prepareCover(file: File): Promise<File> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Chỉ nhận ảnh JPG, PNG hoặc WebP.')
  if (file.size > 10 * 1024 * 1024) throw new Error('Ảnh gốc tối đa 10 MB.')
  const image = await createImageBitmap(file).catch(() => { throw new Error('Không đọc được ảnh. Bạn thử chọn ảnh khác nhé.') })
  try {
    const scale = Math.min(1, 1800 / image.width, 900 / image.height)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.width * scale))
    canvas.height = Math.max(1, Math.round(image.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Không xử lý ảnh được trên trình duyệt này.')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', 0.82))
    if (!blob) throw new Error('Không xử lý ảnh được. Bạn thử chọn ảnh khác nhé.')
    if (blob.size > 2 * 1024 * 1024) throw new Error('Ảnh sau khi nén vẫn lớn hơn 2 MB. Bạn thử chọn ảnh nhỏ hơn nhé.')
    return new File([blob], 'anh-bia.webp', { type: blob.type })
  } finally {
    image.close()
  }
}
