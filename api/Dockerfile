# AWOH-B API — NestJS + Prisma SQLite client preview
FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

FROM deps AS build
COPY . .
ENV NODE_OPTIONS=--max-old-space-size=460
RUN npx prisma generate && npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma/dev.db ./prisma/dev.db
COPY storage/uploads ./storage/uploads
RUN mkdir -p ./storage/uploads ./storage/receipts
# Render sets PORT at runtime; Prisma SQLite paths are relative to prisma/schema.prisma
ENV DATABASE_URL="file:./dev.db"
ENV UPLOADS_DIR=/app/storage/uploads
ENV RECEIPTS_DIR=/app/storage/receipts
EXPOSE 10000
CMD ["sh", "-c", "if [ -f dist/src/main.js ]; then exec node dist/src/main.js; else exec node dist/main.js; fi"]
