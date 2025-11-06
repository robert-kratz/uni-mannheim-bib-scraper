# CI/CD Pipeline

## Overview

This project uses GitHub Actions for continuous integration and deployment. Docker images are automatically built and pushed to GitHub Container Registry on every push to the `main` branch.

## Workflows

### 1. Build and Push Docker Image (`.github/workflows/build-docker.yml`)

**Triggers:**

-   Push to `main` branch
-   Pull requests to `main`
-   Manual trigger via workflow_dispatch

**Process:**

1. Checkout code
2. Set up Docker Buildx for multi-platform builds
3. Login to GitHub Container Registry
4. Extract metadata (tags, labels)
5. Build Docker image for `linux/amd64` and `linux/arm64`
6. Push to `ghcr.io/robert-kratz/uni-mannheim-bib-scraper`

**Image Tags:**

-   `latest` - Always points to the latest main branch build
-   `main` - Latest build from main branch
-   `sha-<commit>` - Specific commit SHA
-   `pr-<number>` - Pull request builds (not pushed, only built)

### 2. Scrape Library Data (`.github/workflows/scrape-library.yml`)

Scheduled workflow to scrape library occupancy data.

### 3. Scrape Calendar (`.github/workflows/scrape-calendar.yml`)

Scheduled workflow to scrape university calendar events.

## GitHub Container Registry

### Image Location

```
ghcr.io/robert-kratz/uni-mannheim-bib-scraper:latest
```

### Pulling the Image

```bash
# Pull latest
docker pull ghcr.io/robert-kratz/uni-mannheim-bib-scraper:latest

# Pull specific version
docker pull ghcr.io/robert-kratz/uni-mannheim-bib-scraper:sha-abc123
```

### Authentication (for private repos)

If the repository is private, you need to authenticate:

```bash
# Create a Personal Access Token (PAT) with `read:packages` scope
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

## Deployment Flow

```
┌─────────────┐
│  Git Push   │
│  to main    │
└──────┬──────┘
       │
       v
┌─────────────────────┐
│  GitHub Actions     │
│  Build Docker Image │
└──────┬──────────────┘
       │
       v
┌─────────────────────────┐
│  GitHub Container       │
│  Registry (ghcr.io)     │
└──────┬──────────────────┘
       │
       v
┌─────────────────────┐
│  Dockploy           │
│  Pull & Deploy      │
└─────────────────────┘
```

## Local Development vs Production

### Development

-   Uses `Dockerfile.dev`
-   Hot reload enabled
-   Local builds
-   Port 3040

### Production

-   Uses pre-built image from `ghcr.io`
-   No build on server
-   Fast deployment
-   Traefik routing on port 3000

## Cache Optimization

The workflow uses GitHub Actions cache to speed up builds:

-   `cache-from: type=gha` - Use previous build cache
-   `cache-to: type=gha,mode=max` - Save all layers to cache

This significantly reduces build times for subsequent builds.

## Multi-Platform Support

Images are built for:

-   `linux/amd64` - Standard x86_64 servers
-   `linux/arm64` - ARM-based servers (e.g., Raspberry Pi, Apple Silicon)

## Troubleshooting

### Build Fails

Check GitHub Actions logs:

1. Go to repository → Actions tab
2. Click on the failed workflow run
3. Review logs for errors

### Image Not Found

Ensure:

1. Workflow completed successfully
2. You have permission to access the package
3. Image name is correct: `ghcr.io/robert-kratz/uni-mannheim-bib-scraper:latest`

### Dockploy Not Pulling Latest

```bash
# Manually pull latest image
make prod-pull

# Restart with latest
make rebuild-prod
```

## Monitoring

### View Workflow Status

```bash
# Using GitHub CLI
gh workflow list
gh run list --workflow=build-docker.yml
gh run view <run-id>
```

### Check Package

Visit: https://github.com/robert-kratz/uni-mannheim-bib-scraper/pkgs/container/uni-mannheim-bib-scraper

## Security

-   `GITHUB_TOKEN` is automatically provided by GitHub Actions
-   No manual token configuration needed
-   Packages inherit repository permissions
-   Images are scanned for vulnerabilities

## Manual Trigger

To manually trigger a build:

1. Go to Actions tab
2. Select "Build and Push Docker Image"
3. Click "Run workflow"
4. Select branch and run
