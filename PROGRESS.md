# Crumbs v2 — Progress Log

This document summarizes all changes from the initial commit (`5edac45`) to the current v2 release candidate.

---

## 1. Product Vision Shift

### Before (v1)
A linear flow: upload video → get MBTI → pick thought → wait for AI dance video → share video. The video was the sole deliverable.

### After (v2)
The **identity card** is now the core deliverable, with video as an optional upgrade:

```
Upload → MBTI analysis → Pick MBTI → Pick thought gem
    → Generate identity card (totem + roast + quote) ~10-15s
    → Share card immediately
    → (Optional) Generate roast video ~2-5min
```

**Why**: Cards are instant, screenshottable, and drive viral sharing. Videos take minutes, are hard to share, and most users won't wait.

---

## 2. Go-Viral Design System (STEPPS Framework)

### Social Currency
- **Type labels**: Each MBTI result gets a unique roast nickname (e.g., "The Spreadsheet Therapist", "The Beautiful Disaster") — more shareable than bare MBTI letters
- **Roast lines**: 1-2 sentence gentle roasts with contradiction/paradox structure — designed to become the user's caption when sharing

### Triggers
- Parasitic on existing MBTI awareness — zero new concept to learn
- "you said this to yourself:" framing connects to daily messaging behavior

### Emotion
- "Amused mortification" — the blend of "oh no it clocked me" and delight
- Roast tone > clinical tone — feels like a witty friend, not a textbook

### Public
- Cards designed at 1080x1080 for Instagram/WeChat sharing
- Consistent visual identity: totem art + bold MBTI type + ink panel
- Brand watermark + domain on every exported card

### Practical Value
- Lightweight self-expression tool — say things about yourself that would be awkward to state directly
- Social lubricant — "what did you get?" comparison mechanic

### Stories
- The narrative is "I let AI read my private messages and this is what it found" — inherently more interesting than "I took a quiz"

---

## 3. User Journey Changes

### Onboarding (2 pages)

**Page 1 — The Hook** (ink background):
- Full-bleed MBTI avatar cards auto-cycling (5s interval)
- Each card shows: avatar background + MBTI type + roast line + "you literally said" quote
- Live counter: "✦ X,XXX crumbs dropped today" (real backend counter + 3000 base)
- CTA: "I WANT MY ROAST"

**Page 2 — The How** (pink background):
- Bridge copy: "The things you text yourself are personality crumbs. We read them."
- 4 steps split into "YOU DO THIS" (record + upload) and "WE DO THE REST" (AI analysis + roast generation)
- CTA: "GET YOUR ROAST →" with "it only takes 15 seconds" hint

### MBTI Selection (Tinder-style full-bleed cards)
- Cards fill the entire viewport (was 30% before)
- Avatar fills upper area as background image
- Lower ink panel: MBTI type + type label + roast line
- Skip/Pick buttons below

### Thought Selection (matching card style)
- Same full-bleed layout as MBTI cards
- Quote centered in card, large italic Fraunces

### Identity Card (NEW — core deliverable)
- Upper: AI-generated totem illustration (neo-traditional tattoo style, unique per user)
- Lower: ink panel with MBTI type (yellow) → type label (white 50%) → roast line (yellow italic) → "you said this to yourself:" + quote (white 70%)
- Share sheet: SHARE CARD / SAVE TO PHOTOS / COPY LINK
- Video generation as easter egg inside share sheet
- Canvas rendering for 1080x1080 shareable PNG with brand bar + placeholder QR

### Video (optional, easter egg)
- Accessible from share sheet: "Want it as a video? AI generates a 15s roast video · takes ~2 min"
- Same flow as before: transition2 loading → video playback → share

---

## 4. Backend Changes

### New API Endpoints
- `POST /api/generate-totem` — DALL-E 3 generates neo-traditional tattoo-style totem per user
  - 16 MBTI types mapped to unique animals, flora, palettes, and moods
  - User's description + thought injected into prompt for per-user uniqueness
- `GET /api/stats` — Returns daily usage counter for social proof

### Modified Endpoints
- `POST /api/upload` — Response now includes `roast_line[3]` and `type_label[3]` fields
  - Bumps daily stats counter on success
- `GET /api/generate` — SSE streaming for video generation progress

### Prompt Engineering
- `ANALYSIS_PROMPT`: Added `roast_line` (≤20 words, contradiction/paradox structure) and `type_label` ("The [Adjective] [Noun]" format)
- Reduced minimum messages from 10 to 3 for analysis
- `videoPromptPrompt`: Added branding requirement — final frame must show "CRUMBS · get your personality roasted · crumbs.app"

