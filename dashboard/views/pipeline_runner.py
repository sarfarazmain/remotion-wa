"""
Page 3: Pipeline Runner
Two-phase pipeline: Generate composition (stages 1-5) → Preview in Remotion Studio → Render (stage 6).
"""

import os
import json
import time
import shutil
import streamlit as st
from pathlib import Path
from dotenv import load_dotenv

from utils.state import (
    get_project_root, get_topic_dir,
    get_avatar_path, get_narration_path, get_output_path,
    get_topic_json_path, reset_all_state,
)
from utils.pipeline import run_generate_only, run_render_only, GENERATE_MARKERS, RENDER_MARKERS
from utils.studio import start_studio, start_tunnel, stop_studio, stop_tunnel, is_studio_running, get_studio_url
from utils.bg_render import start_render, poll_render_status, is_render_running, cleanup_render_files
from utils.dropbox_upload import upload_video, get_shared_link, get_dropbox_web_url, is_configured as dropbox_configured

load_dotenv(get_project_root() / ".env")

st.title("Pipeline Runner")

slug = st.session_state.get("topic_slug")
if not slug:
    st.warning("No topic loaded. Go to Step 1 first.")
    if st.button("Go to Topic Creator"):
        st.switch_page("views/topic_creator.py")
    st.stop()

st.caption(f"Topic: **{st.session_state.get('topic_title', slug)}**")

# ── Pre-flight Checks (compact) ─────────────────────────────────────
topic_json_path = get_topic_json_path()
avatar_path = get_avatar_path()
narration_path = get_narration_path()
output_path = get_output_path()
project_root = get_project_root()

checks = []
checks_ok = True

# Check each requirement
if topic_json_path and topic_json_path.exists():
    checks.append(("Topic JSON", True, ""))
else:
    checks.append(("Topic JSON", False, "Go to Step 1"))
    checks_ok = False

if avatar_path and avatar_path.exists() and avatar_path.stat().st_size > 50_000:
    size_mb = avatar_path.stat().st_size / 1024 / 1024
    checks.append(("Avatar video", True, f"{size_mb:.1f} MB"))
else:
    checks.append(("Avatar video", False, "Go to Step 2"))
    checks_ok = False

if narration_path and narration_path.exists():
    checks.append(("Narration MP3", True, ""))
else:
    checks.append(("Narration MP3", None, "Will be extracted"))

# BGM file existence
bgm_track = None
if topic_json_path and topic_json_path.exists():
    try:
        _topic_data = json.loads(topic_json_path.read_text(encoding="utf-8"))
        bgm_track = _topic_data.get("bgm", {}).get("trackId")
    except Exception:
        pass

if bgm_track:
    bgm_path = project_root / "public" / "bgm" / f"{bgm_track}.mp3"
    if bgm_path.exists():
        checks.append(("BGM audio", True, bgm_track))
    else:
        checks.append(("BGM audio", False, f"Missing: public/bgm/{bgm_track}.mp3"))
        checks_ok = False
else:
    checks.append(("BGM audio", False, "No trackId in topic JSON"))
    checks_ok = False

node_ok = shutil.which("node") is not None and shutil.which("npx") is not None
if node_ok:
    checks.append(("Node.js", True, ""))
else:
    checks.append(("Node.js", False, "Not installed"))
    checks_ok = False

ffmpeg_ok = shutil.which("ffmpeg") is not None
if ffmpeg_ok:
    checks.append(("ffmpeg", True, ""))
else:
    checks.append(("ffmpeg", False, "Not installed"))
    checks_ok = False

# Render checks as a compact single line
check_parts = []
for name, ok, detail in checks:
    if ok is True:
        check_parts.append(f":white_check_mark: {name}")
    elif ok is False:
        check_parts.append(f":x: {name}")
    else:
        check_parts.append(f":large_orange_circle: {name}")

st.markdown("  ·  ".join(check_parts))

if not checks_ok:
    # Show details for failed checks only
    for name, ok, detail in checks:
        if ok is False:
            st.error(f"**{name}** — {detail}")
    st.stop()

if output_path and output_path.exists():
    size_mb = output_path.stat().st_size / 1024 / 1024
    st.info(f"Previous render found ({size_mb:.1f} MB). Re-running will overwrite it.")

# ── Read current phase ───────────────────────────────────────────────
phase = st.session_state.get("pipeline_phase", "idle")

