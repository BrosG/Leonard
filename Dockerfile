FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl curl && rm -rf /var/lib/apt/lists/*

# Run as non-root user
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 leonard
WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY scripts ./scripts/
COPY public ./public/

RUN npm ci --omit=dev
RUN npx prisma generate

COPY server.js ./
COPY api/ ./api/

RUN chown -R leonard:nodejs /app
USER leonard

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/health || exit 1

CMD ["node", "server.js"]
