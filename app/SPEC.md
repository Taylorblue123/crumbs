# Crumbs — Demo SPEC

> 1-hour sprint demo. Mobile-first web app. Frontend + mock backend, swappable to real backend via env flag.

---

## 1. Product

A playful self-discovery app. User uploads a 15-second video of themselves; backend analyzes it via ffmpeg + vision model + LLM, returns 3 candidate MBTI types with descriptions and 3 "thought gems" (金句). User picks one MBTI + one thought, backend generates a short roast-style avatar video, user shares.

**Tone**: Gen Z, creative-worker-coded, self-aware and a little self-roasting. Playful but insightful, never corporate.

**Slogan (placeholder)**: `Meet the you you forgot.`

---

## 2. User Flow (linear, no router needed)

```
[Onboarding] → [Upload] → [Transition] → [Screen 1: Pick MBTI]
    → [Screen 2: Pick Thought] → [Transition 2] → [Screen 3: Video] → [Screen 4: Share]
```

Each screen is a step in a single `useState<Step>` state machine. No React Router. Back button = decrement step.

---

## 3. Screens

### 3.1 Onboarding

- **Background**: `--crumbs-ink`
- Top-left: "CRUMBS" wordmark in Fraunces 32pt, `--crumbs-yellow`
- Center-left: slogan "Meet the you / you forgot." in Fraunces 56pt italic, `--crumbs-yellow`, line-height 0.95
- Below slogan: one-line value prop in Space Grotesk 14pt, `--crumbs-pink`
- Bottom: CTA pill — `--crumbs-pink` bg, `--crumbs-ink` text, Space Grotesk uppercase 14pt. Text: "UPLOAD YOUR 15s ↗"
- Bottom-right: INFP teaser avatar, rotated -8°, size 200px, bleeds off edge
- CTA opens `<input type="file" accept="video/*" capture="user">`

### 3.2 Transition 1 (Upload + Analysis)

- **Background**: `--crumbs-pink`
- Center: avatar cycling (240px) on `--crumbs-yellow` solid disc (280px diameter). Cycles random types every 400ms.
- Below avatar: rotating copy in Fraunces 48pt, `--crumbs-yellow`, cycle every 2.5s:
  - "READING YOUR VIBES" / "CONSULTING MBTI GODS" / "EXTRACTING CRUMBS" / "DECODING YOUR CHAOS"
- Bottom: 4px progress bar — `--crumbs-ink` filled, `--crumbs-yellow` 20% opacity unfilled. NO percentage text.
- Substates: `uploading` (bar moves) / `analyzing` (bar full, copy keeps cycling) / `error` (retry)
- Duration: 10-30s. Stays until `POST /upload` resolves.

### 3.3 Screen 1: MBTI Cards

- **Background**: `--crumbs-ink`
- Top eyebrow: "WHO ARE YOU TODAY" in Space Grotesk uppercase 11pt, `--crumbs-pink`
- Three cards stacked vertically, 12px gap
  - Card 1: `--crumbs-yellow` bg, `--crumbs-ink` text
  - Card 2: `--crumbs-pink` bg, `--crumbs-ink` text, `--crumbs-yellow` accents
  - Card 3: `--crumbs-yellow` bg, `--crumbs-pink` text
- Each card: 96pt MBTI letters (Fraunces bold) left, avatar 100px top-right rotated, description Space Grotesk 13pt below, max 2 lines
- Tap card → hard cut to Screen 2
- No swipe logic in demo

### 3.4 Screen 2: Thought Cards

- Same 3-card layout and color rotation as Screen 1
- Thought text in Fraunces italic 22pt — thought IS the hero, not display numbers
- Small MBTI eyebrow at top of each card (Space Grotesk uppercase, picked type)
- Back button available

### 3.5 Transition 2 (Video Generation)

- **Background**: `--crumbs-yellow`
- Center: picked MBTI avatar, 240px, floating animation (y ±8px, 3s loop)
- Rotating copy in Fraunces 48pt, `--crumbs-ink`, cycle every 3s:
  - "TEACHING YOUR AVATAR SARCASM" / "BRIBING THE LLM" / "WRITING YOUR ROAST" / "WARMING UP THE MIC" / "ALMOST THERE WE PROMISE"
- No progress bar (no progress signal from backend)
- Duration: 30-60s. Loading UX must be charming.

### 3.6 Screen 3: Video Playback

- **Background**: `--crumbs-ink`
- Top eyebrow: "YOUR ROAST" in Space Grotesk uppercase 11pt, `--crumbs-pink`
- `<video autoPlay loop muted playsInline>` — full width minus 24px padding, rounded 16px
- Below video, two buttons side by side:
  - Primary: "SHARE ↗" pill, `--crumbs-pink` bg, `--crumbs-ink` text
  - Secondary: "START OVER" ghost, `--crumbs-yellow` 2px border + text
- Bottom-right: picked avatar 64px as branding beat

### 3.7 Screen 4: Share

- Modal/sheet slides up over Screen 3 (video still visible behind)
- **Background**: `--crumbs-pink` sheet
- "SHARE YOUR CRUMBS" header in Fraunces 32pt, `--crumbs-ink`
- Three stacked buttons: "Save video", "Copy link", "More options (Web Share API)"
- Close X top-right
- Web Share API first (`navigator.share({ files: [videoBlob] })`), fallback to download + copy-link
- "Done" → back to Onboarding

---

## 4. API Contract

Base URL from `import.meta.env.VITE_API_BASE`. Default `/api` (proxied by Vite in dev).

### 4.1 `POST /upload` — multipart/form-data

