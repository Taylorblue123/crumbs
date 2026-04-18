import type { UploadResponse } from './types'

const BASE = import.meta.env.VITE_API_BASE ?? '/api'

export function uploadVideo(
  file: File,
  onProgress: (pct: number) => void,
  signal?: AbortSignal,
): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${BASE}/upload`)

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText))
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error('Network error'))

    signal?.addEventListener('abort', () => xhr.abort())

    const fd = new FormData()
    fd.append('video', file)
    xhr.send(fd)
  })
}

export async function generateVideo(
  mbti: string,
  description: string,
  thought: string,
): Promise<string> {
  const params = new URLSearchParams({ mbti, description, thought })
  const res = await fetch(`${BASE}/generate?${params}`, {
    signal: AbortSignal.timeout(120_000),
  })
  if (!res.ok) throw new Error(`Generate failed: ${res.status}`)
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}
