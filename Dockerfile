# ─────────────────────────────────────────────────────────────
# WARP Dashboard — Multi-stage Docker build
# Node.js (Remotion pipeline) + Python (Streamlit dashboard)
# ─────────────────────────────────────────────────────────────

FROM node:20-bookworm AS base

# ── System dependencies ──────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    ffmpeg \
    # Chromium deps for Remotion headless render
    chromium \
    libnss3 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*

# Tell Remotion / Puppeteer where Chromium is
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV REMOTION_CHROME_EXECUTABLE=/usr/bin/chromium

WORKDIR /app

# ── Node.js dependencies ────────────────────────────────────
COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline 2>/dev/null || npm install --legacy-peer-deps

# ── Python virtual environment ──────────────────────────────
COPY dashboard/requirements.txt /app/dashboard/requirements.txt
RUN python3 -m venv /app/.venv && \
    /app/.venv/bin/pip install --no-cache-dir --upgrade pip && \
    /app/.venv/bin/pip install --no-cache-dir -r /app/dashboard/requirements.txt

ENV PATH="/app/.venv/bin:$PATH"

# ── Copy project files ──────────────────────────────────────
COPY . .

# ── Ensure output directories exist ─────────────────────────
RUN mkdir -p /app/out /app/public/topics

# ── Expose Streamlit port ────────────────────────────────────
EXPOSE 8501

# ── Health check ─────────────────────────────────────────────
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8501/_stcore/health || exit 1

# ── Run dashboard ────────────────────────────────────────────
CMD ["streamlit", "run", "dashboard/app.py", \
     "--server.port=8501", \
     "--server.address=0.0.0.0", \
     "--server.headless=true", \
     "--browser.gatherUsageStats=false"]
