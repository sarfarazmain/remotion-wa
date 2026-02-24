"""
Page 1: Topic Creator
GPT-4o-mini generates the full topic.json from a topic idea.
"""

import json
import os
import copy
import streamlit as st
from pathlib import Path
from dotenv import load_dotenv

from utils.state import get_project_root, get_topic_json_path
from utils.openai_llm import generate_topic, fix_topic
from utils.validator import validate_basic

# Load API keys from .env in project root
load_dotenv(get_project_root() / ".env")

st.title("Topic Creator")
st.caption("Enter a topic idea and generate the full creative brief, or load an existing topic JSON.")

# Load OpenAI API key from environment — no user input needed
api_key = os.environ.get("OPENAI_API_KEY", "") or os.environ.get("PERPLEXITY_API_KEY", "")
if not api_key:
    st.error("OPENAI_API_KEY not found in .env — check your environment setup.")
    st.stop()

# --- Two modes: Generate or Load ---
tab_generate, tab_upload, tab_paste = st.tabs(["Generate New", "Upload File", "Paste JSON"])

# ── TAB 1: Generate via GPT-4o-mini ──────────────────────────────────
with tab_generate:
    title = st.text_input(
        "Topic Title",
        placeholder="e.g. Financial Repression, The Petrodollar System, Japan's Lost Decade",
        value=st.session_state.get("topic_title", ""),
    )

    col1, col2 = st.columns([2, 1])
    with col1:
        guidance = st.text_area(
            "Creative Guidance (optional)",
            placeholder="e.g. Focus on how governments steal purchasing power. Include real CPI data. End with gold as the solution.",
            height=80,
        )
    with col2:
        archetype = st.selectbox(
            "Archetype",
            ["HIDDEN_MECHANISM", "TIMELINE_EVOLUTION", "GREAT_MAN"],
            index=0,
        )

    if st.button("Generate with GPT-4o-mini", type="primary", use_container_width=True, disabled=not title):
        with st.spinner("Generating topic.json via GPT-4o-mini..."):
            try:
                topic = generate_topic(
                    title=title,
                    archetype=archetype,
                    guidance=guidance,
                    api_key=api_key,
                )
                st.session_state["topic_json"] = topic
                st.session_state["topic_title"] = topic.get("meta", {}).get("title", title)
                st.session_state["topic_slug"] = topic.get("meta", {}).get("slug", "")
                st.session_state["narration_text"] = topic.get("narration", "")
                st.success("Topic generated!")
                st.rerun()
            except json.JSONDecodeError as e:
                st.error(f"GPT-4o-mini returned invalid JSON: {e}")
            except Exception as e:
                st.error(f"Generation failed: {e}")

# ── TAB 2: Upload file ─────────────────────────────────────────────
with tab_upload:
    uploaded = st.file_uploader("Upload a topic.json file", type=["json"])
    if uploaded:
        try:
            topic = json.loads(uploaded.read().decode("utf-8"))
            st.session_state["topic_json"] = topic
            st.session_state["topic_title"] = topic.get("meta", {}).get("title", "")
            st.session_state["topic_slug"] = topic.get("meta", {}).get("slug", "")
            st.session_state["narration_text"] = topic.get("narration", "")
            st.success(f"Loaded: {st.session_state['topic_title']}")
        except Exception as e:
            st.error(f"Invalid JSON: {e}")

# ── TAB 3: Paste JSON ──────────────────────────────────────────────
with tab_paste:
    pasted = st.text_area(
        "Paste the full topic JSON below",
        placeholder='{\n  "meta": { "title": "...", "slug": "..." },\n  "narration": "...",\n  "scenes": [...]\n}',
        height=300,
    )
    if st.button("Load Pasted JSON", type="primary", use_container_width=True, disabled=not pasted.strip()):
        try:
            topic = json.loads(pasted)
            st.session_state["topic_json"] = topic
            st.session_state["topic_title"] = topic.get("meta", {}).get("title", "")
            st.session_state["topic_slug"] = topic.get("meta", {}).get("slug", "")
            st.session_state["narration_text"] = topic.get("narration", "")
            st.success(f"Loaded: {st.session_state['topic_title']}")
            st.rerun()
        except json.JSONDecodeError as e:
            st.error(f"Invalid JSON: {e}")


