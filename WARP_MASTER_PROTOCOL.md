# 📜 THE WEALTH ARCHIVE: MASTER VISUAL SOP (WARP v2.0)

**Target Format:** ~60s YouTube Shorts — Business Mechanisms, Finance & Business History
**Canvas:** 1080 × 1920px (Mobile Vertical) @ 30fps
**Target Duration:** 55–62 seconds (1650–1860 frames)

---

## 🚫 PART I: THE ANTI-PATTERNS (Instant Failure Conditions)

If any of these occur in a render, the composition is **rejected automatically.**

1. **NO Digital Symmetries:** Perfect 50/50 vertical or horizontal splits are structurally banned. They create synthetic seams and claustrophobic boxes.
2. **NO Floating UI:** Text must never float in dead center with empty margins. It must anchor flush to a boundary or physically overlap an asset.
3. **NO Naked Assets:** Every image or video must have a vignette, a color wash, or a hard drop shadow. A raw stock asset looks like a pasted JPEG.
4. **NO Pure Black (`#000000`):** Banned. All shadows and backgrounds must be Midnight Navy (`#111827`) with visible film grain.
5. **NO Smooth Linear Easing:** All motion must use Spring physics (heavy, tactile) or 12fps posterized stutter (analog). Linear transitions and 60fps pans look like corporate slideshows.
6. **NO `vw` Typography:** Lock all typography to strict `px` math inside Remotion. Viewport units cause erratic sub-pixel rendering and chop text in absolute-positioned divs.
7. **NO Shipping Without Assets:** Every scene MUST have its designated stock image, stock video, chart data, AND avatar narration video present and verified BEFORE render. A composition with missing or placeholder assets is REJECTED. There are no fallback treatments, no degradation modes, no "placeholder" renders. The video does not ship until every asset is production-ready.

---

## 🏛️ PART II: BRAND LEXICON & COLOR PIPELINE

The aesthetic is **"Dark Academia meets Classified Dossier."**

### Core Palette

| Color | Hex | Usage |
|---|---|---|
| **Midnight Navy** | `#111827` | Base substrate, shadows, dark realities, redaction blocks |
| **Parchment Cream** | `#F4F1EA` | Core reading color, text placards, document textures. Do *not* use bright web beige. |
| **Antique Gold** | `#C5A059` | Structural anchor — borders, divider lines, chart splines, Hero Text highlights |
| **Oxblood Red** | `#8B0000` | High-urgency accent — deficits, danger, debunking, strike-throughs. Acceptable warm variant: `#8B1A1A` |

### Typography

| Role | Font | Usage |
|---|---|---|
| Headers | *Cinzel* or *Playfair Display* | Massive declarations, ALL CAPS, commanding weight |
| Data | *JetBrains Mono* | Tickers, percentages, citations, metadata — typewriter feel |

### Chart Interior Colors

Charts invert the palette to provide optical contrast within the Signal layer:

* **Background:** Parchment Cream (`#F4F1EA`)
* **Labels & Titles:** Midnight Navy at 60–90% opacity
* **Data Lines / Bars:** Antique Gold (`#C5A059`). Final/highlighted bar: Oxblood Red.
* **Grid Lines:** Navy, dashed, at 18% opacity

### The Grading Override

When stylizing archival footage for **Split Reality or Torn Archive backgrounds** (the "Truth" layer), apply filters in this order: `sepia(1)` → `hue-rotate(180deg)` → `brightness(0.7)` → `contrast(1.2)`. This produces a cold cyan-tinted, dark, high-contrast treatment.

**Standard B-roll** (non-juxtaposition scenes) uses a different chain: `grayscale(1)` → `contrast(1.4)` → `sepia(0.2)` → `brightness(0.9)`.

---

## 🗃️ PART III: THE 6-LAYER COMPOSITING STACK

Every scene strictly follows this Z-Index hierarchy to guarantee physical depth:

