import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MbtiAvatar } from '../components/MbtiAvatar'

const VIDEO_COPY = [
  'TEACHING YOUR AVATAR SARCASM',
  'BRIBING THE LLM',
  'WRITING YOUR ROAST',
  'WARMING UP THE MIC',
  'ALMOST THERE WE PROMISE',
]

const CARD_COPY = [
  'READING YOUR LINES',
  'WHAT DIDN\'T YOU SAY',
  'YOUR 2AM THOUGHTS',
  'DRAWING YOUR TOTEM',
  'ALMOST THERE',
]

interface Props {
  mbtiType: string
  genStatus?: string
  genElapsed?: number
  mode?: 'video' | 'card'
}

function statusLabel(status?: string, elapsed?: number, mode?: string): string | null {
  if (!status) return null
  if (mode === 'card') return 'GENERATING YOUR CARD…'
  if (status === 'creating') return 'SUBMITTING TASK…'
  if (status === 'downloading') return 'DOWNLOADING VIDEO…'
  const secs = elapsed ?? 0
  return `RENDERING VIDEO… ${secs}S`
}

export function Transition2({ mbtiType, genStatus, genElapsed, mode = 'video' }: Props) {
  const COPY = mode === 'card' ? CARD_COPY : VIDEO_COPY
  const [copyIndex, setCopyIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setCopyIndex((i) => (i + 1) % COPY.length)
    }, 3000)
    return () => clearInterval(id)
  }, [COPY.length])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="flex h-full w-full flex-col items-center justify-center bg-crumbs-yellow"
    >
      {/* Floating avatar */}
      <motion.div
        animate={{ y: [-8, 8, -8] }}
        transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
      >
        <MbtiAvatar type={mbtiType} size={240} />
      </motion.div>

      {/* Rotating copy */}
      <div className="mt-8 h-[120px] overflow-hidden px-6 text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={copyIndex}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="text-crumbs-ink"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(28px, 8vw, 48px)',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            {COPY[copyIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Status line from backend */}
      {statusLabel(genStatus, genElapsed, mode) && (
        <p
          className="mt-6 text-crumbs-ink/60"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          {statusLabel(genStatus, genElapsed, mode)}
        </p>
      )}
    </motion.div>
  )
}
