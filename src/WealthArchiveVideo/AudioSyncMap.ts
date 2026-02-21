/**
 * WARP 19.0 — Audio Sync Map
 * ───────────────────────────
 * Word-level cue points transcribed by OpenAI Whisper from /public/first_video.mp4
 * (base model, 67.072s, 48kHz AAC stereo)
 *
 * PURPOSE:
 *   The Noun/Verb Trigger rule: the heaviest word in each narration block must
 *   trigger the visual event (text slam, chart spike, transition) on the EXACT
 *   frame the narrator pronounces it.
 *
 *   This file provides:
 *   1. SCENE_CUE_POINTS — per-scene array of { word, frameOffset, event }
 *      where frameOffset is relative to the scene's start frame.
 *   2. A helper hook useIsCueFrame(sceneIdx, event) that returns true
 *      on the exact frame a cue fires, so animations can be delayed to sync.
 *
 * HOW TO USE:
 *   In a scene's Typography/Chart child:
 *     const startDelay = SCENE_CUE_POINTS[2].find(c => c.event === "HERO_WORD")?.frameOffset ?? 0;
 *     <Declaration startDelay={startDelay} ... />
 *
 * TRANSCRIPTION SOURCE:
 *   whisper.transcribe("/public/first_video.mp4", word_timestamps=True, language="en")
 *   All timestamps converted to frames at 30fps, offset relative to scene start.
 */

import { WARP19_STARTS } from "./PacingEngine";

const FPS = 30;

/** Convert absolute audio seconds to absolute frame number */
const toFrame = (seconds: number) => Math.round(seconds * FPS);

/** Convert absolute audio seconds to frame offset within a scene */
const toSceneOffset = (absoluteSeconds: number, sceneIdx: number): number =>
    toFrame(absoluteSeconds) - WARP19_STARTS[sceneIdx];

export type CueEvent =
    | "SCENE_START"      // First word of the narration block
    | "HERO_WORD"        // Heaviest word — triggers text slam / chart spike
    | "HARD_CUT"        // Sentence-ending period — visual punctuation (flash, stop-motion)
    | "SOFT_PAUSE"       // Comma or em-dash — micro-beat, slight hold
    | "CHART_DRAW_START" // Begin animating chart line/bars
    | "DATA_STAMP"       // Number/stat pronounced — DataTicker peaks here
    | "EMPHASIS"         // Secondary stressed word;

export interface SyncCue {
    word: string;
    /** Frame offset from scene start (local frame) */
    frameOffset: number;
    event: CueEvent;
}

/**
 * Per-scene sync cue arrays.
 * Index matches scene index (0 = S1, 11 = S12).
 * frameOffset is LOCAL (relative to scene start, i.e. lf(sceneIdx)).
 */
