# 11. Infrastructure & Deployment

## 11.1 Docker Compose Configuration

```yaml
# docker/docker-compose.yml

version: '3.8'

services:
  postgres:
    image: postgres:17-alpine
    container_name: antone-postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-antone}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB:-antone}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U antone"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped
    networks:
      - antone-network

  backend-api:
    build:
      context: ../backend
      dockerfile: Dockerfile
      target: production
    container_name: antone-backend-api
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
    env_file:
      - ../.env
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped
    networks:
      - antone-network

  backend-worker:
    build:
      context: ../backend
      dockerfile: Dockerfile
      target: production
    container_name: antone-backend-worker
    command: ["node", "dist/workers/index.js"]
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
    env_file:
      - ../.env
    depends_on:
      postgres:
        condition: service_healthy
      backend-api:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - antone-network

  dashboard:
    build:
      context: ../dashboard
      dockerfile: Dockerfile
    container_name: antone-dashboard
    environment:
      NEXT_PUBLIC_API_URL: http://backend-api:3001
    ports:
      - "3000:3000"
    depends_on:
      - backend-api
    restart: unless-stopped
    networks:
      - antone-network

  cloudflared:
    image: cloudflare/cloudflared:latest
    container_name: antone-cloudflared
    command: tunnel run
    environment:
      TUNNEL_TOKEN: ${CLOUDFLARE_TUNNEL_TOKEN}
    restart: unless-stopped
    networks:
      - antone-network

volumes:
  postgres_data:
    driver: local

networks:
  antone-network:
    driver: bridge
```

## 11.2 Dockerfile (Backend)

```dockerfile
# backend/Dockerfile

FROM node:24-alpine AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.0.0 --activate

# Dependencies stage
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Production stage
FROM base AS production
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

## 11.3 Cloudflare Tunnel Configuration

```yaml
# docker/cloudflared/config.yml

tunnel: antone-tunnel
credentials-file: /etc/cloudflared/credentials.json

ingress:
  - hostname: antone.yourdomain.com
    service: http://dashboard:3000
  - hostname: api.antone.yourdomain.com
    service: http://backend-api:3001
  - service: http_status:404
```

---
