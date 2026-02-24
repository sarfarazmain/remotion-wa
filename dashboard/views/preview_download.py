"""
Page 4: Preview & Download
Watch the rendered video and download the final MP4.
"""

import json
import streamlit as st
from pathlib import Path
from datetime import datetime

from utils.state import (
    get_project_root, get_output_path,
    get_topic_dir, get_topic_json_path,
    reset_all_state,
)

st.title("Preview & Download")

slug = st.session_state.get("topic_slug")
if not slug:
    st.warning("No topic loaded. Go to Step 1 first.")
    if st.button("Go to Topic Creator"):
        st.switch_page("views/topic_creator.py")
    st.stop()

st.caption(f"Topic: **{st.session_state.get('topic_title', slug)}**")

output_path = get_output_path()
project_root = get_project_root()

# ── Check for output ─────────────────────────────────────────────────
if not output_path or not output_path.exists():
    st.warning("No rendered video found. Run the pipeline first.")
    if st.button("Go to Pipeline Runner"):
        st.switch_page("views/pipeline_runner.py")
    st.stop()

# ── Video Preview ────────────────────────────────────────────────────
with open(str(output_path), "rb") as f:
    video_bytes = f.read()

video_size_mb = len(video_bytes) / 1024 / 1024
mod_time = datetime.fromtimestamp(output_path.stat().st_mtime)

st.video(video_bytes, format="video/mp4")

# ── Info + Download (compact row) ────────────────────────────────────
col1, col2, col3 = st.columns(3)
with col1:
    st.metric("File Size", f"{video_size_mb:.1f} MB")
with col2:
    st.metric("Format", "MP4 (H.264)")
with col3:
    st.metric("Rendered", mod_time.strftime("%b %d, %H:%M"))

st.download_button(
    label=f"Download {slug}.mp4",
    data=video_bytes,
    file_name=f"{slug}.mp4",
    mime="video/mp4",
    use_container_width=True,
    type="primary",
)

# ── Render Metadata (if available) ───────────────────────────────────
meta_path = project_root / "out" / f"{slug}.meta.json"
if meta_path.exists():
    try:
        meta = json.loads(meta_path.read_text())
        with st.expander("Render details"):
            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("Resolution", f"{meta.get('width', '?')}x{meta.get('height', '?')}")
            with col2:
                st.metric("FPS", meta.get("fps", "?"))
            with col3:
                frames = meta.get("totalFrames", meta.get("frames", "?"))
                st.metric("Total Frames", frames)
            with col4:
                duration = meta.get("durationSec", meta.get("duration", "?"))
                if isinstance(duration, (int, float)):
                    minutes = int(duration) // 60
                    seconds = int(duration) % 60
                    st.metric("Duration", f"{minutes}:{seconds:02d}")
                else:
                    st.metric("Duration", str(duration))
    except Exception:
        pass

# ── SFX Credits ──────────────────────────────────────────────────────
topic_dir = get_topic_dir()
sfx_manifest_path = topic_dir / "sfx" / "manifest.json" if topic_dir else None

if sfx_manifest_path and sfx_manifest_path.exists():
    try:
        manifest = json.loads(sfx_manifest_path.read_text())
        credits = []
        for key, entry in manifest.items():
            if isinstance(entry, dict):
                credits.append({
                    "Sound": entry.get("name", key),
                    "Event": key,
                    "License": entry.get("license", "Unknown"),
                    "Duration": f"{entry.get('duration', '?')}s",
                })
        if credits:
            with st.expander("SFX Credits (Freesound.org)"):
                st.dataframe(credits, use_container_width=True, hide_index=True)
                st.caption("Sound effects from Freesound.org under Attribution or CC0 licenses.")
    except Exception:
        pass

# ── Topic Summary ────────────────────────────────────────────────────
topic_json_path = get_topic_json_path()
if topic_json_path and topic_json_path.exists():
    try:
        topic = json.loads(topic_json_path.read_text())
        with st.expander("Topic summary"):
            meta = topic.get("meta", {})
            st.markdown(
                f"**{meta.get('title', '')}** · "
                f"`{meta.get('slug', '')}` · "
                f"{meta.get('archetype', '')} · "
                f"{len(topic.get('scenes', []))} scenes · "
                f"{len(topic.get('narration', '').split())} words"
            )
    except Exception:
        pass

# ── Navigation ───────────────────────────────────────────────────────
st.divider()
col1, col2 = st.columns(2)

with col1:
    if st.button("Re-run Pipeline", use_container_width=True):
        st.switch_page("views/pipeline_runner.py")

with col2:
    if st.button("Start New Topic", use_container_width=True):
        reset_all_state()
        st.switch_page("views/topic_creator.py")
