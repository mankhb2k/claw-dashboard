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

# Install Docker CLI (to access Docker daemon)
RUN apt-get update && apt-get install -y --no-install-recommends \
    docker.io \
    curl \
    ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .

ENV NODE_ENV=production
ENV NODE_OPTIONS="--enable-source-maps"

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

CMD ["node", "dist/index.js"]
