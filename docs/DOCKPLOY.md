# Dockploy Deployment Checklist

## ✅ Pre-Deployment Setup

1. **Git Repository Connected** ✓
2. **Domain DNS Setup**
   - Point `bib2.rjks.us` A record to your server IP
   - Wait for DNS propagation

## 📋 Dockploy Configuration

### 1. Environment Variables

Add these in Dockploy UI under "Environment Variables":

```bash
DATABASE_URL=postgresql://postgres.vreylscmhqxeesjpbkal:<PASSWORD>@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
API_KEY=your_secure_random_api_key_here
NODE_ENV=production
```

### 2. Docker Settings

3. **Deploy Configuration**:
   - **Domain**: `bib2.rjks.us`
   - **Docker Compose File**: `docker-compose.prod.yml`
   - **Network**: `traefik-public` (must exist!)
   - **Auto Deploy**: Enable for automatic deployments on git push
   - **Image Source**: GitHub Container Registry (automatically built via GitHub Actions)

### 3. Traefik Network Setup

If `traefik-public` network doesn't exist, create it:

```bash
docker network create traefik-public
```

## 🚀 Deployment Steps

1. **Push to Git**
   ```bash
   git add .
   git commit -m "Add Docker configuration"
   git push origin main
   ```

2. **GitHub Actions Build**
   - GitHub Actions automatically builds the Docker image
   - Image is pushed to GitHub Container Registry
   - Check Actions tab in GitHub for build status

3. **Deploy in Dockploy**
   - Go to your project in Dockploy
   - Click "Deploy" or wait for auto-deploy
   - Dockploy pulls the latest image from GitHub Container Registry
   - No build needed on server - just pull and run

4. **Verify Deployment**
   ```bash
   # Check if container is running
   docker ps | grep bib

   # Check logs
   docker logs <container_id>

   # Test the app
   curl https://bib2.rjks.us
   ```

## 🔧 Post-Deployment

### Run Database Migrations

If you need to run migrations on first deployment:

```bash
# Enter the container
docker exec -it <container_name> sh

# Run migrations
npm run drizzle:migrate
```

### Setup Cron Jobs (Optional)

Configure cron jobs in Dockploy or use external services like cron-job.org:

```bash
# Scrape library data every 10 minutes
*/10 * * * * curl -H "x-api-key: YOUR_KEY" https://bib2.rjks.us/api/cron/scrape-library

# Scrape calendar data daily at 3 AM
0 3 * * * curl -H "x-api-key: YOUR_KEY" https://bib2.rjks.us/api/cron/scrape-calendar
```

## 🐛 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs <container_name>

# Verify environment variables
docker exec -it <container_name> env | grep -E "DATABASE_URL|API_KEY"

# Rebuild
make rebuild-prod
```

### SSL Certificate Issues

```bash
# Check Traefik logs
docker logs traefik

# Verify DNS propagation
dig bib2.rjks.us
nslookup bib2.rjks.us
```

### Domain Not Routing

1. Verify `traefik-public` network exists
2. Check Traefik labels in `docker-compose.yml`
3. Ensure Traefik is running and properly configured
4. Check domain matches exactly in labels

### Database Connection Issues

1. Verify `DATABASE_URL` format (use transaction pooling mode)
2. Check Supabase connection limits
3. Test connection from container:
   ```bash
   docker exec -it <container_name> sh
   npm install -g pg
   psql "$DATABASE_URL"
   ```

## 📊 Monitoring

### Health Checks

```bash
# API health
curl https://bib2.rjks.us/api/bib/$(date +%Y-%m-%d)

# Container status
docker ps
docker stats <container_name>
```

### Logs

```bash
# View logs
docker logs -f <container_name>

# Last 100 lines
docker logs --tail 100 <container_name>

# Since timestamp
docker logs --since 2024-01-01T00:00:00 <container_name>
```

## 🔄 Updates & Rollbacks

### Update Deployment

```bash
git push origin main
# Dockploy will auto-deploy if enabled
```

### Manual Rebuild

```bash
# In Dockploy UI: Click "Rebuild"
# Or via CLI:
make rebuild-prod
```

### Rollback

```bash
# In Dockploy UI:
# 1. Go to Deployments
# 2. Select previous successful deployment
# 3. Click "Redeploy"
```

## 📝 Important Notes

1. **Database Migrations**: Always backup before migrations
2. **Environment Variables**: Never commit `.env.production` to git
3. **API Keys**: Use strong, random keys for production
4. **SSL**: Let's Encrypt certificates auto-renew via Traefik
5. **Backups**: Regular database backups are crucial

## 🔗 Useful Links

- Production URL: https://bib2.rjks.us
- Repository: [GitHub Link]
- Dockploy Dashboard: [Your Dockploy URL]
- Supabase Dashboard: [Your Supabase Project]

## 📞 Support

For issues:
1. Check logs first
2. Review DOCKER.md for detailed commands
3. Check GitHub issues
4. Contact maintainer
