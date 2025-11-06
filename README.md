# Uni Mannheim Library Manager

A real-time library occupancy tracking system for the University of Mannheim. This Next.js 15 application monitors and predicts library occupancy across five campus libraries, helping students find available study spaces efficiently.

## Features

-   **Real-time Occupancy Tracking** - Live data from all major libraries (A3, A5, Jura, Schloss, BWL)
-   **Predictive Analytics** - 8-week lookback with linear regression for future occupancy predictions
-   **Weather Integration** - Weather context via met.no API for Mannheim
-   **Semester Calendar** - University calendar integration with event tracking
-   **Responsive Design** - Optimized desktop and mobile views with Recharts visualizations
-   **Performance Optimized** - 5-minute caching strategy for fast page loads
-   **Docker Support** - Production and development containerization with hot reload

## Architecture

### Tech Stack

-   **Framework**: Next.js 15 (App Router, TypeScript)
-   **Database**: PostgreSQL with Drizzle ORM
-   **Hosting**: Self-hosted on Dockploy with Traefik reverse proxy
-   **Styling**: Tailwind CSS with tailwindcss-animate
-   **Charts**: Recharts
-   **Date/Time**: Luxon (Europe/Berlin timezone)
-   **CI/CD**: GitHub Actions with GitHub Container Registry

### Data Flow

```
Web Scraping → PostgreSQL → API Routes → React Components
     ↓            ↓             ↓              ↓
  Cron Jobs   BibData/     Cache (5min)   Visualizations
             Predictions
```

## Quick Start

### Local Development

```bash
# Clone the repository
git clone https://github.com/robert-kratz/uni-mannheim-bib-scraper.git
cd uni-mannheim-bib-scraper

# Install dependencies
npm install

# Set up environment variables
cp example.env .env.local
# Edit .env.local with your DATABASE_URL and API_KEY

# Run development server
npm run dev

# Open http://localhost:3000
```

### Docker Development (Recommended)

```bash
# Start with hot reload
make dev-up      # With logs
make dev         # Detached mode

# Other commands
make logs        # View logs
make down        # Stop containers
make dkwi        # Enter container shell
make rebuild-dev # Full rebuild
```

See [DOCKER.md](DOCKER.md) for complete Docker documentation.

## API Endpoints

### Public Endpoints

-   `GET /api/bib/[date]` - Daily occupancy data (YYYY-MM-DD format)
    -   Returns: Actual + predicted occupancy for all libraries
    -   Cache: 5 minutes
-   `GET /api/bib/[date]/predict` - Prediction-only data
    -   Returns: Predicted occupancy based on historical patterns

### Cron Endpoints (Require API Key)

-   `GET /api/cron/scrape-library` - Scrape current library data
-   `GET /api/cron/scrape-calendar` - Scrape university calendar
-   `GET /api/cron/predict-library` - Generate predictions (to be implemented)

**Authentication**: Include `x-api-key` header with your API key.

## 🔧 Configuration

### Environment Variables

```bash
DATABASE_URL="postgresql://..."  # Supabase connection string (transaction pooling)
API_KEY="your_api_key"          # Secret for cron route authentication
NODE_ENV="development|production"
```

### Database Migrations

```bash
# Generate migrations from schema changes
npm run drizzle:generate

# Apply migrations to database
npm run drizzle:migrate
```

## Data & Algorithms

### Time Chunking System

-   Day divided into **144 × 10-minute slots** (0-143)
-   Chunk calculation: `Math.floor((hour * 60 + minute) / 10)`
-   Timezone: Always **Europe/Berlin**

### Prediction Algorithm

-   **Method**: Linear regression with outlier filtering
-   **Lookback**: 8 weeks of historical data
-   **Outlier Detection**: Z-score threshold of 1.5
-   **Interpolation**: Fills gaps between data points (no extrapolation)

### Library Name Normalization

Scraped names are normalized to canonical IDs:

-   `A3` → A3
-   `A5` → A5
-   `Ehrenhof` → Jura
-   `Westflügel` → Schloss
-   `Schneckenhof` → BWL

## Deployment

### Production (Dockploy + GitHub Actions)

```bash
# Production commands
make prod        # Start detached
make prod-up     # Start with logs
make prod-pull   # Pull latest image
make rebuild-prod # Pull latest and restart
```

**Deployment Flow**:

1. Push to `main` branch
2. GitHub Actions builds Docker image
3. Image pushed to GitHub Container Registry
4. Dockploy pulls and deploys automatically

See [DOCKPLOY.md](DOCKPLOY.md) and [CI-CD.md](CI-CD.md) for detailed deployment guides.

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   │   ├── bib/         # Occupancy endpoints
│   │   └── cron/        # Background jobs
│   └── page.tsx         # Main page
├── components/           # React components
│   ├── pages/           # Page components
│   ├── calendar/        # Calendar widgets
│   └── ui/              # UI primitives
├── lib/
│   ├── scraper.ts       # Web scraping logic
│   ├── prediction.ts    # Prediction algorithm
│   ├── occupancy.ts     # Data merging & interpolation
│   ├── calendar.ts      # Calendar data access
│   └── weather.ts       # Weather API integration
├── drizzle/
│   ├── schema.ts        # Database schema
│   └── migrations/      # DB migrations
├── utils/
│   ├── constants.ts     # Library definitions
│   └── types.d.ts       # TypeScript types
└── hooks/               # React hooks (SWR-based)
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is open source and available under the MIT License.

## Authors

-   [Robert Julian Kratz](https://github.com/robert-kratz) - Lead Developer
-   [Virgil Baclanov](https://github.com/its-gil) - Co-Developer

## Links

-   **Production**: [bib2.rjks.us](https://bib2.rjks.us)
-   **Repository**: [GitHub](https://github.com/robert-kratz/uni-mannheim-bib-scraper)
-   **Documentation**:
    -   [Docker Guide](DOCKER.md)
    -   [Deployment Guide](DOCKPLOY.md)
    -   [CI/CD Pipeline](CI-CD.md)
    -   [AI Coding Instructions](.github/copilot-instructions.md)

## Acknowledgments

-   University of Mannheim for providing library data
-   met.no for weather API access
-   Open source community for the amazing tools

---

**Note**: This project is not officially affiliated with the University of Mannheim.