| Layer | Z-Range | Name | Description |
|---|---|---|---|
| 1 | 0 | **Substrate** | Navy-dyed parchment/leather image. Static, high-resolution. |
| 2 | 1–2 | **Atmosphere** | B-roll blurred 5px, tinted Midnight Navy/Sepia, crushed to 20% opacity. |
| 3 | 2–3 | **Context (Noise)** | SVG architectural blueprints or halftone dots panning slowly at 15% opacity. |
| 4 | 4–5 | **Evidence** | Ragged-edged paper cutouts or isolated PNG subjects casting hard shadows. |
| 5 | 5–6 | **Signal** | Antique Gold spline charts + Kinetic Typography. The primary information layer. |
| 5.5 | 7–8 | **Phantom Host** | Avatar narration video (see Part VIII). Sits between Signal and Global Lens. |
| 6 | 9999 | **Global Lens** | 5% film grain + heavy vignette + 12fps scratch overlay (`mix-blend-mode: screen`). **MANDATORY GLUE.** Sits above everything, including the Phantom Host avatar. `pointer-events: none`. |

---

## 📐 PART IV: SPATIAL GEOMETRY & ALIGNMENT

### The Archive Safe Box

Content is confined to the intersection of all exclusion zones:

| Zone | Range | Pixels | Purpose |
|---|---|---|---|
| **Top Death Band** | 0–15% Y | 0–288px | YouTube Shorts top bar, status bar |
| **Bottom Death Band** | 75–100% Y | 1440–1920px | Captions, video title, handle |
| **Right Death Band** | 80–100% X | 864–1080px | Engagement buttons (like, comment, share) |
| **Left Death Band** | 0–8% X | 0–86px | iOS gesture handles, Android system navigation |

**Safe Box:** X: 86px → 864px, Y: 288px → 1440px (778px wide × 1152px tall).

No text or focal points may enter any Death Band.

### The Diagonal Counterweight

If a Stock Image anchors to the **Top-Right**, the supporting Text Placard MUST anchor to the **Bottom-Left**. Diagonal tension creates visual authority.

### The "Bite" Rule (Z-Space Overlap)

When layering a text placard over an image, the placard must physically overlap the image's corner by **10–15%** of the image height. This proves Z-index depth and creates a physical "layered paper" effect.

---

## 🔠 PART V: KINETIC TYPOGRAPHY & SCALE

### The 5x Scale Rule

To create tension, the "Root Word" (e.g., "CRASH") must be **5x larger** than the "Prefix Words" (e.g., "The Market").

* **Prefix:** Monospace, 24px, Parchment Cream, wide tracking (`0.05em`), **Bold (weight 700)**.
* **Root:** Serif, 120px, Antique Gold, tight tracking (`-0.02em`), **Black (weight 900)**.

### The Burn Rule

Massive text rendered without a placard background must have `textShadow: "0px 10px 30px rgba(0,0,0,0.9)"` to physically burn into the background substrate.

### The Word Cap

Maximum of **5 words** animating on screen at any single moment. A "word" is any visible text element separated by whitespace. Symbols, numbers, and punctuation attached to a word count as part of that word (e.g., `$34.7T` = 1 word, `U.S.` = 1 word).

### The 18-Character Shatter Limit

No single line of text may exceed **18 characters** (including spaces). The pipeline MUST force a `\n` line break at the nearest space before the 18-character boundary. Words exceeding 18 characters on their own (e.g., "HYPERINFLATIONARY") are exempt from the limit but MUST be the only word on their line.

---

## 🧠 PART VI: THE LOGIC ENGINE (Scene States)

Scenes are strictly governed by their core content. Only ONE Hero is allowed per scene.

### DATA STATE (Chart is King)

* **Physics:** SLAM — High stiffness (`300`), low damping (`12`). Snappy, impactful.
* **Layout:** Data Vice — Chart spans full width at bottom; text tabs flush to the top edge.
* **Atmosphere:** Background video crushed to 15% opacity.

### EVIDENCE STATE (Image is King)

* **Physics:** STOP-MOTION — Asset frame wrapped in `Math.floor(frame/4)*4` for 12fps analog stutter (7.5fps posterized).
* **Layout:** Offset Stack — Image anchors Top-Right with ragged SVG `clip-path` or transparent PNG isolation. Text anchors Bottom-Left with 10–15% overlap.

### STATEMENT STATE (Text is King)

* **Physics:** GLIDE — Smooth, cinematic float via low stiffness springs (`100`, damping `20`).
* **Layout:** Full Bleed Text. Background video masked strictly *inside* the massive typography via `background-clip: text` (when applicable).

---

## ⚖️ PART VII: HERO VIDEOS & JUXTAPOSITION

### Approved Video Treatments

Never use a floating box (arbitrary rectangle with no physical justification). All Hero Videos MUST use one of these 5 treatments:

