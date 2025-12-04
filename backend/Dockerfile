# backend/Dockerfile - Multi-stage Production Build (TECH-001)
#
# Optimized for pnpm monorepo with proper layer caching.
# 
# Build targets:
#   - production: Minimal image for deployment
#   - development: Hot reload with tsx watch
#
# Build commands:
#   docker build -t antone-backend --target production .
#   docker build -t antone-backend-dev --target development .

# --- Base Stage ---
FROM node:24-alpine AS base
WORKDIR /app
# Enable corepack and activate pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
# Install wget for health checks (already on alpine but ensure it's there)
RUN apk add --no-cache wget

# --- Dependencies Stage ---
FROM base AS deps
# Copy ALL package.json files from the workspace for proper resolution
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
COPY shared/package.json ./shared/
COPY database/package.json ./database/
# Install ALL workspace dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile

# --- Build Stage ---
FROM base AS builder
WORKDIR /app
# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=deps /app/shared/node_modules ./shared/node_modules
COPY --from=deps /app/database/node_modules ./database/node_modules
# Copy source code (after deps for better layer caching)
COPY . .
# Build shared package first (dependency of backend)
RUN pnpm --filter @antone/shared build
# Build the backend package
RUN pnpm --filter @antone/backend build

# --- Production Stage ---
FROM base AS production
ENV NODE_ENV=production
WORKDIR /app
# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 antone
# Copy only production artifacts
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=deps /app/shared/node_modules ./shared/node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/shared/dist ./shared/dist
COPY --from=builder /app/backend/package.json ./backend/package.json
COPY --from=builder /app/shared/package.json ./shared/package.json
COPY --from=builder /app/package.json ./package.json
# Switch to non-root user
USER antone
EXPOSE 3001
CMD ["node", "backend/dist/index.js"]

# --- Development Stage ---
FROM base AS development
WORKDIR /app
# Install dev dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=deps /app/shared/node_modules ./shared/node_modules
COPY --from=deps /app/database/node_modules ./database/node_modules
# Copy all source (will be overridden by volume mount in dev)
COPY . .
EXPOSE 3001
EXPOSE 9229
# Use tsx watch for hot reload
CMD ["pnpm", "--filter", "@antone/backend", "dev"]
