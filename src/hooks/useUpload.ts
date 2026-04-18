import { useCallback, useRef } from 'react'
import { uploadVideo } from '../api/client'
import type { UploadResponse } from '../api/types'

export function useUpload(
  onProgress: (pct: number) => void,
  onSuccess: (data: UploadResponse) => void,
  onError: (err: Error) => void,
) {
  const abortRef = useRef<AbortController | null>(null)

  const start = useCallback(
    (file: File) => {
      abortRef.current?.abort()
      const ctrl = new AbortController()
      abortRef.current = ctrl

      uploadVideo(file, onProgress, ctrl.signal).then(onSuccess).catch(onError)
    },
    [onProgress, onSuccess, onError],
  )

  const cancel = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return { start, cancel }
}