# ══════════════════════════════════════════════════════════════════════
# CONSTANTS — SOP-defined option sets
# ══════════════════════════════════════════════════════════════════════
HERO_TYPES = ["STATEMENT_STATE", "DATA_STATE", "EVIDENCE_STATE", "HERO_VIDEO"]
ENVIRONMENTS = ["VOID", "IMMERSIVE_BLEED", "SIGNAL_GRID"]
LAYOUTS = ["FULL_BLEED", "DATA_VICE", "OFFSET_STACK"]
PHYSICS_OPTS = ["SLAM", "GLIDE", "STOP_MOTION"]
MICRO_RESET_TYPES = ["Z_PUNCH_IN", "REDACTION_REVEAL", "HIGHLIGHTER"]
COLORS = ["CREAM", "CREAM_DIM", "GOLD", "OXBLOOD", "NAVY"]
TYPO_TYPES = ["HERO", "CONNECTIVE"]
TYPO_ANIMATIONS = ["SLIDE", "STOMP", "REDACTION"]
TYPO_WEIGHTS = ["BLACK", "BOLD"]
TYPO_ALIGNS = ["flex-start", "center", "flex-end"]
CHART_TYPES = ["LINE", "BAR"]
CHART_COLORS = ["GOLD", "OXBLOOD"]
EVIDENCE_TYPES = ["VERDICT_CARD", "STAT_LINES", "FLOW_ARROW", "EVIDENCE_CARD"]
TRANSITION_TYPES = [
    "INFINITE_DESK_LEFT", "INFINITE_DESK_RIGHT", "INFINITE_DESK_DOWN",
    "Z_AXIS_PORTAL", "INK_BLEED", "FLASHBULB",
]


def _idx(options: list, value, default: int = 0) -> int:
    """Return the index of value in options, or default if not found."""
    try:
        return options.index(value)
    except (ValueError, TypeError):
        return default


# ══════════════════════════════════════════════════════════════════════
# SCENE EDITOR — clean sectioned layout
# ══════════════════════════════════════════════════════════════════════

