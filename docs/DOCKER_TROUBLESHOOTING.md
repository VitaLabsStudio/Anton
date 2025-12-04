# Docker Troubleshooting Guide

Common issues and solutions for the Antone Docker deployment.

## Quick Diagnostics

```bash
# Check container status
docker-compose -f docker/docker-compose.yml ps

# View container logs
docker-compose -f docker/docker-compose.yml logs <service-name>

# Check health status
docker inspect --format='{{.State.Health.Status}}' antone-postgres
docker inspect --format='{{.State.Health.Status}}' antone-backend-api
```

---

## Issue: Services fail to start

**Symptoms**: `docker-compose up -d` exits with error

**Diagnosis**:
```bash
docker-compose -f docker/docker-compose.yml logs <service-name>
docker-compose -f docker/docker-compose.yml ps
```

**Common Causes**:

1. **Port already in use (3000, 3001, 5432)**
   ```bash
   # Find process using the port
   lsof -i :3001
   # Kill the process or change port in .env
   ```

2. **Environment file missing**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **External volume not created**
   ```bash
   docker volume create antone_postgres_data
   ```

4. **Build context issues**
   ```bash
   docker-compose -f docker/docker-compose.yml build --no-cache
   ```

---

## Issue: Health checks failing

**Symptoms**: Container shows "unhealthy" status

**Diagnosis**:
```bash
docker inspect antone-backend-api | grep -A 10 Health
docker logs antone-backend-api --tail 100
```

**Solutions**:

1. **PostgreSQL health check failing**
   - Ensure `POSTGRES_USER` in `.env` matches health check command
   - Wait for `start_period` to complete (15s for postgres)
   ```bash
   # Manual check
   docker exec antone-postgres pg_isready -U antone
   ```

2. **Backend API health check failing**
   - Verify app binds to `0.0.0.0`, not `127.0.0.1`
   - Check `backend/src/index.ts` has `hostname: '0.0.0.0'`
   ```bash
   # Manual check from inside container
   docker exec antone-backend-api wget --spider http://localhost:3001/health
   ```

3. **Increase health check intervals**
   - Edit `docker/docker-compose.yml`
   - Increase `timeout` or `retries`

---

## Issue: Services can't communicate

**Symptoms**: Backend can't connect to postgres

**Diagnosis**:
```bash
docker-compose -f docker/docker-compose.yml exec backend-api ping postgres
docker network ls
docker network inspect antone-network
```

**Solutions**:

1. **Ensure all services on same network**
   - Check `networks: - antone-network` in compose file

2. **Use service names, not localhost**
   - ✓ `postgresql://user:pass@postgres:5432/db`
   - ✗ `postgresql://user:pass@localhost:5432/db`

3. **Check DATABASE_URL in .env**
   ```bash
   DATABASE_URL=postgresql://antone:your_password@postgres:5432/antone
   ```

---

## Issue: Data not persisting

**Symptoms**: Database empty after restart

**Diagnosis**:
```bash
docker volume ls
docker volume inspect antone_postgres_data
```

**Solutions**:

1. **Verify volume is external**
   - Check `docker/docker-compose.yml` has `external: true`
   ```yaml
   volumes:
     postgres_data:
       external: true
       name: antone_postgres_data
   ```

2. **Don't use `docker-compose down -v`**
   - Use `./scripts/dev-ctl.sh down` instead
   - The `-v` flag deletes volumes!

3. **Check volume is mounted correctly**
   ```bash
   docker exec antone-postgres ls -la /var/lib/postgresql/data
   ```

---

## Issue: Permission denied errors

**Symptoms**: Container can't write to volume

**Diagnosis**:
```bash
docker exec antone-postgres ls -la /var/lib/postgresql/data
docker exec antone-backend-api id
```

**Solutions**:

1. **Volume permissions**
   ```bash
   # Check volume permissions on host
   docker run --rm -v antone_postgres_data:/data alpine ls -la /data
   ```

2. **Non-root user UID mismatch**
   - Dockerfile uses UID 1001
   - May need to chown volume on host

---

## Issue: Image build fails

**Symptoms**: `docker build` errors

**Diagnosis**:
```bash
# Build with full output
docker build -f backend/Dockerfile --target production -t test .
```

**Common Causes**:

1. **pnpm-lock.yaml out of sync**
   ```bash
   pnpm install
   git add pnpm-lock.yaml
   ```

2. **Missing package.json files**
   - Ensure all workspace `package.json` files are copied in Dockerfile

3. **Node modules in .dockerignore**
   - This is correct, but ensure `pnpm install` runs in container

---

## Emergency Commands

```bash
# Stop all services (safe)
./scripts/dev-ctl.sh down

# Rebuild from scratch (preserves data)
docker-compose -f docker/docker-compose.yml build --no-cache
docker-compose -f docker/docker-compose.yml up -d

# View real-time logs
docker-compose -f docker/docker-compose.yml logs -f

# Access postgres directly
docker exec -it antone-postgres psql -U antone

# Create backup before major changes
./scripts/backup-db.sh
```

---

## Getting Help

1. Run `./scripts/verify-docker.sh` for automated diagnostics
2. Check logs for specific error messages
3. Review the [Docker documentation](https://docs.docker.com/)