# ═════════════════════════════════════════════════════════════════════
# PHASE 1: GENERATE COMPOSITION (stages 1-5)
# ═════════════════════════════════════════════════════════════════════
if phase in ("idle", "error", "generating"):
    st.divider()
    st.markdown("### Generate Composition")
    st.caption("Stages 1-5: validate, audio extraction, Whisper, Pexels assets, SFX, code generation.")

    # Pipeline options
    col1, col2 = st.columns(2)
    with col1:
        skip_assets = st.checkbox(
            "Skip Pexels asset fetch",
            value=False,
            help="Use cached assets if they already exist.",
        )
    with col2:
        skip_sfx = st.checkbox(
            "Skip Freesound SFX fetch",
            value=False,
            help="Use cached SFX if they already exist.",
        )

    # Show cached asset counts
    topic_dir = get_topic_dir()
    if topic_dir:
        hints = []
        assets_dir = topic_dir / "assets"
        sfx_dir = topic_dir / "sfx"
        if assets_dir.exists() and any(assets_dir.iterdir()):
            hints.append(f"{len(list(assets_dir.glob('*')))} cached assets")
        if sfx_dir.exists() and any(sfx_dir.iterdir()):
            hints.append(f"{len(list(sfx_dir.glob('*.mp3')))} cached SFX")
        if hints:
            st.caption(" · ".join(hints))

    # Show error from previous attempt
    if phase == "error" and st.session_state.get("pipeline_log"):
        with st.expander("Previous run log"):
            st.code("\n".join(st.session_state["pipeline_log"][-50:]), language="bash")

    # Generate button
    if st.button(
        "Generate Composition",
        type="primary",
        use_container_width=True,
        disabled=phase == "generating",
    ):
        st.session_state["pipeline_phase"] = "generating"
        st.session_state["pipeline_log"] = []
        st.session_state["pipeline_returncode"] = None

        progress_bar = st.progress(0.0, text="Starting generation...")
        stage_text = st.empty()
        log_container = st.container()
        log_area = log_container.empty()

        log_lines = []

        def on_line(line: str):
            log_lines.append(line)
            visible = "\n".join(log_lines[-30:])
            log_area.code(visible, language="bash")

        def on_stage(label: str, progress: float):
            progress_bar.progress(min(progress, 1.0), text=label)
            stage_text.markdown(f"**{label}**")

        try:
            returncode = run_generate_only(
                slug=slug,
                on_line=on_line,
                on_stage=on_stage,
                skip_assets=skip_assets,
                skip_sfx=skip_sfx,
            )

            st.session_state["pipeline_log"] = log_lines
            st.session_state["pipeline_returncode"] = returncode

            if returncode == 0:
                st.session_state["pipeline_phase"] = "preview"
                progress_bar.progress(1.0, text="Generation complete!")
                st.success("Composition generated! Starting Remotion Studio...")

                with st.spinner("Starting Remotion Studio..."):
                    studio_started = start_studio()

                if studio_started:
                    tunnel_url = start_tunnel(port=3000)
                    if tunnel_url:
                        st.session_state["studio_url"] = tunnel_url
                    else:
                        st.session_state["studio_url"] = "http://localhost:3000"
                    st.rerun()
                else:
                    st.session_state["studio_url"] = "http://localhost:3000"
                    st.warning("Could not auto-start Studio. Run `npm run dev` in terminal.")
                    st.rerun()
            else:
                st.session_state["pipeline_phase"] = "error"
                progress_bar.progress(1.0, text="Generation failed!")
                st.error(f"Generation exited with code {returncode}")

        except Exception as e:
            st.session_state["pipeline_phase"] = "error"
            st.error(f"Generation crashed: {e}")


# ═════════════════════════════════════════════════════════════════════
# PHASE 2: PREVIEW IN REMOTION STUDIO
# ═════════════════════════════════════════════════════════════════════
elif phase == "preview":
    st.divider()
    st.markdown("### Preview Composition")

    studio_url = st.session_state.get("studio_url", "http://localhost:3000")

    if is_studio_running():
        st.success("Remotion Studio is running")
        st.markdown(f"[Open Remotion Studio]({studio_url})")
        st.caption("Scrub through the timeline to review scenes, transitions, SFX, and BGM.")
    else:
        st.warning("Remotion Studio is not running")
        if st.button("Start Studio"):
            with st.spinner("Starting Remotion Studio..."):
                started = start_studio()
            if started:
                tunnel_url = start_tunnel(port=3000)
                if tunnel_url:
                    st.session_state["studio_url"] = tunnel_url
                st.rerun()
            else:
                st.error("Failed to start Studio. Try `npm run dev` in terminal.")

    st.divider()

    col_approve, col_regen = st.columns(2)

    with col_approve:
        if st.button("Approve & Render", type="primary", use_container_width=True):
            st.session_state["pipeline_phase"] = "rendering"
            st.rerun()

    with col_regen:
        if st.button("Re-generate", use_container_width=True):
            stop_studio()
            stop_tunnel()
            st.session_state["pipeline_phase"] = "idle"
            st.session_state["studio_url"] = None
            st.rerun()