| # | Treatment | Description | Usage Frequency |
|---|---|---|---|
| 1 | **FULL_BLEED** | 100% screen coverage, no frame. Archival filter applied. No HUD. | Common |
| 2 | **CINEMATIC_LETTERBOX** | 16:9 aspect ratio box with 2px Antique Gold top/bottom borders. | Most Common |
| 3 | **CLASSIFIED_VIEWFINDER** | 3:4 dossier window (900×1200px), 24px padding, Cream frame, deep inner shadow. | Rare |
| 4 | **LUMA_WINDOW** | Radial gradient mask — 30% opaque center bleeds to 70% transparent edge. Organic, dreamlike. | Rare |
| 5 | **SPLIT_REALITY** | For Lie vs Truth juxtaposition. Small gold-bordered "Lie" (55% width, -3° rotation) hovering over 30% opacity full-bleed "Truth" background. | Juxtaposition Only |

### Persistent Archival HUD

Applied to treatments 2–5 (NOT Full Bleed). Renders micro-metadata in corners of the Safe Box:

* **Top-Left:** File path (e.g., `ARCHIVE // FILE_004 // EVIDENCE_LOG`) — Mono 16px, Cream 70% opacity.
* **Top-Right:** Timestamp with blinking red dot (8×8px, blinks every 15 frames) — Mono 16px, Cream 70% opacity.
* **Bottom-Left:** Source citation — Mono 16px, Cream 70% opacity.

### Juxtaposition Models (WARP 16.0)

When showing two conflicting realities (The "Lie" vs. The "Truth"), use physical layering — never digital seams.

* **Model A: The Classified Inset:** The dark reality plays full-bleed at 30% opacity (Grading Override applied). The "Lie" is scaled to 55% width, framed in a rigid 3px Antique Gold border, rotated `-3deg`, and dropped into the center with a massive shadow.
* **Model B: The Torn Archive:** The top video covers the screen. A jagged SVG `mask-image` (shaped like a violent paper tear) rips across the middle, revealing the dark, crushed reality video burning underneath.

---

## 🕴️ PART VIII: THE PHANTOM HOST PROTOCOL (Avatar Narration)

**MANDATORY.** Every composition includes a full avatar narration video. The avatar is the narrator — their voice drives the entire composition's audio track and pacing.

### Asset Delivery

The avatar video is manually added to `/public/` as a video file. Future integration: HeyGen API for automated generation. The avatar's audio track is the primary narration — Whisper word-level timestamps are derived from this file.

### The 15% Exposure Rule

The avatar is visible on screen for only **15% of total composition duration** (~9 seconds in a 60s video). It appears in exactly three windows:

* **Hook:** First 1.5 seconds (frames 0–45). Face on screen immediately. Grabs attention.
* **Bridge:** One mid-video appearance (2 seconds / 60 frames). Resets trust.
* **Verdict:** Final 3 seconds (last 90 frames). Delivers the concluding statement face-to-face.

During all other scenes, the avatar is hidden — only their voice plays.

### Interrogation Grade

When the avatar IS visible, apply this filter stack directly to the HeyGen layer:

`grayscale(0.4) contrast(1.4) brightness(0.6) sepia(0.2)`

Plus a tight radial vignette darkening the edges. The avatar must look like it was filmed inside a cold interrogation room, not a clean studio.

### The Jump Cut

Mid-sentence during each avatar appearance, scale jumps from **100% to 115%** in a single frame. This resets the visual buffer and masks synthetic lip-sync artifacts.

### Z-Index Placement

The Phantom Host sits at **Layer 5.5 (Z-index 7–8)**, between the Signal layer and the Global Lens. The avatar is intentionally BENEATH the Global Lens — film grain and vignette MUST overlay the avatar's face to maintain the archival aesthetic.

---

## 🎬 PART IX: TACTILE TRANSITIONS

Cross-dissolves and basic X-axis slides are **banned**. Transitions must represent spatial travel or physical events.

### 1. The Z-Axis Portal

Used to **dive into a subject.** An object (a coin, a letter, a chart point) scales up exponentially — `scale: 1` to `50` over 15–20 frames — until its darkness overtakes the screen, revealing the next scene.

### 2. The Luma Ink Bleed

Used for **abstract/psychological shifts.** A black-and-white stock video of spreading ink is used as a CSS `mask-image`. The new scene expands organically through the white ink over 30 frames.

