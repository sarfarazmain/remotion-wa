# ─────────────────────────────────────────────────────────────────────
# WARP Development Workflow
# The Wealth Archive Remotion Pipeline
#
# Branching model:
#   dev   → local testing (this is where you work)
#   main  → auto-deploys to render.thewealtharchive.com
#
# Quick start:
#   make install   Install Python deps into .venv
#   make dev       Start dashboard on http://localhost:8502
#   make stop      Kill local dashboard
#   make promote   Merge dev → main → Render deploy
# ─────────────────────────────────────────────────────────────────────

VENV     := .venv
PY       := $(VENV)/bin/python3
PIP      := $(VENV)/bin/pip
ST       := $(VENV)/bin/streamlit

DEV_PORT := 8502
PROD_URL := https://render.thewealtharchive.com

# ── Colours ───────────────────────────────────────────────────────────
GREEN  := \033[0;32m
YELLOW := \033[0;33m
RED    := \033[0;31m
RESET  := \033[0m

.PHONY: help install dev stop validate promote status

# ── Default target ───────────────────────────────────────────────────
help:
	@echo ""
	@echo "  $(GREEN)WARP Development Commands$(RESET)"
	@echo "  ──────────────────────────────────────"
	@echo "  $(YELLOW)make install$(RESET)                Install / update Python dependencies"
	@echo "  $(YELLOW)make dev$(RESET)                    Start dashboard on http://localhost:$(DEV_PORT)"
	@echo "  $(YELLOW)make stop$(RESET)                   Kill local dashboard server"
	@echo "  $(YELLOW)make validate TOPIC=<path>$(RESET)  Validate a topic JSON file"
	@echo "  $(YELLOW)make promote$(RESET)                Merge dev → main → trigger Render deploy"
	@echo "  $(YELLOW)make status$(RESET)                 Show branch + uncommitted changes"
	@echo ""

# ── Install Python dependencies ───────────────────────────────────────
install:
	@test -d $(VENV) || python3 -m venv $(VENV)
	@$(PIP) install --quiet --upgrade pip
	@$(PIP) install --quiet -r dashboard/requirements.txt
	@echo "$(GREEN)✓ Dependencies installed$(RESET)"

# ── Start local dev server ────────────────────────────────────────────
dev: install
	@echo ""
	@echo "  $(GREEN)WARP Dashboard — DEV$(RESET)"
	@echo "  URL  : http://localhost:$(DEV_PORT)"
	@echo "  PROD : $(PROD_URL)"
	@echo "  Branch: $$(git branch --show-current)"
	@echo ""
	@$(ST) run dashboard/app.py \
		--server.port=$(DEV_PORT) \
		--server.address=localhost \
		--server.headless=true \
		--browser.serverAddress=localhost \
		--browser.gatherUsageStats=false

# ── Kill local server ─────────────────────────────────────────────────
stop:
	@pkill -f "streamlit run dashboard/app.py" 2>/dev/null \
		&& echo "$(GREEN)✓ Dev server stopped$(RESET)" \
		|| echo "$(YELLOW)No dev server was running$(RESET)"

# ── Validate a topic JSON ─────────────────────────────────────────────
validate:
	@test -n "$(TOPIC)" || (echo "$(RED)Usage: make validate TOPIC=topics/my-topic.json$(RESET)" && exit 1)
	@npx tsx pipeline/stages/validate.ts $(TOPIC)

# ── Promote dev → main → Render ───────────────────────────────────────
promote:
	@BRANCH=$$(git branch --show-current); \
	if [ "$$BRANCH" != "dev" ]; then \
		echo "$(RED)✗ You are on '$$BRANCH'. Switch to 'dev' branch first:$(RESET)"; \
		echo "    git checkout dev"; \
		exit 1; \
	fi
	@if ! git diff --quiet || ! git diff --cached --quiet; then \
		echo "$(RED)✗ Uncommitted changes. Commit or stash first.$(RESET)"; \
		git status --short; \
		exit 1; \
	fi
	@echo "$(YELLOW)Promoting dev → main...$(RESET)"
	@git checkout main
	@git merge dev --no-edit
	@git push origin main
	@git checkout dev
	@echo ""
	@echo "$(GREEN)✓ Promoted to main.$(RESET)"
	@echo "  Render will deploy to $(PROD_URL) in ~2 minutes."
	@echo "  Watch progress: https://dashboard.render.com"
	@echo ""

# ── Show status ───────────────────────────────────────────────────────
status:
	@echo "Branch  : $$(git branch --show-current)"
	@echo "Last commit: $$(git log --oneline -1)"
	@git status --short
