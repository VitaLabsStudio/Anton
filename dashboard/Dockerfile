# dashboard/Dockerfile - Multi-stage Next.js Build
#
# Optimized for Next.js standalone output with minimal image size.
#
# Build command:
#   docker build -t antone-dashboard .

# --- Base Stage ---
FROM node:24-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# --- Dependencies Stage ---
FROM base AS deps
# Copy workspace files for pnpm resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY dashboard/package.json ./dashboard/
COPY shared/package.json ./shared/
COPY database/package.json ./database/
COPY backend/package.json ./backend/
# Install dependencies
RUN pnpm install --frozen-lockfile

# --- Build Stage ---
FROM base AS builder
WORKDIR /app
# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/dashboard/node_modules ./dashboard/node_modules
COPY --from=deps /app/shared/node_modules ./shared/node_modules
# Copy source code
COPY . .
# Build shared package first
RUN pnpm --filter @antone/shared build
# Build Next.js with standalone output
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @antone/dashboard build

# --- Production Stage ---
FROM node:24-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
# Copy standalone build
COPY --from=builder /app/dashboard/.next/standalone ./
COPY --from=builder /app/dashboard/.next/static ./dashboard/.next/static
COPY --from=builder /app/dashboard/public ./dashboard/public
# Set correct permissions
RUN chown -R nextjs:nodejs /app
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "dashboard/server.js"]
