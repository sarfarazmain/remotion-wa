"""
OpenAI GPT-4o-mini API client for topic.json generation.
Replaces Perplexity Sonar — same interface, better JSON reliability via
native response_format: json_object mode (no markdown fence stripping needed).
"""

import json
import os
import requests
from pathlib import Path

OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
MODEL = "gpt-4o-mini"

# Load the example topic.json for few-shot prompting
_EXAMPLE_PATH = Path(__file__).resolve().parent.parent.parent / "topics" / "financial-repression.json"


def _load_example() -> str:
    """Load the financial-repression example as reference."""
    if _EXAMPLE_PATH.exists():
        return _EXAMPLE_PATH.read_text()
    return "(no example available)"


def _get_api_key(api_key: str | None = None) -> str:
    """Resolve API key: argument → OPENAI_API_KEY → PERPLEXITY_API_KEY (fallback)."""
    key = api_key or os.environ.get("OPENAI_API_KEY", "") or os.environ.get("PERPLEXITY_API_KEY", "")
    if not key:
        raise ValueError("OPENAI_API_KEY not set")
    return key


SYSTEM_PROMPT = """You must return valid JSON.

You are a creative director for "The Wealth Archive" — a YouTube Shorts channel that produces dark, cinematic, data-driven explainers on economics and finance.

Given a topic and optional guidance, produce a complete topic.json that EXACTLY conforms to this specification:

## Schema Rules

### meta
- title: string (the topic name)
- slug: lowercase-alphanumeric-with-hyphens (e.g. "financial-repression")
- archetype: one of "HIDDEN_MECHANISM", "TIMELINE_EVOLUTION", "GREAT_MAN"

### narration
- A single string: the FULL narration (all scene narrations concatenated). 10+ chars.
- Aim for 120-180 words total (~50-70 seconds when spoken).

### bgm
- trackId: always use "bgm_dark_high_drone_01"

### scenes (array of 10-14 scenes)
Each scene has:
- index: integer 1 to N
- narration: that scene's narration text (1-2 sentences)
- heroType: "DATA_STATE" | "EVIDENCE_STATE" | "STATEMENT_STATE" | "HERO_VIDEO"
- environment: "VOID" (default) | "IMMERSIVE_BLEED" | "SIGNAL_GRID"
- layout: "FULL_BLEED" (default) | "OFFSET_STACK" | "DATA_VICE"
- physics: "SLAM" (default) | "GLIDE" | "STOP_MOTION"
- typography: (required for STATEMENT_STATE) { lines: [{text (max 18 chars!), type: "HERO"|"CONNECTIVE", animation: "SLIDE"|"STOMP"|"REDACTION", weight: "BOLD"|"BLACK"|"LIGHT"|"REGULAR", color: "GOLD"|"OXBLOOD"|"CREAM"|"CREAM_DIM"|"CREAM_FAINT"}], align, stagger }
- declaration: (optional) { lines: [{text (max 18 chars), size: number, color}], lineStagger }
- chart: (REQUIRED for DATA_STATE) { type: "LINE"|"BAR", title, yUnit, color, data: [{label, value, sublabel?}], highlightLast?, secondLine?, lineLabel? }
- evidence: (optional, for EVIDENCE_STATE) { type: "VERDICT_CARD"|"EVIDENCE_CARD"|"STAT_LINES"|"FLOW_ARROW", ...fields }
- dataTicker: (optional) { from, to, prefix, suffix, decimals, label, color }
- pexelsVideoQuery: descriptive search query for a stock VIDEO (atmospheric footage)
- pexelsImageQuery: descriptive search query for a stock IMAGE (evidence/texture)
- heroWord: the most impactful word in the narration for audio sync
- connectiveWord: (optional) a connective word
- microReset: { type: "Z_PUNCH_IN"|"REDACTION_REVEAL"|"HIGHLIGHTER", label?: string, targetElement?: string }
- source: (optional) { classification, citation }

EVERY scene MUST have at least typography OR declaration.
EVERY DATA_STATE scene MUST have a chart with real, plausible data.

### transitions (array, exactly scenes.length - 1)
Each: { from: int, to: int, type: "Z_AXIS_PORTAL"|"INFINITE_DESK_LEFT"|"INFINITE_DESK_RIGHT"|"INFINITE_DESK_DOWN"|"INK_BLEED"|"FLASHBULB" }

## Style Rules (CRITICAL)
- Typography lines: MAXIMUM 18 characters per line. This is a hard limit.
- Don't repeat the same heroType more than 2x in a row (vary the rhythm).
- Use Z_AXIS_PORTAL, INK_BLEED, FLASHBULB as special transitions (max 1-2 each). Use INFINITE_DESK_* for most transitions.
- First scene should be HERO_VIDEO. Last scene should be HERO_VIDEO or STATEMENT_STATE.
- Include at least 2 DATA_STATE scenes with real charts (real economic data).
- Include at least 1 EVIDENCE_STATE scene.
- Use STOMP animation for dramatic emphasis, SLIDE for flowing text, REDACTION for reveals.
- narration field = exact concatenation of all scene narrations with spaces between.
- Use real-world data, citations, and economic facts — not placeholders.

## Output
Return ONLY a valid JSON object. No markdown fences, no explanation, just the raw JSON object.

## Reference Example
Here is a complete, valid topic.json for "Financial Repression":

{example}
"""


def generate_topic(
    title: str,
    archetype: str = "HIDDEN_MECHANISM",
    guidance: str = "",
    api_key: str | None = None,
) -> dict:
    """
    Call OpenAI GPT-4o-mini to generate a complete topic.json.
    Returns the parsed dict. Raises on API error or invalid JSON.
    """
    key = _get_api_key(api_key)
    example = _load_example()
    system = SYSTEM_PROMPT.replace("{example}", example)

    user_msg = f"Topic: {title}\nArchetype: {archetype}"
    if guidance:
        user_msg += f"\nGuidance: {guidance}"
    user_msg += "\n\nGenerate the complete topic.json now."

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user_msg},
        ],
        "max_tokens": 8000,
        "temperature": 0.7,
        "response_format": {"type": "json_object"},
    }

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }

    resp = requests.post(OPENAI_API_URL, json=payload, headers=headers, timeout=120)
    resp.raise_for_status()

    data = resp.json()
    content = data["choices"][0]["message"]["content"]

    # OpenAI json_object mode guarantees valid JSON — no fence stripping needed
    topic = json.loads(content)
    return topic


def fix_topic(
    topic: dict,
    errors: list[str],
    api_key: str | None = None,
) -> dict:
    """
    Feed validation errors back to GPT-4o-mini to fix the topic.json.
    """
    key = _get_api_key(api_key)
    example = _load_example()
    system = SYSTEM_PROMPT.replace("{example}", example)

    user_msg = (
        f"The following topic.json has validation errors. Fix them and return the corrected JSON.\n\n"
        f"Errors:\n" + "\n".join(f"- {e}" for e in errors) + "\n\n"
        f"Current JSON:\n{json.dumps(topic, indent=2)}\n\n"
        f"Return ONLY the corrected JSON, no explanation."
    )

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user_msg},
        ],
        "max_tokens": 8000,
        "temperature": 0.3,
        "response_format": {"type": "json_object"},
    }

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }

    resp = requests.post(OPENAI_API_URL, json=payload, headers=headers, timeout=120)
    resp.raise_for_status()

    data = resp.json()
    content = data["choices"][0]["message"]["content"]
    return json.loads(content)
