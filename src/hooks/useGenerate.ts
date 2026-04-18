import { useCallback, useRef } from 'react'
import { generateVideo } from '../api/client'

export function useGenerate(
  onSuccess: (videoUrl: string) => void,
  onError: (err: Error) => void,
) {
  const abortRef = useRef(false)

  const start = useCallback(
    (mbti: string, description: string, thought: string) => {
      abortRef.current = false
      generateVideo(mbti, description, thought)
        .then((url) => {
          if (!abortRef.current) onSuccess(url)
        })
        .catch((err) => {
          if (!abortRef.current) onError(err)
        })
    },
    [onSuccess, onError],
  )

  const cancel = useCallback(() => {
    abortRef.current = true
  }, [])

  return { start, cancel }
}
