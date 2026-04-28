import { useState, useCallback, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface CardStyle {
  bg: string
  text: string
  accent: string
}

export const CARD_STYLES: CardStyle[] = [
  {
    bg: 'var(--color-crumbs-yellow)',
    text: 'var(--color-crumbs-ink)',
    accent: 'var(--color-crumbs-pink)',
  },
  {
    bg: 'var(--color-crumbs-pink)',
    text: 'var(--color-crumbs-ink)',
    accent: 'var(--color-crumbs-yellow)',
  },
  {
    bg: 'var(--color-crumbs-yellow)',
    text: 'var(--color-crumbs-pink)',
    accent: 'var(--color-crumbs-ink)',
  },
]

const STACK_OFFSET_Y = 10
const STACK_OFFSET_SCALE = 0.025

interface Props {
  title: string
  onBack?: () => void
  footerHint?: string
  /** deckSize is the current number of remaining cards (decrements as user skips) */
  renderCard: (index: number, style: CardStyle, isTop: boolean, deckSize: number) => ReactNode
  onPick: (index: number) => void
}

export function CardStack({ title, onBack, footerHint = "SKIP OR PICK — IT'S YOUR CALL", renderCard, onPick }: Props) {
  const [deck, setDeck] = useState<number[]>([0, 1, 2])

  const topIndex = deck[0]
  const topStyle = CARD_STYLES[topIndex]

  const handleSkip = useCallback(() => {
    setDeck((prev) => {
      const next = prev.filter((i) => i !== prev[0])
      return next.length === 0 ? [0, 1, 2] : next
    })
  }, [])

  const handlePick = useCallback(() => {
    onPick(topIndex)
  }, [onPick, topIndex])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="flex h-full w-full flex-col bg-crumbs-ink px-4 pt-6 pb-6"
    >
      {/* Header row */}
      <div className="flex items-center justify-between px-1 mb-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={onBack}
              className="cursor-pointer text-crumbs-yellow"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                fontWeight: 700,
                background: 'none',
                border: 'none',
              }}
            >
              ←
            </motion.button>
          )}
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
            {title}
          </p>
        </div>
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
            const isTop = stackIndex === 0
            const style = CARD_STYLES[originalIndex]

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
                {renderCard(originalIndex, style, isTop, deck.length)}
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
        {footerHint}
      </p>
    </motion.div>
  )
}
