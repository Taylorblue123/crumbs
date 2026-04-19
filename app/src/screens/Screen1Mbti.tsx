import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MbtiAvatar } from '../components/MbtiAvatar'
import type { UploadResponse } from '../api/types'

const CARD_STYLES: Array<{
  bg: string
  text: string
  accent: string
  avatarRotation: number
}> = [
  {
    bg: 'var(--color-crumbs-yellow)',
    text: 'var(--color-crumbs-ink)',
    accent: 'var(--color-crumbs-pink)',
    avatarRotation: -4,
  },
  {
    bg: 'var(--color-crumbs-pink)',
    text: 'var(--color-crumbs-ink)',
    accent: 'var(--color-crumbs-yellow)',
    avatarRotation: 4,
  },
  {
    bg: 'var(--color-crumbs-yellow)',
    text: 'var(--color-crumbs-pink)',
    accent: 'var(--color-crumbs-ink)',
    avatarRotation: -4,
  },
]

const STACK_OFFSET_Y = 12
const STACK_OFFSET_SCALE = 0.04

interface Props {
  options: UploadResponse
  onPick: (index: number) => void
}

export function Screen1Mbti({ options, onPick }: Props) {
  const [deck, setDeck] = useState<number[]>([0, 1, 2])

  const topIndex = deck[0]
  const topStyle = CARD_STYLES[topIndex]

  const handlePick = useCallback(() => {
    onPick(topIndex)
  }, [onPick, topIndex])

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
      {/* Eyebrow */}
      <p
        className="mb-2 text-crumbs-pink"
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
        }}
      >
        WHO ARE YOU TODAY
      </p>

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
        {deck.length} {deck.length === 1 ? 'option' : 'options'} left
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
                key={`card-${originalIndex}`}
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
                  className="relative overflow-hidden rounded-3xl p-6"
                  style={{
                    backgroundColor: style.bg,
                    minHeight: 'clamp(280px, 48vh, 380px)',
                  }}
                >
                  {/* Avatar — upper right, rotated */}
                  <div
                    className="absolute right-4 top-4"
                    style={{ transform: `rotate(${style.avatarRotation}deg)` }}
                  >
                    <MbtiAvatar type={options.mbti[originalIndex]} size={110} />
                  </div>

                  {/* Content — bottom aligned */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    {/* Giant MBTI type */}
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(68px, 20vw, 100px)',
                        fontWeight: 900,
                        color: style.text,
                        letterSpacing: '-0.03em',
                        lineHeight: 0.85,
                        display: 'block',
                      }}
                    >
                      {options.mbti[originalIndex]}
                    </span>

                    {/* Description */}
                    <p
                      className="mt-3 max-w-[80%]"
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '14px',
                        color: style.accent,
                        lineHeight: 1.45,
                      }}
                    >
                      {options.description[originalIndex]}
                    </p>
                  </div>

                  {/* Card number indicator */}
                  {isTop && (
                    <div
                      className="absolute left-6 top-6"
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

      {/* Action buttons — fixed below card stack */}
      <div className="mt-5 flex items-center justify-center gap-6">
        {/* Skip button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.12 }}
          onClick={handleSkip}
          className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full border-3"
          style={{
            borderColor: 'var(--color-crumbs-pink)',
            backgroundColor: 'transparent',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke={topStyle.accent} strokeWidth="3" strokeLinecap="round" />
          </svg>
        </motion.button>

        {/* Pick / confirm button */}
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

      {/* Hint text */}
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
        SKIP OR PICK — IT'S YOUR CALL
      </p>
    </motion.div>
  )
}
