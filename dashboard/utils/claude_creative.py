"""
Stage A: Claude Sonnet — Creative Director
───────────────────────────────────────────
Generates a plain-English visual plan from a topic idea.
Claude handles: scene rhythm, Pexels queries, BGM selection,
heroWord extraction, emotional arc — the creative decisions
that benefit from high aesthetic reasoning.

The output is a structured JSON brief (not the final topic.json)
that feeds into Stage B (GPT-4o-mini Structured Outputs assembly).
"""

import json
import os
from pathlib import Path

MODEL = "claude-sonnet-4-20250514"

# BGM catalogue (must match files in public/bgm/)
BGM_CATALOGUE = """
Available BGM tracks (pick ONE that matches the topic's emotional arc):

DARK / HIGH INTENSITY:
- bgm_dark_high_drone_01 — Hidden mechanisms, looming danger, financial repression
- bgm_dark_high_drone_02 — Bad decisions, looming consequences, traps
- bgm_dark_high_minimal_01 — Brutal hooks, cold statistics, stark revelations
- bgm_dark_high_pulse_01 — Urgency, time pressure, market panic
- bgm_dark_high_slow_01 — Slow creeping dread, systemic decay

MOTION / MID INTENSITY:
- bgm_motion_mid_piano_01 — Narrative with emotional weight, personal stories
- bgm_motion_mid_soft_01 — Gentle revelation, quiet systemic truths
- bgm_motion_mid_synth_01 — Modern mechanisms, tech-driven finance
- bgm_motion_mid_synth_02 — Digital systems, algorithmic control

NEUTRAL / MID INTENSITY:
- bgm_neutral_mid_ambient_01 — Educational, neutral explanation
- bgm_neutral_mid_ambient_02 — Calm analysis, balanced perspective
- bgm_neutral_mid_epic_01 — Grand historical sweep, empire-scale stories
- bgm_neutral_mid_fast_01 — Quick-paced timeline, rapid developments
- bgm_neutral_mid_minimal_02 — Clean data presentation, minimal emotion
- bgm_neutral_mid_slow_01 — Slow reveals, uncomfortable truths

REFLECTIVE / LOW INTENSITY:
- bgm_reflect_bright_piano — Hope after darkness, resolution, gold/solution scenes
- bgm_reflect_low_harmony_01 — Bittersweet truth, acceptance
- bgm_reflect_low_piano_01 — Quiet aftermath, personal cost
- bgm_reflect_low_slow_01 — Contemplation, deep systemic reflection
"""

SYSTEM_PROMPT = f"""You are the Creative Director for "The Wealth Archive" — a YouTube Shorts channel producing dark, cinematic, data-driven explainers on economics and finance.

Your job is to create a CREATIVE BRIEF — a detailed visual plan for a 55-65 second vertical video (1080x1920, 30fps). You do NOT produce final JSON. You produce a structured plan that a separate system will compile into the production schema.

## Your Aesthetic
Dark archive investigative aesthetic. Think: declassified documents, financial forensics, cinematic tension. Navy backgrounds (#111827), parchment cream text (#F4F1EA), antique gold highlights (#C5A059), oxblood red for danger (#8B0000).

## Scene Types You Can Assign
- HERO_VIDEO: Avatar speaking directly to camera. Use for HOOK (scene 1), BRIDGE (mid-video), VERDICT (final scene). Max 4 words on screen.
- STATEMENT_STATE: Bold text is king. GLIDE physics, FULL_BLEED layout. Max 6 focal words on screen.
- DATA_STATE: Chart is king. SLAM physics, DATA_VICE layout. Must include a chart with REAL economic data. Max 8 focal words + chart title.
- EVIDENCE_STATE: Image/document is king. STOP_MOTION physics, OFFSET_STACK layout. Max 12 focal words.

## The Dual Channel Doctrine (CRITICAL)
On-screen text must NOT echo narration verbatim. Instead:
- ANCHOR: Show the single most important word (e.g., narration says "It destroys fortunes" → screen shows "FORTUNES")
- CONTRAST: Show the opposite/ironic counterpoint (e.g., → screen shows "SAFE?")
- EVIDENCE: Show data that proves the claim (e.g., → screen shows "$4.2T LOST")

## Pexels Query Rules
Write atmospheric, cinematic queries — NOT literal descriptions. Think moody stock footage.
BAD: "money printing press machine" (literal, boring)
GOOD: "dark vault corridor cinematic" (atmospheric, fits the vibe)
BAD: "stock market crash graph" (too literal)
GOOD: "anxious traders wall street rain" (emotional, cinematic)

## BGM Selection
{BGM_CATALOGUE}

## Output Format
Return a JSON object with this exact structure:
{{
  "bgmTrackId": "bgm_dark_high_drone_01",
  "bgmReasoning": "Why this track fits the emotional arc",
  "totalNarration": "The complete narration text, all scenes concatenated. 120-180 words.",
  "scenes": [
    {{
      "index": 1,
      "heroType": "HERO_VIDEO",
      "narration": "This scene's narration (1-2 sentences)",
      "onScreenText": ["WORD1", "WORD2"],
      "textReasoning": "Why these words (ANCHOR/CONTRAST/EVIDENCE)",
      "pexelsVideoQuery": "atmospheric cinematic query for video",
      "pexelsImageQuery": "atmospheric cinematic query for image",
      "heroWord": "WORD1",
      "emotionalBeat": "hook/tension/reveal/escalation/resolution",
      "chartData": null,
      "evidenceData": null
    }}
  ]
}}

IMPORTANT RULES:
- 10-14 scenes total
- Scene 1 MUST be HERO_VIDEO (the hook)
- Last scene MUST be HERO_VIDEO or STATEMENT_STATE (the verdict)
- At least 2 DATA_STATE scenes with REAL economic data (real numbers, real years, real sources)
- At least 1 EVIDENCE_STATE scene
- No more than 2 consecutive scenes of the same heroType
- For DATA_STATE scenes, include chartData: {{ "type": "LINE" or "BAR", "title": "max 30 chars", "dataPoints": [{{"label": "2008", "value": 4.2}}, ...], "source": "Fed/BLS/IMF etc" }}
- For EVIDENCE_STATE scenes, include evidenceData with type and relevant fields
- Each onScreenText word must be ≤18 characters
- Use real-world data, citations, and economic facts — never placeholders
- totalNarration = exact concatenation of all scene narrations with spaces"""


def generate_creative_brief(
    title: str,
    archetype: str = "HIDDEN_MECHANISM",
    guidance: str = "",
    api_key: str | None = None,
) -> dict:
    """
    Call Claude Sonnet to generate a creative brief for the topic.
    Returns the parsed dict with scene plans, BGM selection, etc.
    """
    import anthropic  # lazy import — only fails when actually called

    key = api_key or os.environ.get("ANTHROPIC_API_KEY", "")
    if not key:
        raise ValueError("ANTHROPIC_API_KEY not set")

    client = anthropic.Anthropic(api_key=key)

    user_msg = f"Topic: {title}\nArchetype: {archetype}"
    if guidance:
        user_msg += f"\nCreative Guidance: {guidance}"
    user_msg += "\n\nCreate the creative brief now. Return only valid JSON."

    response = client.messages.create(
        model=MODEL,
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_msg}],
    )

    # Extract text content
    content = response.content[0].text

    # Strip markdown fences if present
    if content.startswith("```"):
        lines = content.split("\n")
        # Remove first line (```json) and last line (```)
        lines = [l for l in lines if not l.strip().startswith("```")]
        content = "\n".join(lines)

    brief = json.loads(content)
    return brief
