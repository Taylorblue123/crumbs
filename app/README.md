# Crumbs

A playful MBTI self-discovery app. Upload a 15-second video, get roasted by AI, share the result.

**Stack**: Vite + React 19 + TypeScript + Tailwind v4 + Framer Motion + MSW

## Quick Start

```bash
npm install
npm run dev        # Starts on http://localhost:5173 with mock API
```

The app ships with MSW mocks enabled by default — no backend needed for UI development.

## Backend Integration Guide

The frontend expects **two API endpoints**. The mock layer (MSW) simulates both. To connect a real backend, flip one env var and make sure your server implements the contract below.

### Step 1: Disable Mocks

Edit `.env` in the project root:

```env
VITE_USE_MOCK=false
VITE_API_BASE=/api
```

Or start the dev server with the override:

```bash
VITE_USE_MOCK=false npm run dev
```

When `VITE_USE_MOCK=false`, the MSW service worker is never registered. All `/api/*` requests go through Vite's dev proxy.

### Step 2: Run Your Backend

The Vite dev server proxies `/api/*` to `http://localhost:3001` (configured in `vite.config.ts`).

Start your backend on port **3001** (or change the proxy target):

```ts
// vite.config.ts — change target if your backend uses a different port
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',  // ← your backend
      changeOrigin: true,
    },
  },
},
```

### Step 3: Implement the API Contract

#### `POST /api/upload`

Receives a user video, analyzes it, returns 3 MBTI candidates with descriptions and thought gems.

**Request**:
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: single field `video` (MIME `video/*`, max 50MB recommended)

**Response** (200 OK):
```json
{
  "mbti": ["INTJ", "ENFP", "ISTP"],
  "description": [
    "The strategist who overthinks brunch orders.",
    "Chaos gremlin with a spreadsheet problem.",
    "Silently judging your playlist from the corner."
  ],
  "thoughts": [
    "今天又在厕所里开会了，觉得自己像个会议室里的游魂。",
    "Maybe productivity is just procrastination with better branding.",
    "我不是内向，我只是在加载。"
  ]
}
```

- `mbti`: exactly 3 four-letter MBTI codes (uppercase)
- `description`: exactly 3 strings, parallel to `mbti` (same index = same type)
- `thoughts`: exactly 3 extracted quotes (金句) — can be Chinese, English, or mixed

**Error responses** the frontend handles gracefully:
| Status | Meaning |
|--------|---------|
| 413 | File too large |
| 415 | Unsupported format |
| 500 | Analysis failed |

**Expected latency**: 10–30 seconds. The frontend shows a progress bar during upload and rotating copy during analysis.

**Backend implementation hint**: The typical pipeline is:
1. Extract frames from video with ffmpeg
2. Send frames to a vision model for personality/vibe analysis
3. Send analysis to an LLM to generate MBTI matches + thought gems

#### `GET /api/generate`

Generates a roast-style avatar video for the user's chosen MBTI + thought combination.

**Request**:
- Method: `GET`
- Query params (all URL-encoded strings):
  - `mbti` — the chosen MBTI code (e.g., `INTJ`)
  - `description` — the chosen description string
  - `thought` — the chosen thought gem string

Example:
```
GET /api/generate?mbti=INTJ&description=The+strategist+who+overthinks+brunch+orders.&thought=我不是内向，我只是在加载。
```

**Response** (200 OK):
- Content-Type: `video/mp4`
- Body: raw MP4 binary (the video file itself, not a URL)

The frontend does:
```js
const blob = await response.blob()
videoElement.src = URL.createObjectURL(blob)
```

**Expected latency**: 30–60 seconds. This is a synchronous/blocking call. The frontend sets a 120-second timeout via `AbortSignal.timeout(120_000)`.

**Backend implementation hint**: The typical pipeline is:
1. Use the MBTI + description + thought to generate a video prompt via LLM
2. Select/generate an avatar matching the MBTI type
3. Generate the video (e.g., via a video generation API)
4. Stream or return the MP4 binary

### Production Deployment

#### Option A: Same-Origin (Recommended)

Your backend serves both the API and the static frontend files:

```
your-server
├── /api/upload      → backend handler
├── /api/generate    → backend handler
└── /*               → serve files from dist/
```

Build the frontend:
```bash
npm run build   # outputs to dist/
```

Copy `dist/` to your server and serve as static files. All `/api/*` routes are handled by your backend; everything else returns `index.html`.

#### Option B: Separate Domains

Frontend on Vercel/Netlify/Cloudflare Pages, backend on a separate server.

1. Set `VITE_API_BASE` to your backend's full URL at build time:
   ```bash
   VITE_API_BASE=https://api.yourserver.com npm run build
   ```

2. Configure CORS on your backend:
   ```
   Access-Control-Allow-Origin: https://your-frontend-domain.com
   Access-Control-Allow-Methods: GET, POST
   Access-Control-Allow-Headers: Content-Type
   ```

3. Note: `/api/generate` returns a large video blob — ensure your CORS setup and any CDN/reverse proxy allow large binary responses (50MB+) and long timeouts (120s+).

### TypeScript Types

The full type definitions are in `src/api/types.ts`:

```ts
interface UploadResponse {
  mbti: [string, string, string]
  description: [string, string, string]
  thoughts: [string, string, string]
}
```

### File Reference

| File | Purpose |
|------|---------|
| `src/api/client.ts` | API client — `uploadVideo()` (XHR with progress) and `generateVideo()` (fetch with 120s timeout) |
| `src/api/types.ts` | TypeScript interfaces for API contract and app state |
| `src/mocks/handlers.ts` | MSW mock handlers (edit to change mock data) |
| `src/hooks/useUpload.ts` | Upload hook with progress + abort |
| `src/hooks/useGenerate.ts` | Video generation hook with abort |
| `.env` | `VITE_USE_MOCK` and `VITE_API_BASE` |
| `vite.config.ts` | Dev proxy target |

### MBTI Avatar Assets

The app expects 16 PNG files in `public/avatars/`:
```
public/avatars/
├── intj.png
├── enfp.png
├── istp.png
├── ... (all 16 types, lowercase)
```

These are gitignored (demo-only assets from 16personalities.com). For production, replace with original illustrations.

## Development

```bash
npm run dev       # Dev server with HMR
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # ESLint
```

## License

MIT
