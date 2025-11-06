.PHONY: help dev dev-up down logs dkwi build-dev rebuild-dev rebuild-prod build-prod prod prod-up prod-down prod-logs clean

# Default target
.DEFAULT_GOAL := help

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m # No Color

##@ Help

help: ## Display this help message
	@echo "$(BLUE)Available commands:$(NC)"
	@awk 'BEGIN {FS = ":.*##"; printf "\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Development

dev: ## Start dev environment (detached, no logs)
	@echo "$(BLUE)Starting development environment...$(NC)"
	docker-compose -f docker-compose.dev.yml up -d

dev-up: ## Start dev environment with logs
	@echo "$(BLUE)Starting development environment with logs...$(NC)"
	docker-compose -f docker-compose.dev.yml up

down: ## Stop dev environment
	@echo "$(YELLOW)Stopping development environment...$(NC)"
	docker-compose -f docker-compose.dev.yml down

logs: ## Show dev logs
	docker-compose -f docker-compose.dev.yml logs -f

dkwi: ## Enter dev container shell
	@echo "$(BLUE)Entering container shell...$(NC)"
	docker-compose -f docker-compose.dev.yml exec app sh

build-dev: ## Build dev image
	@echo "$(BLUE)Building development image...$(NC)"
	docker-compose -f docker-compose.dev.yml build

rebuild-dev: ## Rebuild and restart dev environment
	@echo "$(BLUE)Rebuilding development environment...$(NC)"
	docker-compose -f docker-compose.dev.yml down
	docker-compose -f docker-compose.dev.yml build --no-cache
	docker-compose -f docker-compose.dev.yml up -d
	@echo "$(GREEN)Development environment rebuilt!$(NC)"

##@ Production

prod: ## Start production environment (detached, no logs)
	@echo "$(BLUE)Starting production environment...$(NC)"
	docker-compose -f docker-compose.prod.yml up -d

prod-up: ## Start production environment with logs
	@echo "$(BLUE)Starting production environment with logs...$(NC)"
	docker-compose -f docker-compose.prod.yml up

prod-down: ## Stop production environment
	@echo "$(YELLOW)Stopping production environment...$(NC)"
	docker-compose -f docker-compose.prod.yml down

prod-logs: ## Show production logs
	docker-compose -f docker-compose.prod.yml logs -f

prod-pull: ## Pull latest production image from registry
	@echo "$(BLUE)Pulling latest production image...$(NC)"
	docker-compose -f docker-compose.prod.yml pull

build-prod: ## Build production image locally
	@echo "$(BLUE)Building production image...$(NC)"
	docker build -t ghcr.io/robert-kratz/uni-mannheim-bib-scraper:latest .

rebuild-prod: ## Pull latest image and restart production environment
	@echo "$(BLUE)Pulling and restarting production environment...$(NC)"
	docker-compose -f docker-compose.prod.yml down
	docker-compose -f docker-compose.prod.yml pull
	docker-compose -f docker-compose.prod.yml up -d
	@echo "$(GREEN)Production environment restarted with latest image!$(NC)"

##@ Utility

clean: ## Clean up containers, volumes and images
	@echo "$(YELLOW)Cleaning up Docker resources...$(NC)"
	docker-compose -f docker-compose.dev.yml down -v
	docker-compose -f docker-compose.prod.yml down -v
	@echo "$(GREEN)Cleanup complete!$(NC)"

restart-dev: ## Restart dev environment
	@echo "$(BLUE)Restarting development environment...$(NC)"
	docker-compose -f docker-compose.dev.yml restart

restart-prod: ## Restart production environment
	@echo "$(BLUE)Restarting production environment...$(NC)"
	docker-compose -f docker-compose.prod.yml restart

ps: ## Show running containers
	@echo "$(BLUE)Development:$(NC)"
	@docker-compose -f docker-compose.dev.yml ps
	@echo "\n$(BLUE)Production:$(NC)"
	@docker-compose -f docker-compose.prod.yml ps
