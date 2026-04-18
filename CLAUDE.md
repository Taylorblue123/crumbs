# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Crumbs is a mobile-first web app where users upload a 15s video, get MBTI type suggestions and "thought gems" (金句), pick one of each, then receive a generated roast-style avatar video to share. Linear flow, no router — single `useState<Step>` state machine.

## Stack

- Vite + React 18 + TypeScript
- Tailwind v4 + shadcn/ui (components: button, card, progress, dialog)
- TanStack Query v5
- MSW 2.x for API mocking in dev
- Framer Motion for transitions

## Commands

```bash
npm run dev          # Start dev server (MSW active by default)
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint
```

Set `VITE_USE_MOCK=false` in `.env` to disable MSW and hit real backend.
Set `VITE_API_BASE` for backend URL (default: `/api`, proxied by Vite in dev).

## Project Structure

```
src/
  screens/       # Onboarding, Transition, Screen1-4 (one component per step)
  components/    # MBTICard, ThoughtCard, MbtiAvatar
  api/           # client.ts (fetch wrapper), types.ts
  mocks/         # MSW handlers
  hooks/         # useUpload, useGenerate (polling)
```

## Architecture

**State machine**: The entire app is a linear flow controlled by a single `Step` discriminated union (see SPEC.md §5 for full type). Each screen is a component that receives state and an `onNext`/`onBack` callback. No React Router.

**API contract**:
- `POST /api/upload` — multipart `video` field → returns `{ mbti[3], description[3], thoughts[3] }`
- `GET /api/generate?mbti=X&description=Y&thought=Z` → returns `video/mp4` blob (30-60s latency, use 120s timeout)

**Mock-first dev**: MSW intercepts both endpoints with 3s delay for upload and a sample video URL for generate. All mock handlers live in `src/mocks/`.

## Visual Direction

**Aesthetic**: Spotify Wrapped 2024 × MBTI roast card. High-voltage pop, hard cuts, bold type-as-form.

**Palette — exactly three colors:**
- `--crumbs-pink: #FF2E63` / `--crumbs-yellow: #FFE14D` / `--crumbs-ink: #0A0F3D`
- Every screen: ONE color full-bleed bg, other two for text/accents. No neutrals, no gradients.
- Screen transitions are HARD CUTS (background color jumps).

**Typography:**
- Display: `"Fraunces", Georgia, serif` — 60-120pt for MBTI letters/headlines. Letter-spacing -0.02em.
- Body: `"Space Grotesk", system-ui, sans-serif`.
- Labels: Space Grotesk uppercase, 0.15em tracking, 11px.
- **Never use Inter.**

**MBTI Avatars**: 16 PNGs in `public/avatars/{type}.png` (lowercase). Local demo only — in `.gitignore`. Component: `<MbtiAvatar type="INTJ" size={120} />`.

**Motion rules:**
- Screen transitions: 180ms cross-fade, bg color HARD CUT. `AnimatePresence mode="wait"`.
- Avatar float: `y: [-8, 8, -8]`, 3s, easeInOut, infinite.
- Rotating copy: y slide (20→0) + opacity swap.
- Card tap: scale 0.97 press / 1.0 release, 120ms.
- No scroll animations, no parallax, no shimmer.

**Tone**: Gen Z, creative-worker-coded, self-roasting. Playful but insightful, never corporate.

## Key Implementation Notes

- `<video>` must use `playsInline` for iOS
- Upload progress via `XMLHttpRequest.upload.onprogress` (not fetch)
- Video generation endpoint is synchronous/blocking — loading UX must be charming (animated copy rotation every 3s)
- Share: Web Share API first (`navigator.share({ files: [videoBlob] })`), fallback to download + copy-link
- UI copy is all English. Thought gems (金句) may contain Chinese — that's content from the API, not i18n.
- See SPEC.md for full screen specs, state machine type, copy strings, and mock data
