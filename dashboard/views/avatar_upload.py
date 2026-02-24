"""
Page 2: Avatar Upload
Upload HeyGen avatar.mp4 and auto-extract narration MP3.
"""

import shutil
import streamlit as st
from pathlib import Path

from utils.state import (
    get_project_root, get_topic_dir,
    get_avatar_path, get_narration_path,
)
from utils.launch import run_and_wait

st.title("Avatar Upload")

slug = st.session_state.get("topic_slug")
if not slug:
    st.warning("No topic loaded. Go to Step 1 first.")
    if st.button("Go to Topic Creator"):
        st.switch_page("views/topic_creator.py")
    st.stop()

st.caption(f"Topic: **{st.session_state.get('topic_title', slug)}**")

# ── Step A: Narration Script ─────────────────────────────────────────
st.markdown("### Narration Script")
st.caption(
    "Copy this narration and paste it into "
    "[HeyGen](https://app.heygen.com/create/avatar-video) "
    "to generate your avatar video."
)

narration = st.session_state.get("narration_text", "")
if narration:
    word_count = len(narration.split())
    est_duration = round(word_count / 2.5)
    st.text_area(
        "Narration (select all + copy)",
        value=narration,
        height=150,
        label_visibility="collapsed",
        disabled=True,
    )
    st.caption(f"{word_count} words  ·  ~{est_duration}s estimated duration")
else:
    st.warning("No narration text found. Go back to Step 1.")

# ── Step B: Upload Avatar ────────────────────────────────────────────
st.divider()
st.markdown("### Upload Avatar Video")

avatar_path = get_avatar_path()
topic_dir = get_topic_dir()

if avatar_path and avatar_path.exists() and avatar_path.stat().st_size > 50_000:
    size_mb = avatar_path.stat().st_size / 1024 / 1024
    st.success(f"Avatar uploaded: **{avatar_path.name}** ({size_mb:.1f} MB)")
    st.video(str(avatar_path))
    st.session_state["avatar_uploaded"] = True
else:
    st.caption("Download the MP4 from HeyGen after generation, then upload it here.")
    uploaded = st.file_uploader(
        "Upload HeyGen avatar.mp4",
        type=["mp4"],
    )

    if uploaded:
        topic_dir.mkdir(parents=True, exist_ok=True)

        with open(str(avatar_path), "wb") as f:
            f.write(uploaded.getbuffer())

        file_size = avatar_path.stat().st_size / 1024 / 1024
        st.success(f"Uploaded: **{uploaded.name}** ({file_size:.1f} MB)")
        st.video(str(avatar_path))
        st.session_state["avatar_uploaded"] = True

# ── Step C: Audio Extraction (automatic) ─────────────────────────────
if st.session_state.get("avatar_uploaded") and avatar_path and avatar_path.exists():
    st.divider()
    st.markdown("### Narration Audio")

    narration_path = get_narration_path()

    if not narration_path:
        st.error("Cannot determine narration path — make sure topic is loaded on Step 1.")
        st.stop()

    narration_path.parent.mkdir(parents=True, exist_ok=True)

    if narration_path.exists() and narration_path.stat().st_size > 1000:
        st.success(f"Narration audio ready: **{narration_path.name}**")
        st.audio(str(narration_path))
    else:
        ffmpeg_bin = shutil.which("ffmpeg") or "/opt/homebrew/bin/ffmpeg"

        if not Path(ffmpeg_bin).exists():
            st.error(f"ffmpeg not found at `{ffmpeg_bin}`. Install ffmpeg first.")
            st.stop()

        st.info("Extracting narration audio from avatar video...")

        ffmpeg_cmd = (
            f'"{ffmpeg_bin}" -y -i "{avatar_path}" '
            f'-vn -acodec libmp3lame -q:a 2 "{narration_path}"'
        )

        with st.spinner("Running ffmpeg..."):
            exit_code, log_output = run_and_wait(ffmpeg_cmd, timeout=120)

            if exit_code == 0 and narration_path.exists() and narration_path.stat().st_size > 1000:
                st.success("Narration audio extracted!")
                st.audio(str(narration_path))
            else:
                st.error("ffmpeg failed to extract audio.")
                if log_output.strip():
                    with st.expander("ffmpeg output"):
                        st.code(log_output[-2000:], language="bash")

    # ── Continue ─────────────────────────────────────────────────────
    st.divider()
    if st.button("Continue to Pipeline Runner", type="primary", use_container_width=True):
        st.switch_page("views/pipeline_runner.py")
