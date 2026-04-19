# --- Stage 1: Build frontend ---
FROM node:22-slim AS frontend-build
WORKDIR /app
COPY app/package.json app/package-lock.json ./
RUN npm ci
COPY app/ ./
RUN npm run build
# Output is in ../dist (relative to app/), which means /dist in container

# --- Stage 2: Runtime ---
FROM node:22-slim

# Install ffmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install uv (Python package manager)
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

# Install Python 3.14 via uv
RUN uv python install 3.14

WORKDIR /app

# Copy backend package files and install
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy Python project files and install deps
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen

# Copy backend source
COPY server.js prompts.js generate.py ./

# Copy built frontend from stage 1
COPY --from=frontend-build /dist ./dist

# Copy avatar assets for totem generation
COPY app/public/avatars ./dist/avatars

# Create data directory
RUN mkdir -p data

EXPOSE 4184

CMD ["node", "server.js"]