export const SCENE_CUE_POINTS: SyncCue[][] = [

    // ─── S1: "Central banks are not printing money anymore. The government is. The Fed isn't leading the market."
    // Scene start: 0.0s = f0, Scene end: 6.64s = f199
    [
        { word: "Central",    frameOffset: toSceneOffset(0.000, 0),  event: "SCENE_START" },
        { word: "printing",   frameOffset: toSceneOffset(0.940, 0),  event: "HERO_WORD" },      // "PRINTING" — triggers redaction reveal
        { word: "anymore.",   frameOffset: toSceneOffset(1.560, 0),  event: "HARD_CUT" },
        { word: "government", frameOffset: toSceneOffset(2.700, 0),  event: "HERO_WORD" },      // "GOVERNMENT" — text slams
        { word: "is.",        frameOffset: toSceneOffset(3.040, 0),  event: "HARD_CUT" },
        { word: "Fed",        frameOffset: toSceneOffset(4.300, 0),  event: "EMPHASIS" },
        { word: "market.",    frameOffset: toSceneOffset(5.760, 0),  event: "HARD_CUT" },
    ],

    // ─── S2: "It is chasing a moving tiger."
    // Scene start: 6.64s = f199, Scene end: 10.08s = f302
    [
        { word: "chasing",  frameOffset: toSceneOffset(6.860, 1),  event: "SCENE_START" },
        { word: "chasing",  frameOffset: toSceneOffset(6.860, 1),  event: "HERO_WORD" },       // "CHASING" — chart starts drawing
        { word: "tiger.",   frameOffset: toSceneOffset(8.420, 1),  event: "HARD_CUT" },
        { word: "chasing",  frameOffset: toSceneOffset(6.860, 1),  event: "CHART_DRAW_START" },
    ],

    // ─── S3: "For a decade, we believed low rates were the only engine of growth."
    // Scene start: 10.08s = f302, Scene end: 15.54s = f466
    [
        { word: "For",      frameOffset: toSceneOffset(10.080, 2), event: "SCENE_START" },
        { word: "decade,",  frameOffset: toSceneOffset(10.560, 2), event: "SOFT_PAUSE" },
        { word: "low",      frameOffset: toSceneOffset(11.960, 2), event: "EMPHASIS" },
        { word: "rates",    frameOffset: toSceneOffset(12.220, 2), event: "HERO_WORD" },        // "RATES" — ZIRP chart spike draws
        { word: "rates",    frameOffset: toSceneOffset(12.220, 2), event: "CHART_DRAW_START" },
        { word: "engine",   frameOffset: toSceneOffset(13.660, 2), event: "EMPHASIS" },
        { word: "growth.",  frameOffset: toSceneOffset(14.240, 2), event: "HARD_CUT" },
    ],

    // ─── S4: "Investors grew addicted to cheap debt and artificial stability."
    // Scene start: 15.54s = f466, Scene end: 20.40s = f612
    [
        { word: "Investors", frameOffset: toSceneOffset(15.540, 3), event: "SCENE_START" },
        { word: "addicted",  frameOffset: toSceneOffset(16.420, 3), event: "HERO_WORD" },      // "ADDICTED" — bar chart bars slam
        { word: "addicted",  frameOffset: toSceneOffset(16.420, 3), event: "CHART_DRAW_START" },
        { word: "cheap",     frameOffset: toSceneOffset(16.960, 3), event: "EMPHASIS" },
        { word: "debt",      frameOffset: toSceneOffset(17.200, 3), event: "DATA_STAMP" },
        { word: "stability.", frameOffset: toSceneOffset(18.980, 3), event: "HARD_CUT" },
    ],

    // ─── S5: "But in the current cycle, the engine changed. Fiscal dominance arrived."
    // Scene start: 20.40s = f612, Scene end: 26.78s = f803
    [
        { word: "But",       frameOffset: toSceneOffset(20.400, 4), event: "SCENE_START" },
        { word: "cycle,",    frameOffset: toSceneOffset(21.540, 4), event: "SOFT_PAUSE" },
        { word: "engine",    frameOffset: toSceneOffset(22.660, 4), event: "EMPHASIS" },
        { word: "changed.",  frameOffset: toSceneOffset(22.980, 4), event: "HERO_WORD" },      // "CHANGED" — crossover lines draw
        { word: "changed.",  frameOffset: toSceneOffset(22.980, 4), event: "CHART_DRAW_START" },
        { word: "Fiscal",    frameOffset: toSceneOffset(24.480, 4), event: "EMPHASIS" },
        { word: "dominance", frameOffset: toSceneOffset(24.880, 4), event: "HERO_WORD" },      // second hero word
        { word: "arrived.",  frameOffset: toSceneOffset(25.340, 4), event: "HARD_CUT" },
    ],

    // ─── S6: "Governments are now bypassing banks to inject capital directly into the economy."
    // Scene start: 26.78s = f803, Scene end: 32.94s = f988
    [
        { word: "Governments", frameOffset: toSceneOffset(26.780, 5), event: "SCENE_START" },
        { word: "bypassing",   frameOffset: toSceneOffset(27.520, 5), event: "HERO_WORD" },    // "BYPASSING" — kinetic stomp
        { word: "banks",       frameOffset: toSceneOffset(28.280, 5), event: "EMPHASIS" },
        { word: "capital",     frameOffset: toSceneOffset(29.520, 5), event: "DATA_STAMP" },
        { word: "economy.",    frameOffset: toSceneOffset(31.660, 5), event: "HARD_CUT" },
    ],

    // ─── S7: "Inflation is a policy choice, not an accident of the supply chain."
    // Scene start: 32.94s = f988, Scene end: 38.74s = f1162
    [
        { word: "Inflation", frameOffset: toSceneOffset(32.940, 6), event: "SCENE_START" },
        { word: "policy",    frameOffset: toSceneOffset(34.100, 6), event: "HERO_WORD" },      // "POLICY" — VerdictCard right column lights
        { word: "choice,",   frameOffset: toSceneOffset(34.480, 6), event: "SOFT_PAUSE" },
        { word: "accident",  frameOffset: toSceneOffset(36.140, 6), event: "HERO_WORD" },      // "ACCIDENT" — left column (✕) stamps
        { word: "supply",    frameOffset: toSceneOffset(36.780, 6), event: "EMPHASIS" },
        { word: "chain.",    frameOffset: toSceneOffset(37.200, 6), event: "HARD_CUT" },
    ],

    // ─── S8: "Zombie companies are dying because their 2% debt is now a trap."
    // Scene start: 38.74s = f1162, Scene end: 44.80s = f1344
    [
        { word: "Zombie",    frameOffset: toSceneOffset(38.740, 7), event: "SCENE_START" },
        { word: "Zombie",    frameOffset: toSceneOffset(38.740, 7), event: "HERO_WORD" },      // "ZOMBIE" — bar chart bars slam in
        { word: "Zombie",    frameOffset: toSceneOffset(38.740, 7), event: "CHART_DRAW_START" },
        { word: "dying",     frameOffset: toSceneOffset(40.280, 7), event: "EMPHASIS" },
        { word: "2",         frameOffset: toSceneOffset(41.300, 7), event: "DATA_STAMP" },    // "2%" — DataTicker
        { word: "trap.",     frameOffset: toSceneOffset(43.280, 7), event: "HARD_CUT" },
    ],

    // ─── S9: "Real assets win when the currency is devalued to fund deficits."
    // Scene start: 44.80s = f1344, Scene end: 50.86s = f1526
    [
        { word: "Real",      frameOffset: toSceneOffset(44.800, 8), event: "SCENE_START" },
        { word: "assets",    frameOffset: toSceneOffset(45.140, 8), event: "HERO_WORD" },      // "ASSETS" — stat lines cascade
        { word: "win",       frameOffset: toSceneOffset(45.520, 8), event: "EMPHASIS" },
        { word: "devalued",  frameOffset: toSceneOffset(47.540, 8), event: "HERO_WORD" },      // "DEVALUED" — Cash row goes red
        { word: "deficits.", frameOffset: toSceneOffset(49.180, 8), event: "HARD_CUT" },
    ],

    // ─── S10: "Wealth is being redistributed from the saver to the spender."
    // Scene start: 50.86s = f1526, Scene end: 56.28s = f1688
    [
        { word: "Wealth",          frameOffset: toSceneOffset(50.860, 9), event: "SCENE_START" },
        { word: "redistributed",   frameOffset: toSceneOffset(52.120, 9), event: "HERO_WORD" }, // "REDISTRIBUTED" — arrow animates
        { word: "saver",           frameOffset: toSceneOffset(53.820, 9), event: "EMPHASIS" },
        { word: "spender.",        frameOffset: toSceneOffset(54.800, 9), event: "HERO_WORD" }, // "SPENDER" — stomp
        { word: "spender.",        frameOffset: toSceneOffset(54.800, 9), event: "HARD_CUT" },
    ],

    // ─── S11: "The risk is no longer a crash. It is a slow, hot burn."
    // Scene start: 56.28s = f1688, Scene end: 62.92s = f1887
    [
        { word: "The",    frameOffset: toSceneOffset(56.280, 10), event: "SCENE_START" },
        { word: "risk",   frameOffset: toSceneOffset(56.740, 10), event: "EMPHASIS" },
        { word: "crash.", frameOffset: toSceneOffset(57.720, 10), event: "HERO_WORD" },       // "CRASH" — declaration slams
        { word: "crash.", frameOffset: toSceneOffset(57.720, 10), event: "HARD_CUT" },
        { word: "slow,",  frameOffset: toSceneOffset(59.140, 10), event: "EMPHASIS" },
        { word: "hot",    frameOffset: toSceneOffset(59.880, 10), event: "EMPHASIS" },
        { word: "burn.",  frameOffset: toSceneOffset(60.540, 10), event: "HERO_WORD" },       // "BURN" — chart line hits peak
        { word: "burn.",  frameOffset: toSceneOffset(60.540, 10), event: "CHART_DRAW_START" },
    ],

    // ─── S12: "The printing press hasn't stopped. It just found a new operator."
    // Scene start: 62.92s = f1888, Scene end: 67.07s = f2012
    [
        { word: "The",       frameOffset: toSceneOffset(62.920, 11), event: "SCENE_START" },
        { word: "printing",  frameOffset: toSceneOffset(63.500, 11), event: "EMPHASIS" },
        { word: "stopped.",  frameOffset: toSceneOffset(64.380, 11), event: "HARD_CUT" },
        { word: "found",     frameOffset: toSceneOffset(65.720, 11), event: "HERO_WORD" },    // "FOUND" — gold highlight draws
        { word: "operator.", frameOffset: toSceneOffset(66.320, 11), event: "HERO_WORD" },    // "OPERATOR" — final stamp
        { word: "operator.", frameOffset: toSceneOffset(66.320, 11), event: "HARD_CUT" },
    ],
];

/**
 * Get the frame offset of a specific cue event for a scene.
 * Returns 0 (immediate) if not found — safe default.
 */
export function getCueFrame(sceneIdx: number, event: CueEvent): number {
    const cues = SCENE_CUE_POINTS[sceneIdx] ?? [];
    return cues.find(c => c.event === event)?.frameOffset ?? 0;
}

/**
 * Get all cue frames matching an event type for a scene.
 */
export function getAllCueFrames(sceneIdx: number, event: CueEvent): number[] {
    const cues = SCENE_CUE_POINTS[sceneIdx] ?? [];
    return cues.filter(c => c.event === event).map(c => c.frameOffset);
}

/**
 * Check if the current local frame is at or past a cue's trigger point.
 * Use to conditionally reveal elements:
 *   const ready = isCuePassed(lf(sceneIdx), sceneIdx, "HERO_WORD");
 */
export function isCuePassed(localFrame: number, sceneIdx: number, event: CueEvent): boolean {
    return localFrame >= getCueFrame(sceneIdx, event);
}
