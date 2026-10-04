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
COPY scripts/render-start.sh ./scripts/render-start.sh
RUN chmod +x ./scripts/render-start.sh \
  && mkdir -p ./storage/uploads ./storage/receipts
ENV PORT=4000
ENV UPLOADS_DIR=/app/storage/uploads
ENV RECEIPTS_DIR=/app/storage/receipts
ENV DATABASE_URL="file:./prisma/dev.db"
EXPOSE 4000
CMD ["./scripts/render-start.sh"]