### 3. The Infinite Desk Pan (Continuous Substrate)

Used for **sequential information flow** (scene to scene within the same narrative thread). The camera roves over the pre-rendered **4320×5760px virtual desk grid** (4 columns × 3 rows of 1080×1920 scenes). This is a viewport translation — NOT a background scroll. Spring physics: `stiffness: 200, damping: 20`. Supports three directions:

* **LEFT:** Horizontal pan to the next column.
* **RIGHT:** Reverse horizontal pan.
* **DOWN:** Vertical drop to the next row.

### 4. The Flashbulb Overlay

Used for **time jumps and shock cuts.** A 5-frame `<AbsoluteFill>` of pure white fades to 0% opacity, paired with film burn stock footage at `mix-blend-mode: screen`. Synced with a vintage camera shutter Foley.

---

## 🖋️ PART X: MICRO-KINETIC MANIPULATION (The Tactile Text Engine)

**The Core Philosophy:** Text is not digital — it is physical ink on a dossier. After a layout has been static long enough to risk losing attention, it must be physically manipulated. Standard digital fades or smooth scaling are strictly banned. Part X defines **WHAT** manipulations fire. Part XII (The Chronos Engine) defines **WHEN** they fire (at the 3.0-second Boredom Maximum).

**Rule of Exclusivity:** Never apply micro-animations to the 24px "Prefix" words. Micro-manipulations are strictly reserved for the massive 120px "Root" words or critical data points.

### 1. The "Oxblood Strike" (Debunking & Failure)

Use this when the narration reveals a lie, a failure, or a crashed metric.

* **The Visual:** A violent, rough, hand-drawn line strikes directly through the center of the text.
* **The Remotion Execution:** Do NOT use CSS `text-decoration: line-through` (it looks like a cheap digital typo). Use an SVG `path` with a ragged brush stroke overlaying the text (Z-index +1). Apply `feTurbulence` filter for organic roughness.
* **The Properties:** Color must be Oxblood Red (`#8B0000`). Stroke width: 6px.
* **The Motion:** Animate `stroke-dashoffset` over exactly **6 frames** — a fast, angry pen swipe.
* **The Foley:** Must sync with a loud, aggressive paper scratch sound.

### 2. The "Archival Highlighter" (Data Emphasis)

Use this when the narrator emphasizes a specific metric or a shocking truth that is already on screen.

* **The Visual:** A thick, rough marker stroke bleeds in behind the text, highlighting it.
* **The Remotion Execution:** An SVG `path` placed behind the typography layer (Z-index -1). Apply `feTurbulence` for organic ink edge.
* **The Properties:** Color must be Antique Gold (`#C5A059`) set to `mix-blend-mode: multiply` with an opacity of 85%. This allows the texture of the parchment background to bleed through the marker ink.
* **The Motion:** Smooth but fast — **8 to 10 frames**, left-to-right draw via `stroke-dashoffset`.
* **Implementation Note:** The MicroAnimationReset system also implements the Highlighter as an **ellipse stroke** (for circling data points on charts). The linear SVG path variant (for underlining text) is a separate component in Typography.tsx. Both are valid expressions of this rule.
* **TARGETING RULE (Mandatory):** The ellipse Highlighter MUST specify a `targetElement` string in the scene's `microReset` config. This string is resolved to absolute `{cx, cy, rx, ry}` canvas coordinates by `resolveHighlighterTarget()` in `MicroAnimationReset.tsx`. **A HIGHLIGHTER without a valid `targetElement` will NOT render** — no fallback, no default coordinates. Hardcoded default positions are banned because they create circles on irrelevant areas (wrong chart, wrong panel, empty space). Every new `targetElement` value must be added to the resolver's switch statement with precise coordinates for the layout it appears in.

### 3. The "Stomp & Shift" (Size / Weight Manipulation)

Use this for introducing massive, terrifying macro-concepts (e.g., "HYPERINFLATION").

* **The Visual:** The text doesn't just scale — it physically impacts the dossier, rattling the camera.
* **The Remotion Execution:** The text enters at `scale: 2.5` and `opacity: 0`. It slams down to `scale: 1.0` in exactly **4 frames**.
* **The Physics:** Rigid spring — `stiffness: 300, damping: 12`.
* **The Screen Shake:** At the exact frame the scale hits `1.0`, the parent container must jump `translateY: 8px` down, and bounce back to `0px` in the next frame. This simulates the physical force of a heavy stamp hitting a wooden desk. *Test on 720p compressed export before approving shake values — if invisible after compression, increase.*

