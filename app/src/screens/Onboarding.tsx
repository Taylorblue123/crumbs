import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'


interface Props {
  onFileSelected: (file: File) => void
}

const EXAMPLES = [
  {
    type: 'ENFP',
    bg: 'var(--color-crumbs-yellow)',
    roast: 'Main character energy with side character follow-through.',
    thought: 'I almost texted back but then I got inspired',
  },
  {
    type: 'INTJ',
    bg: 'var(--color-crumbs-pink)',
    roast: 'Overthinks ordering coffee, underthinks life decisions.',
    thought: 'Why does nobody read the docs I wrote',
  },
  {
    type: 'ESFP',
    bg: 'var(--color-crumbs-yellow)',
    roast: 'You gaslight yourself into productivity every Sunday night.',
    thought: 'This week is gonna be different I can feel it',
  },
]

const STEPS = [
  { num: '01', title: 'OPEN YOUR CHATS', desc: 'WeChat, Telegram, Notes — wherever you talk to yourself', you: true },
  { num: '02', title: 'SCREEN-RECORD', desc: 'Hit record, scroll through your messages for 15s', you: true },
  { num: '03', title: 'UPLOAD', desc: 'AI reads your crumbs', you: false },
  { num: '04', title: 'GET ROASTED', desc: 'Personality video, ready to share', you: false },
]

