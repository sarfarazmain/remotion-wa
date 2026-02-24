"""
Background render manager.

Runs the Remotion render in a background process and tracks progress
via a shared JSON status file. This avoids blocking the Streamlit
event loop, which would cause Cloudflare tunnel timeouts (530 errors)
on long-running renders.

The render process is launched via posix_spawnp (fork-free), and
progress is polled from the status file on each Streamlit rerun cycle.
"""

import json
import os
import re
import tempfile
import time
import shutil
from pathlib import Path
from typing import Optional

from .state import get_project_root
from .launch import launch_command

# Regex for parsing Remotion progress
RENDER_PROGRESS_RE = re.compile(r"(\d+)/(\d+)")
BUNDLING_RE = re.compile(r"Bundling\s+(\d+)%")

# Status file lives in out/ so it's easy to find
def _status_path(slug: str) -> Path:
    return get_project_root() / "out" / f".{slug}_render_status.json"


def _log_path(slug: str) -> Path:
    return get_project_root() / "out" / f"{slug}_render_live.log"


def _create_staging_dir(slug: str) -> Path:
    """
    Create a lightweight staging directory with symlinks to only the assets
    needed for this topic. Remotion copies the entire public dir into a temp
    bundle — with stale topics this was 408MB. With symlinks, only ~92MB.
    """
    project_root = get_project_root()
    staging_dir = project_root / "out" / f".render_public_{slug}"

    # Clean up any previous staging dir
    if staging_dir.exists():
        shutil.rmtree(str(staging_dir))

    # Create structure
    (staging_dir / "topics").mkdir(parents=True, exist_ok=True)

    # Symlink only what the composition needs
    topic_dir = project_root / "public" / "topics" / slug
    if topic_dir.exists():
        os.symlink(str(topic_dir), str(staging_dir / "topics" / slug))

    bgm_dir = project_root / "public" / "bgm"
    if bgm_dir.exists():
        os.symlink(str(bgm_dir), str(staging_dir / "bgm"))

    noise_file = project_root / "public" / "noise.bmp"
    if noise_file.exists():
        os.symlink(str(noise_file), str(staging_dir / "noise.bmp"))

    return staging_dir


