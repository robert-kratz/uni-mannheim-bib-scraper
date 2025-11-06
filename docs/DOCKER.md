# Docker Deployment Guide

## Quick Start

### Development

```bash
# Start with logs
make dev-up

# Start detached
make dev

# Stop
make down

# View logs
make logs

# Enter container shell
make dkwi

# Rebuild
make rebuild-dev
```

### Production

```bash
# Build and start
make prod

# Start with logs
make prod-up

# Stop
make prod-down

# View logs
make prod-logs

# Rebuild
make rebuild-prod
```

## Dockploy Setup

1. **Connect Git Repository** ✅ (Already done)

2. **Set Environment Variables** in Dockploy:

    - `DATABASE_URL`: Your Supabase connection string
    - `API_KEY`: Your API key for cron routes

3. **Deploy Configuration**:

    - **Domain**: `bib2.rjks.us`
    - **Docker Compose File**: `docker-compose.prod.yml`
    - **Traefik Network**: `traefik-public`

4. **Automatic SSL**: Traefik will handle Let's Encrypt certificates automatically

5. **GitHub Container Registry**: Images are automatically built and pushed via GitHub Actions on every push to `main`

## Architecture

### Production (docker-compose.prod.yml)

-   Pulls pre-built image from GitHub Container Registry (`ghcr.io`)
-   Image built via GitHub Actions on every push to `main`
-   Traefik labels for reverse proxy and SSL
-   Connected to `traefik-public` network
-   No local build needed - just pull and run

### Development (docker-compose.dev.yml)

-   Hot reload enabled via volume mounts
-   Turbopack for fast refresh
-   Direct port mapping (3040:3000)
-   Full source code mounted
-   Local build for development

## Traefik Labels Explained

```yaml
traefik.enable=true                                    # Enable Traefik
traefik.http.routers.bib-app.rule=Host(`bib2.rjks.us`) # Domain routing
traefik.http.routers.bib-app.entrypoints=websecure    # HTTPS entry
traefik.http.routers.bib-app.tls.certresolver=letsencrypt # SSL cert
traefik.http.services.bib-app.loadbalancer.server.port=3000 # Internal port
```

## Makefile Commands

### Development

-   `make dev` - Start detached
-   `make dev-up` - Start with logs
-   `make down` - Stop containers
-   `make logs` - View logs
-   `make dkwi` - Enter container shell
-   `make build-dev` - Build image
-   `make rebuild-dev` - Full rebuild

### Production

-   `make prod` - Start detached
-   `make prod-up` - Start with logs
-   `make prod-down` - Stop containers
-   `make prod-logs` - View logs
-   `make prod-pull` - Pull latest image from registry
-   `make build-prod` - Build image locally (optional)
-   `make rebuild-prod` - Pull latest and restart

### Utility

-   `make clean` - Remove all containers and volumes
-   `make restart-dev` - Restart dev environment
-   `make restart-prod` - Restart prod environment
-   `make ps` - Show running containers
-   `make help` - Show all commands

## Troubleshooting

### Hot Reload Not Working

```bash
# Rebuild dev container
make rebuild-dev
```

### Production Image Too Large

The Dockerfile uses multi-stage builds and standalone output to minimize size.

### Database Connection Issues

Ensure your `DATABASE_URL` in Dockploy environment variables is correct and uses transaction pooling mode.

### Traefik Not Routing

1. Ensure `traefik-public` network exists
2. Check Traefik is running and configured
3. Verify domain DNS points to your server

## Files Overview

-   `Dockerfile` - Production multi-stage build
-   `Dockerfile.dev` - Development with hot reload
-   `docker-compose.yml` - Production with Traefik
-   `docker-compose.dev.yml` - Development setup
-   `.dockerignore` - Exclude files from builds
-   `Makefile` - Command shortcuts
-   `next.config.ts` - Standalone output enabled
