import type { UploadResponse } from '../api/types'
import { CardStack, type CardStyle } from '../components/CardStack'

interface Props {
  options: UploadResponse
  onPick: (index: number) => void
}

export function Screen1Mbti({ options, onPick }: Props) {
  return (
    <CardStack
      title="WHO ARE YOU TODAY"
      onPick={onPick}
      renderCard={(originalIndex: number, style: CardStyle, isTop: boolean, deckSize: number) => (
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
                1 / {deckSize}
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
      )}
    />
  )
}
