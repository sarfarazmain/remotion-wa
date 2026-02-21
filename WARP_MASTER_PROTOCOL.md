# 📜 THE WEALTH ARCHIVE: MASTER VISUAL SOP

## 🚫 PART I: THE ABSOLUTE ANTI-PATTERNS (What NOT to Do)

If any of these visual signatures appear in a render, the composition has failed.

* **NO Digital Symmetries:** Perfect 50/50 horizontal/vertical splits are banned. They create synthetic seams and claustrophobic boxes.
* **NO Floating UI Elements:** Text placards must never float in the dead center with empty margins. They must anchor flush to an edge or physically overlap another asset.
* **NO Naked Assets:** A stock image or video must never sit un-graded. If it lacks a heavy vignette, color wash, or drop shadow, it looks like a pasted JPEG.
* **NO Pure Black Voids:** `#000000` is banned. When a scene is dark, it must be Midnight Navy (`#111827`) with visible film grain.
* **NO Smooth Linear Easing:** Linear transitions and 60fps pans look like corporate slideshows. All motion must use Spring physics (`stiffness/damping`) or 12fps "posterized" stuttering.
* **NO Viewport Width (`vw`) Typography:** Never use `vw` inside absolute divs in Remotion. It causes erratic sub-pixel rendering and chops text. Lock typography to strict `px` math.

---

## 🏛️ PART II: THE BRAND LEXICON

The aesthetic is "Dark Academia & Classified Dossier."

* **Midnight Navy (`#111827`):** The absolute base substrate. Used for deep shadows and grim realities.
* **Parchment Cream (`#F4F1EA`):** The core reading color. Mimics old, oxidized paper. (Do *not* use bright web beige).
* **Antique Gold (`#C5A059`):** The structural anchor. Used strictly for borders, data lines, and highlights.
* **Oxblood Red (`#8B0000`):** High-urgency accent. Used strictly for deficits, danger, or debunking.
* **Typography:** *Cinzel* or *Playfair Display* (Massive Headers, ALL CAPS). *JetBrains Mono* or *Courier* (Data, tickers, citations).

---

## 🗃️ PART III: THE 6-LAYER COMPOSITING STACK

Every scene must follow this strict Z-Index vertical hierarchy to guarantee physical depth.

1. **The Substrate (Base):** Static, high-res image of navy-dyed parchment/leather.
2. **The Atmosphere (Video):** Heavily blurred (5px), tinted Midnight Navy/Sepia, crushed to 20% opacity.
3. **The Context (Noise):** SVG architectural blueprints or halftone dots panning slowly at 15% opacity.
4. **The Evidence (Images):** Ragged-edged paper cutouts or isolated PNG subjects casting hard shadows.
5. **The Signal (Data/Text):** Antique Gold spline charts and Kinetic Typography.
6. **The Global Lens (MANDATORY GLUE):** An `<AbsoluteFill>` spanning the entire screen containing 5% artificial film grain, a heavy vignette, and a looping 12fps scratch overlay set to `mix-blend-mode: screen`.

---

## 📐 PART IV: SPATIAL GEOMETRY & ALIGNMENT

* **The Death Bands:** No text or focal points may enter the Top 15% (UI overlay), Bottom 25% (Captions/Handle), or Right 20% (Engagement buttons).
* **The Diagonal Counterweight:** If a Stock Image anchors to the Top-Right, the supporting Text Placard MUST anchor to the Bottom-Left.
* **The "Bite" Rule (Z-Space Overlap):** When layering a text placard over an image, it must physically overlap the image's corner by exactly 10-15% to prove depth.

---

## 🔠 PART V: KINETIC TYPOGRAPHY & SCALE

* **The 5x Scale Rule:** To create tension, the "Root Word" (e.g., "CRASH") must be 5x larger than the "Prefix Words" (e.g., "The Market").
* *Prefix:* Monospace, 24px, Parchment Cream, wide tracking.
* *Root:* Serif, 120px, Antique Gold, tight tracking.

* **The Burn Rule:** Massive text without a placard must have `textShadow: "0px 10px 30px rgba(0,0,0,0.9)"` to burn into the background.
* **The Word Cap:** Maximum of 5 words animating on screen at any single moment.

---

## 🧠 PART VI: THE LOGIC ENGINE (Hierarchy States)

Scenes are mathematically governed by their core content. Only one Hero is allowed.

* **DATA STATE (Chart is King):** 
  * *Physics:* SLAM (High stiffness, low bounce).
  * *Layout:* Data Vice (Chart spans full width at bottom; text tabs flush to the top edge). Background video is crushed to 15% opacity.

* **EVIDENCE STATE (Image is King):** 
  * *Physics:* STOP-MOTION (Asset frame wrapped in `Math.floor(frame/4)*4` for 12fps analog stutter).
  * *Layout:* Offset Stack. Image has a ragged SVG `clip-path` or transparent PNG isolation.

* **STATEMENT STATE (Text is King):** 
  * *Physics:* GLIDE (Smooth, cinematic float via low stiffness springs).
  * *Layout:* Full Bleed Text. Video is masked strictly *inside* the massive typography (`background-clip: text`).

---

## ⚖️ PART VII: ADVANCED JUXTAPOSITION (WARP 16.0)

When showing two conflicting realities (The "Lie" vs. The "Truth"), use physical layering, never digital seams.

* **Model A: The Classified Inset:** The dark reality (e.g., a breadline) plays full-bleed in the background at 30% opacity. The "Lie" (e.g., The Capitol) is scaled to 55% width, framed in a rigid 3px Antique Gold border, rotated `-3deg`, and dropped into the center with a massive shadow.
* **Model B: The Torn Archive:** The top video covers the screen. A jagged SVG `mask-image` (shaped like a violent paper tear) rips across the middle, revealing the dark, crushed reality video burning underneath it.

---

## 🎬 PART VIII: TACTILE TRANSITIONS (WARP 14.0)

Cross-dissolves and basic X-axis slides are banned. Transitions must represent spatial travel.

* **The Z-Axis Portal:** Used to dive into a subject. An object (a coin, a letter) scales up exponentially (`scale: 1` to `50` over 15 frames) until its darkness overtakes the screen, revealing the next scene.
* **The Luma Ink Bleed:** Used for abstract/psychological shifts. A black-and-white stock video of spreading ink is used as a CSS `mask-image`. The new scene expands organically through the white ink.
* **The Flashbulb Overlay:** Used for time-jumps. A 5-frame `<AbsoluteFill>` of pure white fades to 0%, paired with film burn stock footage (`mix-blend-mode: screen`).

---

## 🔊 PART IX: THE FOLEY ENGINE (The 50% Rule)

Visuals without synced audio will fail the Netflix-tier standard. Your Make.com backend must map timestamps to Remotion `<Audio />` tags.

* **Text SLAMS:** Must sync with a sub-bass boom or heavy paper thud.
* **Data Lines/Highlights:** Must sync with a thick marker scratch or rapid mechanical ticking.
* **Transitions:** Z-Axis Portals require a low-frequency cinematic swoosh. Flashbulbs require a loud, physical vintage camera shutter.
* **Hero Video Breathers:** When a video plays full-bleed with no text, its native Foley (e.g., a printing press grinding) must be amplified by 300%.
