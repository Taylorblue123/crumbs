import { motion } from 'framer-motion'

interface Props {
  videoUrl: string
  onClose: () => void
  onDone: () => void
}

export function Screen4Share({ videoUrl, onClose, onDone }: Props) {
  const handleSaveVideo = async () => {
    const a = document.createElement('a')
    a.href = videoUrl
    a.download = 'crumbs-roast.mp4'
    a.click()
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
    } catch {
      // fallback: do nothing
    }
  }

  const handleWebShare = async () => {
    try {
      const res = await fetch(videoUrl)
      const blob = await res.blob()
      const file = new File([blob], 'crumbs-roast.mp4', { type: 'video/mp4' })

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My Crumbs Roast' })
      } else {
        // Fallback: just share URL
        await navigator.share({ title: 'My Crumbs Roast', url: window.location.href })
      }
    } catch {
      // User cancelled or not supported
    }
  }

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
      className="absolute inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl bg-crumbs-pink px-6 pb-8 pt-6"
      style={{ maxHeight: '70vh' }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute right-5 top-5 cursor-pointer text-crumbs-ink"
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '20px',
          fontWeight: 700,
          background: 'none',
          border: 'none',
          lineHeight: 1,
        }}
      >
        ✕
      </button>

      {/* Header */}
      <h2
        className="mb-6 text-crumbs-ink"
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: '32px',
          fontWeight: 700,
          letterSpacing: '-0.02em',
        }}
      >
        SHARE YOUR
        <br />
        CRUMBS
      </h2>

      {/* Buttons */}
      <div className="flex flex-col gap-3">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSaveVideo}
          className="w-full cursor-pointer rounded-full bg-crumbs-ink py-4 text-crumbs-yellow"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          SAVE VIDEO
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleCopyLink}
          className="w-full cursor-pointer rounded-full bg-crumbs-ink py-4 text-crumbs-yellow"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          COPY LINK
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleWebShare}
          className="w-full cursor-pointer rounded-full border-2 border-crumbs-ink bg-transparent py-4 text-crumbs-ink"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          MORE OPTIONS
        </motion.button>
      </div>

      {/* Done */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onDone}
        className="mt-6 w-full cursor-pointer text-center text-crumbs-ink"
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          fontWeight: 700,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          background: 'none',
          border: 'none',
        }}
      >
        DONE
      </motion.button>
    </motion.div>
  )
}
