# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE="node:24-bookworm"
FROM ${NODE_IMAGE} AS builder

WORKDIR /app

COPY package.json pnpm-lock.yaml* yarn.lock* package-lock.json* ./

RUN npm install --ci || npm install

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ── Runtime ──
FROM ${NODE_IMAGE}

WORKDIR /app

# Install heavy dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    ffmpeg \
    libwebp-dev \
    libvips-dev \
    python3 \
    python3-pip && \
    rm -rf /var/lib/apt/lists/*

# Install Playwright (optional, can be deferred to first run)
ARG INSTALL_PLAYWRIGHT=1
RUN if [ "$INSTALL_PLAYWRIGHT" = "1" ]; then \
      npm install -g @playwright/cli && \
      playwright install chromium; \
    fi

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .

ENV NODE_ENV=production
ENV NODE_OPTIONS="--enable-source-maps"

EXPOSE 3003

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:3003/health || exit 1

CMD ["node", "dist/index.js"]
