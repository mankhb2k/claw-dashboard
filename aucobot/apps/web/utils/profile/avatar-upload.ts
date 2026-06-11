const MAX_BYTES = 512 * 1024
const MAX_EDGE = 256
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

export function validateAvatarFile(file: File): string | null {
  if (!ALLOWED_TYPES.has(file.type)) {
    return 'Chỉ hỗ trợ JPEG, PNG, WebP hoặc GIF'
  }
  if (file.size > MAX_BYTES) {
    return 'Ảnh tối đa 512 KB (hãy chọn ảnh nhỏ hơn)'
  }
  return null
}

/** Resize large images before upload (OSS stores bytes in Postgres). GIF kept as-is. */
export async function prepareAvatarFile(file: File): Promise<File> {
  const validationError = validateAvatarFile(file)
  if (validationError) {
    throw new Error(validationError)
  }
  if (file.type === 'image/gif' && file.size <= MAX_BYTES) {
    return file
  }

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    return file
  }
  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, outputType, outputType === 'image/jpeg' ? 0.88 : undefined)
  })
  if (!blob) {
    return file
  }
  if (blob.size > MAX_BYTES) {
    throw new Error('Ảnh sau khi nén vẫn quá 512 KB — hãy chọn ảnh khác')
  }
  const ext = outputType === 'image/png' ? 'png' : 'jpg'
  return new File([blob], `avatar.${ext}`, { type: outputType })
}
