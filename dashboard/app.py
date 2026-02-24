"""
WARP Dashboard — Main Entry Point
The Wealth Archive Remotion Pipeline

Uses st.navigation() for dynamic sidebar control.
Pages are gated based on pipeline step completion.
"""

import streamlit as st
from utils.state import init_state, get_completed_steps, reset_all_state

st.set_page_config(
    page_title="WARP Dashboard",
    page_icon="🎬",
    layout="centered",
    initial_sidebar_state="expanded",
)

init_state()

# ── Step definitions ─────────────────────────────────────────────────
STEPS = [
    {"num": 1, "title": "Create Topic",       "file": "views/topic_creator.py",     "icon": "📝", "requires": set()},
    {"num": 2, "title": "Upload Avatar",       "file": "views/avatar_upload.py",     "icon": "🎭", "requires": {1}},
    {"num": 3, "title": "Run Pipeline",        "file": "views/pipeline_runner.py",   "icon": "⚙️",  "requires": {1, 2}},
    {"num": 4, "title": "Preview & Download",  "file": "views/preview_download.py",  "icon": "🎬", "requires": {1, 2, 3}},
    {"num": 5, "title": "Asset Manager",       "file": "views/asset_manager.py",     "icon": "🖼️",  "requires": {1, 3}},
]

# Utility pages — always accessible, not part of the pipeline
UTILS = [
    {"title": "SOP Reference", "file": "views/sop_reference.py", "icon": "📜"},
]

# ── Compute which steps are unlocked ─────────────────────────────────
completed = get_completed_steps()

# Build page list — only register reachable pages with st.navigation()
pages = []
for step in STEPS:
    reachable = step["requires"].issubset(completed)
    if reachable:
        pages.append(
            st.Page(
                step["file"],
                title=step["title"],
                icon=step["icon"],
            )
        )

# Step 1 is always available (fallback)
if not pages:
    pages.append(
        st.Page(
            "views/topic_creator.py",
            title="Create Topic",
            icon="📝",
        )
    )

# Always register utility pages
for util in UTILS:
    pages.append(
        st.Page(
            util["file"],
            title=util["title"],
            icon=util["icon"],
        )
    )

# ── Sidebar ──────────────────────────────────────────────────────────
with st.sidebar:
    st.title("WARP")
    st.caption("Wealth Archive Remotion Pipeline")

    slug = st.session_state.get("topic_slug")
    if slug:
        st.markdown(f"**{st.session_state.get('topic_title', slug)}**")
        if st.button("🔄 New Topic", key="sidebar_new_topic", use_container_width=True):
            reset_all_state()
            st.switch_page("views/topic_creator.py")

    st.divider()

    # Build set of registered page files for defensive navigation guard
    registered_files = {step["file"] for step in STEPS if step["requires"].issubset(completed)}

    # Progress stepper
    for step in STEPS:
        num = step["num"]
        reachable = step["requires"].issubset(completed)
        is_completed = num in completed

        if is_completed and reachable:
            if st.button(
                f"✅  {num}. {step['title']}",
                key=f"nav_{num}",
                use_container_width=True,
            ):
                if step["file"] in registered_files:
                    st.switch_page(step["file"])
        elif reachable:
            if st.button(
                f"→  {num}. {step['title']}",
                key=f"nav_{num}",
                use_container_width=True,
                type="primary",
            ):
                st.switch_page(step["file"])
        else:
            st.markdown(
                f"<div style='color:#555; padding:6px 16px; font-size:0.9em;'>"
                f"🔒 {num}. {step['title']}</div>",
                unsafe_allow_html=True,
            )

    # Utility links
    st.divider()
    for util in UTILS:
        if st.button(
            f"{util['icon']}  {util['title']}",
            key=f"nav_util_{util['title']}",
            use_container_width=True,
        ):
            st.switch_page(util["file"])

# ── Run navigation (hidden — our sidebar buttons handle nav) ─────────
pg = st.navigation(pages, position="hidden")
pg.run()
