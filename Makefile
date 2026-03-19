# =============================================================================
# Makefile - Uni Mannheim Bib Scraper
# =============================================================================
#
# App runs on host (npm run dev). Docker is used ONLY for Postgres.
# =============================================================================

.PHONY: help install dev up down logs db-generate db-migrate db-studio db-push db-reset db-reset-seed clean prod-up prod-down prod-logs prod-ps prod-restart prod-reset

SHELL := /bin/zsh

# Colors
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m

# =============================================================================
# HELP
# =============================================================================

help: ## Show this help message
	@echo ""
	@echo "$(CYAN)Uni Mannheim Bib Scraper$(NC)"
	@echo "$(CYAN)=======================$(NC)"
	@echo ""
	@echo "$(YELLOW)Available commands:$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

# =============================================================================
# INSTALLATION
# =============================================================================

install: ## Install all dependencies
	@echo "$(CYAN)📦 Installing dependencies...$(NC)"
	pnpm install
	@echo "$(GREEN)✅ Dependencies installed$(NC)"

# =============================================================================
# INFRASTRUCTURE (Docker)
# =============================================================================

up: ## Start Postgres in Docker
	@echo "$(CYAN)🐳 Starting Postgres...$(NC)"
	docker compose -f docker-compose.dev.yml up -d
	@echo "$(GREEN)✅ Postgres started$(NC)"
	@echo ""
	@echo "  PostgreSQL: localhost:5432"
	@echo ""

down: ## Stop Postgres
	@echo "$(CYAN)🐳 Stopping Postgres...$(NC)"
	docker compose -f docker-compose.dev.yml down
	@echo "$(GREEN)✅ Postgres stopped$(NC)"

logs: ## Show Postgres logs
	docker compose -f docker-compose.dev.yml logs -f

# =============================================================================
# DEVELOPMENT
# =============================================================================

dev: up ## Start development (Postgres + Next.js with hot-reload)
	@echo "$(CYAN)🚀 Starting development server...$(NC)"
	pnpm dev

# =============================================================================
# DATABASE
# =============================================================================

db-generate: ## Generate Drizzle migrations from schema changes
	@echo "$(CYAN)📝 Generating migrations...$(NC)"
	pnpm drizzle:generate
	@echo "$(GREEN)✅ Migrations generated$(NC)"

db-migrate: ## Run pending migrations
	@echo "$(CYAN)🔄 Running migrations...$(NC)"
	pnpm drizzle:migrate
	@echo "$(GREEN)✅ Migrations complete$(NC)"

db-push: ## Push schema changes directly to database (dev only)
	@echo "$(CYAN)📤 Pushing schema to database...$(NC)"
	pnpm dlx drizzle-kit push
	@echo "$(GREEN)✅ Schema pushed$(NC)"

db-studio: ## Open Drizzle Studio (database GUI)
	@echo "$(CYAN)🎨 Opening Drizzle Studio...$(NC)"
	pnpm drizzle-kit studio

db-reset: down ## Reset database (WARNING: destroys all data)
	@echo "$(RED)⚠️  Resetting database...$(NC)"
	docker volume rm uni-mannheim-bib-scraper_postgres_data 2>/dev/null || true
	@$(MAKE) up
	@sleep 3
	@$(MAKE) db-push
	@echo "$(GREEN)✅ Database reset complete$(NC)"

db-reset-seed: down ## Reset database, run migrations and push schema
	@echo "$(RED)⚠️  Resetting database...$(NC)"
	docker volume rm uni-mannheim-bib-scraper_postgres_data 2>/dev/null || true
	@$(MAKE) up
	@sleep 3
	@echo "$(CYAN)📝 Generating migrations...$(NC)"
	pnpm drizzle:generate
	@echo "$(CYAN)🔄 Running migrations...$(NC)"
	pnpm drizzle:migrate
	@echo "$(CYAN)📤 Pushing schema...$(NC)"
	pnpm dlx drizzle-kit push
	@echo "$(GREEN)✅ Database reset and ready$(NC)"

# =============================================================================
# PRODUCTION (pull from GHCR + bundled Postgres)
# =============================================================================

PROD_COMPOSE := docker compose -f docker-compose.prod.yml

prod-up: ## Start production stack (pulls latest image from GHCR)
	@echo "$(CYAN)🚀 Pulling latest image and starting production stack...$(NC)"
	@$(MAKE) down 2>/dev/null || true
	$(PROD_COMPOSE) pull app
	$(PROD_COMPOSE) up -d
	@echo ""
	@echo "$(GREEN)✅ Production stack running$(NC)"
	@echo ""
	@echo "  Web App: http://localhost:3000"
	@echo ""

prod-down: ## Stop production stack
	@echo "$(CYAN)Stopping production stack...$(NC)"
	$(PROD_COMPOSE) down
	@echo "$(GREEN)✅ Production stack stopped$(NC)"

prod-logs: ## Follow production logs
	$(PROD_COMPOSE) logs -f

prod-ps: ## Show production container status
	$(PROD_COMPOSE) ps

prod-restart: ## Restart production stack
	@echo "$(CYAN)Restarting production stack...$(NC)"
	$(PROD_COMPOSE) restart
	@echo "$(GREEN)✅ Production stack restarted$(NC)"

prod-reset: prod-down ## Reset production data (WARNING: destroys all data)
	@echo "$(RED)⚠️  Resetting production data...$(NC)"
	docker volume rm uni-mannheim-bib-scraper_postgres_data 2>/dev/null || true
	@echo "$(GREEN)✅ Production data removed$(NC)"
	@echo "$(YELLOW)Run 'make prod-up' to start fresh.$(NC)"

# =============================================================================
# CLEANUP
# =============================================================================

clean: down ## Clean build artifacts, dependencies and Docker volumes
	@echo "$(CYAN)🧹 Cleaning project...$(NC)"
	rm -rf node_modules .next
	docker volume rm uni-mannheim-bib-scraper_postgres_data 2>/dev/null || true
	@echo "$(GREEN)✅ Cleanup complete$(NC)"

# =============================================================================
# SETUP (First time)
# =============================================================================

setup: ## Initial project setup (run this first!)
	@echo "$(CYAN)🎯 Setting up project...$(NC)"
	@cp -n example.env .env.local 2>/dev/null || echo "   .env.local already exists"
	@$(MAKE) install
	@$(MAKE) up
	@sleep 3
	@$(MAKE) db-push
	@echo ""
	@echo "$(GREEN)✅ Setup complete!$(NC)"
	@echo ""
	@echo "$(YELLOW)Next steps:$(NC)"
	@echo "  1. Review .env.local"
	@echo "  2. Run 'make dev' to start development"
	@echo ""
