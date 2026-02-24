"""
Page 5: Asset Manager
Preview current Pexels assets per scene, edit search queries,
and re-fetch individual images or videos that aren't up to the mark.
"""

import json
import os
import re
import time
import requests
import streamlit as st
from pathlib import Path
from dotenv import load_dotenv

from utils.state import get_project_root, get_topic_dir, get_topic_json_path

# Load API keys from .env
load_dotenv(get_project_root() / ".env")

PEXELS_API_KEY = os.environ.get("PEXELS_API_KEY", "")

st.title("Asset Manager")
st.caption("Preview and replace Pexels stock images/videos for each scene.")

# ── Guard: need a topic ────────────────────────────────────────────
slug = st.session_state.get("topic_slug")
if not slug:
    st.warning("No topic loaded. Go to Step 1 first.")
    if st.button("Go to Topic Creator"):
        st.switch_page("views/topic_creator.py")
    st.stop()

if not PEXELS_API_KEY:
    st.error("PEXELS_API_KEY not found in .env — check your environment setup.")
    st.stop()

topic_dir   = get_topic_dir()
assets_dir  = topic_dir / "assets"
manifest_path = assets_dir / "manifest.json"
topic_json_path = get_topic_json_path()

if not manifest_path.exists():
    st.warning("No asset manifest found. Run the pipeline first (Step 3) to fetch initial assets.")
    if st.button("Go to Pipeline Runner"):
        st.switch_page("views/pipeline_runner.py")
    st.stop()

# ── Load topic + manifest ──────────────────────────────────────────
manifest: dict = json.loads(manifest_path.read_text())
topic: dict    = json.loads(topic_json_path.read_text()) if topic_json_path and topic_json_path.exists() else {}
scenes: list   = topic.get("scenes", [])

st.markdown(f"**{st.session_state.get('topic_title', slug)}** · {len(scenes)} scenes")

# ── Pexels helpers ─────────────────────────────────────────────────
PEXELS_HEADERS = {"Authorization": PEXELS_API_KEY}

def search_pexels_videos(query: str, per_page: int = 5) -> list[dict]:
    """Search Pexels for videos. Returns list of {id, url, preview, thumb, duration}."""
    try:
        r = requests.get(
            "https://api.pexels.com/videos/search",
            headers=PEXELS_HEADERS,
            params={"query": query, "per_page": per_page, "orientation": "portrait", "size": "medium"},
            timeout=10,
        )
        r.raise_for_status()
        results = []
        for v in r.json().get("videos", []):
            files = sorted(
                [f for f in v.get("video_files", []) if f.get("height", 0) >= 720],
                key=lambda f: f.get("height", 0),
                reverse=True,
            )
            if files:
                results.append({
                    "id": v["id"],
                    "url": files[0]["link"],
                    "thumb": v.get("image", ""),
                    "duration": v.get("duration", 0),
                    "photographer": v.get("user", {}).get("name", ""),
                })
        return results
    except Exception as e:
        st.error(f"Pexels video search failed: {e}")
        return []


def search_pexels_images(query: str, per_page: int = 5) -> list[dict]:
    """Search Pexels for photos. Returns list of {id, url, thumb, photographer}."""
    try:
        r = requests.get(
            "https://api.pexels.com/v1/search",
            headers=PEXELS_HEADERS,
            params={"query": query, "per_page": per_page, "orientation": "portrait"},
            timeout=10,
        )
        r.raise_for_status()
        results = []
        for p in r.json().get("photos", []):
            results.append({
                "id": p["id"],
                "url": p["src"].get("large2x") or p["src"].get("large"),
                "thumb": p["src"].get("medium"),
                "photographer": p.get("photographer", ""),
            })
        return results
    except Exception as e:
        st.error(f"Pexels image search failed: {e}")
        return []


def download_asset(url: str, dest: Path) -> bool:
    """Download a file from URL to dest path."""
    try:
        r = requests.get(url, stream=True, timeout=60)
        r.raise_for_status()
        dest.parent.mkdir(parents=True, exist_ok=True)
        with open(dest, "wb") as f:
            for chunk in r.iter_content(chunk_size=8192):
                f.write(chunk)
        return True
    except Exception as e:
        st.error(f"Download failed: {e}")
        return False


def update_manifest(key: str, static_path: str):
    """Update manifest.json with new asset path."""
    manifest[key] = static_path
    manifest_path.write_text(json.dumps(manifest, indent=2))


def update_topic_query(scene_idx: int, field: str, new_query: str):
    """Update pexelsVideoQuery or pexelsImageQuery in topic JSON on disk."""
    if not topic_json_path or not topic_json_path.exists():
        return
    t = json.loads(topic_json_path.read_text())
    for s in t.get("scenes", []):
        if s.get("index") == scene_idx:
            s[field] = new_query
            break
    topic_json_path.write_text(json.dumps(t, indent=2))


# ── Store search results in session state ─────────────────────────
if "asset_search_results" not in st.session_state:
    st.session_state["asset_search_results"] = {}

# ── Scene assets ──────────────────────────────────────────────────
st.divider()

