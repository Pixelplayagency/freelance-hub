const MAX_DIMENSION = 1920
const QUALITY = 0.85
const SKIP_BELOW_BYTES = 300 * 1024 // skip compression for files < 300 KB

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.size < SKIP_BELOW_BYTES) return file

  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          height = Math.round((height * MAX_DIMENSION) / width)
          width = MAX_DIMENSION
        } else {
          width = Math.round((width * MAX_DIMENSION) / height)
          height = MAX_DIMENSION
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            // Compression didn't help — use original
            resolve(file)
            return
          }
          const name = file.name.replace(/\.[^.]+$/, '.jpg')
          resolve(new File([blob], name, { type: 'image/jpeg' }))
        },
        'image/jpeg',
        QUALITY
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file) // fallback to original on error
    }

    img.src = url
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
