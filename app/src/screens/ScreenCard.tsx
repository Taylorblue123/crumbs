import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MbtiAvatar } from '../components/MbtiAvatar'
import type { PickedFull } from '../api/types'


interface Props {
  picked: PickedFull
  totemUrl?: string
  onWantVideo: () => void
  onStartOver: () => void
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Draws word-wrapped text centred at x, starting at y. Returns the new y after the last line. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
): number {
  const words = text.split(' ')
  let line = ''
  for (const word of words) {
    const test = line + (line ? ' ' : '') + word
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y)
      line = word
      y += lineHeight
    } else {
      line = test
    }
  }
  if (line) ctx.fillText(line, x, y)
  return y
}

async function drawTotemLayer(ctx: CanvasRenderingContext2D, W: number, H: number, totemUrl: string) {
  try {
    const totem = await loadImage(totemUrl)
    const scale = W / totem.width
    const drawH = Math.min(totem.height * scale, H * 0.65)
    ctx.drawImage(totem, 0, 0, totem.width, drawH / scale, 0, 0, W, drawH)
  } catch { /* skip totem */ }
}

function drawTextPanel(ctx: CanvasRenderingContext2D, W: number, H: number, picked: PickedFull) {
  const panelY = H * 0.58
  ctx.fillStyle = '#0A0F3D'
  ctx.fillRect(0, panelY, W, H - panelY)

  // MBTI type
  ctx.fillStyle = '#FFE14D'
  ctx.font = '900 110px "Fraunces", Georgia, serif'
  ctx.textAlign = 'center'
  ctx.fillText(picked.mbti, W / 2, panelY + 95)

  let y = panelY + 130
  if (picked.typeLabel) {
    ctx.fillStyle = '#FF2E63'
    ctx.font = '600 18px "Space Grotesk", system-ui, sans-serif'
    ctx.fillText(picked.typeLabel.toUpperCase(), W / 2, y)
    y += 40
  } else {
    y += 20
  }

  // Roast line
  ctx.fillStyle = '#FFE14D'
  ctx.font = '400 26px "Space Grotesk", system-ui, sans-serif'
  const roast = picked.roastLine || picked.description.split('.')[0] + '.'
  y = wrapText(ctx, roast, W / 2, y, W - 160, 36)

  // Divider
  y += 30
  ctx.strokeStyle = '#FFE14D'
  ctx.globalAlpha = 0.15
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(W / 2 - 40, y)
  ctx.lineTo(W / 2 + 40, y)
  ctx.stroke()
  ctx.globalAlpha = 1

  // "you said this to yourself:"
  y += 25
  ctx.fillStyle = '#FF2E63'
  ctx.font = '500 15px "Space Grotesk", system-ui, sans-serif'
  ctx.fillText('you said this to yourself:', W / 2, y)

  // Thought gem
  y += 32
  ctx.fillStyle = '#FFE14D'
  ctx.font = 'italic 400 24px "Fraunces", Georgia, serif'
  wrapText(ctx, `"${picked.thought}"`, W / 2, y, W - 180, 34)
}

async function drawBranding(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const brandY = H - 80
  ctx.fillStyle = '#FFE14D'
  ctx.globalAlpha = 0.08
  ctx.fillRect(0, brandY, W, 80)
  ctx.globalAlpha = 1

  ctx.fillStyle = '#FFE14D'
  ctx.textAlign = 'left'
  ctx.font = '700 24px "Fraunces", Georgia, serif'
  ctx.fillText('CRUMBS', 40, brandY + 32)
  ctx.font = '400 14px "Space Grotesk", system-ui, sans-serif'
  ctx.globalAlpha = 0.5
  ctx.fillText('get your personality roasted', 40, brandY + 54)
  ctx.globalAlpha = 1

  ctx.textAlign = 'right'
  ctx.font = '500 14px "Space Grotesk", system-ui, sans-serif'
  ctx.globalAlpha = 0.6
  ctx.fillText('scan to try', W - 85, brandY + 28)
  ctx.globalAlpha = 1

  try {
    const qrImg = await loadImage('/qr-crumbs.png')
    ctx.drawImage(qrImg, W - 56 - 25, brandY + 10, 56, 56)
  } catch { /* skip QR */ }

  ctx.textAlign = 'center'
}

async function renderCardToBlob(
  picked: PickedFull,
  totemUrl?: string,
): Promise<Blob> {
  const W = 1080
  const H = 1080
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Background — cream parchment
  ctx.fillStyle = '#FFF8E7'
  ctx.fillRect(0, 0, W, H)

  if (totemUrl) await drawTotemLayer(ctx, W, H, totemUrl)
  drawTextPanel(ctx, W, H, picked)
  await drawBranding(ctx, W, H)

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png')
  })
}

