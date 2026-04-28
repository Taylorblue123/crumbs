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

export interface GenerateProgress {
  status: string
  elapsed_s: number
}

export async function generateTotem(
  mbti: string,
  description: string,
  thought: string,
  signal?: AbortSignal,
): Promise<string> {
  const timeout = AbortSignal.timeout(60_000)
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout
  const res = await fetch(`${BASE}/generate-totem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mbti, description, thought }),
    signal: combined,
  })
  if (!res.ok) throw new Error(`Totem generation failed: ${res.status}`)
  const data = await res.json()
  return data.image
}

export async function generateVideo(
  mbti: string,
  description: string,
  thought: string,
  onProgress?: (p: GenerateProgress) => void,
  signal?: AbortSignal,
): Promise<string> {
  const params = new URLSearchParams({ mbti, description, thought })
  const timeout = AbortSignal.timeout(600_000) // 10 min
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout

  // Phase 1: SSE stream for progress + video_url
  const res = await fetch(`${BASE}/generate?${params}`, { signal: combined })
  if (!res.ok) throw new Error(`Generate failed: ${res.status}`)

  const videoUrl = await new Promise<string>((resolve, reject) => {
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    function pump(): void {
      reader.read().then(({ done, value }) => {
        if (done) {
          reject(new Error('SSE stream ended without result'))
          return
        }
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()! // keep incomplete line in buffer

        let currentEvent = ''
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim()
          } else if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (currentEvent === 'progress' && onProgress) {
                onProgress({ status: data.status, elapsed_s: data.elapsed_s })
              } else if (currentEvent === 'done' && data.video_url) {
                reader.cancel()
                resolve(data.video_url)
                return
              } else if (currentEvent === 'error') {
                reader.cancel()
                reject(new Error(data.message || 'Generation failed'))
                return
              }
            } catch { /* ignore parse errors */ }
          }
        }
        pump()
      }).catch(reject)
    }
    pump()
  })

  // Phase 2: download the video blob via backend proxy
  onProgress?.({ status: 'downloading', elapsed_s: 0 })
  const videoRes = await fetch(
    `${BASE}/generate/video?${new URLSearchParams({ url: videoUrl })}`,
    { signal: combined },
  )
  if (!videoRes.ok) throw new Error(`Video download failed: ${videoRes.status}`)
  const blob = await videoRes.blob()
  return URL.createObjectURL(blob)
}
