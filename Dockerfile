# syntax=docker/dockerfile:1
FROM node:24-alpine AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=optional --no-audit --no-fund

FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DROPAI_DB_PATH=/data/dropai.db
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs \
 && mkdir -p /data /app/public/uploads \
 && chown -R nextjs:nodejs /data /app

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# better-sqlite3 нативный модуль — нужен явно, standalone его не подхватывает
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/bindings ./node_modules/bindings
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/file-uri-to-path ./node_modules/file-uri-to-path

USER nextjs
EXPOSE 3000

# Миграции Better Auth применяются автоматически при старте, т.к. таблицы создаются в lib/db.ts
# Для добавления auth-таблиц можно запускать `npx @better-auth/cli migrate` отдельной командой.
CMD ["node", "server.js"]
