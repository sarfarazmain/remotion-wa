"""
Topic JSON validator.
Runs basic Python-side checks and optionally calls the Node.js Zod validator.

This validator mirrors the Node-side Zod schema (pipeline/schema.ts) so the
dashboard catches errors before the pipeline does.
"""

import json
from pathlib import Path

from .state import get_project_root
from .launch import spawn_shell_wait

# ── Valid enum values (must match pipeline/schema.ts) ─────────────────
VALID_HERO_TYPES = {"STATEMENT_STATE", "DATA_STATE", "EVIDENCE_STATE", "HERO_VIDEO"}
VALID_ENVIRONMENTS = {"VOID", "IMMERSIVE_BLEED", "SIGNAL_GRID"}
VALID_LAYOUTS = {"FULL_BLEED", "DATA_VICE", "OFFSET_STACK"}
VALID_PHYSICS = {"SLAM", "GLIDE", "STOP_MOTION"}
VALID_CHART_TYPES = {"LINE", "BAR"}
VALID_CHART_COLORS = {"GOLD", "OXBLOOD"}
VALID_EVIDENCE_TYPES = {"VERDICT_CARD", "STAT_LINES", "FLOW_ARROW", "EVIDENCE_CARD"}
VALID_TRANSITION_TYPES = {
    "INFINITE_DESK_LEFT", "INFINITE_DESK_RIGHT", "INFINITE_DESK_DOWN",
    "Z_AXIS_PORTAL", "INK_BLEED", "FLASHBULB",
}
VALID_COLORS = {"CREAM", "CREAM_DIM", "GOLD", "OXBLOOD", "NAVY"}
VALID_MICRO_RESET_TYPES = {"Z_PUNCH_IN", "REDACTION_REVEAL", "HIGHLIGHTER"}