### Infrastructure
- `FFMPEG_ROOT` no longer hardcoded — reads from env var, defaults to system PATH
- `FFMPEG_BIN` / `FFPROBE_BIN` default to `ffmpeg` / `ffprobe`
- `VISION_MODEL` / `TEXT_MODEL` configurable via env vars (default: gpt-4o / gpt-4o-mini)
- `OPENAI_IMAGE_MODEL` for totem generation (default: dall-e-3)
- Server port reads from `PORT` env var (for Railway deployment)
- Upload response JSON parsing: strips markdown fences, finds JSON in preamble text

### New Files
- `.env.example` — Documents all required environment variables
- `Dockerfile` — Multi-stage build (Node + Python + ffmpeg + uv)
- `.dockerignore` — Keeps Docker context clean

---

## 5. Frontend Changes

### New Components
- `ScreenCard.tsx` — Identity card display + canvas rendering + share sheet

### Modified Components

| Component | Changes |
|---|---|
| `Onboarding.tsx` | Complete rewrite: 2-page flow, full-bleed example cards, bridge copy, real counter |
| `Screen1Mbti.tsx` | Tinder-style full-bleed cards with avatar background, type label, roast line |
| `Screen2Thought.tsx` | Matching full-bleed style |
| `Screen3Video.tsx` | Video error fallback |
| `Screen4Share.tsx` | Share text includes brand CTA, reorganized buttons |
| `Transition2.tsx` | Supports `mode="card"` with card-specific loading copy |
| `App.tsx` | New `card-loading` and `card` states, totem generation flow, handleWantVideo |

### Type Changes
- `UploadResponse`: Added `roast_line`, `type_label` fields
- `PickedMbti`: Added `roastLine`, `typeLabel` fields
- `Step`: Added `card-loading` and `card` states

### API Client
- `generateTotem()` — New function for totem generation
- `generateVideo()` — Updated with SSE streaming support, 10min timeout

### Design System
- Cards fill viewport (was 30-48vh, now flex-1/inset-0)
- Two-tone text panel: yellow (primary) + white at varying opacity (secondary)
- Pink reserved for interactive elements (buttons only)
- Avatar images use `object-cover` to fill card backgrounds
- Consistent brand bar on exported cards

---

## 6. Architecture

```
crumbs/
├── server.js              # Express backend (Node)
├── generate.py            # Video generation (Python, BytePlus Ark SDK)
├── prompts.js             # All AI prompts (OCR, analysis, video script)
├── package.json           # Backend deps + build script
├── pyproject.toml          # Python deps
├── Dockerfile             # Multi-stage Docker build
├── .env.example           # Environment variable documentation
├── app/                   # Frontend (Vite + React + TypeScript)
│   ├── src/
│   │   ├── App.tsx        # State machine (Step discriminated union)
│   │   ├── api/           # client.ts (API calls), types.ts
│   │   ├── screens/       # One component per step
│   │   │   ├── Onboarding.tsx      # 2-page intro
│   │   │   ├── Screen1Mbti.tsx     # MBTI card selection
│   │   │   ├── Screen2Thought.tsx  # Thought gem selection
│   │   │   ├── ScreenCard.tsx      # Identity card + share (NEW)
│   │   │   ├── Screen3Video.tsx    # Video playback
│   │   │   ├── Screen4Share.tsx    # Video share sheet
│   │   │   ├── Transition1.tsx     # Upload loading
│   │   │   └── Transition2.tsx     # Card/video generation loading
│   │   ├── components/    # MbtiAvatar
│   │   ├── hooks/         # useUpload, useGenerate
│   │   └── mocks/         # MSW handlers
│   └── public/avatars/    # 16 MBTI avatar PNGs
└── dist/                  # Built frontend (served by Express)
```

---

## 7. Deployment

### Local Development
```bash
npm start                  # Backend on :4184
cd app && npm run dev      # Frontend on :5173 (proxied to backend)
```

### Production (Docker / Railway)
```bash
npm run build              # Build frontend → dist/
docker build -t crumbs .   # Or push to Railway via GitHub
```

### Environment Variables
| Variable | Required | Default | Purpose |
|---|---|---|---|
| `OPENAI_API_KEY` | Yes | — | OpenAI API access |
| `OPENAI_MODEL` | No | `gpt-4o` | Vision model for OCR |
| `OPENAI_TEXT_MODEL` | No | `gpt-4o-mini` | Text model for analysis + script |
| `OPENAI_IMAGE_MODEL` | No | `dall-e-3` | Image model for totem |
| `ARK_API_KEY` | Yes | — | BytePlus video generation |
| `PORT` | No | `4184` | Server port |
| `FFMPEG_BIN` | No | `ffmpeg` | ffmpeg binary path |
| `FFPROBE_BIN` | No | `ffprobe` | ffprobe binary path |
