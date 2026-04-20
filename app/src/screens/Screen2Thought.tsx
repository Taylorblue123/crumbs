import type { UploadResponse, PickedMbti } from '../api/types'
import { CardStack, type CardStyle } from '../components/CardStack'

interface Props {
  options: UploadResponse
  picked: PickedMbti
  onPick: (thought: string) => void
  onBack: () => void
}

export function Screen2Thought({ options, picked, onPick, onBack }: Props) {
  return (
    <CardStack
      title="PICK YOUR CRUMB"
      onBack={onBack}
      footerHint="SKIP OR PICK YOUR CRUMB"
      onPick={(index) => onPick(options.thoughts[index])}
      renderCard={(originalIndex: number, style: CardStyle, isTop: boolean, deckSize: number) => (
        <div
          className="relative flex h-full flex-col justify-between overflow-hidden rounded-3xl p-6"
          style={{ backgroundColor: style.bg }}
        >
          {/* Top — MBTI badge + card indicator */}
          <div className="flex items-start justify-between">
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.15em',
                textTransform: 'uppercase' as const,
                color: style.accent,
              }}
            >
              {picked.mbti}
            </span>
            {isTop && (
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '11px',
                  fontWeight: 500,
                  letterSpacing: '0.15em',
                  color: style.text,
                  opacity: 0.4,
                }}
              >
                1 / {deckSize}
              </span>
            )}
          </div>

          {/* Center — thought quote, hero text */}
          <div className="flex-1 flex items-center justify-center py-8">
            <p
              className="text-center"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(22px, 6vw, 32px)',
                fontStyle: 'italic',
                fontWeight: 400,
                color: style.text,
                lineHeight: 1.35,
                letterSpacing: '-0.02em',
              }}
            >
              "{options.thoughts[originalIndex]}"
            </p>
          </div>

          {/* Bottom label */}
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              color: style.text,
              opacity: 0.35,
              textAlign: 'center',
            }}
          >
            YOUR THOUGHT CRUMB
          </p>
        </div>
      )}
    />
  )
}