### 4. The "Redaction Reveal" (Information Declassification)

Use this to reveal a hidden truth or a classified source.

* **The Visual:** The text is completely hidden by a solid marker block. The block rapidly slides away to expose the text underneath.
* **The Remotion Execution:** Place a `<div>` exactly the size of the text bounding box over the text (Z-index +1). Color it Midnight Navy (`#111827`).
* **The Motion:** Animate `clip-path` or `translateX` of the Navy block to aggressively pull it to the right, uncovering the text in ~12 frames.
* **The Foley:** Sync with the sound of a heavy file folder opening or a sharp tape rip.

---

## 👓 PART XI: OPTICAL LEGIBILITY & COMPRESSION ARMOR

Mandatory guardrails to survive YouTube Shorts compression (H.264/VP9 at 720p–1080p on mobile).

### The Localized Scrim

Any text rendered over complex B-roll (not a solid substrate) MUST have a `radial-gradient` smudge placed directly behind it: `radial-gradient(ellipse at center, rgba(17,24,39,0.7) 0%, transparent 70%)`. This prevents text from becoming unreadable when B-roll has bright or busy areas.

### Structural Kerning & Leading

* **Root Words (120px):** Negative tracking (`letter-spacing: -2px`) and tight line-height (`1.05`). Creates a dense, authoritative block.
* **Prefix Words (24px):** Positive tracking (`letter-spacing: 4px`) and standard line-height (`1.4`). Creates open, legible contrast against the massive Root.

---

## ⏱️ PART XII: THE CHRONOS ENGINE (Timings, Pacing & Foley)

The script is chopped by grammar (commas, periods, sentence boundaries) — not arbitrary word counts.

### 1. Target Duration

Compositions must target **55–62 seconds** (1650–1860 frames @ 30fps). This maximizes YouTube Shorts algorithm favorability while allowing a natural buffer for intro and outro.

### 2. Scene Count

Compositions must contain **10–14 scenes.** Fewer than 10 lacks the narrative density required for business/finance content. More than 14 causes attention fatigue at the short-form duration ceiling.

### 3. The Hook Window (Frames 0–45 / 0–1.5s)

The first 1.5 seconds determine 80%+ of viewer retention. The Hook MUST contain one of:

* A provocative text statement (**STATEMENT STATE**) — e.g., a bold claim or question.
* The **Phantom Host face** — immediate human connection.
* Both simultaneously.

**BANNED in the Hook Window:** Charts, slow reveals, Evidence State images, or any element that requires more than 1.5 seconds to parse.

### 4. Cognitive Minimum (1.5s / 45 Frames)

No scene environment can be on screen for **less than 1.5 seconds.** This minimum applies to SCENES, not individual elements. Within a scene, elements may enter and exit via micro-animations, but the scene's spatial environment (its position on the virtual desk, its background, its compositing stack) must persist for ≥45 frames.

### 5. Boredom Maximum (3.0s / 90 Frames)

