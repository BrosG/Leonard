FROM node:20-slim

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY scripts ./scripts/
COPY public ./public/

RUN npm ci --omit=dev
RUN npx prisma generate

COPY server.js ./
COPY api/ ./api/

EXPOSE 8080

CMD ["node", "server.js"]
