"""
Pipeline subprocess runner with real-time log streaming.
Wraps `npx tsx pipeline/run.ts` and parses its output for progress tracking.

Uses a separate runner.py process to avoid macOS Python 3.14 fork crash
in Streamlit's multi-threaded environment.
"""

import os
import re
import shutil
import sys
import tempfile
import time
from pathlib import Path
from typing import Callable

from .state import get_project_root
from .launch import launch_command

# Stage markers the pipeline prints — used to track progress
STAGE_MARKERS = [
    ("STAGE 1: VALIDATE", "Validating topic JSON"),
    ("STAGE 2: HEYGEN", "HeyGen avatar (skipped)"),
    ("STAGE 2.5: AUDIO EXTRACTION", "Extracting narration audio"),
    ("STAGE 3: WHISPER", "Transcribing with Whisper"),
    ("STAGE 4: PEXELS", "Fetching Pexels assets"),
    ("STAGE 4.5: FREESOUND", "Fetching SFX from Freesound"),
    ("STAGE 5: CODE GENERATION", "Generating composition code"),
    ("STAGE 6: REMOTION RENDER", "Rendering video (this takes a few minutes)"),
    ("PIPELINE COMPLETE", "Done!"),
]

# Generation-only markers (stages 1-5, used with --skip-render)
GENERATE_MARKERS = [
    ("STAGE 1: VALIDATE", "Validating topic JSON"),
    ("STAGE 2: HEYGEN", "HeyGen avatar (skipped)"),
    ("STAGE 2.5: AUDIO EXTRACTION", "Extracting narration audio"),
    ("STAGE 3: WHISPER", "Transcribing with Whisper"),
    ("STAGE 4: PEXELS", "Fetching Pexels assets"),
    ("STAGE 4.5: FREESOUND", "Fetching SFX from Freesound"),
    ("STAGE 5: CODE GENERATION", "Generating composition code"),
    ("PIPELINE COMPLETE", "Done!"),
]

# Render-only markers
RENDER_MARKERS = [
    ("STAGE 6: REMOTION RENDER", "Rendering video (this takes a few minutes)"),
    ("PIPELINE COMPLETE", "Done!"),
]

# Regex to parse Remotion render progress: "Rendered 450/1800" or "Encoded 450/1800"
RENDER_PROGRESS_RE = re.compile(r"(\d+)/(\d+)")
BUNDLING_RE = re.compile(r"Bundling\s+(\d+)%")

# Remotion render sub-phases and their weight in overall progress (0.0 to 1.0)
# Bundling: 0.0-0.15, Copying: 0.15-0.20, Rendering: 0.20-0.85, Encoding: 0.85-1.0
RENDER_PHASE_WEIGHTS = {
    "bundling": (0.0, 0.15),
    "copying": (0.15, 0.20),
    "rendering": (0.20, 0.85),
    "encoding": (0.85, 1.0),
}


def parse_stage(line: str) -> str | None:
    """If the line contains a stage marker, return the stage label."""
    for marker, label in STAGE_MARKERS:
        if marker in line:
            return label
    return None


def parse_render_progress(line: str) -> tuple[int, int] | None:
    """Parse Remotion render progress from a log line. Returns (current, total) or None."""
    if "Rendered" not in line and "rendered" not in line:
        return None
    match = RENDER_PROGRESS_RE.search(line)
    if match:
        return int(match.group(1)), int(match.group(2))
    return None


def parse_remotion_progress(line: str) -> tuple[str, float] | None:
    """
    Parse any Remotion CLI progress line. Returns (label, progress_0_to_1) or None.

    Remotion outputs these phases (with --log=verbose or non-TTY):
      - "Bundling XX%"
      - "Copying public dir XX MB"
      - "Getting composition"
      - "Rendered 450/1800, time remaining: 12s"
      - "Encoded 450/1800"
    """
    # Bundling phase: "Bundling 65%"
    m = BUNDLING_RE.search(line)
    if m:
        pct = int(m.group(1)) / 100.0
        lo, hi = RENDER_PHASE_WEIGHTS["bundling"]
        return f"Bundling code ({m.group(1)}%)", lo + pct * (hi - lo)

    # Copying public dir
    if "Copying public dir" in line:
        lo, hi = RENDER_PHASE_WEIGHTS["copying"]
        return "Copying assets...", (lo + hi) / 2  # approximate midpoint

    # Getting composition
    if "Getting composition" in line:
        lo, hi = RENDER_PHASE_WEIGHTS["rendering"]
        return "Getting composition...", lo

    # Rendered frames: "Rendered 450/1800, time remaining: 12s"
    if "Rendered" in line or "rendered" in line:
        match = RENDER_PROGRESS_RE.search(line)
        if match:
            current, total = int(match.group(1)), int(match.group(2))
            frac = current / max(total, 1)
            lo, hi = RENDER_PHASE_WEIGHTS["rendering"]
            progress = lo + frac * (hi - lo)
            # Extract ETA if present
            eta = ""
            eta_match = re.search(r"time remaining: (.+?)$", line)
            if eta_match:
                eta = f" — {eta_match.group(1)} remaining"
            return f"Rendering frame {current}/{total}{eta}", progress

    # Encoded (stitching): "Encoded 450/1800"
    if "Encoded" in line:
        match = RENDER_PROGRESS_RE.search(line)
        if match:
            current, total = int(match.group(1)), int(match.group(2))
            frac = current / max(total, 1)
            lo, hi = RENDER_PHASE_WEIGHTS["encoding"]
            return f"Encoding {current}/{total}", lo + frac * (hi - lo)

    return None