def validate_basic(topic: dict) -> list[str]:
    """
    Quick Python-side validation of a topic dict.
    Returns a list of error strings (empty = valid).
    """
    errors = []

    # ── meta ──────────────────────────────────────────────────────
    meta = topic.get("meta", {})
    if not meta.get("title"):
        errors.append("meta.title is required")
    if not meta.get("slug"):
        errors.append("meta.slug is required")
    elif not all(c.isalnum() or c == "-" for c in meta["slug"]):
        errors.append("meta.slug must be lowercase alphanumeric with hyphens")

    # ── narration ─────────────────────────────────────────────────
    narration = topic.get("narration", "")
    if len(narration) < 10:
        errors.append("narration must be at least 10 characters")

    # ── bgm ───────────────────────────────────────────────────────
    bgm = topic.get("bgm", {})
    if not bgm.get("trackId"):
        errors.append("bgm.trackId is required")
    else:
        bgm_file = get_project_root() / "public" / "bgm" / f"{bgm['trackId']}.mp3"
        if not bgm_file.exists():
            available = get_available_bgm_tracks()
            hint = f" Available: {', '.join(available)}" if available else ""
            errors.append(f"BGM file not found: public/bgm/{bgm['trackId']}.mp3.{hint}")

    # ── scenes ────────────────────────────────────────────────────
    scenes = topic.get("scenes", [])
    if len(scenes) < 10:
        errors.append(f"Need at least 10 scenes, got {len(scenes)}")
    if len(scenes) > 14:
        errors.append(f"Maximum 14 scenes, got {len(scenes)}")

    for i, scene in enumerate(scenes):
        idx = scene.get("index", i + 1)
        hero_type = scene.get("heroType", "")

        # heroType must be valid
        if hero_type and hero_type not in VALID_HERO_TYPES:
            errors.append(f"Scene {idx}: invalid heroType '{hero_type}'")

        # Must have typography or declaration
        if not scene.get("typography") and not scene.get("declaration"):
            errors.append(f"Scene {idx}: must have typography or declaration")

        # DATA_STATE must have chart
        if hero_type == "DATA_STATE" and not scene.get("chart"):
            errors.append(f"Scene {idx}: DATA_STATE requires chart")

        # Required fields
        if not scene.get("heroWord"):
            errors.append(f"Scene {idx}: heroWord is required")
        if not scene.get("pexelsVideoQuery"):
            errors.append(f"Scene {idx}: pexelsVideoQuery is required")
        if not scene.get("pexelsImageQuery"):
            errors.append(f"Scene {idx}: pexelsImageQuery is required")

        # ── Chart validation ──────────────────────────────────────
        chart = scene.get("chart")
        if chart is not None:
            if not chart.get("title"):
                errors.append(f"Scene {idx}: chart.title is required")
            ch_type = chart.get("type", "")
            if ch_type not in VALID_CHART_TYPES:
                errors.append(f"Scene {idx}: chart.type must be LINE or BAR, got '{ch_type}'")
            ch_data = chart.get("data", [])
            if not ch_data:
                errors.append(f"Scene {idx}: chart.data must have at least 1 data point")
            for j, dp in enumerate(ch_data):
                if not dp.get("label"):
                    errors.append(f"Scene {idx}: chart.data[{j}].label is required")
                if dp.get("value") is None:
                    errors.append(f"Scene {idx}: chart.data[{j}].value is required")

        # ── Evidence validation ───────────────────────────────────
        evidence = scene.get("evidence")
        if evidence is not None:
            ev_type = evidence.get("type", "")
            if ev_type not in VALID_EVIDENCE_TYPES:
                errors.append(f"Scene {idx}: invalid evidence.type '{ev_type}'")

        # ── Declaration validation ────────────────────────────────
        decl = scene.get("declaration")
        if decl is not None:
            decl_lines = decl.get("lines", [])
            if not decl_lines:
                errors.append(f"Scene {idx}: declaration.lines must not be empty")
            for j, line in enumerate(decl_lines):
                text = line.get("text", "")
                if not text:
                    errors.append(f"Scene {idx}: declaration line {j + 1} text is empty")
                if len(text) > 18:
                    errors.append(f"Scene {idx}: declaration line {j + 1} '{text}' is {len(text)} chars (max 18)")
                if line.get("size") is None:
                    errors.append(f"Scene {idx}: declaration line {j + 1} size is required")
                if not line.get("color"):
                    errors.append(f"Scene {idx}: declaration line {j + 1} color is required")

        # ── Typography validation ─────────────────────────────────
        typo = scene.get("typography")
        if typo is not None:
            typo_lines = typo.get("lines", [])
            if not typo_lines:
                errors.append(f"Scene {idx}: typography.lines must not be empty")
            for j, line in enumerate(typo_lines):
                text = line.get("text", "")
                if len(text) > 18:
                    errors.append(f"Scene {idx}: typography line {j + 1} '{text}' is {len(text)} chars (max 18)")

    # ── transitions ───────────────────────────────────────────────
    transitions = topic.get("transitions", [])
    expected_transitions = max(len(scenes) - 1, 0)
    if len(transitions) != expected_transitions:
        errors.append(f"Expected {expected_transitions} transitions, got {len(transitions)}")

    for i, tr in enumerate(transitions):
        tr_type = tr.get("type", "")
        if tr_type not in VALID_TRANSITION_TYPES:
            errors.append(f"Transition {i + 1}: invalid type '{tr_type}'")

    return errors


def get_available_bgm_tracks() -> list[str]:
    """Return BGM track IDs that have corresponding .mp3 files on disk."""
    bgm_dir = get_project_root() / "public" / "bgm"
    if not bgm_dir.exists():
        return []
    return sorted(f.stem for f in bgm_dir.glob("*.mp3"))


def validate_with_node(topic_json_path: str) -> tuple[bool, list[str]]:
    """
    Run the Node.js Zod validator for full schema validation.
    Returns (success, errors).
    """
    project_root = get_project_root()
    try:
        # Use fork-safe spawn instead of subprocess.run
        js_code = (
            f"import {{ validateTopicJSON }} from './pipeline/stages/validate';"
            f"const result = validateTopicJSON('{topic_json_path}');"
            f"if (result.success) {{"
            f"  console.log(JSON.stringify({{ success: true, errors: [] }}));"
            f"}} else {{"
            f"  console.log(JSON.stringify({{ success: false, errors: result.errors || ['Validation failed'] }}));"
            f"}}"
        )
        cmd = f'cd "{project_root}" && npx tsx -e \'{js_code}\''
        exit_code, output = spawn_shell_wait(cmd)
        if exit_code == 0 and output.strip():
            data = json.loads(output.strip().split("\n")[-1])
            return data["success"], data.get("errors", [])
        else:
            return False, [f"Validator error: {output[:500]}"]
    except Exception as e:
        return False, [f"Could not run Node validator: {e}"]
