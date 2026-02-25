"""
OpenAI GPT-4o-mini API client for topic.json generation.
─────────────────────────────────────────────────────────
Two modes:
  1. assemble_from_brief() — Stage B of 2-stage pipeline.
     Takes Claude's creative brief and compiles it into valid topic.json
     using Structured Outputs (schema-constrained JSON).
  2. generate_topic() — Legacy single-model fallback.
     Generates everything in one shot (used when Claude API unavailable).
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
    """Load first 4 scenes of financial-repression as a compact reference (~1,000 tokens)."""
    if not _EXAMPLE_PATH.exists():
        return "(no example available)"
    try:
        data = json.loads(_EXAMPLE_PATH.read_text())
        trimmed = {
            "meta": data.get("meta", {}),
            "narration": data.get("narration", ""),
            "bgm": data.get("bgm", {}),
            "scenes": data.get("scenes", [])[:4],
            "transitions": data.get("transitions", [])[:3],
        }
        return json.dumps(trimmed, separators=(",", ":"))
    except Exception:
        return "(no example available)"


def _get_api_key(api_key: str | None = None) -> str:
    """Resolve API key: argument → OPENAI_API_KEY → PERPLEXITY_API_KEY (fallback)."""
    key = api_key or os.environ.get("OPENAI_API_KEY", "") or os.environ.get("PERPLEXITY_API_KEY", "")
    if not key:
        raise ValueError("OPENAI_API_KEY not set")
    return key


# ── JSON Schema for Structured Outputs ────────────────────────────────────────
# This mirrors pipeline/schema.ts and guarantees GPT-4o-mini can ONLY output
# valid topic.json. No more fix_topic() retry loops needed.

TOPIC_JSON_SCHEMA = {
    "name": "topic_json",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {
            "meta": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "slug": {"type": "string"},
                    "archetype": {"type": "string", "enum": ["HIDDEN_MECHANISM", "TIMELINE_EVOLUTION", "GREAT_MAN"]},
                },
                "required": ["title", "slug", "archetype"],
                "additionalProperties": False,
            },
            "narration": {"type": "string"},
            "bgm": {
                "type": "object",
                "properties": {
                    "trackId": {"type": "string"},
                },
                "required": ["trackId"],
                "additionalProperties": False,
            },
            "scenes": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "index": {"type": "integer"},
                        "narration": {"type": "string"},
                        "heroType": {"type": "string", "enum": ["DATA_STATE", "EVIDENCE_STATE", "STATEMENT_STATE", "HERO_VIDEO"]},
                        "environment": {"type": "string", "enum": ["VOID", "IMMERSIVE_BLEED", "SIGNAL_GRID"]},
                        "layout": {"type": "string", "enum": ["FULL_BLEED", "OFFSET_STACK", "DATA_VICE"]},
                        "physics": {"type": "string", "enum": ["SLAM", "GLIDE", "STOP_MOTION"]},
                        "typography": {
                            "anyOf": [
                                {"type": "null"},
                                {
                                    "type": "object",
                                    "properties": {
                                        "lines": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "text": {"type": "string"},
                                                    "type": {"type": "string", "enum": ["HERO", "CONNECTIVE"]},
                                                    "animation": {"type": "string", "enum": ["SLIDE", "STOMP", "REDACTION"]},
                                                    "weight": {"type": "string", "enum": ["LIGHT", "REGULAR", "BOLD", "BLACK"]},
                                                    "color": {"type": "string", "enum": ["GOLD", "OXBLOOD", "CREAM", "CREAM_DIM", "CREAM_FAINT", "GOLD_DIM", "NAVY"]},
                                                },
                                                "required": ["text", "type", "animation", "weight", "color"],
                                                "additionalProperties": False,
                                            },
                                        },
                                        "align": {"type": "string", "enum": ["flex-start", "center", "flex-end", "baseline"]},
                                        "stagger": {"type": "integer"},
                                    },
                                    "required": ["lines", "align", "stagger"],
                                    "additionalProperties": False,
                                },
                            ],
                        },
                        "declaration": {
                            "anyOf": [
                                {"type": "null"},
                                {
                                    "type": "object",
                                    "properties": {
                                        "lines": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "text": {"type": "string"},
                                                    "size": {"type": "integer"},
                                                    "color": {"type": "string", "enum": ["GOLD", "OXBLOOD", "CREAM", "CREAM_DIM", "CREAM_FAINT", "GOLD_DIM", "NAVY"]},
                                                },
                                                "required": ["text", "size", "color"],
                                                "additionalProperties": False,
                                            },
                                        },
                                        "lineStagger": {"type": "integer"},
                                    },
                                    "required": ["lines", "lineStagger"],
                                    "additionalProperties": False,
                                },
                            ],
                        },
                        "chart": {
                            "anyOf": [
                                {"type": "null"},
                                {
                                    "type": "object",
                                    "properties": {
                                        "type": {"type": "string", "enum": ["LINE", "BAR"]},
                                        "title": {"type": "string"},
                                        "yUnit": {"type": "string"},
                                        "color": {"type": "string", "enum": ["GOLD", "OXBLOOD"]},
                                        "highlightLast": {"type": "boolean"},
                                        "data": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "label": {"type": "string"},
                                                    "value": {"type": "number"},
                                                },
                                                "required": ["label", "value"],
                                                "additionalProperties": False,
                                            },
                                        },
                                        "lineLabel": {"type": "string"},
                                    },
                                    "required": ["type", "title", "yUnit", "color", "highlightLast", "data", "lineLabel"],
                                    "additionalProperties": False,
                                },
                            ],
                        },
                        "dataTicker": {
                            "anyOf": [
                                {"type": "null"},
                                {
                                    "type": "object",
                                    "properties": {
                                        "from": {"type": "number"},
                                        "to": {"type": "number"},
                                        "prefix": {"type": "string"},
                                        "suffix": {"type": "string"},
                                        "decimals": {"type": "integer"},
                                        "label": {"type": "string"},
                                        "color": {"type": "string", "enum": ["GOLD", "OXBLOOD", "CREAM", "CREAM_DIM", "CREAM_FAINT", "GOLD_DIM", "NAVY"]},
                                    },
                                    "required": ["from", "to", "prefix", "suffix", "decimals", "label", "color"],
                                    "additionalProperties": False,
                                },
                            ],
                        },
                        "evidence": {
                            "anyOf": [
                                {"type": "null"},
                                {
                                    "type": "object",
                                    "properties": {
                                        "type": {"type": "string", "enum": ["VERDICT_CARD", "EVIDENCE_CARD", "STAT_LINES", "FLOW_ARROW"]},
                                        "leftLabel": {"type": "string"},
                                        "leftItems": {"type": "array", "items": {"type": "string"}},
                                        "rightLabel": {"type": "string"},
                                        "rightItems": {"type": "array", "items": {"type": "string"}},
                                        "stats": {
                                            "type": "array",
                                            "items": {
                                                "type": "object",
                                                "properties": {
                                                    "label": {"type": "string"},
                                                    "value": {"type": "string"},
                                                    "color": {"type": "string", "enum": ["GOLD", "OXBLOOD"]},
                                                },
                                                "required": ["label", "value", "color"],
                                                "additionalProperties": False,
                                            },
                                        },
                                        "fromLabel": {"type": "string"},
                                        "toLabel": {"type": "string"},
                                        "throughLabel": {"type": "string"},
                                        "cardLabel": {"type": "string"},
                                    },
                                    "required": ["type", "leftLabel", "leftItems", "rightLabel", "rightItems", "stats", "fromLabel", "toLabel", "throughLabel", "cardLabel"],
                                    "additionalProperties": False,
                                },
                            ],
                        },
                        "pexelsVideoQuery": {"type": "string"},
                        "pexelsImageQuery": {"type": "string"},
                        "heroWord": {"type": "string"},
                        "connectiveWord": {"type": "string"},
                        "microReset": {
                            "type": "object",
                            "properties": {
                                "type": {"type": "string", "enum": ["Z_PUNCH_IN", "REDACTION_REVEAL", "HIGHLIGHTER"]},
                                "label": {"type": "string"},
                                "targetElement": {"type": "string"},
                            },
                            "required": ["type", "label", "targetElement"],
                            "additionalProperties": False,
                        },
                        "source": {
                            "anyOf": [
                                {"type": "null"},
                                {
                                    "type": "object",
                                    "properties": {
                                        "classification": {"type": "string"},
                                        "citation": {"type": "string"},
                                    },
                                    "required": ["classification", "citation"],
                                    "additionalProperties": False,
                                },
                            ],
                        },
                    },
                    "required": [
                        "index", "narration", "heroType", "environment", "layout", "physics",
                        "typography", "declaration", "chart", "dataTicker", "evidence",
                        "pexelsVideoQuery", "pexelsImageQuery", "heroWord", "connectiveWord",
                        "microReset", "source",
                    ],
                    "additionalProperties": False,
                },
            },
            "transitions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "from": {"type": "integer"},
                        "to": {"type": "integer"},
                        "type": {"type": "string", "enum": [
                            "Z_AXIS_PORTAL", "INFINITE_DESK_LEFT", "INFINITE_DESK_RIGHT",
                            "INFINITE_DESK_DOWN", "INK_BLEED", "FLASHBULB",
                        ]},
                    },
                    "required": ["from", "to", "type"],
                    "additionalProperties": False,
                },
            },
        },
        "required": ["meta", "narration", "bgm", "scenes", "transitions"],
        "additionalProperties": False,
    },
}


# ── Stage B: Assemble from Claude's Creative Brief ───────────────────────────

ASSEMBLY_SYSTEM_PROMPT = """You are a JSON assembly engine for "The Wealth Archive" video pipeline.

