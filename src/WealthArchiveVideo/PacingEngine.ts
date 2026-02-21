/**
 * WARP 19.0 — Asymmetric Pacing & Audio Sync Engine
 * ────────────────────────────────────────────────────
 * Enforces narrative breathing: no uniform tick. Scene durations are derived
 * from ACTUAL AUDIO narration via Whisper word-level timestamps — not arbitrary
 * time budgets.
 *
 * RULES:
 *   MIN  = 45 frames  (1.5s @ 30fps) — eye needs time to register
 *   MAX  = 135 frames (4.5s @ 30fps) — attention cliff edge
 *   HOLD_EVOLVE_TRIGGER = 90 frames (3.0s) — inject micro-reset if scene is longer
 *
 * HOW DURATIONS WERE DERIVED:
 *   1. Whisper base model transcribed /public/first_video.mp4 with word timestamps
 *   2. Each scene cut was placed at the hard punctuation mark (period/comma) in
 *      the narration that introduces the scene's TOPIC (Comma/Period Law)
 *   3. Scene end = start of the next scene's key phrase
 *   4. Total: 2013 frames = 67.1s (matches audio duration exactly)
 *
 * HOLD & EVOLVE:
 *   Scenes > 90f get a MicroAnimationReset at frame 90 (3.0s mark).
 *   The layout stays the same — only a subtle camera or overlay fires —
 *   resetting the viewer's attention clock without disrupting comprehension.
 */

export const PACING = {
    MIN_FRAMES: 45,           // 1.5s — absolute floor
    MAX_FRAMES: 135,          // 4.5s — attention ceiling
    HOLD_EVOLVE_AT: 90,       // 3.0s — inject micro-animation reset
    KINETIC_PREFIX_MIN: 15,   // 0.5s — connective word flash minimum
    FPS: 30,
} as const;

export type RhythmTier = "STACCATO" | "MEDIUM" | "LEGATO" | "EXTENDED";

/** Classify a duration into a rhythm tier */
export function getRhythmTier(frames: number): RhythmTier {
    if (frames <= 75)  return "STACCATO";  // <= 2.5s — punchy
    if (frames <= 105) return "MEDIUM";    // <= 3.5s — balanced
    if (frames <= 135) return "LEGATO";    // <= 4.5s — deliberate
    return "EXTENDED";                     // > 4.5s — needs Hold & Evolve
}

/**
 * Validate that no 3 consecutive scenes share the same RhythmTier.
 * Returns the offending triplet index, or -1 if valid.
 */
export function findRhythmViolation(durations: number[]): number {
    for (let i = 0; i < durations.length - 2; i++) {
        const a = getRhythmTier(durations[i]);
        const b = getRhythmTier(durations[i + 1]);
        const c = getRhythmTier(durations[i + 2]);
        if (a === b && b === c) return i;
    }
    return -1;
}

/**
 * Clamp a duration to the min boundary (no max clamp — EXTENDED scenes use Hold & Evolve).
 */
export function clampDuration(frames: number): number {
    return Math.max(PACING.MIN_FRAMES, frames);
}

/**
 * Given a scene's duration (in frames), returns whether it needs a
 * Hold & Evolve micro-animation reset.
 */
export function needsHoldEvolve(frames: number): boolean {
    return frames > PACING.HOLD_EVOLVE_AT;
}

/**
 * WARP 19.0 — Audio-Accurate Scene Duration Table
 * ─────────────────────────────────────────────────
 * Derived from Whisper word-level timestamps on /public/first_video.mp4
 * Audio total duration: 67.072s = 2012 frames @ 30fps
 *
 * Scene cut logic (Comma/Period Law):
 *   Each scene starts on the word that introduces its topic.
 *   Each scene ends when the next scene's topic word begins.
 *
 * Narration → Scene mapping:
 *   S1  [0.00s→6.64s]  199f  "Central banks are not printing money anymore. The government is. The Fed isn't leading the market."
 *   S2  [6.64s→10.08s] 103f  "It is chasing a moving tiger."
 *   S3  [10.08s→15.54s] 164f "For a decade, we believed low rates were the only engine of growth."
 *   S4  [15.54s→20.40s] 146f "Investors grew addicted to cheap debt and artificial stability."
 *   S5  [20.40s→26.78s] 191f "But in the current cycle, the engine changed. Fiscal dominance arrived."
 *   S6  [26.78s→32.94s] 185f "Governments are now bypassing banks to inject capital directly into the economy."
 *   S7  [32.94s→38.74s] 174f "Inflation is a policy choice, not an accident of the supply chain."
 *   S8  [38.74s→44.80s] 182f "Zombie companies are dying because their 2% debt is now a trap."
 *   S9  [44.80s→50.86s] 182f "Real assets win when the currency is devalued to fund deficits."
 *  S10  [50.86s→56.28s] 163f "Wealth is being redistributed from the saver to the spender."
 *  S11  [56.28s→62.92s] 199f "The risk is no longer a crash. It is a slow, hot burn."
 *  S12  [62.92s→67.07s] 125f "The printing press hasn't stopped. It just found a new operator."
 *
 * Total: 2013f (rounding artefact — composition set to 2013f)
 */
export const WARP19_DURATIONS: readonly number[] = [
    199,  // S1  — EXTENDED  (6.6s) — Hold & Evolve at 90f + 150f
    103,  // S2  — MEDIUM    (3.4s)
    164,  // S3  — EXTENDED  (5.5s) — Hold & Evolve at 90f
    146,  // S4  — EXTENDED  (4.9s) — Hold & Evolve at 90f
    191,  // S5  — EXTENDED  (6.4s) — Hold & Evolve at 90f + 150f
    185,  // S6  — EXTENDED  (6.2s) — Hold & Evolve at 90f + 150f
    174,  // S7  — EXTENDED  (5.8s) — Hold & Evolve at 90f
    182,  // S8  — EXTENDED  (6.1s) — Hold & Evolve at 90f + 150f
    182,  // S9  — EXTENDED  (6.1s) — Hold & Evolve at 90f + 150f
    163,  // S10 — EXTENDED  (5.4s) — Hold & Evolve at 90f
    199,  // S11 — EXTENDED  (6.6s) — Hold & Evolve at 90f + 150f
    125,  // S12 — LEGATO    (4.2s)
] as const;

/** Build a cumulative start-frame array from the duration table */
export function buildStartFrames(durations: readonly number[]): number[] {
    const starts: number[] = [];
    let cursor = 0;
    for (const d of durations) {
        starts.push(cursor);
        cursor += d;
    }
    return starts;
}

export const WARP19_STARTS = buildStartFrames(WARP19_DURATIONS);
export const WARP19_TOTAL  = WARP19_STARTS[WARP19_STARTS.length - 1] + WARP19_DURATIONS[WARP19_DURATIONS.length - 1];
// = 2013 frames total (67.1s — matches audio)

/**
 * For long scenes, we need MULTIPLE Hold & Evolve triggers.
 * Rule: fire every 90 frames within the scene window.
 * Returns an array of local frame numbers at which to trigger.
 */
export function getHoldEvolveTriggers(durationFrames: number): number[] {
    if (durationFrames <= PACING.HOLD_EVOLVE_AT) return [];
    const triggers: number[] = [];
    let t = PACING.HOLD_EVOLVE_AT;
    while (t < durationFrames - 30) { // don't fire in last 30f (transition window)
        triggers.push(t);
        t += PACING.HOLD_EVOLVE_AT;
    }
    return triggers;
}
