import { useRef } from 'react'
import { motion } from 'framer-motion'
import { MbtiAvatar } from '../components/MbtiAvatar'

interface Props {
  onFileSelected: (file: File) => void
}

export function Onboarding({ onFileSelected }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="relative flex h-full w-full flex-col overflow-hidden bg-crumbs-ink"
    >
      {/* Wordmark */}
      <div className="px-6 pt-8">
        <h1
          className="text-crumbs-yellow"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '32px',
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
        >
          CRUMBS
        </h1>
      </div>

      {/* Slogan */}
      <div className="flex flex-1 flex-col justify-center px-6">
        <h2
          className="text-crumbs-yellow"
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(40px, 12vw, 56px)',
            fontStyle: 'italic',
            fontWeight: 400,
            lineHeight: 0.95,
            letterSpacing: '-0.02em',
          }}
        >
          Meet the you
          <br />
          you forgot.
        </h2>
        <p
          className="mt-4 text-crumbs-pink"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
          }}
        >
          15 seconds of you. A lifetime of personality crumbs.
        </p>
      </div>

      {/* CTA */}
      <div className="px-6 pb-10">
        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.12 }}
          onClick={() => inputRef.current?.click()}
          className="w-full cursor-pointer rounded-full bg-crumbs-pink py-4 text-crumbs-ink"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          UPLOAD YOUR 15s ↗
        </motion.button>
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
      </div>

      {/* INFP teaser avatar */}
      <div className="pointer-events-none absolute bottom-0 right-[-24px]">
        <MbtiAvatar
          type="INFP"
          size={200}
          style={{ transform: 'rotate(-8deg)' }}
        />
      </div>
    </motion.div>
  )
}