def run_pipeline(
    slug: str,
    on_line: Callable[[str], None],
    on_stage: Callable[[str, float], None],
    skip_assets: bool = False,
    skip_sfx: bool = False,
) -> int:
    """
    Run the full pipeline as a subprocess.

    Args:
        slug: Topic slug (e.g. "financial-repression")
        on_line: Callback for each log line
        on_stage: Callback for stage changes — (stage_label, progress_0_to_1)
        skip_assets: Skip Pexels asset fetching
        skip_sfx: Skip Freesound SFX fetching

    Returns:
        Process return code (0 = success)
    """
    project_root = get_project_root()
    topic_path = f"topics/{slug}.json"

    npx_bin = shutil.which("npx") or "npx"

    cmd_parts = [
        f'"{npx_bin}"', "tsx", "pipeline/run.ts",
        f'"{topic_path}"',
        "--skip-heygen",
    ]
    if skip_assets:
        cmd_parts.append("--skip-assets")
    if skip_sfx:
        cmd_parts.append("--skip-sfx")

    # Create temp file for pipeline output
    log_fd, log_path = tempfile.mkstemp(suffix=".log", prefix="pipeline_")
    os.close(log_fd)

    shell_cmd = (
        f'cd "{project_root}" && '
        f'NODE_OPTIONS="--max-old-space-size=8192" '
        f'{" ".join(cmd_parts)}'
    )

    # Launch via runner.py + shell script to avoid macOS fork crash
    launch_command(shell_cmd, log_path)

    current_stage_idx = 0
    total_stages = len(STAGE_MARKERS)
    lines_read = 0
    exit_code = None
    idle_count = 0
    max_idle = 1200  # 10 minutes of no output = timeout

    while exit_code is None:
        time.sleep(0.5)

        try:
            all_lines = Path(log_path).read_text().splitlines()
        except Exception:
            all_lines = []

        new_lines = all_lines[lines_read:]
        lines_read = len(all_lines)

        if not new_lines:
            idle_count += 1
            if idle_count > max_idle:
                on_line("[TIMEOUT] Pipeline produced no output for 10 minutes.")
                exit_code = -1
                break
            continue

        idle_count = 0

        for line in new_lines:
            line = line.rstrip()
            if not line:
                continue

            if line.startswith("EXIT_CODE:"):
                try:
                    exit_code = int(line.split(":")[1])
                except ValueError:
                    exit_code = -1
                break

            on_line(line)

            stage_label = parse_stage(line)
            if stage_label:
                for i, (marker, label) in enumerate(STAGE_MARKERS):
                    if label == stage_label:
                        current_stage_idx = i
                        break
                progress = current_stage_idx / (total_stages - 1)
                on_stage(stage_label, progress)

            render_prog = parse_render_progress(line)
            if render_prog:
                current, total = render_prog
                render_frac = current / max(total, 1)
                base = (len(STAGE_MARKERS) - 2) / (total_stages - 1)
                top = (len(STAGE_MARKERS) - 1) / (total_stages - 1)
                progress = base + render_frac * (top - base)
                on_stage(f"Rendering frame {current}/{total}", progress)

    final_code = exit_code if exit_code is not None else -1

    # On failure: preserve the full log for debugging
    if final_code != 0:
        project_root = get_project_root()
        debug_log_path = project_root / "out" / f"{slug}_pipeline.log"
        try:
            (project_root / "out").mkdir(parents=True, exist_ok=True)
            import shutil
            shutil.copy2(log_path, str(debug_log_path))
            on_line(f"[DEBUG] Full pipeline log saved to: {debug_log_path}")
        except Exception as e:
            on_line(f"[DEBUG] Could not save debug log: {e}")

    # Cleanup temp file
    try:
        os.unlink(log_path)
    except Exception:
        pass

    return final_code