A static layout dies at **3.0 seconds.** If a scene must hold longer than 90 frames, it MUST trigger a **Micro-Kinetic Manipulation** (Part X) at exactly the 90-frame mark. For scenes exceeding 180 frames, an additional trigger fires every 90 frames thereafter (stopping 30 frames before the scene's exit transition).

### 6. Hard Cut Ceiling (6.0s / 180 Frames)

No single scene environment should exceed **6.0 seconds** unless driven by a long audio narration segment. If audio forces a scene beyond 6.0s, it MUST use Hold & Evolve micro-resets (multiple Part X triggers) to keep the scene alive.

### 7. Asymmetric Rhythm

No two consecutive scenes may share the **same Rhythm Tier:**

| Tier | Duration | Character |
|---|---|---|
| STACCATO | ≤ 75f (≤ 2.5s) | Punchy, aggressive |
| MEDIUM | ≤ 105f (≤ 3.5s) | Balanced |
| LEGATO | ≤ 135f (≤ 4.5s) | Deliberate, cinematic |
| EXTENDED | > 135f (> 4.5s) | Needs Hold & Evolve |

Alternate between tiers to create a **"Jolt & Settle"** rhythm. Exact frame counts may repeat across non-consecutive scenes, but the tier-level pattern must never show two identical tiers back-to-back.

### 8. The Verdict Window (Final 60–90 Frames / 2–3s)

The final 2–3 seconds deliver the concluding statement. The Verdict MUST be:

* A **STATEMENT STATE** with the final declaration, OR
* A **HERO_VIDEO** (Phantom Host face) delivering the closing line.

**BANNED in the Verdict Window:** New charts, new data points, new Evidence State images, or any element that introduces information the viewer hasn't already seen. The Verdict is a resolution, not a surprise.

### 9. Foley Sync (The 50% Rule)

Visuals without synced audio fail the quality standard. Audio cues MUST be mapped to visual events:

| Visual Event | Required Foley |
|---|---|
| Text SLAM / Stomp & Shift | Sub-bass boom or heavy paper thud |
| Data Lines / Archival Highlighter | Thick marker scratch or rapid mechanical ticking |
| Z-Axis Portal | Low-frequency cinematic swoosh |
| Flashbulb | Loud, physical vintage camera shutter |
| Redaction Reveal | Heavy file folder opening or sharp tape rip |
| Oxblood Strike | Aggressive paper scratch |
| Hero Video (full-bleed, no text) | Native Foley amplified +300% |

**Foley Timing:** Onset = transition/animation frame 0. Peak amplitude = 60% of the animation's duration. Tail = extends 10 frames into the settled state (allows the sound to naturally decay).

### 10. Chart Draw Budget Rule

Charts are the slowest visual element to parse. Their draw animation MUST complete with a clean buffer before the exit transition begins. Failure to enforce this results in charts that are cut off, partially drawn, or completely blank.

**Hard Rules:**

1. **`CHART_DRAW_START` MUST fire at `SCENE_START + 15` frames** — NOT at the Hero Word cue. Hero Words often appear late in narration, leaving insufficient draw time. The 15-frame delay allows the scene environment to establish before the chart begins drawing.
2. **Charts MUST complete their draw animation at least 35 frames before scene end.** The 35-frame buffer = 5f visual settle + 30f exit transition window.
3. **Draw duration is dynamic**, computed as: `drawDuration = min(maxDraw, idealDraw)` where `maxDraw = sceneDuration - chartStart - 35` and `idealDraw` = 80f (LINE) / 50f (BAR). Minimum floor: 25 frames.
4. **Minimum DATA_STATE scene duration:**
   - LINE charts (80f ideal draw): minimum **130 frames** (4.3s) = 15f establish + 80f draw + 35f exit buffer
   - BAR charts (50f ideal draw): minimum **100 frames** (3.3s) = 15f establish + 50f draw + 35f exit buffer
5. If computed scene duration falls below the minimum, the **pipeline MUST emit a warning** during code generation.

### 11. BGM Selection & Auto-Ducking Rule

Every composition MUST include a Background Music (BGM) track. BGM establishes emotional subtext and prevents the viewer from experiencing audio dead zones between narration phrases.

**BGM Catalogue:** All track IDs are defined in `pipeline/bgm-catalogue.json`. Every `topic.json` MUST include a `bgm.trackId` field that references a valid catalogue ID. The pipeline validator will reject any trackId whose `.mp3` file does not exist in `public/bgm/`.

**Selection Rule:** Match the BGM archetype to the video's emotional arc:
| Archetype | Track Pattern | Use Case |
|-----------|--------------|----------|
| The Shadow | `bgm_dark_high_drone_*` | Hidden mechanisms, looming danger, financial repression |
| The Trap | `bgm_dark_high_drone_02` | Bad decisions, looming consequences |
| The Cold Fact | `bgm_dark_high_minimal_*` | Brutal hooks, cold statistics |
| The Panic | `bgm_dark_high_pulse_*` | Urgency, time pressure |
| The Reckoning | `bgm_neutral_mid_slow_01` | Slow reveals, uncomfortable truths |
| The Narrator | `bgm_neutral_mid_ambient_*` | Educational, neutral explanation |

**Auto-Ducking Rules (Mandatory):**

BGM volume is NEVER static. It MUST be a frame-level function with three zones:

| Zone | Frames | Volume | Behaviour |
|------|--------|--------|-----------|
| **INTRO RAMP** | 0 → 15f | 0 → 0.45 | Fade in before narrator begins |
| **VOICE DUCK** | 15f → (end-45f) | 0.18 | Reduced under active narration |
| **OUTRO SWELL** | last 45f | 0.18 → 0.45 | Swell as narrator finishes |

- `BGM_AMBIENT = 0.45` — full BGM level (only in silence zones)
- `BGM_DUCKED = 0.18` — ducked level under narrator voice
- Narration audio plays at **volume = 1.0** (never lower it — voice intelligibility is non-negotiable)
- All `interpolate()` calls use `extrapolateLeft: "clamp", extrapolateRight: "clamp"`

**Implementation:** The `volume` prop on Remotion's `<Audio>` component accepts a `(frame: number) => number` callback — use this for frame-accurate ducking. Never use a static number for BGM volume.

### 12. SFX Foley Pipeline (Freesound Integration)

Every composition MUST include Sound Effect (SFX) foley events synced to visual transitions and micro-animations. SFX are sourced from Freesound.org via API and cached per-topic.

**SFX Event Type Definitions:**

| Event Type | Visual Trigger | Freesound Query | Duration Filter | Default Volume |
|---|---|---|---|---|
| `STOMP_IMPACT` | Text STOMP/SLAM animation (STATEMENT scenes) | `sub bass impact boom cinematic` | 0.2–2.0s | 0.60 |
| `HIGHLIGHTER_CIRCLE` | Archival Highlighter ellipse draw (Hold & Evolve) | `marker pen paper writing` | 0.3–2.0s | 0.35 |
| `Z_AXIS_SWOOSH` | Z-Axis Portal transition exit | `cinematic whoosh dark deep` | 0.5–3.0s | 0.50 |
| `FLASHBULB_SHUTTER` | Flashbulb transition overlay | `vintage camera shutter click` | 0.1–1.5s | 0.55 |
| `REDACTION_REVEAL` | Redaction block slide-away (Hold & Evolve) | `file folder paper slide open` | 0.3–2.0s | 0.40 |
| `INK_BLEED` | Ink Bleed transition mask | `ink liquid drip dark` | 0.3–2.5s | 0.35 |
| `CHART_DRAW` | Chart line/bar draw animation start | `pen writing paper scratch fast` | 0.5–3.0s | 0.30 |

**Trigger Frame Rules:**
- **STOMP_IMPACT:** Fires at the scene's `HERO_WORD` cue frame (from AudioSyncMap)
- **CHART_DRAW:** Fires at the scene's `CHART_DRAW_START` cue frame (SCENE_START + 15)
- **HIGHLIGHTER_CIRCLE / REDACTION_REVEAL:** Fires at the Hold & Evolve trigger (local frame 90)
- **Z_AXIS_SWOOSH / INK_BLEED / FLASHBULB_SHUTTER:** Fires at the transition exit window (sceneDuration - 30)

**Volume Hierarchy (Final Mix):**
```
Narration:    1.00    (never reduced — voice intelligibility is sacred)
SFX:          0.30–0.60  (per event type, defined in sfx-catalogue.json)
BGM Ducked:   0.18    (under narration)
BGM Ambient:  0.45    (intro/outro silence zones only)
```

**Freesound Search Strategy:**
1. Search via `GET /apiv2/search/text/` with Token auth (no OAuth2 needed)
2. Filter: `duration:[min TO max]`, `license:(Attribution OR "Creative Commons 0")`
3. Sort: `rating_desc` — highest-rated sounds first
4. Pick the top result; download its HQ preview MP3 (`previews.preview-hq-mp3`, ~128kbps)
5. Save to `public/topics/{slug}/sfx/{EVENT_TYPE}.mp3`

**Caching:** If `public/topics/{slug}/sfx/manifest.json` exists with all needed SFX files present, skip re-download. Delete manifest to force re-fetch.

**License Compliance:** Only `Attribution` and `Creative Commons 0` licenses are acceptable. Credit all Freesound authors in video metadata / description.

**Pipeline Integration:** SFX fetching runs as Stage 4.5 (between Pexels assets and Code Generation). Skip with `--skip-sfx` flag. The code generator produces `SfxMap.ts` mapping absolute frames → SFX file paths + volumes.

**Composition Rendering:** Each SFX event renders as a `<Sequence from={absoluteFrame} layout="none"><Audio>` component, placed after the BGM layer in the compositing stack. The `layout="none"` prop ensures the Sequence doesn't create a DOM container.
