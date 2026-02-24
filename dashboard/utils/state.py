"""
Session state helpers for the WARP Dashboard.
Centralizes all session state keys and initialization.
"""

import streamlit as st
from pathlib import Path

# Project root — the spinning-halley directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

# All session state keys and their defaults — single source of truth
_STATE_DEFAULTS = {
    "step": 1,
    "topic_json": None,         # Full parsed topic dict
    "topic_slug": None,         # e.g. "financial-repression"
    "topic_title": None,        # e.g. "Financial Repression"
    "narration_text": None,     # Full narration string
    "avatar_uploaded": False,   # Whether avatar.mp4 is in place
    "pipeline_status": "idle",  # idle | running | done | error
    "pipeline_phase": "idle",   # idle | generating | preview | rendering | done | error
    "pipeline_log": [],         # List of log lines
    "pipeline_returncode": None,
    "output_path": None,        # Path to rendered mp4
    "studio_url": None,         # Remotion Studio URL (local or tunnel)
    "_render_started": False,   # Whether bg render has been kicked off
    "_dropbox_uploaded": False,  # Whether video was uploaded to Dropbox
    "_dropbox_path": None,      # Dropbox path after upload
    "_dropbox_link": None,      # Dropbox shared link URL
}


def get_project_root() -> Path:
    return PROJECT_ROOT


def init_state():
    """Initialize all session state keys with defaults (only sets if missing)."""
    for key, val in _STATE_DEFAULTS.items():
        if key not in st.session_state:
            st.session_state[key] = val

    # Sync avatar state from disk (once per session init, not in get_completed_steps)
    _sync_avatar_from_disk()


def _sync_avatar_from_disk():
    """Check if avatar exists on disk and update session state accordingly."""
    slug = st.session_state.get("topic_slug")
    if slug:
        avatar = PROJECT_ROOT / "public" / "topics" / slug / "avatar.mp4"
        if avatar.exists() and avatar.stat().st_size > 50_000:
            st.session_state["avatar_uploaded"] = True


def reset_all_state():
    """Reset ALL session state keys to defaults. Used for 'Start New Topic'."""
    for key, val in _STATE_DEFAULTS.items():
        st.session_state[key] = val


def get_topic_dir() -> Path | None:
    """Get the public/topics/{slug}/ directory for current topic."""
    slug = st.session_state.get("topic_slug")
    if not slug:
        return None
    return PROJECT_ROOT / "public" / "topics" / slug


def get_avatar_path() -> Path | None:
    """Get path to avatar.mp4 for current topic."""
    topic_dir = get_topic_dir()
    if not topic_dir:
        return None
    return topic_dir / "avatar.mp4"


def get_narration_path() -> Path | None:
    """Get path to narration.mp3 for current topic."""
    topic_dir = get_topic_dir()
    if not topic_dir:
        return None
    return topic_dir / "narration.mp3"


def get_output_path() -> Path | None:
    """
    Get path to rendered output mp4.
    Checks multiple possible locations:
      1. Session state override (set by render phase)
      2. out/{slug}.mp4 (dashboard render output)
      3. out/WealthArchive.mp4 (composition-based output from pipeline/render.ts)
    """
    # Check session override first (set during render)
    override = st.session_state.get("output_path")
    if override:
        p = Path(override)
        if p.exists():
            return p

    slug = st.session_state.get("topic_slug")
    if not slug:
        return None

    # Primary: out/{slug}.mp4
    primary = PROJECT_ROOT / "out" / f"{slug}.mp4"
    if primary.exists():
        return primary

    # Fallback: out/WealthArchive.mp4 (Remotion composition ID)
    fallback = PROJECT_ROOT / "out" / "WealthArchive.mp4"
    if fallback.exists():
        return fallback

    # Return the primary path even if it doesn't exist yet
    # (caller checks .exists())
    return primary


def get_topic_json_path() -> Path | None:
    """Get path to topics/{slug}.json."""
    slug = st.session_state.get("topic_slug")
    if not slug:
        return None
    return PROJECT_ROOT / "topics" / f"{slug}.json"


def get_completed_steps() -> set[int]:
    """
    Determine which pipeline steps have been completed based on session state
    and disk state. Returns a set of step numbers (1-5).

    Pure read function — no state mutations.

    Steps:
      1. Create Topic — topic_slug and topic_json exist
      2. Upload Avatar — avatar file exists on disk
      3. Run Pipeline — composition generated (session state OR disk fallback)
      4. Preview & Download — video rendered and output file exists
      5. Asset Manager — (tool, not a completion step; accessible once 1+3 done)
    """
    completed = set()

    slug = st.session_state.get("topic_slug")

    # Step 1: Topic created
    if slug and st.session_state.get("topic_json"):
        completed.add(1)

    # Step 2: Avatar uploaded (check disk — session state synced in init_state)
    if slug:
        avatar = PROJECT_ROOT / "public" / "topics" / slug / "avatar.mp4"
        if avatar.exists() and avatar.stat().st_size > 50_000:
            completed.add(2)

    # Step 3: Pipeline ran (composition generated)
    # Primary: check session state
    phase = st.session_state.get("pipeline_phase", "idle")
    if phase in ("preview", "rendering", "done"):
        completed.add(3)
    # Disk fallback: if composition source was generated for this slug
    elif slug:
        topic_data = PROJECT_ROOT / "src" / "WealthArchiveVideo" / "TopicData.ts"
        if topic_data.exists():
            try:
                content = topic_data.read_text(encoding="utf-8")
                if slug in content:
                    completed.add(3)
            except OSError:
                pass

    # Step 4: Video rendered — output file exists
    if phase == "done":
        output = get_output_path()
        if output and output.exists():
            completed.add(4)
    # Disk fallback: check if rendered video exists
    elif slug:
        output = get_output_path()
        if output and output.exists():
            completed.add(4)

    return completed
