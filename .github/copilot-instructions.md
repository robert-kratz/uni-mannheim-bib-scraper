# Uni Mannheim Library Manager - AI Coding Instructions

## Project Overview

This Next.js 15 app tracks real-time library occupancy at University of Mannheim libraries and predicts future occupancy using linear regression. It scrapes library data, stores it in PostgreSQL, and displays occupancy graphs with weather context and semester calendar events.

**Core Libraries:** A3, A5, Jura, Schloss, BWL (defined in `utils/constants.ts` as `ALLOWED_LIBS`)

## Architecture

### Data Flow

1. **Scraping → Storage:** Cron routes (`app/api/cron/scrape-library/route.ts`) call `lib/scraper.ts` to scrape `bib.uni-mannheim.de`, normalize library names, and insert into `BibData` table
2. **Prediction:** `lib/prediction.ts` uses 8-week lookback with outlier filtering (Z-score 1.5) to generate linear regression predictions, stored in `BibPredictionData`
3. **API Layer:** `app/api/bib/[date]/route.ts` merges actual + predicted data via `lib/occupancy.ts`, returning time-slotted occupancy (144 × 10-min chunks/day)
4. **Frontend:** React components consume API data to render occupancy graphs, weather forecasts, and semester calendars

### Database Schema (`drizzle/schema.ts`)

-   **BibData:** Historical occupancy (percentage, name, year, month, day, chunk, iat, ttl)
-   **BibPredictionData:** Predicted occupancy (same structure as BibData)
-   **CalendarEvent:** Semester events (name, type enum, start, end) with unique constraint on (name, start)

**Critical:** Use Drizzle ORM with `db` from `drizzle/index.ts`. Connection uses `prepare: false` for transaction pooling compatibility with Supabase.

## Key Patterns

### Time Handling

-   **Always use Europe/Berlin timezone** via Luxon (`DateTime.fromISO(date, { zone: 'Europe/Berlin' })`)
-   **Chunk system:** Day divided into 144 × 10-minute slots (0-143). Calculate as `Math.floor((hour * 60 + minute) / 10)`
-   Format chunks as `HH:MM` using `chunkToTime()` helpers in prediction/occupancy libs

### Library Name Normalization

`lib/scraper.ts` maps scraped names to canonical IDs:

```typescript
'A3' → 'A3'
'A5' → 'A5'
'Ehrenhof' → 'Jura'
'Westflügel' → 'Schloss'
'Schneckenhof' → 'BWL'
```

Always validate against `ALLOWED_LIBS` set before DB insertion.

### API Authentication

Cron routes require `x-api-key` header matching `process.env.API_KEY`. Example:

```typescript
if (req.headers.get('x-api-key') !== API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Data Interpolation

`lib/occupancy.ts` fills gaps between existing data points using linear interpolation (see `interpolateGaps()`). Never extrapolate beyond first/last known chunk.

### Calendar Event Types

EventType enum: `'lecture' | 'exam' | 'holiday' | 'break' | 'event' | 'info'`
Scraper in `lib/scraper.ts` maps German labels to types:

-   "vorlesungszeit" → 'lecture'
-   "prüfungszeit" → 'exam'
-   "osterferien" → 'holiday'
-   etc.

## Development Workflows

### Local Development

```bash
npm install
npm run dev  # Starts Next.js on port 3000 with Turbopack
```

### Docker Development (Recommended)

```bash
# Start with hot reload
make dev-up      # With logs
make dev         # Detached

# Other commands
make down        # Stop containers
make logs        # View logs
make dkwi        # Enter container shell
make rebuild-dev # Full rebuild

