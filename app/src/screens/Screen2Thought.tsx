import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { UploadResponse, PickedMbti } from '../api/types'

const CARD_STYLES: Array<{
  bg: string
  text: string
  eyebrow: string
}> = [
  {
    bg: 'var(--color-crumbs-yellow)',
    text: 'var(--color-crumbs-ink)',
    eyebrow: 'var(--color-crumbs-pink)',
  },
  {
    bg: 'var(--color-crumbs-pink)',
    text: 'var(--color-crumbs-ink)',
    eyebrow: 'var(--color-crumbs-yellow)',
  },
  {
    bg: 'var(--color-crumbs-yellow)',
    text: 'var(--color-crumbs-pink)',
    eyebrow: 'var(--color-crumbs-ink)',
  },
]

const STACK_OFFSET_Y = 12
const STACK_OFFSET_SCALE = 0.04

interface Props {
  options: UploadResponse
  picked: PickedMbti
  onPick: (thought: string) => void
  onBack: () => void
}

export function Screen2Thought({ options, picked, onPick, onBack }: Props) {
  const [deck, setDeck] = useState<number[]>([0, 1, 2])

  const topIndex = deck[0]
  const topStyle = CARD_STYLES[topIndex]

  const handlePick = useCallback(() => {
    onPick(options.thoughts[topIndex])
  }, [onPick, options.thoughts, topIndex])

  const handleSkip = useCallback(() => {
    setDeck((prev) => {
      const next = prev.filter((i) => i !== prev[0])
      if (next.length === 0) return [0, 1, 2]
      return next
    })
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="flex h-full w-full flex-col bg-crumbs-ink px-5 pt-8 pb-6"
    >
      {/* Back + Eyebrow */}
      <div className="mb-2 flex items-center gap-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onBack}
          className="cursor-pointer text-crumbs-yellow"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            fontWeight: 700,
            background: 'none',
            border: 'none',
          }}
        >
          ← BACK
        </motion.button>
        <p
          className="text-crumbs-pink"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          PICK YOUR CRUMB
        </p>
      </div>

      {/* Counter */}
      <p
        className="mb-5 text-crumbs-yellow"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '14px',
          fontWeight: 400,
          fontStyle: 'italic',
          opacity: 0.7,
        }}
      >
        {deck.length} {deck.length === 1 ? 'thought' : 'thoughts'} left
      </p>

      {/* Card stack area */}
      <div className="relative flex-1 min-h-0">
        <AnimatePresence mode="popLayout">
          {[...deck].reverse().map((originalIndex, visualIndex) => {
            const stackIndex = deck.length - 1 - visualIndex
            const style = CARD_STYLES[originalIndex]
            const isTop = stackIndex === 0

            return (
              <motion.div
                key={`thought-${originalIndex}`}
                className="absolute inset-x-0 top-0"
                style={{ zIndex: 10 - stackIndex }}
                initial={{
                  y: stackIndex * STACK_OFFSET_Y,
                  scale: 1 - stackIndex * STACK_OFFSET_SCALE,
                  opacity: 1,
                }}
                animate={{
                  y: stackIndex * STACK_OFFSET_Y,
                  scale: 1 - stackIndex * STACK_OFFSET_SCALE,
                  opacity: 1,
                }}
                exit={{
                  x: 300,
                  opacity: 0,
                  rotate: 15,
                  transition: { duration: 0.3, ease: [0.32, 0, 0.67, 0] },
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              >
                <div
                  className="relative flex flex-col justify-between overflow-hidden rounded-3xl p-6"
                  style={{
                    backgroundColor: style.bg,
                    minHeight: 'clamp(260px, 44vh, 360px)',
                  }}
                >
                  {/* MBTI eyebrow */}
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '11px',
                      fontWeight: 500,
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: style.eyebrow,
                    }}
                  >
                    {picked.mbti}
                  </span>

                  {/* Thought — hero text */}
                  <p
                    className="my-auto py-6"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(20px, 5.5vw, 28px)',
                      fontStyle: 'italic',
                      fontWeight: 400,
                      color: style.text,
                      lineHeight: 1.4,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    "{options.thoughts[originalIndex]}"
                  </p>

                  {/* Card number */}
                  {isTop && (
                    <div
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '11px',
                        fontWeight: 500,
                        letterSpacing: '0.15em',
                        color: style.text,
                        opacity: 0.5,
                      }}
                    >
                      {deck.indexOf(originalIndex) + 1} / {deck.length}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="mt-5 flex items-center justify-center gap-6">
        {/* Skip */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.12 }}
          onClick={handleSkip}
          className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-3"
          style={{
            borderColor: topStyle.eyebrow,
            backgroundColor: 'transparent',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke={topStyle.eyebrow} strokeWidth="3" strokeLinecap="round" />
          </svg>
        </motion.button>

        {/* Pick */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.12 }}
          onClick={handlePick}
          className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-full"
          style={{
            backgroundColor: 'var(--color-crumbs-pink)',
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L20 7" stroke="var(--color-crumbs-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
      </div>

      {/* Hint */}
      <p
        className="mt-3 text-center"
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-crumbs-yellow)',
          opacity: 0.35,
        }}
      >
        SKIP OR PICK YOUR CRUMB
      </p>
    </motion.div>
  )
}