for i, scene in enumerate(scenes):
    scene_idx = scene.get("index")
    hero_type = scene.get("heroType", "")
    hero_word = scene.get("heroWord", "")

    video_key   = f"scene{scene_idx}_video"
    image_key   = f"scene{scene_idx}_image"
    video_file  = assets_dir / f"scene{scene_idx}_video.mp4"
    image_file  = assets_dir / f"scene{scene_idx}_image.jpg"

    video_query = scene.get("pexelsVideoQuery", "")
    image_query = scene.get("pexelsImageQuery", "")

    # First scene expanded by default so user sees something immediately
    with st.expander(
        f"S{scene_idx}  ·  {hero_type}  ·  \"{hero_word}\"",
        expanded=(i == 0),
    ):

        tab_video, tab_image = st.tabs(["Video", "Image"])

        # ── VIDEO TAB ──────────────────────────────────────────────
        with tab_video:
            col_preview, col_controls = st.columns([1, 1])

            with col_preview:
                if video_file.exists():
                    st.video(str(video_file))
                    size_mb = video_file.stat().st_size / 1024 / 1024
                    st.caption(f"{size_mb:.1f} MB")
                else:
                    st.info("No video file")

            with col_controls:
                new_video_query = st.text_input(
                    "Video search query",
                    value=video_query,
                    key=f"vq_{scene_idx}",
                    label_visibility="collapsed",
                    placeholder="Search Pexels videos...",
                )

                if st.button(
                    "Search", key=f"search_vid_{scene_idx}", use_container_width=True
                ):
                    if new_video_query:
                        with st.spinner("Searching..."):
                            results = search_pexels_videos(new_video_query, per_page=5)
                            st.session_state["asset_search_results"][f"vid_{scene_idx}"] = results
                            if new_video_query != video_query:
                                update_topic_query(scene_idx, "pexelsVideoQuery", new_video_query)

            # Show search results
            results_key = f"vid_{scene_idx}"
            results = st.session_state["asset_search_results"].get(results_key, [])
            if results:
                st.caption("Click to replace:")
                cols = st.columns(min(len(results), 5))
                for j, (col, res) in enumerate(zip(cols, results)):
                    with col:
                        if res.get("thumb"):
                            st.image(res["thumb"], use_container_width=True)
                        st.caption(f"{res['duration']}s")
                        if st.button("Use", key=f"use_vid_{scene_idx}_{j}", use_container_width=True):
                            with st.spinner("Downloading..."):
                                success = download_asset(res["url"], video_file)
                                if success:
                                    static_path = f"/assets/{slug}/scene{scene_idx}_video.mp4"
                                    update_manifest(video_key, static_path)
                                    st.session_state["asset_search_results"].pop(results_key, None)
                                    st.success(f"Replaced scene {scene_idx} video!")
                                    st.rerun()

        # ── IMAGE TAB ──────────────────────────────────────────────
        with tab_image:
            col_preview, col_controls = st.columns([1, 1])

            with col_preview:
                if image_file.exists():
                    st.image(str(image_file), use_container_width=True)
                    size_kb = image_file.stat().st_size / 1024
                    st.caption(f"{size_kb:.0f} KB")
                else:
                    st.info("No image file")

            with col_controls:
                new_image_query = st.text_input(
                    "Image search query",
                    value=image_query,
                    key=f"iq_{scene_idx}",
                    label_visibility="collapsed",
                    placeholder="Search Pexels images...",
                )

                if st.button(
                    "Search", key=f"search_img_{scene_idx}", use_container_width=True
                ):
                    if new_image_query:
                        with st.spinner("Searching..."):
                            results = search_pexels_images(new_image_query, per_page=5)
                            st.session_state["asset_search_results"][f"img_{scene_idx}"] = results
                            if new_image_query != image_query:
                                update_topic_query(scene_idx, "pexelsImageQuery", new_image_query)

            # Show image results
            results_key = f"img_{scene_idx}"
            results = st.session_state["asset_search_results"].get(results_key, [])
            if results:
                st.caption("Click to replace:")
                cols = st.columns(min(len(results), 5))
                for j, (col, res) in enumerate(zip(cols, results)):
                    with col:
                        if res.get("thumb"):
                            st.image(res["thumb"], use_container_width=True)
                        st.caption(res.get("photographer", ""))
                        if st.button("Use", key=f"use_img_{scene_idx}_{j}", use_container_width=True):
                            with st.spinner("Downloading..."):
                                success = download_asset(res["url"], image_file)
                                if success:
                                    static_path = f"/assets/{slug}/scene{scene_idx}_image.jpg"
                                    update_manifest(image_key, static_path)
                                    st.session_state["asset_search_results"].pop(results_key, None)
                                    st.success(f"Replaced scene {scene_idx} image!")
                                    st.rerun()

# ── Upload custom file ─────────────────────────────────────────────
st.divider()
with st.expander("Upload custom file"):
    st.caption("Upload your own MP4 or JPG to replace a specific scene's asset.")
    col1, col2, col3 = st.columns([1, 1, 2])
    with col1:
        upload_scene = st.number_input("Scene #", min_value=1, max_value=max(len(scenes), 1), step=1, key="upload_scene_num")
    with col2:
        upload_type = st.selectbox("Type", ["video", "image"], key="upload_type_sel")
    with col3:
        ext = "mp4" if upload_type == "video" else "jpg"
        custom_file = st.file_uploader(
            f"Upload {ext.upper()}",
            type=[ext],
            key=f"custom_upload_{upload_scene}_{upload_type}",
        )
    if custom_file:
        dest_filename = f"scene{upload_scene}_{upload_type}.{ext}"
        dest_path = assets_dir / dest_filename
        dest_path.write_bytes(custom_file.getbuffer())
        static_path = f"/assets/{slug}/{dest_filename}"
        manifest_key = f"scene{upload_scene}_{upload_type}"
        update_manifest(manifest_key, static_path)
        st.success(f"Uploaded `{dest_filename}` — manifest updated.")

# ── Navigation ─────────────────────────────────────────────────────
st.divider()
st.caption("Changes are saved immediately. Re-run the pipeline (skip asset fetch) to render with updated assets.")

col1, col2 = st.columns(2)
with col1:
    if st.button("Go to Pipeline Runner", use_container_width=True, type="primary"):
        st.switch_page("views/pipeline_runner.py")
with col2:
    if st.button("Go to Preview", use_container_width=True):
        st.switch_page("views/preview_download.py")