export function Onboarding({ onFileSelected }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [page, setPage] = useState<'hook' | 'how'>('hook')
  const [exampleIndex, setExampleIndex] = useState(0)

  useEffect(() => {
    if (page !== 'hook') return
    const timer = setInterval(() => {
      setExampleIndex((i) => (i + 1) % EXAMPLES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [page])

  const [count, setCount] = useState(0)
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE ?? '/api'}/stats`)
      .then(r => r.json())
      .then(d => setCount(3000 + Math.floor(Math.random() * 800) + (d.count || 0)))
      .catch(() => {})
  }, [])
  const current = EXAMPLES[exampleIndex]

  return (
    <AnimatePresence mode="wait">
      {page === 'hook' ? (
        <motion.div
          key="hook"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="relative flex h-full w-full flex-col overflow-hidden bg-crumbs-ink"
        >
          {/* Wordmark — absolute top-left, overlays card */}
          <motion.div
            className="absolute left-6 top-8 z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0, duration: 0.3 }}
          >
            <h1
              className="text-crumbs-yellow"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '28px',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                textShadow: '0 2px 8px rgba(10,15,61,0.3)',
              }}
            >
              CRUMBS
            </h1>
          </motion.div>

          {/* Full-bleed card area — Tinder style */}
          <motion.div
            className="relative mx-4 mt-5 mb-4 flex-1 min-h-0"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, type: 'spring', stiffness: 200, damping: 22 }}
          >
            {/* Ghost cards */}
            {[16, 8].map((offset, i) => (
              <div
                key={offset}
                className="absolute inset-x-0 top-0 bottom-0 rounded-3xl"
                style={{
                  backgroundColor: i === 0
                    ? 'var(--color-crumbs-yellow)'
                    : 'var(--color-crumbs-pink)',
                  opacity: i === 0 ? 0.06 : 0.12,
                  transform: `translateY(${offset}px) scale(${1 - (2 - i) * 0.02})`,
                }}
              />
            ))}

            {/* Active card — matches ScreenCard design */}
            <AnimatePresence mode="wait">
              <motion.div
                key={exampleIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex flex-col overflow-hidden rounded-3xl"
                style={{ backgroundColor: current.bg }}
              >
                {/* Upper — avatar fills background */}
                <div className="relative flex-1 overflow-hidden">
                  <img
                    src={`/avatars/${current.type.toLowerCase()}.png`}
                    alt={current.type}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  {/* Gradient overlay for text readability */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(to bottom, transparent 40%, ${current.bg} 100%)`,
                    }}
                  />
                </div>

                {/* Lower — text panel */}
                <div
                  className="px-5 py-4"
                  style={{ backgroundColor: 'var(--color-crumbs-ink)' }}
                >
                  {/* MBTI type */}
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
                    {current.type}
                  </h2>

                  {/* Roast line */}
                  <p
                    className="mt-2 text-center text-crumbs-pink"
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: 'clamp(13px, 3.5vw, 16px)',
                      lineHeight: 1.4,
                    }}
                  >
                    {current.roast}
                  </p>

                  {/* Divider */}
                  <div
                    className="mx-auto my-2"
                    style={{
                      width: '30px',
                      height: '1px',
                      backgroundColor: 'var(--color-crumbs-yellow)',
                      opacity: 0.2,
                    }}
                  />

                  {/* Thought gem */}
                  <p
                    className="text-center text-crumbs-pink"
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '9px',
                      fontWeight: 500,
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase' as const,
                    }}
                  >
                    you literally said:
                  </p>
                  <p
                    className="mt-1 text-center text-crumbs-yellow"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: 'clamp(12px, 3.5vw, 15px)',
                      fontStyle: 'italic',
                      fontWeight: 400,
                      lineHeight: 1.3,
                    }}
                  >
                    "{current.thought}"
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Bottom bar — counter + CTA */}
          <motion.div
            className="px-5 pb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.3 }}
          >
            <p
              className="mb-3 text-center text-crumbs-pink"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.08em',
              }}
            >
              ✦ {count.toLocaleString()} crumbs dropped today
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.12 }}
              onClick={() => setPage('how')}
              className="w-full cursor-pointer rounded-full bg-crumbs-pink py-4 text-crumbs-ink"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              DROP YOUR CRUMBS
            </motion.button>
          </motion.div>
        </motion.div>
      ) : (
        /* Page 2: How it works */
        <motion.div
          key="how"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="flex h-full w-full flex-col overflow-hidden bg-crumbs-pink"
        >
          {/* Title area */}
          <motion.div
            className="px-6 pt-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0, duration: 0.3 }}
          >
            <h2
              className="text-crumbs-ink"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(24px, 7vw, 34px)',
                fontStyle: 'italic',
                fontWeight: 400,
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
              }}
            >
              Your texts reveal who you really are.{' '}
              <span className="text-crumbs-yellow">We turn them into your roast.</span>
            </h2>
          </motion.div>

          {/* Full-bleed steps card */}
          <div className="relative mx-4 mt-5 mb-4 flex-1 min-h-0">
            <motion.div
              className="absolute inset-0 flex flex-col overflow-hidden overflow-y-auto rounded-3xl bg-crumbs-ink p-5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 22 }}
            >
              {/* Section label: YOU */}
              <motion.p
                className="text-crumbs-pink mb-3"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase' as const,
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.3 }}
              >
                YOU DO THIS
              </motion.p>

              {/* Steps 1-2 */}
              {STEPS.filter(s => s.you).map((step, i) => (
                <motion.div
                  key={step.num}
                  className="mb-4"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.2 + i * 0.1,
                    type: 'spring',
                    stiffness: 260,
                    damping: 24,
                  }}
                >
                  <div className="flex items-baseline gap-2.5">
                    <span
                      className="text-crumbs-yellow"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(26px, 7vw, 34px)',
                        fontWeight: 900,
                        letterSpacing: '-0.03em',
                        lineHeight: 1,
                      }}
                    >
                      {step.num}
                    </span>
                    <span
                      className="text-crumbs-yellow"
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '14px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase' as const,
                      }}
                    >
                      {step.title}
                    </span>
                  </div>
                  <p
                    className="mt-1 text-crumbs-yellow"
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '13px',
                      opacity: 0.5,
                      lineHeight: 1.45,
                      paddingLeft: 'clamp(34px, 9vw, 42px)',
                    }}
                  >
                    {step.desc}
                  </p>
                </motion.div>
              ))}

              {/* Divider */}
              <motion.div
                className="my-2 flex items-center gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                <div className="flex-1" style={{ height: '1px', backgroundColor: 'var(--color-crumbs-yellow)', opacity: 0.12 }} />
                <span
                  className="text-crumbs-pink"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase' as const,
                  }}
                >
                  WE DO THE REST
                </span>
                <div className="flex-1" style={{ height: '1px', backgroundColor: 'var(--color-crumbs-yellow)', opacity: 0.12 }} />
              </motion.div>

              {/* Steps 3-4 */}
              {STEPS.filter(s => !s.you).map((step, i) => (
                <motion.div
                  key={step.num}
                  className="mt-3"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.45 + i * 0.1,
                    type: 'spring',
                    stiffness: 260,
                    damping: 24,
                  }}
                >
                  <div className="flex items-baseline gap-2.5">
                    <span
                      className="text-crumbs-yellow"
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(26px, 7vw, 34px)',
                        fontWeight: 900,
                        letterSpacing: '-0.03em',
                        lineHeight: 1,
                        opacity: 0.4,
                      }}
                    >
                      {step.num}
                    </span>
                    <span
                      className="text-crumbs-yellow"
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontSize: '14px',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase' as const,
                        opacity: 0.6,
                      }}
                    >
                      {step.title}
                    </span>
                  </div>
                  <p
                    className="mt-1 text-crumbs-yellow"
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '13px',
                      opacity: 0.35,
                      lineHeight: 1.45,
                      paddingLeft: 'clamp(34px, 9vw, 42px)',
                    }}
                  >
                    {step.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Bottom bar */}
          <div className="px-5 pb-8">
            <motion.button
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.12 }}
              onClick={() => inputRef.current?.click()}
              className="w-full cursor-pointer rounded-full bg-crumbs-yellow py-4 text-crumbs-ink"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                fontWeight: 700,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
              }}
            >
              UPLOAD & GET ROASTED →
            </motion.button>
            <p
              className="mt-2 text-center text-crumbs-ink"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                opacity: 0.45,
              }}
            >
              it only takes 15 seconds
            </p>
            <input
              ref={inputRef}
              type="file"
              accept="video/*,image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onFileSelected(file)
              }}
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.12 }}
              onClick={() => setPage('hook')}
              className="mt-3 w-full cursor-pointer text-center text-crumbs-ink"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '13px',
                fontWeight: 500,
                letterSpacing: '0.08em',
                background: 'none',
                border: 'none',
                opacity: 0.5,
              }}
            >
              ← back
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