# ═════════════════════════════════════════════════════════════════════
# PHASE 3: RENDER (stage 6) — NON-BLOCKING
# ═════════════════════════════════════════════════════════════════════
elif phase == "rendering":
    st.divider()
    st.markdown("### Rendering Video")
    st.caption("Remotion render (Stage 6). This takes a few minutes.")

    # On first entry, kick off the background render
    # Set flag BEFORE start_render() to prevent duplicate renders on rerun
    if not st.session_state.get("_render_started"):
        st.session_state["_render_started"] = True
        stop_studio()
        stop_tunnel()
        cleanup_render_files(slug)
        start_render(slug)

    # Poll the background render status
    status = poll_render_status(slug)
    render_state = status["state"]
    progress_val = min(max(status["progress"], 0.0), 1.0)
    label = status["label"]
    log_lines = status.get("log_lines", [])

    # Progress bar
    st.progress(progress_val, text=label)

    # Live log (last 20 lines, collapsed)
    if log_lines:
        with st.expander("Render log", expanded=False):
            st.code("\n".join(log_lines[-30:]), language="bash")

    # Handle completion
    if render_state == "done":
        st.session_state["pipeline_phase"] = "done"
        st.session_state["pipeline_status"] = "done"
        st.session_state["pipeline_log"] = log_lines
        st.session_state["pipeline_returncode"] = 0
        st.session_state["_render_started"] = False
        cleanup_render_files(slug)
        st.balloons()
        st.success("Video rendered successfully!")

        if output_path and output_path.exists():
            st.session_state["output_path"] = str(output_path)
            size_mb = output_path.stat().st_size / 1024 / 1024
            st.caption(f"Output: **{output_path.name}** ({size_mb:.1f} MB)")

        # ── Auto-upload to Dropbox ────────────────────────────────
        if dropbox_configured() and output_path and output_path.exists():
            if not st.session_state.get("_dropbox_uploaded"):
                upload_progress = st.progress(0.0, text="Uploading to Dropbox...")

                try:
                    result = upload_video(
                        file_path=output_path,
                        slug=slug,
                        on_progress=lambda p: upload_progress.progress(
                            min(p, 1.0), text=f"Uploading... {p*100:.0f}%"
                        ),
                    )
                    upload_progress.progress(1.0, text="Upload complete!")

                    dropbox_path = result.get("path_display", "")
                    st.session_state["_dropbox_uploaded"] = True
                    st.session_state["_dropbox_path"] = dropbox_path

                    st.success(f"Uploaded to Dropbox: `{dropbox_path}`")

                    shared_url = get_shared_link(dropbox_path)
                    if not shared_url:
                        shared_url = get_dropbox_web_url(dropbox_path)
                    st.session_state["_dropbox_link"] = shared_url
                    st.markdown(f"[Open in Dropbox]({shared_url})")

                except Exception as e:
                    st.error(f"Dropbox upload failed: {e}")
                    st.caption("Video saved locally. Upload manually later.")
            else:
                dbx_path = st.session_state.get("_dropbox_path", "")
                dbx_link = st.session_state.get("_dropbox_link", "")
                st.success(f"Uploaded to Dropbox: `{dbx_path}`")
                if dbx_link:
                    st.markdown(f"[Open in Dropbox]({dbx_link})")
        elif not dropbox_configured():
            st.caption("Dropbox not configured. Set DROPBOX_* vars in .env for auto-upload.")

        # Navigation
        st.divider()
        col_dl, col_restart = st.columns(2)
        with col_dl:
            if st.button("Preview & Download", type="primary", use_container_width=True):
                st.switch_page("views/preview_download.py")
        with col_restart:
            if st.button("Start Over", use_container_width=True):
                reset_all_state()
                st.switch_page("views/topic_creator.py")

    elif render_state == "failed":
        exit_code = status.get("exit_code", -1)
        st.session_state["pipeline_phase"] = "error"
        st.session_state["pipeline_log"] = log_lines
        st.session_state["pipeline_returncode"] = exit_code
        st.session_state["_render_started"] = False
        cleanup_render_files(slug)
        st.error(f"Render failed (exit code {exit_code})")

        if status.get("error"):
            with st.expander("Error details", expanded=True):
                st.code(status["error"], language="bash")

        if log_lines:
            with st.expander("Last 100 lines"):
                st.code("\n".join(log_lines[-100:]), language="bash")

        debug_log = project_root / "out" / f"{slug}_render.log"
        if debug_log.exists():
            st.caption(f"Full log saved to: `{debug_log}`")

    else:
        # Still running — auto-refresh every 3 seconds
        time.sleep(3)
        st.rerun()


# ═════════════════════════════════════════════════════════════════════
# PHASE 4: DONE
# ═════════════════════════════════════════════════════════════════════
elif phase == "done":
    st.divider()
    st.success("Pipeline complete! Your video is ready.")

    if output_path and output_path.exists():
        size_mb = output_path.stat().st_size / 1024 / 1024
        st.caption(f"Output: **{output_path.name}** ({size_mb:.1f} MB)")

    col_preview, col_restart = st.columns(2)

    with col_preview:
        if st.button("Preview & Download", type="primary", use_container_width=True):
            st.switch_page("views/preview_download.py")

    with col_restart:
        if st.button("Start Over", use_container_width=True):
            reset_all_state()
            st.switch_page("views/topic_creator.py")


# ── Log Viewer (always available) ────────────────────────────────────
if st.session_state.get("pipeline_log"):
    st.divider()
    with st.expander("Full pipeline log"):
        full_log = "\n".join(st.session_state["pipeline_log"])
        st.code(full_log, language="bash")