export function ScreenCard({ picked, totemUrl, onWantVideo, onStartOver }: Props) {
  const [showShareSheet, setShowShareSheet] = useState(false)
  const roast = picked.roastLine || picked.description.split('.')[0] + '.'

  const handleShare = useCallback(async () => {
    try {
      const blob = await renderCardToBlob(picked, totemUrl)
      const file = new File([blob], 'crumbs-card.png', { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `I'm a ${picked.mbti} — CRUMBS`,
          text: 'Get your personality roasted → crumbs-production.up.railway.app',
        })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'crumbs-card.png'
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch { /* cancelled */ }
  }, [picked, totemUrl])

  const handleSave = useCallback(async () => {
    const blob = await renderCardToBlob(picked, totemUrl)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'crumbs-card.png'
    a.click()
    URL.revokeObjectURL(url)
  }, [picked, totemUrl])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="flex h-full w-full flex-col bg-crumbs-ink"
    >
      {/* Card preview — visual area */}
      <div className="flex flex-1 flex-col items-center overflow-hidden">
        {/* Upper: Totem + Avatar */}
        <div className="relative w-full flex-1 min-h-0 overflow-hidden" style={{ backgroundColor: '#FFF8E7' }}>
          {/* Totem or avatar fallback */}
          {totemUrl ? (
            <motion.img
              src={totemUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 3, ease: 'easeInOut', repeat: Infinity }}
              >
                <MbtiAvatar type={picked.mbti} size={180} />
              </motion.div>
            </div>
          )}
        </div>

        {/* Lower: Text panel */}
        <div className="w-full bg-crumbs-ink px-6 py-5">
          {/* MBTI */}
          <motion.h1
            className="text-center text-crumbs-yellow"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(60px, 18vw, 90px)',
              fontWeight: 900,
              letterSpacing: '-0.04em',
              lineHeight: 0.9,
            }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 20 }}
          >
            {picked.mbti}
          </motion.h1>

          {/* Type label */}
          {picked.typeLabel && (
            <motion.p
              className="mt-2 text-center"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {picked.typeLabel}
            </motion.p>
          )}

          {/* Roast line */}
          <motion.p
            className="mt-3 text-center text-crumbs-yellow"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(16px, 4.5vw, 20px)',
              fontStyle: 'italic',
              fontWeight: 400,
              lineHeight: 1.35,
              letterSpacing: '-0.01em',
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.3 }}
          >
            {roast}
          </motion.p>

          {/* Divider */}
          <div
            className="mx-auto my-4"
            style={{
              width: '40px',
              height: '1px',
              backgroundColor: 'rgba(255,255,255,0.15)',
            }}
          />

          {/* Thought gem */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.3 }}
          >
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '10px',
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.35)',
              }}
            >
              you said this to yourself:
            </p>
            <p
              className="mt-2"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(15px, 4vw, 19px)',
                fontStyle: 'italic',
                fontWeight: 400,
                lineHeight: 1.35,
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              "{picked.thought}"
            </p>
          </motion.div>
        </div>
      </div>

      {/* Bottom actions */}
      <div className="px-5 pb-6 pt-2 bg-crumbs-ink">
        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.12 }}
          onClick={() => setShowShareSheet(true)}
          className="w-full cursor-pointer rounded-full bg-crumbs-pink py-4 text-crumbs-ink"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}
        >
          SHARE YOUR CRUMBS
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.97 }}
          transition={{ duration: 0.12 }}
          onClick={onStartOver}
          className="mt-3 w-full cursor-pointer text-center text-crumbs-yellow"
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '12px',
            fontWeight: 500,
            letterSpacing: '0.08em',
            background: 'none',
            border: 'none',
            opacity: 0.35,
          }}
        >
          START OVER
        </motion.button>
      </div>

      {/* Share sheet overlay */}
      <AnimatePresence>
        {showShareSheet && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-x-0 bottom-0 z-50 flex flex-col rounded-t-3xl bg-crumbs-pink px-6 pb-8 pt-6"
            style={{ maxHeight: '70vh' }}
          >
            {/* Close */}
            <button
              onClick={() => setShowShareSheet(false)}
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
              className="mb-5 text-crumbs-ink"
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

            <div className="flex flex-col gap-2.5">
              {/* Share card (Web Share API) */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleShare}
                className="w-full cursor-pointer rounded-full bg-crumbs-ink py-4 text-crumbs-yellow"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                }}
              >
                SHARE CARD
              </motion.button>

              {/* Save to photos — primary path for Instagram/WeChat */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { handleSave(); setShowShareSheet(false); }}
                className="w-full cursor-pointer rounded-full bg-crumbs-ink py-4 text-crumbs-yellow"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  fontWeight: 700,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                }}
              >
                SAVE TO PHOTOS
              </motion.button>
              <p
                className="text-center text-crumbs-ink"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '11px',
                  opacity: 0.45,
                  marginTop: '4px',
                }}
              >
                then post it to your story or moments
              </p>

              {/* Copy link */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText('Get your personality roasted → crumbs-production.up.railway.app')
                  } catch {}
                }}
                className="w-full cursor-pointer rounded-full border-2 border-crumbs-ink bg-transparent py-4 text-crumbs-ink"
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
            </div>

            {/* Video easter egg — visible but secondary */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { setShowShareSheet(false); onWantVideo(); }}
              className="mt-4 w-full cursor-pointer rounded-2xl py-3 px-4"
              style={{
                background: 'rgba(10,15,61,0.08)',
                border: 'none',
              }}
            >
              <p
                className="text-crumbs-ink"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '14px',
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                }}
              >
                ✦ Want it as a video?
              </p>
              <p
                className="text-crumbs-ink"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '11px',
                  opacity: 0.5,
                  marginTop: '2px',
                }}
              >
                AI generates a 15s roast video · takes ~2 min
              </p>
            </motion.button>

            {/* Brand */}
            <p
              className="mt-3 text-center text-crumbs-ink"
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                opacity: 0.35,
              }}
            >
              crumbs.app
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