def _edit_scene(scene: dict, idx: int) -> dict:
    """Render a clean scene editor. Returns the modified scene dict."""
    s = copy.deepcopy(scene)
    k = f"se_{idx}"

    # ── 1. BASICS ─────────────────────────────────────────────────
    s["narration"] = st.text_area(
        "Narration", value=s.get("narration", ""), height=68, key=f"{k}_narr",
    )

    left, right = st.columns(2)
    with left:
        s["heroType"] = st.selectbox("Hero Type", HERO_TYPES, index=_idx(HERO_TYPES, s.get("heroType")), key=f"{k}_hero")
    with right:
        s["heroWord"] = st.text_input("Hero Word", value=s.get("heroWord", ""), key=f"{k}_hw")

    left, mid, right = st.columns(3)
    with left:
        s["layout"] = st.selectbox("Layout", LAYOUTS, index=_idx(LAYOUTS, s.get("layout")), key=f"{k}_layout")
    with mid:
        s["physics"] = st.selectbox("Physics", PHYSICS_OPTS, index=_idx(PHYSICS_OPTS, s.get("physics")), key=f"{k}_phys")
    with right:
        s["environment"] = st.selectbox("Environment", ENVIRONMENTS, index=_idx(ENVIRONMENTS, s.get("environment")), key=f"{k}_env")

    # ── 2. PEXELS ─────────────────────────────────────────────────
    left, right = st.columns(2)
    with left:
        s["pexelsVideoQuery"] = st.text_input("Video Query (Pexels)", value=s.get("pexelsVideoQuery", ""), key=f"{k}_pvq")
    with right:
        s["pexelsImageQuery"] = st.text_input("Image Query (Pexels)", value=s.get("pexelsImageQuery", ""), key=f"{k}_piq")

    # ── 3. MICRO RESET ────────────────────────────────────────────
    mr = s.get("microReset") or {}
    mr_type = st.selectbox("Micro Reset", MICRO_RESET_TYPES, index=_idx(MICRO_RESET_TYPES, mr.get("type")), key=f"{k}_mr")
    new_mr = {"type": mr_type}
    if mr_type == "REDACTION_REVEAL":
        new_mr["label"] = st.text_input("Reveal Label", value=mr.get("label", ""), key=f"{k}_mr_lbl")
    elif mr_type == "HIGHLIGHTER":
        new_mr["targetElement"] = st.text_input("Target Element", value=mr.get("targetElement", ""), key=f"{k}_mr_tgt")
    s["microReset"] = new_mr

    # ── 4. SOURCE ─────────────────────────────────────────────────
    src = s.get("source") or {}
    left, right = st.columns(2)
    with left:
        src_cls = st.text_input("Classification", value=src.get("classification", ""), key=f"{k}_cls")
    with right:
        src_cit = st.text_input("Citation", value=src.get("citation", ""), key=f"{k}_cit")
    s["source"] = {"classification": src_cls, "citation": src_cit}

    # ── 5. DECLARATION (collapsible) ──────────────────────────────
    decl = s.get("declaration")
    has_decl = decl is not None and bool(decl.get("lines"))
    with st.expander(f"Declaration {'— ' + ' / '.join(l.get('text','') for l in (decl or {}).get('lines',[])) if has_decl else '(none)'}"):
        if not has_decl:
            st.caption("No declaration lines. Add one below.")
            decl = {"lines": [], "lineStagger": 10}

        decl_lines = list(decl.get("lines", []))
        new_decl_lines = []
        for j, dl in enumerate(decl_lines):
            st.markdown(f"**Line {j+1}**")
            dl_text = st.text_input("Text", value=dl.get("text", ""), key=f"{k}_d{j}_t", placeholder="≤18 chars")
            left, right = st.columns(2)
            with left:
                dl_size = st.slider("Size (px)", 24, 120, int(dl.get("size", 88)), step=4, key=f"{k}_d{j}_s")
            with right:
                dl_color = st.selectbox("Color", COLORS, index=_idx(COLORS, dl.get("color")), key=f"{k}_d{j}_c")
            new_decl_lines.append({"text": dl_text, "size": dl_size, "color": dl_color})

        if st.button("+ Add Declaration Line", key=f"{k}_d_add"):
            new_decl_lines.append({"text": "", "size": 72, "color": "CREAM"})

        stagger = st.slider("Line Stagger (frames)", 0, 30, int(decl.get("lineStagger", 10)), step=2, key=f"{k}_d_stg")

        if new_decl_lines:
            s["declaration"] = {"lines": new_decl_lines, "lineStagger": stagger}
        else:
            s["declaration"] = None

    # ── 6. TYPOGRAPHY (collapsible) ───────────────────────────────
    typo = s.get("typography")
    has_typo = typo is not None and bool(typo.get("lines"))
    typo_preview = " / ".join(l.get("text", "") for l in (typo or {}).get("lines", [])) if has_typo else "(none)"
    with st.expander(f"Typography — {typo_preview}"):
        if not has_typo:
            st.caption("No typography lines. Add one below.")
            typo = {"lines": [], "align": "flex-start", "stagger": 8}

        typo_lines = list(typo.get("lines", []))
        new_typo_lines = []
        for j, tl in enumerate(typo_lines):
            st.markdown(f"**Line {j+1}**")
            tl_text = st.text_input("Text", value=tl.get("text", ""), key=f"{k}_t{j}_t", placeholder="≤18 chars")
            left, right = st.columns(2)
            with left:
                tl_type = st.selectbox("Type", TYPO_TYPES, index=_idx(TYPO_TYPES, tl.get("type")), key=f"{k}_t{j}_tp")
                tl_anim = st.selectbox("Animation", TYPO_ANIMATIONS, index=_idx(TYPO_ANIMATIONS, tl.get("animation")), key=f"{k}_t{j}_a")
            with right:
                tl_weight = st.selectbox("Weight", TYPO_WEIGHTS, index=_idx(TYPO_WEIGHTS, tl.get("weight")), key=f"{k}_t{j}_w")
                tl_color = st.selectbox("Color", COLORS, index=_idx(COLORS, tl.get("color", "CREAM")), key=f"{k}_t{j}_c")
            new_typo_lines.append({"text": tl_text, "type": tl_type, "animation": tl_anim, "weight": tl_weight, "color": tl_color})

        if st.button("+ Add Typography Line", key=f"{k}_t_add"):
            new_typo_lines.append({"text": "", "type": "HERO", "animation": "STOMP", "weight": "BLACK", "color": "GOLD"})

        left, right = st.columns(2)
        with left:
            t_align = st.selectbox("Align", TYPO_ALIGNS, index=_idx(TYPO_ALIGNS, typo.get("align")), key=f"{k}_t_al")
        with right:
            t_stagger = st.slider("Stagger (frames)", 0, 30, int(typo.get("stagger", 8)), step=2, key=f"{k}_t_stg")

        if new_typo_lines:
            s["typography"] = {"lines": new_typo_lines, "align": t_align, "stagger": t_stagger}
        else:
            s["typography"] = None

    # ── 7. CHART (collapsible — only relevant for DATA_STATE) ────
    chart = s.get("chart")
    has_chart = chart is not None
    chart_label = f"Chart — {chart.get('type','')} \"{chart.get('title','')}\"" if has_chart else "Chart (none)"
    with st.expander(chart_label):
        show_chart = st.toggle("Enable Chart", value=has_chart, key=f"{k}_ch_on")
        if show_chart:
            if not chart:
                chart = {"type": "LINE", "title": "", "lineLabel": "", "color": "GOLD", "data": []}

            left, right = st.columns(2)
            with left:
                ch_type = st.selectbox("Chart Type", CHART_TYPES, index=_idx(CHART_TYPES, chart.get("type")), key=f"{k}_ch_tp")
            with right:
                ch_color = st.selectbox("Chart Color", CHART_COLORS, index=_idx(CHART_COLORS, chart.get("color")), key=f"{k}_ch_cl")

            ch_title = st.text_input("Chart Title", value=chart.get("title", ""), key=f"{k}_ch_tt")

            ch_label = ""
            ch_highlight = False
            if ch_type == "LINE":
                ch_label = st.text_input("Line Label", value=chart.get("lineLabel", ""), key=f"{k}_ch_ll")
            else:
                ch_highlight = st.toggle("Highlight Last Bar (Oxblood)", value=chart.get("highlightLast", False), key=f"{k}_ch_hl")

            # Data points
            st.caption("Data Points")
            data_points = chart.get("data", [])
            new_data = []
            for j, dp in enumerate(data_points):
                left, right = st.columns(2)
                with left:
                    dp_lbl = st.text_input(f"Label {j+1}", value=dp.get("label", ""), key=f"{k}_cd{j}_l")
                with right:
                    dp_val = st.number_input(f"Value {j+1}", value=float(dp.get("value", 0)), key=f"{k}_cd{j}_v", format="%.1f")
                new_data.append({"label": dp_lbl, "value": dp_val})

            if st.button("+ Add Data Point", key=f"{k}_cd_add"):
                new_data.append({"label": "", "value": 0})

            new_chart = {"type": ch_type, "title": ch_title, "color": ch_color, "data": new_data}
            if ch_type == "LINE":
                new_chart["lineLabel"] = ch_label
            if ch_type == "BAR":
                new_chart["highlightLast"] = ch_highlight
            if chart.get("secondLine"):
                new_chart["secondLine"] = chart["secondLine"]
            s["chart"] = new_chart
        else:
            s["chart"] = None

    # ── 8. EVIDENCE (collapsible) ─────────────────────────────────
    evidence = s.get("evidence")
    has_ev = evidence is not None
    ev_label = f"Evidence — {evidence.get('type','')}" if has_ev else "Evidence (none)"
    with st.expander(ev_label):
        show_ev = st.toggle("Enable Evidence", value=has_ev, key=f"{k}_ev_on")
        if show_ev:
            if not evidence:
                evidence = {"type": "VERDICT_CARD"}

            ev_type = st.selectbox("Evidence Type", EVIDENCE_TYPES, index=_idx(EVIDENCE_TYPES, evidence.get("type")), key=f"{k}_ev_tp")
            new_ev = {"type": ev_type}

            if ev_type == "VERDICT_CARD":
                left, right = st.columns(2)
                with left:
                    st.markdown("**Left Side**")
                    new_ev["leftLabel"] = st.text_input("Label", value=evidence.get("leftLabel", ""), key=f"{k}_ev_ll")
                    items_l = evidence.get("leftItems", [])
                    raw_l = st.text_input("Items (comma-separated)", value=", ".join(items_l), key=f"{k}_ev_li")
                    new_ev["leftItems"] = [x.strip() for x in raw_l.split(",") if x.strip()]
                with right:
                    st.markdown("**Right Side**")
                    new_ev["rightLabel"] = st.text_input("Label", value=evidence.get("rightLabel", ""), key=f"{k}_ev_rl")
                    items_r = evidence.get("rightItems", [])
                    raw_r = st.text_input("Items (comma-separated)", value=", ".join(items_r), key=f"{k}_ev_ri")
                    new_ev["rightItems"] = [x.strip() for x in raw_r.split(",") if x.strip()]

            elif ev_type == "FLOW_ARROW":
                new_ev["fromLabel"] = st.text_input("From", value=evidence.get("fromLabel", ""), key=f"{k}_ev_fr")
                new_ev["throughLabel"] = st.text_input("Through (optional)", value=evidence.get("throughLabel", ""), key=f"{k}_ev_th")
                new_ev["toLabel"] = st.text_input("To", value=evidence.get("toLabel", ""), key=f"{k}_ev_to")

            elif ev_type == "STAT_LINES":
                stats = evidence.get("stats", [])
                new_stats = []
                for j, stat in enumerate(stats):
                    st.markdown(f"**Stat {j+1}**")
                    left, mid, right = st.columns(3)
                    with left:
                        st_lbl = st.text_input("Label", value=stat.get("label", ""), key=f"{k}_es{j}_l")
                    with mid:
                        st_val = st.text_input("Value", value=stat.get("value", ""), key=f"{k}_es{j}_v")
                    with right:
                        st_clr = st.selectbox("Color", CHART_COLORS, index=_idx(CHART_COLORS, stat.get("color")), key=f"{k}_es{j}_c")
                    new_stats.append({"label": st_lbl, "value": st_val, "color": st_clr})
                if st.button("+ Add Stat", key=f"{k}_es_add"):
                    new_stats.append({"label": "", "value": "", "color": "GOLD"})
                new_ev["stats"] = new_stats

            s["evidence"] = new_ev
        else:
            s["evidence"] = None

    return s


