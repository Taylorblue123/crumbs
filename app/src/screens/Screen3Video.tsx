import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { MbtiAvatar } from '../components/MbtiAvatar'
import type { PickedFull } from '../api/types'

interface Props {
  videoUrl: string
  picked: PickedFull
  onShare: () => void
  onStartOver: () => void
}

export function Screen3Video({ videoUrl, picked, onShare, onStartOver }: Props) {
  const [videoError, setVideoError] = useState(false)

  const handleVideoPlay = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget
    video.muted = false
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="flex h-full w-full flex-col bg-crumbs-ink px-5 pt-8 pb-6"
    >
      {/* Eyebrow */}
      <p
        className="mb-4 text-crumbs-pink"
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}
      >
        YOUR ROAST
      </p>

      {/* Video or fallback */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-2xl bg-crumbs-ink">
        {!videoError ? (
          <video
            src={videoUrl}
            autoPlay
            loop
            muted
            playsInline
            onPlay={handleVideoPlay}
            onError={() => setVideoError(true)}
            className="h-full w-full rounded-2xl object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-4 p-6">
            <MbtiAvatar type={picked.mbti} size={160} />
            <p
              className="text-center text-crumbs-yellow"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '24px',
                fontWeight: 700,
                fontStyle: 'italic',
                letterSpacing: '-0.02em',
              }}
            >
              Video couldn't load — but you're still a {picked.mbti}
            </p>
            <p
              className="text-center text-crumbs-pink"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
              }}
            >
              {picked.description}
            </p>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="mt-4 flex gap-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.12 }}
          onClick={onShare}
          className="flex-1 cursor-pointer rounded-full bg-crumbs-pink py-3.5 text-crumbs-ink"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          SHARE ↗
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.12 }}
          onClick={onStartOver}
          className="flex-1 cursor-pointer rounded-full border-2 border-crumbs-yellow bg-transparent py-3.5 text-crumbs-yellow"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          START OVER
        </motion.button>
      </div>

      {/* Small avatar */}
      <div className="absolute bottom-6 right-5">
        <MbtiAvatar type={picked.mbti} size={64} />
      </div>
    </motion.div>
  )
}
