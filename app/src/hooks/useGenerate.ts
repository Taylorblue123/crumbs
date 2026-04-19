import { useCallback, useRef } from 'react'
import { generateVideo } from '../api/client'

export function useGenerate(
  onSuccess: (videoUrl: string) => void,
  onError: (err: Error) => void,
) {
  const ctrlRef = useRef<AbortController | null>(null)

  const start = useCallback(
    (mbti: string, description: string, thought: string) => {
      ctrlRef.current?.abort()
      const ctrl = new AbortController()
      ctrlRef.current = ctrl

      generateVideo(mbti, description, thought, ctrl.signal)
        .then((url) => {
          if (!ctrl.signal.aborted) onSuccess(url)
        })
        .catch((err) => {
          if (!ctrl.signal.aborted) onError(err)
        })
    },
    [onSuccess, onError],
  )

  const cancel = useCallback(() => {
    ctrlRef.current?.abort()
  }, [])

  return { start, cancel }
}
