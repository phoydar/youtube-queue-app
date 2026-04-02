# --- Base ---
FROM node:20-slim AS base
WORKDIR /app

# --- Dependencies ---
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# --- Build ---
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build Next.js (no DB push at build time — Postgres isn't available here)
RUN npm run build -- --no-lint

# --- Production ---
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000

# Don't run as root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy drizzle config and schema for db:push at startup
COPY --from=build --chown=nextjs:nodejs /app/drizzle.config.ts ./
COPY --from=build --chown=nextjs:nodejs /app/src/lib/db/schema.ts ./src/lib/db/schema.ts
COPY --from=build --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=nextjs:nodejs /app/package.json ./

# Copy startup script
COPY --from=build --chown=nextjs:nodejs /app/start.sh ./
RUN chmod +x start.sh

USER nextjs
EXPOSE 3000

CMD ["./start.sh"]
