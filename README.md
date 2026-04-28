# Crumbs

**Get your personality roasted.**

Crumbs reads the things you text yourself — late-night thoughts, half-finished ideas, screenshots you never sent — and turns them into a shareable identity card with your MBTI type, a personalized roast, and your own words quoted back at you.

## How It Works

1. **Screen-record your chats** — Open your private messages (WeChat, Telegram, Notes) and scroll for 15 seconds
2. **Upload** — AI extracts text via OCR, analyzes your personality patterns
3. **Pick your MBTI** — Choose from 3 AI-suggested types, each with a unique roast label
4. **Pick your thought gem** — Select the quote that hits hardest
5. **Get your card** — A unique identity card with AI-generated totem art, your roast line, and your own words
6. **Share** — Save, share to social media, or generate an optional roast video

## Stack

- **Frontend**: Vite + React 18 + TypeScript + Tailwind v4 + Framer Motion
- **Backend**: Express (Node.js) + Python (video generation)
- **AI**: OpenAI GPT-4o (OCR + analysis) + GPT-4o-mini (roast generation) + DALL-E 3 (totem art) + BytePlus Seedance (video)
- **Tools**: ffmpeg (video frame extraction)

## Quick Start

```bash
# Install dependencies
npm install
cd app && npm install && cd ..

# Set up environment
cp .env.example .env
# Edit .env with your API keys

# Build frontend
npm run build

# Start server
npm start
# → http://localhost:4184
```

## Development

```bash
# Terminal 1: Backend
npm start

# Terminal 2: Frontend (with hot reload + API proxy)
cd app && npm run dev
# → http://localhost:5173
```

## Docker

```bash
docker build -t crumbs .
docker run -p 4184:4184 --env-file .env crumbs
```

## Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `OPENAI_API_KEY` | Yes | — | OpenAI API |
| `OPENAI_MODEL` | No | `gpt-4o` | Vision model (OCR) |
| `OPENAI_TEXT_MODEL` | No | `gpt-4o-mini` | Text model (analysis) |
| `OPENAI_IMAGE_MODEL` | No | `dall-e-3` | Image model (totem) |
| `ARK_API_KEY` | Yes | — | BytePlus video generation |
| `PORT` | No | `4184` | Server port |

## Deploy to Railway

1. Push to GitHub
2. Connect repo at [railway.app](https://railway.app)
3. Set environment variables in Railway dashboard
4. Deploy — Railway auto-detects the Dockerfile

## License

Private project.
