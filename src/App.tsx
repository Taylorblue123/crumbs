import { useState, useCallback, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { Step, UploadResponse, PickedFull } from './api/types'
import { useUpload } from './hooks/useUpload'
import { useGenerate } from './hooks/useGenerate'
import { Onboarding } from './screens/Onboarding'
import { Transition1 } from './screens/Transition1'
import { Screen1Mbti } from './screens/Screen1Mbti'
import { Screen2Thought } from './screens/Screen2Thought'
import { Transition2 } from './screens/Transition2'
import { Screen3Video } from './screens/Screen3Video'
import { Screen4Share } from './screens/Screen4Share'

export default function App() {
  const [step, setStep] = useState<Step>({ kind: 'onboarding' })

  const onProgress = useCallback((pct: number) => {
    setStep((s) =>
      s.kind === 'transition1' ? { ...s, uploadPct: pct } : s,
    )
  }, [])

  const onUploadSuccess = useCallback((data: UploadResponse) => {
    setStep({ kind: 'mbti', options: data })
  }, [])

  const onUploadError = useCallback(() => {
    setStep({ kind: 'error', message: 'Upload failed. Try again?', retryTo: 'onboarding' })
  }, [])

  const { start: startUpload } = useUpload(onProgress, onUploadSuccess, onUploadError)

  const pendingPickedRef = useRef<PickedFull | null>(null)

  const onGenerateSuccess = useCallback(
    (videoUrl: string) => {
      const picked = pendingPickedRef.current
      if (picked) {
        setStep({ kind: 'video', videoUrl, picked })
        pendingPickedRef.current = null
      }
    },
    [],
  )

  const onGenerateError = useCallback(() => {
    setStep({ kind: 'error', message: 'Video generation failed.', retryTo: 'onboarding' })
    pendingPickedRef.current = null
  }, [])

  const { start: startGenerate } = useGenerate(onGenerateSuccess, onGenerateError)

  const handleFileSelected = (file: File) => {
    setStep({ kind: 'transition1', phase: 'uploading', uploadPct: 0 })
    startUpload(file)
  }

  const handleMbtiPick = (index: number) => {
    if (step.kind !== 'mbti') return
    setStep({
      kind: 'thought',
      options: step.options,
      picked: {
        mbti: step.options.mbti[index],
        description: step.options.description[index],
      },
    })
  }

  const handleThoughtPick = (thought: string) => {
    if (step.kind !== 'thought') return
    const picked = { ...step.picked, thought }
    pendingPickedRef.current = picked
    setStep({ kind: 'transition2', picked })
    startGenerate(picked.mbti, picked.description, thought)
  }

  const handleBack = () => {
    if (step.kind === 'thought') {
      setStep({ kind: 'mbti', options: step.options })
    }
  }

  const handleShare = () => {
    if (step.kind === 'video') {
      setStep({ kind: 'share', videoUrl: step.videoUrl, picked: step.picked })
    }
  }

  const handleStartOver = () => {
    setStep({ kind: 'onboarding' })
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      <AnimatePresence mode="wait">
        {step.kind === 'onboarding' && (
          <Onboarding key="onboarding" onFileSelected={handleFileSelected} />
        )}

        {step.kind === 'transition1' && (
          <Transition1
            key="transition1"
            phase={step.phase}
            uploadPct={step.uploadPct}
          />
        )}

        {step.kind === 'mbti' && (
          <Screen1Mbti
            key="mbti"
            options={step.options}
            onPick={handleMbtiPick}
          />
        )}

        {step.kind === 'thought' && (
          <Screen2Thought
            key="thought"
            options={step.options}
            picked={step.picked}
            onPick={handleThoughtPick}
            onBack={handleBack}
          />
        )}

        {step.kind === 'transition2' && (
          <Transition2 key="transition2" mbtiType={step.picked.mbti} />
        )}

        {(step.kind === 'video' || step.kind === 'share') && (
          <Screen3Video
            key="video"
            videoUrl={step.videoUrl}
            picked={step.picked}
            onShare={handleShare}
            onStartOver={handleStartOver}
          />
        )}

        {step.kind === 'error' && (
          <div
            key="error"
            className="flex h-full w-full flex-col items-center justify-center gap-4 bg-crumbs-ink"
          >
            <p
              className="text-crumbs-pink px-6 text-center"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '28px',
                fontWeight: 700,
              }}
            >
              {step.message}
            </p>
            <button
              onClick={handleStartOver}
              className="cursor-pointer rounded-full bg-crumbs-pink px-8 py-3 text-crumbs-ink"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              TRY AGAIN
            </button>
          </div>
        )}
      </AnimatePresence>

      {/* Share sheet overlay */}
      <AnimatePresence>
        {step.kind === 'share' && (
          <Screen4Share
            key="share"
            videoUrl={step.videoUrl}
            onClose={() => {
              if (step.kind === 'share') {
                setStep({ kind: 'video', videoUrl: step.videoUrl, picked: step.picked })
              }
            }}
            onDone={handleStartOver}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
