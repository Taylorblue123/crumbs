import { useState } from 'react'

interface MbtiAvatarProps {
  type: string
  size: number
  className?: string
  style?: React.CSSProperties
}

export function MbtiAvatar({ type, size, className = '', style }: MbtiAvatarProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    // Fallback: styled text badge
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-crumbs-yellow text-crumbs-ink ${className}`}
        style={{
          width: size,
          height: size,
          fontFamily: 'var(--font-display)',
          fontSize: size * 0.28,
          fontWeight: 900,
          letterSpacing: '-0.02em',
          ...style,
        }}
      >
        {type}
      </div>
    )
  }

  return (
    <img
      src={`/avatars/${type.toLowerCase()}.png`}
      alt={type}
      width={size}
      height={size}
      className={`pointer-events-none select-none ${className}`}
      style={{ objectFit: 'contain', ...style }}
      draggable={false}
      onError={() => setFailed(true)}
    />
  )
}
