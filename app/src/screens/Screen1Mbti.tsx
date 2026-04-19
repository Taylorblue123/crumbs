import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
    avatarRotation: -6,
  },
  {
    bg: 'var(--color-crumbs-pink)',
    text: 'var(--color-crumbs-ink)',
    accent: 'var(--color-crumbs-yellow)',
    avatarRotation: 5,
  },
  {
    bg: 'var(--color-crumbs-yellow)',
    text: 'var(--color-crumbs-pink)',
    accent: 'var(--color-crumbs-ink)',
    avatarRotation: -5,
  },
]

const STACK_OFFSET_Y = 10
const STACK_OFFSET_SCALE = 0.025

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
      className="flex h-full w-full flex-col bg-crumbs-ink px-4 pt-6 pb-6"
    >
      {/* Eyebrow row */}
      <div className="flex items-center justify-between px-1 mb-3">
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
          WHO ARE YOU TODAY
        </p>
        <p
          className="text-crumbs-yellow"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '13px',
            fontWeight: 400,
            fontStyle: 'italic',
            opacity: 0.6,
          }}
        >
          {deck.length} left
        </p>
      </div>

      {/* Full-bleed card stack */}
      <div className="relative flex-1 min-h-0">
        <AnimatePresence mode="popLayout">
          {[...deck].reverse().map((originalIndex, visualIndex) => {
            const stackIndex = deck.length - 1 - visualIndex
            const style = CARD_STYLES[originalIndex]
            const isTop = stackIndex === 0

            return (
              <motion.div
                key={`card-${originalIndex}`}
                className="absolute inset-0"
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
                  className="relative flex h-full flex-col overflow-hidden rounded-3xl"
                  style={{ backgroundColor: style.bg }}
                >
                  {/* Upper — avatar fills area */}
                  <div className="relative flex-1 overflow-hidden">
                    <img
                      src={`/avatars/${options.mbti[originalIndex].toLowerCase()}.png`}
                      alt={options.mbti[originalIndex]}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    {/* Card indicator overlay */}
                    {isTop && (
                      <span
                        className="absolute left-4 top-4"
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '11px',
                          fontWeight: 500,
                          letterSpacing: '0.15em',
                          color: '#fff',
                          opacity: 0.7,
                          textShadow: '0 1px 4px rgba(0,0,0,0.3)',
                        }}
                      >
                        {deck.indexOf(originalIndex) + 1} / {deck.length}
                      </span>
                    )}
                  </div>

                  {/* Lower — ink panel with MBTI + roast */}
                  <div className="px-5 py-4" style={{ backgroundColor: 'var(--color-crumbs-ink)' }}>
                    <h2
                      className="text-center text-crumbs-yellow"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(48px, 14vw, 72px)',
                        fontWeight: 900,
                        letterSpacing: '-0.04em',
                        lineHeight: 0.9,
                      }}
                    >
                      {options.mbti[originalIndex]}
                    </h2>
                    {/* Type label — the funny nickname */}
                    {options.type_label?.[originalIndex] && (
                      <p
                        className="mt-1 text-center text-crumbs-pink"
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '11px',
                          fontWeight: 600,
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {options.type_label[originalIndex]}
                      </p>
                    )}
                    {/* Roast line */}
                    <p
                      className="mt-2 text-center text-crumbs-pink"
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: 'clamp(13px, 3.5vw, 16px)',
                        lineHeight: 1.4,
                      }}
                    >
                      {options.roast_line?.[originalIndex] || options.description[originalIndex].split('.').slice(0, 2).join('.') + '.'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="mt-4 flex items-center justify-center gap-6">
        <motion.button
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.12 }}
          onClick={handleSkip}
          className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-3"
          style={{
            borderColor: topStyle.accent,
            backgroundColor: 'transparent',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke={topStyle.accent} strokeWidth="3" strokeLinecap="round" />
          </svg>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.12 }}
          onClick={handlePick}
          className="flex h-18 w-18 cursor-pointer items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--color-crumbs-pink)' }}
        >
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
            <path d="M5 12l5 5L20 7" stroke="var(--color-crumbs-ink)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
      </div>

      <p
        className="mt-2 text-center"
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '11px',
          fontWeight: 500,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'var(--color-crumbs-yellow)',
          opacity: 0.3,
        }}
      >
        SKIP OR PICK — IT'S YOUR CALL
      </p>
    </motion.div>
  )
}
