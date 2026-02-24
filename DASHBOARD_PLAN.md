# WARP Dashboard — Global Production Pipeline

## The Goal

Turn the local-only video pipeline into a **web-accessible production dashboard** that anyone with a browser can use to go from a **topic idea → rendered YouTube Short**. The only manual step remains HeyGen (upload avatar.mp4). Everything else is automated.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    STREAMLIT DASHBOARD                           │
│                   (Python — 4 pages)                             │
├─────────────────────────────────────────────────────────────────┤
│  Page 1: TOPIC CREATOR         │  Page 2: AVATAR UPLOAD          │
│  ● Provide a topic idea        │  ● Upload HeyGen avatar.mp4     │
│  ● Perplexity generates the    │  ● Preview video inline          │
│    full topic.json via LLM     │  ● Auto-extract narration MP3    │
│  ● Review & edit JSON          │                                  │
│  ● Validate against Zod schema │                                  │
├─────────────────────────────────────────────────────────────────┤
│  Page 3: PIPELINE RUNNER       │  Page 4: PREVIEW & DOWNLOAD      │
│  ● One-click "Render"          │  ● Play final video inline       │
│  ● Real-time stage progress    │  ● Download MP4                  │
│  ● Log streaming               │  ● Freesound SFX credits         │
│  ● Stage-by-stage status       │  ● Render metadata               │
└─────────────────────────────────────────────────────────────────┘
        │
        │  subprocess.Popen (streams stdout)
        ▼
┌─────────────────────────────────────────────────────────────────┐
│              NODE.JS PIPELINE (existing run.ts)                   │
│  validate → whisper → pexels → freesound → generate → render     │
└─────────────────────────────────────────────────────────────────┘
        │
        │  npx remotion render (headless Chrome)
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    OUTPUT: final.mp4                              │
│              1080×1920 · 30fps · H.264 · ~50s                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Page-by-Page Design

### Page 1: Topic Creator (THE KEY INNOVATION)

**This is where Perplexity earns its keep.** Instead of manually authoring a 300-line topic.json, the user provides:

1. **A topic title** (e.g., "Financial Repression")
2. **An archetype** (dropdown: HIDDEN_MECHANISM / TIMELINE_EVOLUTION / GREAT_MAN)
3. **Optional guidance** (free text: "Focus on how governments steal purchasing power through inflation")

The dashboard then:
- Calls **Perplexity Sonar API** with a structured system prompt that includes:
  - The full Zod schema as a specification
  - The WARP Master Protocol rules for scene variety, typography constraints (≤18 chars), chart data requirements
  - Example topic.json (financial-repression.json) as a reference
  - Instructions to produce valid JSON with 10-14 scenes, proper transitions, chart data, evidence cards, etc.
- Receives the generated topic.json
- Validates it client-side against the Zod schema (via a Python port or by shelling out to `npx tsx pipeline/stages/validate.ts`)
- Shows a **live JSON editor** (st.data_editor for scenes table + st.text_area for raw JSON)
- Shows the **full narration text** extracted from the JSON — this is what the user will paste into HeyGen
- Has a **"Regenerate" button** if the user isn't happy
- Has a **"Lock & Continue" button** that saves topics/{slug}.json and moves to Page 2

**Perplexity System Prompt Structure:**
```
You are a creative director for "The Wealth Archive" YouTube Shorts channel.
Given a topic, produce a complete topic.json that conforms to this schema:
{schema}

Rules:
- Exactly 10-14 scenes
- transitions.length === scenes.length - 1
- Every STATEMENT_STATE scene needs typography with lines ≤18 chars each
- Every DATA_STATE scene needs a chart with real data
- Vary heroType: don't repeat the same type 3x in a row
- Vary transitions: use Z_AXIS_PORTAL, INK_BLEED, FLASHBULB sparingly
- narration field = concatenation of all scene narrations
- bgm.trackId = "bgm_dark_high_drone_01"
- Include pexelsVideoQuery and pexelsImageQuery for every scene
- Include heroWord for audio sync
- Use real economic/financial data in charts

Example:
{financial-repression.json}
```

### Page 2: Avatar Upload

