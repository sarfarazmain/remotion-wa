"""
SOP Reference
Copy-paste-ready versions of the internal SOPs that guide composition generation.
"""

import streamlit as st
from pathlib import Path

from utils.state import get_project_root

st.title("SOP Reference")
st.caption("Internal SOPs that guide composition generation. Copy any section for use with AI prompts or manual review.")

project_root = get_project_root()

# ── SOP files ─────────────────────────────────────────────────────────
SOP_FILES = [
    {
        "title": "Gemini System Prompt",
        "subtitle": "The prompt sent to Perplexity/Gemini to generate topic.json from narration text",
        "path": project_root / "sop" / "GEMINI_PROMPT.md",
    },
    {
        "title": "WARP Master Protocol",
        "subtitle": "The full visual SOP (WARP v2.0) — colors, compositing, typography, transitions, foley, pacing",
        "path": project_root / "WARP_MASTER_PROTOCOL.md",
    },
]


# ── Render each SOP ───────────────────────────────────────────────────
for sop in SOP_FILES:
    st.divider()
    st.subheader(sop["title"])
    st.caption(sop["subtitle"])

    path: Path = sop["path"]

    if not path.exists():
        st.warning(f"File not found: `{path.relative_to(project_root)}`")
        continue

    content = path.read_text()
    word_count = len(content.split())
    line_count = content.count("\n") + 1

    col_info, col_copy = st.columns([3, 1])
    with col_info:
        st.caption(f"`{path.relative_to(project_root)}`  ·  {word_count:,} words  ·  {line_count} lines")
    with col_copy:
        st.download_button(
            label=f"Download {path.name}",
            data=content,
            file_name=path.name,
            mime="text/markdown",
            key=f"dl_{path.stem}",
            use_container_width=True,
        )

    # Full content in a copy-friendly text area
    st.text_area(
        f"{sop['title']} (select all + copy)",
        value=content,
        height=400,
        label_visibility="collapsed",
        key=f"sop_{path.stem}",
    )
