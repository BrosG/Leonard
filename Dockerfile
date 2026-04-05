# Build stage
FROM node:20-slim AS builder

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma/
RUN npx prisma generate

# Production stage
FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 leonard

WORKDIR /app

COPY --from=builder --chown=leonard:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=leonard:nodejs /app/prisma ./prisma
COPY --chown=leonard:nodejs package.json ./
COPY --chown=leonard:nodejs server.js ./
COPY --chown=leonard:nodejs api/ ./api/
COPY --chown=leonard:nodejs scripts/ ./scripts/
COPY --chown=leonard:nodejs public/ ./public/

USER leonard
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

CMD ["node", "server.js"]