- **File uploader** for HeyGen avatar.mp4 (st.file_uploader, type=["mp4"])
- **Video preview** of the uploaded avatar (st.video)
- **Narration script display** (from topic.json) — for the user to copy-paste into HeyGen before uploading
- Copies uploaded file to `public/topics/{slug}/avatar.mp4`
- Auto-runs **ffmpeg audio extraction** (narration.mp3) immediately on upload
- Shows extraction status + audio preview
- **"Continue to Render" button** → Page 3

### Page 3: Pipeline Runner

- **"Start Pipeline" button** — runs `npx tsx pipeline/run.ts topics/{slug}.json --skip-heygen`
  (HeyGen is skipped because avatar.mp4 is already uploaded)
- **Real-time progress** via subprocess.Popen:
  - Parse pipeline stdout for stage markers (`━━━ STAGE N:`)
  - Update st.progress() bar (0% → 100% across 7 stages)
  - Show current stage name in st.status()
  - Stream log lines in a scrollable st.code() container
  - Parse Remotion render progress (`Rendered frame X/Y`) for granular bar
- **Stage status chips**: ✅ Validate → ✅ Whisper → 🔄 Pexels → ⏳ SFX → ⏳ Generate → ⏳ Render
- On completion: auto-navigate to Page 4
- On failure: show error log, offer "Retry" button

### Page 4: Preview & Download

- **Video player** (st.video) with the rendered output
- **Download button** (st.download_button) for the MP4
- **Metadata display**: duration, file size, frame count, scene count
- **SFX credits**: parsed from manifest.json (Freesound attribution)
- **"New Video" button** → back to Page 1

---

## Technical Implementation Plan

### Step 1: Project Structure

```
dashboard/
├── app.py                          # Streamlit entry point + page router
├── pages/
│   ├── 1_Topic_Creator.py          # Perplexity-powered JSON generator
│   ├── 2_Avatar_Upload.py          # HeyGen MP4 upload
│   ├── 3_Pipeline_Runner.py        # Execute pipeline + stream logs
│   └── 4_Preview_Download.py       # Video preview + download
├── utils/
│   ├── perplexity.py               # Perplexity Sonar API client
│   ├── pipeline.py                 # subprocess.Popen wrapper + log parser
│   ├── validator.py                # Topic JSON validation (calls Node validate)
│   └── state.py                    # Session state helpers
├── requirements.txt                # streamlit, requests
├── .streamlit/
│   └── config.toml                 # maxUploadSize=500, theme
└── Dockerfile                      # Node.js + Python + ffmpeg + Chromium
```

### Step 2: Perplexity Topic Generator (utils/perplexity.py)

- Uses `requests` to call `https://api.perplexity.ai/chat/completions`
- Model: `sonar` (fast, good at structured output)
- System prompt embeds: Zod schema text, WARP SOP rules, example JSON
- Response parsed as JSON, validated, shown to user
- Retry logic: if validation fails, feed errors back to Perplexity for correction

### Step 3: Pipeline Subprocess (utils/pipeline.py)

```python
def run_pipeline(slug: str, project_root: str, on_line: Callable):
    cmd = [
        "npx", "tsx", "pipeline/run.ts",
        f"topics/{slug}.json",
        "--skip-heygen"
    ]
    process = subprocess.Popen(
        cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
        text=True, bufsize=1, cwd=project_root
    )
    for line in iter(process.stdout.readline, ""):
        on_line(line.strip())
    process.wait()
    return process.returncode
```

### Step 4: Docker Container

```dockerfile
FROM node:22-bookworm-slim

# System deps: Chromium for Remotion, ffmpeg, Python for Whisper + Streamlit
RUN apt-get update && apt-get install -y \
    python3 python3-pip python3-venv \
    ffmpeg \
    libnss3 libdbus-1-3 libatk1.0-0 libgbm-dev libasound2 \
    libxrandr2 libxkbcommon-dev libxfixes3 libxcomposite1 \
    libxdamage1 libatk-bridge2.0-0 libpango-1.0-0 libcairo2 libcups2 \
    fonts-liberation fonts-noto-color-emoji \
    && rm -rf /var/lib/apt/lists/*

# Whisper
RUN pip3 install --break-system-packages openai-whisper

# Project
WORKDIR /app
COPY package*.json ./
RUN npm ci
RUN npx remotion browser ensure

COPY . .

# Streamlit
RUN pip3 install --break-system-packages -r dashboard/requirements.txt

EXPOSE 8501
CMD ["streamlit", "run", "dashboard/app.py", \
     "--server.port=8501", "--server.address=0.0.0.0"]
```