# See DOCKER.md for complete guide
```

### Database Migrations

```bash
npm run drizzle:generate  # Generate migrations from schema changes
npm run drizzle:migrate   # Apply migrations to database
```

**Note:** `npm run build` automatically runs `drizzle:generate` before building.

### Environment Setup

Copy `example.env` to `.env.local` (or use `.env.development` for Docker):

-   `DATABASE_URL`: PostgreSQL connection string (Supabase transaction pool mode)
-   `API_KEY`: Secret for cron route authentication

For production, copy `.env.production.example` to `.env.production`.

### Cron Route Testing

```bash
# Scrape current library occupancy
curl -H "x-api-key: your_key" http://localhost:3000/api/cron/scrape-library

# Scrape semester calendar
curl -H "x-api-key: your_key" http://localhost:3000/api/cron/scrape-calendar

# (predict-library route not yet implemented)
```

## Component Conventions

### Data Fetching

-   Use server components for initial data load (see `components/pages/IndexPage.tsx`)
-   Client components use hooks (`hooks/use-occupancy.tsx`, `use-weather.tsx`) with `useSWR` for client-side fetching

### Occupancy Visualization

-   **Desktop:** `OccupancyGraph.tsx` (Recharts line chart)
-   **Mobile:** `MobileOccupancyGraph.tsx` (optimized for small screens)
-   Both consume `OccupancyDataPoint[]` with `time`, `occupancy`, `prediction` fields

### Styling

Tailwind CSS with `tailwindcss-animate` for transitions. Use library colors from `utils/constants.ts`:

-   A3: `#3B82F6` (blue)
-   A5: `#10B981` (green)
-   Schloss: `#F59E0B` (amber)
-   Jura: `#EC4899` (pink)
-   BWL: `#8B5CF6` (purple)

## Common Pitfalls

1. **Timezone mismatches:** Always use `Europe/Berlin` when parsing dates from API routes or scraping
2. **Missing library filtering:** Always check `ALLOWED_LIBS` before inserting into DB to prevent bad data
3. **Chunk boundary errors:** Chunk range is 0-143. API routes accept `startChunk` and `endChunk` params (default: 0-143)
4. **Date format:** API expects `YYYY-MM-DD` format. Validate with `/^\d{4}-\d{2}-\d{2}$/` before processing
5. **Drizzle prepare mode:** Never enable `prepare: true` in postgres client config (breaks Supabase pooling)

## Deployment

### Docker/Dockploy (Production)

Self-hosted on `bib2.rjks.us` using Dockploy with Traefik:

```bash
# Production commands
make prod        # Start detached
make prod-up     # Start with logs
make prod-down   # Stop
make prod-pull   # Pull latest image from GitHub Container Registry
make rebuild-prod # Pull latest and restart
```

**CI/CD Pipeline:**

-   GitHub Actions automatically builds Docker image on push to `main`
-   Image pushed to GitHub Container Registry (`ghcr.io/robert-kratz/uni-mannheim-bib-scraper`)
-   Dockploy pulls pre-built image (no build on server)

**Traefik Configuration:** Labels in `docker-compose.prod.yml` handle:

-   Automatic SSL via Let's Encrypt
-   Domain routing for `bib2.rjks.us`
-   HTTP → HTTPS redirect

See `DOCKER.md` for complete deployment guide.

## Key Files Reference

-   `lib/scraper.ts` - Web scraping logic for library + calendar data
-   `lib/prediction.ts` - Linear regression prediction engine (8-week lookback)
-   `lib/occupancy.ts` - Merges actual + predicted data with interpolation
-   `drizzle/schema.ts` - Database schema definitions
-   `utils/constants.ts` - Library definitions and allowed library set
-   `app/api/bib/[date]/route.ts` - Main occupancy API endpoint
-   `app/api/cron/*` - Background scraping jobs (require API key auth)
-   `Dockerfile` / `Dockerfile.dev` - Production/dev containerization
-   `docker-compose.prod.yml` / `docker-compose.dev.yml` - Docker orchestration
-   `Makefile` - Development shortcuts
-   `.github/workflows/build-docker.yml` - CI/CD pipeline for Docker builds
-   `DOCKER.md` - Complete Docker deployment guide