You receive a CREATIVE BRIEF (produced by a creative director) and must compile it into a complete, valid topic.json.

Your job is MECHANICAL COMPILATION, not creative work. The brief already contains all creative decisions. You must:
1. Map every scene from the brief into the exact schema format
2. Generate transitions between scenes (use INFINITE_DESK_LEFT/RIGHT for most, Z_AXIS_PORTAL for topic shifts, INK_BLEED for abstract, FLASHBULB for shock)
3. Ensure every scene has typography AND/OR declaration (at least one)
4. For STATEMENT_STATE: typography is primary (GLIDE physics, FULL_BLEED layout)
5. For DATA_STATE: chart is required (SLAM physics, DATA_VICE layout)
6. For EVIDENCE_STATE: evidence component (STOP_MOTION physics, OFFSET_STACK layout)
7. For HERO_VIDEO: declaration with the on-screen text (GLIDE physics, FULL_BLEED layout)

## HARD RULES
- Every text line (typography.text, declaration.text) MUST be ≤18 characters. If a word/phrase is longer, SPLIT IT across multiple lines.
- Chart titles ≤30 characters
- Chart labels ≤14 characters
- Evidence labels ≤12 characters
- Source classification ≤36 characters, citation ≤50 characters
- Slug must be lowercase-alphanumeric-with-hyphens
- narration = exact concatenation of all scene narrations with spaces
- transitions count = scenes count - 1
- Set null for optional fields not in the brief (chart, evidence, dataTicker, source, etc.)
- Use empty string "" for optional string fields not provided (connectiveWord, microReset.label, microReset.targetElement, etc.)

