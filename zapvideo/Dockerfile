FROM node:22-bookworm-slim

# Chromium + dependências para o render do Remotion
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium fonts-liberation libnss3 libatk-bridge2.0-0 libgtk-3-0 libasound2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
COPY packages/core/package.json packages/core/
COPY packages/video/package.json packages/video/
COPY packages/agent/package.json packages/agent/
COPY apps/web/package.json apps/web/
COPY apps/bot/package.json apps/bot/
RUN npm install

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV REMOTION_BROWSER_EXECUTABLE=/usr/bin/chromium
