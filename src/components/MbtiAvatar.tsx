interface MbtiAvatarProps {
  type: string
  size: number
  className?: string
  style?: React.CSSProperties
}

export function MbtiAvatar({ type, size, className = '', style }: MbtiAvatarProps) {
  return (
    <img
      src={`/avatars/${type.toLowerCase()}.png`}
      alt={type}
      width={size}
      height={size}
      className={`pointer-events-none select-none ${className}`}
      style={{ objectFit: 'contain', ...style }}
      draggable={false}
    />
  )
}