## Reference Example
Here is a valid topic.json structure:

{example}"""


def assemble_from_brief(
    brief: dict,
    title: str,
    archetype: str = "HIDDEN_MECHANISM",
    api_key: str | None = None,
) -> dict:
    """
    Stage B: Take Claude's creative brief and compile it into valid topic.json
    using OpenAI Structured Outputs (schema-constrained generation).
    """
    key = _get_api_key(api_key)
    example = _load_example()
    system = ASSEMBLY_SYSTEM_PROMPT.replace("{example}", example)

    user_msg = (
        f"Compile this creative brief into a complete topic.json.\n\n"
        f"Title: {title}\n"
        f"Archetype: {archetype}\n\n"
        f"CREATIVE BRIEF:\n{json.dumps(brief, indent=2)}\n\n"
        f"Compile into the exact topic.json schema now. Use the brief's bgmTrackId for bgm.trackId. "
        f"Use the brief's pexels queries, heroWords, and narration exactly as provided. "
        f"Map onScreenText into typography lines (for STATEMENT_STATE) or declaration lines (for HERO_VIDEO). "
        f"Ensure every text line is ≤18 characters — split longer text across multiple lines."
    )

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user_msg},
        ],
        "max_tokens": 6000,
        "temperature": 0.2,  # Low temp — mechanical assembly, not creative
        "response_format": {
            "type": "json_schema",
            "json_schema": TOPIC_JSON_SCHEMA,
        },
    }

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }

    resp = requests.post(OPENAI_API_URL, json=payload, headers=headers, timeout=300)
    resp.raise_for_status()

    data = resp.json()
    content = data["choices"][0]["message"]["content"]
    topic = json.loads(content)

    # Strip null optional fields for cleaner output
    topic = _clean_nulls(topic)
    return topic


def _clean_nulls(obj):
    """Recursively remove null values and empty strings from optional fields."""
    if isinstance(obj, dict):
        cleaned = {}
        for k, v in obj.items():
            if v is None:
                continue
            cleaned_v = _clean_nulls(v)
            cleaned[k] = cleaned_v
        return cleaned
    elif isinstance(obj, list):
        return [_clean_nulls(item) for item in obj]
    return obj


# ── Legacy: Single-model generation (fallback) ──────────────────────────────

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
- typography: (required for STATEMENT_STATE) {{ lines: [{{text (max 18 chars!), type: "HERO"|"CONNECTIVE", animation: "SLIDE"|"STOMP"|"REDACTION", weight: "BOLD"|"BLACK"|"LIGHT"|"REGULAR", color: "GOLD"|"OXBLOOD"|"CREAM"|"CREAM_DIM"|"CREAM_FAINT"}}], align, stagger }}
- declaration: (optional) {{ lines: [{{text (max 18 chars), size: number, color}}], lineStagger }}
- chart: (REQUIRED for DATA_STATE) {{ type: "LINE"|"BAR", title, yUnit, color, data: [{{label, value, sublabel?}}], highlightLast?, secondLine?, lineLabel? }}
- evidence: (optional, for EVIDENCE_STATE) {{ type: "VERDICT_CARD"|"EVIDENCE_CARD"|"STAT_LINES"|"FLOW_ARROW", ...fields }}
- dataTicker: (optional) {{ from, to, prefix, suffix, decimals, label, color }}
- pexelsVideoQuery: descriptive search query for a stock VIDEO (atmospheric footage)
- pexelsImageQuery: descriptive search query for a stock IMAGE (evidence/texture)
- heroWord: the most impactful word in the narration for audio sync
- connectiveWord: (optional) a connective word
- microReset: {{ type: "Z_PUNCH_IN"|"REDACTION_REVEAL"|"HIGHLIGHTER", label?: string, targetElement?: string }}
- source: (optional) {{ classification, citation }}

EVERY scene MUST have at least typography OR declaration.
EVERY DATA_STATE scene MUST have a chart with real, plausible data.

### transitions (array, exactly scenes.length - 1)
Each: {{ from: int, to: int, type: "Z_AXIS_PORTAL"|"INFINITE_DESK_LEFT"|"INFINITE_DESK_RIGHT"|"INFINITE_DESK_DOWN"|"INK_BLEED"|"FLASHBULB" }}

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

{example}"""


def generate_topic(
    title: str,
    archetype: str = "HIDDEN_MECHANISM",
    guidance: str = "",
    api_key: str | None = None,
) -> dict:
    """
    Legacy single-model generation. Used as fallback when Claude API is unavailable.
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
        "max_tokens": 5000,
        "temperature": 0.7,
        "response_format": {"type": "json_object"},
    }

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }

    resp = requests.post(OPENAI_API_URL, json=payload, headers=headers, timeout=300)
    resp.raise_for_status()

    data = resp.json()
    content = data["choices"][0]["message"]["content"]
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
        "max_tokens": 5000,
        "temperature": 0.3,
        "response_format": {"type": "json_object"},
    }

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
    }

    resp = requests.post(OPENAI_API_URL, json=payload, headers=headers, timeout=300)
    resp.raise_for_status()

    data = resp.json()
    content = data["choices"][0]["message"]["content"]
    return json.loads(content)