def start_render(slug: str) -> bool:
    """
    Launch the render in the background. Returns True if started successfully.
    """
    project_root = get_project_root()
    npx_bin = shutil.which("npx") or "npx"
    output_mp4 = f"out/{slug}.mp4"

    # Ensure out/ exists
    (project_root / "out").mkdir(parents=True, exist_ok=True)

    # Write initial status
    status = {
        "state": "starting",
        "progress": 0.0,
        "label": "Starting render...",
        "log_lines": [],
        "error": None,
        "exit_code": None,
        "started_at": time.time(),
    }
    _status_path(slug).write_text(json.dumps(status))

    # Create staging dir with only needed assets (saves ~318MB copy time)
    staging_dir = _create_staging_dir(slug)

    # Dynamic concurrency: 50% of CPU cores, min 2, max 4
    cpu_count = os.cpu_count() or 4
    concurrency = min(max(cpu_count // 2, 2), 4)

    # The render command
    render_cmd = (
        f'cd "{project_root}" && '
        f'NODE_OPTIONS="--max-old-space-size=8192" '
        f'"{npx_bin}" remotion render src/index.ts WealthArchive '
        f'"{output_mp4}" '
        f'--codec h264 --concurrency {concurrency} --timeout=120000 '
        f'--gl=angle '
        f'--public-dir "{staging_dir}" '
        f'--log=verbose'
    )

    log_file = str(_log_path(slug))
    launch_command(render_cmd, log_file)

    return True


def poll_render_status(slug: str) -> dict:
    """
    Read the live log file and parse progress.
    Returns a status dict with: state, progress, label, log_lines, exit_code, error
    """
    log_path = _log_path(slug)
    status_path = _status_path(slug)

    # Default status
    status = {
        "state": "unknown",
        "progress": 0.0,
        "label": "Waiting for render to start...",
        "log_lines": [],
        "error": None,
        "exit_code": None,
    }

    if not log_path.exists():
        # Check if status file was written (render just started)
        if status_path.exists():
            try:
                return json.loads(status_path.read_text())
            except Exception:
                pass
        return status

    try:
        content = log_path.read_text()
    except Exception:
        status["state"] = "reading_error"
        return status

    lines = content.splitlines()
    status["log_lines"] = lines

    # Check for EXIT_CODE (render finished)
    exit_code = None
    for line in reversed(lines):
        if line.startswith("EXIT_CODE:"):
            try:
                exit_code = int(line.split(":")[1])
            except ValueError:
                exit_code = -1
            break

    if exit_code is not None:
        status["exit_code"] = exit_code
        if exit_code == 0:
            status["state"] = "done"
            status["progress"] = 1.0
            status["label"] = "Render complete!"
        else:
            status["state"] = "failed"
            status["progress"] = 1.0
            status["label"] = f"Render failed (exit code {exit_code})"
            # Extract error lines
            error_lines = [l for l in lines if any(kw in l.lower() for kw in [
                "error", "err ", "failed", "timeout", "timed out",
                "crash", "exception", "enoent", "delayrender"
            ])]
            if error_lines:
                status["error"] = "\n".join(error_lines[-20:])
        return status

    # Still running — parse progress from the latest lines
    status["state"] = "running"
    latest_label = "Rendering..."
    latest_progress = 0.0

    for line in lines:
        # Stage markers
        if "STAGE 6: REMOTION RENDER" in line:
            latest_label = "Rendering video..."
            latest_progress = 0.05

        # Bundling
        m = BUNDLING_RE.search(line)
        if m:
            pct = int(m.group(1)) / 100.0
            latest_progress = pct * 0.15
            latest_label = f"Bundling code ({m.group(1)}%)"

        # Copying
        if "Copying public dir" in line:
            latest_progress = 0.17
            latest_label = "Copying assets..."

        # Getting composition
        if "Getting composition" in line:
            latest_progress = 0.20
            latest_label = "Getting composition..."

        # Rendered frames
        if "Rendered" in line or "rendered" in line:
            match = RENDER_PROGRESS_RE.search(line)
            if match:
                current, total = int(match.group(1)), int(match.group(2))
                frac = current / max(total, 1)
                latest_progress = 0.20 + frac * 0.65
                eta = ""
                eta_match = re.search(r"time remaining: (.+?)$", line)
                if eta_match:
                    eta = f" — {eta_match.group(1)} remaining"
                latest_label = f"Rendering frame {current}/{total}{eta}"

        # Encoded (stitching)
        if "Encoded" in line:
            match = RENDER_PROGRESS_RE.search(line)
            if match:
                current, total = int(match.group(1)), int(match.group(2))
                frac = current / max(total, 1)
                latest_progress = 0.85 + frac * 0.15
                latest_label = f"Encoding {current}/{total}"

        # Pipeline complete
        if "PIPELINE COMPLETE" in line:
            latest_progress = 1.0
            latest_label = "Done!"

    status["progress"] = latest_progress
    status["label"] = latest_label

    return status


def is_render_running(slug: str) -> bool:
    """Check if a render is currently in progress."""
    status = poll_render_status(slug)
    return status["state"] in ("starting", "running")


def cleanup_render_files(slug: str):
    """Clean up temporary render tracking files."""
    try:
        _status_path(slug).unlink(missing_ok=True)
    except Exception:
        pass
    # Don't delete the log — it's useful for debugging
    # But rename it so it doesn't interfere with next render
    log = _log_path(slug)
    if log.exists():
        try:
            debug_log = get_project_root() / "out" / f"{slug}_render.log"
            shutil.copy2(str(log), str(debug_log))
            log.unlink()
        except Exception:
            pass
