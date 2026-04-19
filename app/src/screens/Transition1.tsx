import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MbtiAvatar } from '../components/MbtiAvatar'

const MBTI_TYPES = [
  'INTJ', 'ENFP', 'ISTP', 'ESFJ', 'INFP', 'ENTJ', 'ISFJ', 'ESTP',
  'INTP', 'ENFJ', 'ISTJ', 'ESFP', 'INFJ', 'ENTP', 'ISFP', 'ESTJ',
]

const COPY = [
  'READING YOUR VIBES',
  'CONSULTING MBTI GODS',
  'EXTRACTING CRUMBS',
  'DECODING YOUR CHAOS',
]

interface Props {
  phase: 'uploading' | 'analyzing'
  uploadPct?: number
}

export function Transition1({ phase, uploadPct = 0 }: Props) {
  const [avatarType, setAvatarType] = useState(MBTI_TYPES[0])
  const [copyIndex, setCopyIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setAvatarType(MBTI_TYPES[Math.floor(Math.random() * MBTI_TYPES.length)])
    }, 400)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setInterval(() => {
      setCopyIndex((i) => (i + 1) % COPY.length)
    }, 2500)
    return () => clearInterval(id)
  }, [])

  const barWidth = phase === 'analyzing' ? 100 : uploadPct

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="flex h-full w-full flex-col items-center bg-crumbs-pink"
    >
      {/* Top spacer — pushes avatar to upper-center area */}
      <div className="flex-[2]" />

      {/* Avatar on yellow disc — contained in its own block */}
      <div className="relative flex shrink-0 items-center justify-center" style={{ width: 240, height: 240 }}>
        <div
          className="absolute rounded-full bg-crumbs-yellow"
          style={{ width: 240, height: 240 }}
        />
        <div className="relative z-10">
          <MbtiAvatar type={avatarType} size={200} />
        </div>
      </div>

      {/* Spacer between avatar and copy */}
      <div className="flex-[1] min-h-8" />

      {/* Rotating copy — fixed height container, no overlap possible */}
      <div className="shrink-0 px-8 text-center" style={{ height: 80 }}>
        <AnimatePresence mode="wait">
          <motion.p
            key={copyIndex}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-crumbs-yellow"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(24px, 6vw, 36px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
            }}
          >
            {COPY[copyIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Bottom spacer + progress bar */}
      <div className="flex-[2]" />

      {/* Progress bar — pinned to bottom */}
      <div className="w-full shrink-0 px-6 pb-10">
        <div
          className="h-1 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: 'rgba(255, 225, 77, 0.2)' }}
        >
          <motion.div
            className="h-full rounded-full bg-crumbs-ink"
            initial={{ width: '0%' }}
            animate={{ width: `${barWidth}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  )
}