### Step 5: Deployment

**Recommended: Railway or a $20/mo Hetzner VPS with Docker**

- Railway: Supports Dockerfile, persistent volumes, HTTPS, custom domains
- Hetzner CPX31 (4 vCPU, 8GB RAM, ~$14/mo): Enough for renders + Streamlit
- Alternative: DigitalOcean App Platform with Docker

**Environment variables** (set in Railway/VPS, not in .env):
- `PEXELS_API_KEY`
- `PERPLEXITY_API_KEY`
- `FREESOUND_API_KEY`
- `OPENAI_API_KEY` (if using Whisper API instead of local)

---

## What Changes in the Existing Pipeline

### Minimal changes — the dashboard wraps the existing pipeline, it does NOT rewrite it.

1. **`pipeline/run.ts`** — No changes. Already supports `--skip-heygen`.
2. **`pipeline/stages/render.ts`** — No changes. Works headless.
3. **`pipeline/stages/transcribe.ts`** — No changes. Whisper runs from CLI.
4. **New: `dashboard/` folder** — All new Python code lives here.
5. **`topics/` folder** — Dashboard writes topic.json here (currently empty).
6. **`public/topics/{slug}/`** — Dashboard writes uploaded avatar.mp4 here.
7. **`.env`** → Move API keys to environment variables for Docker deployment.

### One potential optimization:

If Whisper local is too slow on a small VPS, we could swap `pipeline/stages/transcribe.ts` to use the **OpenAI Whisper API** (cloud) instead of local Whisper CLI. This would:
- Remove the Python/Whisper dependency from Docker
- Make renders 30-120s faster (no local transcription)
- Cost ~$0.006 per minute of audio ($0.03 for a 50s video)
- Require `OPENAI_API_KEY` env var

---

## Implementation Order

| Step | What | Effort |
|------|------|--------|
| 1 | Create `dashboard/` folder structure + `requirements.txt` | 10 min |
| 2 | Build `utils/perplexity.py` — Sonar API client with schema prompt | 30 min |
| 3 | Build Page 1: Topic Creator with Perplexity generation + JSON editor | 1 hr |
| 4 | Build Page 2: Avatar Upload with ffmpeg extraction | 30 min |
| 5 | Build `utils/pipeline.py` — subprocess wrapper + log parser | 30 min |
| 6 | Build Page 3: Pipeline Runner with real-time progress | 1 hr |
| 7 | Build Page 4: Preview & Download | 20 min |
| 8 | Build `app.py` entry point with session state | 20 min |
| 9 | Write Dockerfile | 30 min |
| 10 | Test locally with `streamlit run` | 30 min |
| 11 | Deploy to Railway/Hetzner | 30 min |
| **Total** | | **~5-6 hours** |

---

## Key Design Decisions

1. **Streamlit over NiceGUI/Gradio**: Fastest to prototype, good enough for a production dashboard, largest community. Can migrate to NiceGUI later if layout limitations bite.

2. **Perplexity for topic generation**: The user should NEVER have to write topic.json by hand. Perplexity Sonar is fast, cheap, and good at structured JSON output. The schema + example in the system prompt ensures validity.

3. **Wrap don't rewrite**: The Node.js pipeline stays intact. The Python dashboard is a thin orchestration layer that calls `npx tsx pipeline/run.ts` as a subprocess. Zero risk of breaking existing functionality.

4. **Docker for portability**: One `docker build && docker run` command and it works on any Linux machine in the world. No "works on my Mac" issues.

5. **Skip HeyGen automation**: HeyGen web is manual by design (they don't have a free API for video generation). The dashboard just provides the narration script to copy and accepts the avatar.mp4 upload. This is the cleanest UX possible for a manual step.

6. **BGM is pre-bundled**: The BGM file (`bgm_dark_high_drone_01.mp3`) is already generated and committed. topic.json references it by trackId. No need for the user to provide BGM.