def _edit_transitions(transitions: list, scene_count: int) -> list:
    """Render compact transition editors."""
    new_transitions = []
    for i in range(scene_count - 1):
        f_idx, t_idx = i + 1, i + 2
        existing = next((t for t in transitions if t.get("from") == f_idx and t.get("to") == t_idx), {})
        current = existing.get("type", "INFINITE_DESK_LEFT")
        t_type = st.selectbox(
            f"S{f_idx} → S{t_idx}",
            TRANSITION_TYPES,
            index=_idx(TRANSITION_TYPES, current),
            key=f"tr_{f_idx}_{t_idx}",
        )
        new_transitions.append({"from": f_idx, "to": t_idx, "type": t_type})
    return new_transitions


# ════════════════════════════════════════════════════════════════════
# REVIEW SECTION — shown once a topic is loaded
# ════════════════════════════════════════════════════════════════════
topic = st.session_state.get("topic_json")
if topic:
    st.divider()
    meta = topic.get("meta", {})
    st.subheader(meta.get("title", "Untitled Topic"))
    st.caption(f"Slug: `{meta.get('slug', '—')}`  ·  Archetype: `{meta.get('archetype', '—')}`")

    # ── Validation ──────────────────────────────────────────────────
    errors = validate_basic(topic)
    if errors:
        with st.expander(f":warning: {len(errors)} validation issue(s)", expanded=True):
            for err in errors:
                st.markdown(f"- {err}")
            if st.button("Auto-fix with GPT-4o-mini"):
                with st.spinner("Fixing..."):
                    try:
                        fixed = fix_topic(topic, errors, api_key=api_key)
                        st.session_state["topic_json"] = fixed
                        st.session_state["topic_slug"] = fixed.get("meta", {}).get("slug", "")
                        st.session_state["narration_text"] = fixed.get("narration", "")
                        st.rerun()
                    except Exception as e:
                        st.error(f"Fix failed: {e}")
    else:
        st.success("All validations passed!")

    # ── Narration (copy-friendly) ───────────────────────────────────
    narration = topic.get("narration", "")
    if narration:
        word_count = len(narration.split())
        est_duration = round(word_count / 2.5)
        st.markdown(f"**Narration** — {word_count} words, ~{est_duration}s")
        st.text_area(
            "Full narration text (select all + copy for HeyGen)",
            value=narration,
            height=150,
            label_visibility="collapsed",
            disabled=True,
        )

    # ── Scenes: View / Edit / JSON ─────────────────────────────────
    scenes = topic.get("scenes", [])
    transitions = topic.get("transitions", [])

    if scenes:
        st.divider()
        view_tab, edit_tab, json_tab = st.tabs([
            f"View ({len(scenes)} scenes)",
            "Edit Scenes",
            "Raw JSON",
        ])

        # ── VIEW TAB ──────────────────────────────────────────────
        with view_tab:
            for s in scenes:
                idx = s.get("index", "?")
                hero = s.get("heroType", "—")
                hero_word = s.get("heroWord", "—")
                scene_narr = s.get("narration", "")
                typo_preview = " / ".join(l.get("text", "") for l in s.get("typography", {}).get("lines", []))

                with st.expander(f"S{idx}  ·  {hero}  ·  \"{hero_word}\"  ·  {typo_preview or '—'}"):
                    st.markdown(f"**Narration:** {scene_narr}")
                    left, right = st.columns(2)
                    with left:
                        st.markdown(f"**Video Query:** `{s.get('pexelsVideoQuery', '—')}`")
                    with right:
                        st.markdown(f"**Image Query:** `{s.get('pexelsImageQuery', '—')}`")
                    mr = s.get("microReset", {})
                    st.markdown(f"**MicroReset:** `{mr.get('type', '—')}`")

        # ── EDIT TAB ──────────────────────────────────────────────
        with edit_tab:
            edited_scenes = []
            for i, scene in enumerate(scenes):
                idx = scene.get("index", i + 1)
                hero = scene.get("heroType", "—")
                hw = scene.get("heroWord", "—")
                narr_short = (scene.get("narration", "")[:50] + "...") if len(scene.get("narration", "")) > 50 else scene.get("narration", "")

                with st.expander(f"**S{idx}**  {hero}  ·  \"{hw}\"  —  _{narr_short}_", expanded=False):
                    edited = _edit_scene(scene, idx)
                    edited["index"] = idx
                    edited_scenes.append(edited)

            # Transitions
            with st.expander("Transitions"):
                edited_transitions = _edit_transitions(transitions, len(scenes))

            # Save
            if st.button("Save All Changes", type="primary", use_container_width=True, key="save_edits"):
                updated_topic = copy.deepcopy(topic)
                clean_scenes = []
                for sc in edited_scenes:
                    clean = {kk: v for kk, v in sc.items() if v is not None}
                    clean_scenes.append(clean)
                updated_topic["scenes"] = clean_scenes
                updated_topic["transitions"] = edited_transitions
                st.session_state["topic_json"] = updated_topic
                st.success("Changes saved!")
                st.rerun()

        # ── JSON TAB ──────────────────────────────────────────────
        with json_tab:
            edited_json = st.text_area(
                "Edit JSON",
                value=json.dumps(topic, indent=2),
                height=500,
                label_visibility="collapsed",
            )
            if st.button("Apply JSON Changes"):
                try:
                    updated = json.loads(edited_json)
                    st.session_state["topic_json"] = updated
                    st.session_state["topic_slug"] = updated.get("meta", {}).get("slug", "")
                    st.session_state["narration_text"] = updated.get("narration", "")
                    st.success("JSON updated!")
                    st.rerun()
                except json.JSONDecodeError as e:
                    st.error(f"Invalid JSON: {e}")

    # ── Save & Continue ─────────────────────────────────────────────
    st.divider()

    if not errors:
        if st.button("Save & Continue to Avatar Upload", type="primary", use_container_width=True):
            project_root = get_project_root()
            slug = st.session_state["topic_slug"]
            topics_dir = project_root / "topics"
            topics_dir.mkdir(exist_ok=True)
            topic_path = topics_dir / f"{slug}.json"
            topic_path.write_text(json.dumps(topic, indent=2))

            topic_dir = project_root / "public" / "topics" / slug
            topic_dir.mkdir(parents=True, exist_ok=True)
            (topic_dir / "assets").mkdir(exist_ok=True)

            st.success(f"Saved to `topics/{slug}.json`")
            st.switch_page("views/avatar_upload.py")
    else:
        st.info("Fix validation errors above before continuing.")
