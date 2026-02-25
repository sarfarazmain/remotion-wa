"""
Deterministic text fixes — runs AFTER LLM generation, BEFORE pipeline.
────────────────────────────────────────────────────────────────────────
Handles the math/constraint problems that LLMs are unreliable at:
- 18-character line breaking
- Text budget enforcement
- Character limit validation
"""

import re

# SOP Part V: scene text budgets (max focal words on screen)
TEXT_BUDGET = {
    "STATEMENT_STATE": 6,
    "EVIDENCE_STATE": 12,
    "DATA_STATE": 8,
    "HERO_VIDEO": 4,
}

CHAR_LIMIT = 18  # SOP: 18-character shatter limit


def fix_topic_text(topic: dict) -> tuple[dict, list[str]]:
    """
    Apply all deterministic text fixes to a topic dict.
    Returns (fixed_topic, list_of_fixes_applied).
    Mutates the input dict.
    """
    fixes = []

    for scene in topic.get("scenes", []):
        idx = scene.get("index", "?")

        # Fix typography lines exceeding 18 chars
        if scene.get("typography") and scene["typography"].get("lines"):
            new_lines = []
            for line in scene["typography"]["lines"]:
                text = line.get("text", "")
                if len(text) > CHAR_LIMIT:
                    split_lines = _break_line(text, CHAR_LIMIT)
                    fixes.append(
                        f"Scene {idx}: Split typography \"{text}\" ({len(text)} chars) "
                        f"into {len(split_lines)} lines"
                    )
                    for i, chunk in enumerate(split_lines):
                        new_line = dict(line)
                        new_line["text"] = chunk
                        # First chunk keeps original type, rest become CONNECTIVE
                        if i > 0:
                            new_line["type"] = "CONNECTIVE"
                        new_lines.append(new_line)
                else:
                    new_lines.append(line)
            scene["typography"]["lines"] = new_lines[:5]  # Schema max 5 lines

        # Fix declaration lines exceeding 18 chars
        if scene.get("declaration") and scene["declaration"].get("lines"):
            new_lines = []
            for line in scene["declaration"]["lines"]:
                text = line.get("text", "")
                if len(text) > CHAR_LIMIT:
                    split_lines = _break_line(text, CHAR_LIMIT)
                    fixes.append(
                        f"Scene {idx}: Split declaration \"{text}\" ({len(text)} chars) "
                        f"into {len(split_lines)} lines"
                    )
                    for chunk in split_lines:
                        new_line = dict(line)
                        new_line["text"] = chunk
                        # Scale down size for split lines
                        if len(split_lines) > 1:
                            new_line["size"] = max(48, int(line.get("size", 72) * 0.8))
                        new_lines.append(new_line)
                else:
                    new_lines.append(line)
            scene["declaration"]["lines"] = new_lines[:3]  # Schema max 3 lines

        # Fix chart title exceeding 30 chars
        if scene.get("chart"):
            title = scene["chart"].get("title", "")
            if len(title) > 30:
                truncated = title[:27] + "..."
                fixes.append(
                    f"Scene {idx}: Truncated chart title \"{title}\" ({len(title)} chars) to 30"
                )
                scene["chart"]["title"] = truncated

            # Fix chart labels exceeding 14 chars
            for dp in scene["chart"].get("data", []):
                if len(dp.get("label", "")) > 14:
                    old = dp["label"]
                    dp["label"] = old[:14]
                    fixes.append(f"Scene {idx}: Truncated chart label \"{old}\" to 14 chars")

        # Fix source fields exceeding limits
        if scene.get("source"):
            cls = scene["source"].get("classification", "")
            if len(cls) > 36:
                scene["source"]["classification"] = cls[:33] + "..."
                fixes.append(f"Scene {idx}: Truncated classification to 36 chars")
            cit = scene["source"].get("citation", "")
            if len(cit) > 50:
                scene["source"]["citation"] = cit[:47] + "..."
                fixes.append(f"Scene {idx}: Truncated citation to 50 chars")

        # Fix evidence labels exceeding limits
        if scene.get("evidence"):
            ev = scene["evidence"]
            for field in ["leftLabel", "rightLabel"]:
                val = ev.get(field, "")
                if val and len(val) > 12:
                    ev[field] = val[:12]
                    fixes.append(f"Scene {idx}: Truncated {field} to 12 chars")
            for field in ["leftItems", "rightItems"]:
                items = ev.get(field, [])
                for i, item in enumerate(items):
                    if len(item) > 14:
                        items[i] = item[:14]
                        fixes.append(f"Scene {idx}: Truncated {field}[{i}] to 14 chars")

    return topic, fixes


def validate_text_hard(topic: dict) -> list[str]:
    """
    Hard validation — returns errors for text issues that weren't auto-fixable.
    These block the pipeline.
    """
    errors = []

    for scene in topic.get("scenes", []):
        idx = scene.get("index", "?")
        hero_type = scene.get("heroType", "")

        # Count focal words
        word_count = _count_focal_words(scene)
        budget = TEXT_BUDGET.get(hero_type, 8)
        if word_count > budget * 2:  # Allow some slack, but catch extreme violations
            errors.append(
                f"Scene {idx} ({hero_type}): {word_count} focal words, "
                f"budget is {budget} — far over limit"
            )

        # Check that at least typography or declaration exists
        if not scene.get("typography") and not scene.get("declaration"):
            errors.append(f"Scene {idx}: must have typography or declaration")

        # Check DATA_STATE has chart
        if hero_type == "DATA_STATE" and not scene.get("chart"):
            errors.append(f"Scene {idx}: DATA_STATE requires chart")

    return errors


def _break_line(text: str, max_chars: int) -> list[str]:
    """
    Break a text string into lines of max_chars, splitting on word boundaries.
    """
    words = text.split()
    lines = []
    current = ""

    for word in words:
        if not current:
            current = word
        elif len(current) + 1 + len(word) <= max_chars:
            current += " " + word
        else:
            lines.append(current)
            current = word

    if current:
        lines.append(current)

    # If any single word exceeds max_chars, just keep it (can't break further)
    return lines


def _count_focal_words(scene: dict) -> int:
    """Count total focal words across all text components of a scene."""
    count = 0
    if scene.get("typography"):
        for line in scene["typography"].get("lines", []):
            count += len(line.get("text", "").split())
    if scene.get("declaration"):
        for line in scene["declaration"].get("lines", []):
            count += len(line.get("text", "").split())
    return count
