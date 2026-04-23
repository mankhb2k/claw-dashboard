# syntax=docker/dockerfile:1.7

FROM node:24-bookworm

WORKDIR /app

# Install openclaw from npm
COPY package.json package-lock.json ./
RUN npm ci

# Copy pre-built control-ui
COPY vendor/control-ui ./vendor/control-ui

# Copy config and scripts
COPY onboard-server.js public .env.example ./

# Set production env
ENV NODE_ENV=production

# Run as non-root
USER node

# Expose ports
EXPOSE 18788 18789

# Start gateway with control-ui
CMD ["sh", "-lc", "node_modules/openclaw/openclaw.mjs config set gateway.controlUi.root /app/vendor/control-ui && node_modules/openclaw/openclaw.mjs gateway run --allow-unconfigured --bind lan --port 18789 --auth token --token \"${OPENCLAW_GATEWAY_TOKEN:-dev-openclaw-token-18789}\""]
