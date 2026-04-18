import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MbtiAvatar } from '../components/MbtiAvatar'

const COPY = [
  'TEACHING YOUR AVATAR SARCASM',
  'BRIBING THE LLM',
  'WRITING YOUR ROAST',
  'WARMING UP THE MIC',
  'ALMOST THERE WE PROMISE',
]

interface Props {
  mbtiType: string
}

export function Transition2({ mbtiType }: Props) {
  const [copyIndex, setCopyIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setCopyIndex((i) => (i + 1) % COPY.length)
    }, 3000)
    return () => clearInterval(id)
  }, [])

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
    </motion.div>
  )
}
