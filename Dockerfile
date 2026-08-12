# ── Stage 1: Build ──────────────────────────────────────────────────
FROM oven/bun:1.1-alpine AS builder

WORKDIR /app

# Copy root workspace files
COPY package.json bun.lock* ./
COPY packages/web/package.json ./packages/web/

# Install all deps
RUN bun install

# Copy full source (needed for Vite build + API compilation)
COPY packages/web ./packages/web

# Build the frontend (outputs to packages/web/dist)
WORKDIR /app/packages/web
RUN bun run build

# ── Stage 2: Production runtime ─────────────────────────────────────
FROM oven/bun:1.1-alpine AS runner

WORKDIR /app

# Copy everything needed for runtime
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/web/package.json ./packages/web/package.json
COPY --from=builder /app/packages/web/src ./packages/web/src
COPY --from=builder /app/packages/web/dist ./packages/web/dist
COPY --from=builder /app/packages/web/public ./packages/web/public
COPY --from=builder /app/packages/web/drizzle ./packages/web/drizzle
COPY --from=builder /app/packages/web/drizzle.config.ts ./packages/web/drizzle.config.ts

WORKDIR /app/packages/web

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Apply pending schema migrations, then boot. The app no longer self-migrates.
CMD ["sh", "-c", "bunx drizzle-kit migrate && bun src/server.ts"]
