# =============================================================================
# Raad LMS Frontend – Makefile
# =============================================================================

SHELL := /bin/bash
COMPOSE_FILE ?= docker-compose.yml
COMPOSE := docker compose -f $(COMPOSE_FILE)

CYAN   := \033[36m
GREEN  := \033[32m
YELLOW := \033[33m
RED    := \033[31m
BOLD   := \033[1m
RESET  := \033[0m
ECHO   := echo -e

.PHONY: help up down build force-rebuild restart install shell
.PHONY: logs ps clean health

# =============================================================================
# Help
# =============================================================================
help:
	@$(ECHO) "$(BOLD)Raad LMS Frontend$(RESET)"
	@$(ECHO) ""
	@$(ECHO) "  $(GREEN)up$(RESET)              Build and start production container"
	@$(ECHO) "  $(GREEN)down$(RESET)            Stop container (keeps volumes)"
	@$(ECHO) "  $(GREEN)build$(RESET)           Build production image"
	@$(ECHO) "  $(GREEN)force-rebuild$(RESET)   Stop, rebuild (no cache), start"
	@$(ECHO) "  $(GREEN)restart$(RESET)         Restart container"
	@$(ECHO) "  $(GREEN)install$(RESET)         Install deps on host for IDE support (via Docker)"
	@$(ECHO) "  $(GREEN)shell$(RESET)           Open shell in container"
	@$(ECHO) "  $(GREEN)logs$(RESET)            Follow container logs"
	@$(ECHO) "  $(GREEN)ps$(RESET)              Container status"
	@$(ECHO) "  $(GREEN)health$(RESET)          Verify frontend is serving"
	@$(ECHO) "  $(GREEN)clean$(RESET)           Stop, prune images and build cache"
	@$(ECHO) ""

# =============================================================================
# Lifecycle
# =============================================================================
up:
	@$(ECHO) "$(BOLD)Building and starting frontend...$(RESET)"
	@$(COMPOSE) build --pull
	@$(COMPOSE) up -d --build --remove-orphans
	@$(ECHO) "$(GREEN)Frontend is up: http://localhost:3000$(RESET)"

down:
	$(COMPOSE) down --remove-orphans

build:
	$(COMPOSE) build app

force-rebuild:
	@$(ECHO) "$(BOLD)1. Stopping frontend container...$(RESET)"
	@$(COMPOSE) down --remove-orphans
	@$(ECHO) "$(BOLD)2. Rebuilding image (no cache)...$(RESET)"
	@$(COMPOSE) build --no-cache app
	@$(ECHO) "$(BOLD)3. Starting...$(RESET)"
	@$(COMPOSE) up -d --remove-orphans
	@$(ECHO) "$(GREEN)Force rebuild done: http://localhost:3000$(RESET)"

restart:
	$(COMPOSE) restart

# =============================================================================
# Setup — install deps on host for IDE/TypeScript support
# =============================================================================
BUN_IMAGE ?= oven/bun:1-alpine

install:
	@$(ECHO) "$(BOLD)Installing dependencies on host (for IDE support)...$(RESET)"
	@docker run --rm -v "$(CURDIR):/app" -w /app $(BUN_IMAGE) bun install
	@$(ECHO) "$(GREEN)Done. node_modules available for IDE. Run 'make up' to start.$(RESET)"

# =============================================================================
# App commands
# =============================================================================
shell:
	$(COMPOSE) exec app sh

# =============================================================================
# Logs & status
# =============================================================================
logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps

# =============================================================================
# Health check
# =============================================================================
health:
	@$(ECHO) "$(BOLD)Frontend container$(RESET)"
	@docker ps --filter name=raad-lms-frontend --format '{{.Status}}' | grep -q . \
		&& $(ECHO) "   $(GREEN)raad-lms-frontend: running$(RESET)" \
		|| ($(ECHO) "   $(RED)raad-lms-frontend: not running (run: make up)$(RESET)" && exit 1)
	@code=$$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/ 2>/dev/null); \
	if [ "$$code" = "200" ]; then $(ECHO) "   $(GREEN)http://localhost:3000 → 200 OK$(RESET)"; \
	else $(ECHO) "   $(RED)http://localhost:3000 → HTTP $$code$(RESET)" && exit 1; fi
	@$(ECHO) "$(GREEN)Frontend healthy.$(RESET)"

# =============================================================================
# Cleanup
# =============================================================================
clean:
	@$(ECHO) "$(CYAN)Stopping containers...$(RESET)"
	@$(COMPOSE) down --remove-orphans 2>/dev/null || true
	@$(ECHO) "$(CYAN)Pruning images and build cache...$(RESET)"
	@docker image prune -f
	@docker builder prune -f
	@$(ECHO) "$(GREEN)Clean complete.$(RESET)"