**Request**: field `video`, MIME `video/*`, max 50MB
**Response 200**:

```ts
{
  mbti: [string, string, string],          // e.g. ["INTJ", "ENFP", "ISTP"]
  description: [string, string, string],   // parallel array, same index
  thoughts: [string, string, string]       // 3 extracted 金句
}
```

**Errors**: 413 (too large), 415 (wrong format), 500 (analysis failed)
**Latency**: 10-30s expected

### 4.2 `GET /generate` — synchronous video

**Query params**: `mbti`, `description`, `thought` (all URL-encoded strings)
**Response 200**: `video/mp4` binary, directly usable as `<video src={URL.createObjectURL(blob)}>`
**Latency**: 30-60s (⚠️ blocking HTTP — frontend uses `fetch` with `AbortSignal.timeout(120_000)`)

---

## 5. State Machine

```ts
type Step =
  | { kind: "onboarding" }
  | {
      kind: "transition1";
      phase: "uploading" | "analyzing";
      uploadPct?: number;
    }
  | { kind: "mbti"; options: UploadResponse }
  | {
      kind: "thought";
      options: UploadResponse;
      picked: { mbti: string; description: string };
    }
  | { kind: "transition2"; picked: PickedMbti & { thought: string } }
  | { kind: "video"; videoUrl: string; picked: PickedFull }
  | { kind: "share"; videoUrl: string }
  | { kind: "error"; message: string; retryTo: Step["kind"] };
```

---

## 6. Visual Direction

**Aesthetic**: _Spotify Wrapped 2024 × MBTI roast card._ High-voltage pop, not warm/editorial. Hard, punchy, bold.

### Palette — exactly three colors, no others

- `--crumbs-pink: #FF2E63` (hot pink)
- `--crumbs-yellow: #FFE14D` (canary yellow)
- `--crumbs-ink: #0A0F3D` (near-black indigo)

**Color rules:**
- Every screen has ONE of these three as full-bleed background. No off-white, no gradients, no neutrals.
- Text and accent elements use the OTHER two colors. Always high contrast.
- Each MBTI card in Screen 1 gets a different bg color from the trio — rotate through.
- Transitions between screens are HARD CUTS. Background color jumps.

### Typography

- **Display**: `"Fraunces", Georgia, serif` — used huge (60–120pt) for MBTI letters and 金句 lead-ins. Letter-spacing -0.02em.
- **Body**: `"Space Grotesk", system-ui, sans-serif` — descriptions and micro-copy.
- **Labels/eyebrows**: Space Grotesk uppercase, letter-spacing 0.15em, 11px.
- **Never use Inter.**

### Type-as-form principle

- MBTI four letters (e.g., "INTJ") rendered at 96pt+ in Fraunces, taking up half the card.
- On Transition screens, rotating copy rendered full-width across viewport.
- Numbers and short words are graphic elements, not just text.

### MBTI Avatar Integration

16 PNG files in `public/avatars/{type}.png` (lowercase: `intj.png`, `enfp.png`, etc.). Local demo only — add `public/avatars/` to `.gitignore`.

**`<MbtiAvatar type="INTJ" size={120} />`** — shared component, renders `<img src="/avatars/{type.toLowerCase()}.png" />`.

Where avatars appear:
- **Onboarding**: INFP teaser, bottom-right, rotated -8°, size 200px, bleeds off edge.
- **Transition 1**: center, 240px, on yellow disc (280px). Cycles through random avatars every 400ms.
- **Transition 2**: center, 240px, floating. Shows the picked MBTI's avatar.
- **Screen 1 cards**: top-right of each card, 100px, rotated (-4°/+4°/-4°).
- **Screen 3**: small 64px avatar next to "Start over" button.

### Motion Rules

- **Screen transitions**: 180ms cross-fade on container, background color is HARD CUT. AnimatePresence `mode="wait"`.
- **Avatar float**: `y: [-8, 8, -8]`, 3s, easeInOut, infinite.
- **Rotating copy**: Motion swap with y slide (`y: 20 → 0`) + opacity.
- **Card tap**: scale 0.97 on press, 1.0 on release, 120ms.
- **No scroll animations. No parallax. No shimmer effects.**

---

## 7. Copy — Rotating Strings

**Transition 1 (cycle every 2.5s):**
- "READING YOUR VIBES"
- "CONSULTING MBTI GODS"
- "EXTRACTING CRUMBS"
- "DECODING YOUR CHAOS"

**Transition 2 (cycle every 3s):**
- "TEACHING YOUR AVATAR SARCASM"
- "BRIBING THE LLM"
- "WRITING YOUR ROAST"
- "WARMING UP THE MIC"
- "ALMOST THERE WE PROMISE"

---

## 8. Mock Data (MSW handlers)

```ts
{
  mbti: ['INTJ', 'ENFP', 'ISTP'],
  description: [
    'The strategist who overthinks brunch orders.',
    'Chaos gremlin with a spreadsheet problem.',
    'Silently judging your playlist from the corner.',
  ],
  thoughts: [
    '今天又在厕所里开会了，觉得自己像个会议室里的游魂。',
    'Maybe productivity is just procrastination with better branding.',
    '我不是内向，我只是在加载。',
  ],
}
```

---

## 9. Out of Scope for This Demo

- Real auth / accounts
- Backend persistence / history
- Telegram/WeChat ingestion (that's P0 for product but v2+ for demo)
- The full "Crumbs community" social layer
- Router / deep links
- i18n (UI is all English; 金句 content from API may contain Chinese)
- Analytics