def _run_with_markers(
    shell_cmd: str,
    markers: list[tuple[str, str]],
    on_line: Callable[[str], None],
    on_stage: Callable[[str, float], None],
    track_render: bool = False,
    slug: str = "",
) -> int:
    """
    Generic pipeline runner that launches a command and tracks progress
    using the given stage markers.

    On failure (non-zero exit), the full log is preserved to out/{slug}_render.log
    so the user can inspect it for debugging.
    """
    log_fd, log_path = tempfile.mkstemp(suffix=".log", prefix="pipeline_")
    os.close(log_fd)

    launch_command(shell_cmd, log_path)

    current_stage_idx = 0
    total_stages = len(markers)
    lines_read = 0
    exit_code = None
    idle_count = 0
    max_idle = 7200  # 60 minutes of no output = timeout (0.5s polls)

    while exit_code is None:
        time.sleep(0.5)

        try:
            all_lines = Path(log_path).read_text().splitlines()
        except Exception:
            all_lines = []

        new_lines = all_lines[lines_read:]
        lines_read = len(all_lines)

        if not new_lines:
            idle_count += 1
            if idle_count > max_idle:
                on_line("[TIMEOUT] No output for 60 minutes.")
                exit_code = -1
                break
            continue

        idle_count = 0

        for line in new_lines:
            line = line.rstrip()
            if not line:
                continue

            if line.startswith("EXIT_CODE:"):
                try:
                    exit_code = int(line.split(":")[1])
                except ValueError:
                    exit_code = -1
                break

            on_line(line)

            stage_label = None
            for marker, label in markers:
                if marker in line:
                    stage_label = label
                    break

            if stage_label:
                for i, (marker, label) in enumerate(markers):
                    if label == stage_label:
                        current_stage_idx = i
                        break
                progress = current_stage_idx / max(total_stages - 1, 1)
                on_stage(stage_label, progress)

            if track_render:
                remotion_prog = parse_remotion_progress(line)
                if remotion_prog:
                    label, progress = remotion_prog
                    on_stage(label, progress)

    final_code = exit_code if exit_code is not None else -1

    # On failure: preserve the full log for debugging
    if final_code != 0:
        project_root = get_project_root()
        debug_log_name = f"{slug}_render.log" if slug else "render_debug.log"
        debug_log_path = project_root / "out" / debug_log_name
        try:
            (project_root / "out").mkdir(parents=True, exist_ok=True)
            import shutil
            shutil.copy2(log_path, str(debug_log_path))
            on_line(f"[DEBUG] Full render log saved to: {debug_log_path}")
        except Exception as e:
            on_line(f"[DEBUG] Could not save debug log: {e}")

    # Clean up temp file
    try:
        os.unlink(log_path)
    except Exception:
        pass

    return final_code


def run_generate_only(
    slug: str,
    on_line: Callable[[str], None],
    on_stage: Callable[[str, float], None],
    skip_assets: bool = False,
    skip_sfx: bool = False,
) -> int:
    """
    Run stages 1-5 only (no render). Uses --skip-render flag.
    Returns process exit code (0 = success).
    """
    project_root = get_project_root()
    npx_bin = shutil.which("npx") or "npx"

    cmd_parts = [
        f'"{npx_bin}"', "tsx", "pipeline/run.ts",
        f'"topics/{slug}.json"',
        "--skip-heygen",
        "--skip-render",
    ]
    if skip_assets:
        cmd_parts.append("--skip-assets")
    if skip_sfx:
        cmd_parts.append("--skip-sfx")

    shell_cmd = (
        f'cd "{project_root}" && '
        f'NODE_OPTIONS="--max-old-space-size=8192" '
        f'{" ".join(cmd_parts)}'
    )

    return _run_with_markers(shell_cmd, GENERATE_MARKERS, on_line, on_stage, track_render=False, slug=slug)


def run_render_only(
    slug: str,
    on_line: Callable[[str], None],
    on_stage: Callable[[str, float], None],
) -> int:
    """
    Run Stage 6 only (Remotion render).
    Returns process exit code (0 = success).
    """
    project_root = get_project_root()
    npx_bin = shutil.which("npx") or "npx"

    output_path = f"out/{slug}.mp4"

    # Dynamic concurrency: 50% of CPU cores, min 2, max 4
    import os as _os
    cpu_count = _os.cpu_count() or 4
    concurrency = min(max(cpu_count // 2, 2), 4)

    shell_cmd = (
        f'cd "{project_root}" && '
        f'NODE_OPTIONS="--max-old-space-size=8192" '
        f'"{npx_bin}" remotion render src/index.ts WealthArchive '
        f'"{output_path}" '
        f'--codec h264 --concurrency {concurrency} --timeout=120000 '
        f'--gl=angle --log=verbose'
    )

    return _run_with_markers(shell_cmd, RENDER_MARKERS, on_line, on_stage, track_render=True, slug=slug)
