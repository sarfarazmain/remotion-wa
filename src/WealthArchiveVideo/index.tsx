
import React from "react";
import { AbsoluteFill, Audio, useCurrentFrame, useVideoConfig, spring, interpolate, staticFile } from "remotion";
import { useSceneFrame } from "./SceneContext";
import { ArchiveScene } from "./ArchiveScene";
import { KineticTypography } from "./KineticTypography";
import { Declaration, DataTicker, RedPenStrike, GoldHighlight, SourceStamp } from "./Typography";
import { PhysicalLineChart, PhysicalBarChart, EvidenceCard } from "./Charts";
import { GlobalLens } from "./GlobalLens";
import { C } from "./fonts";
import { ARCHIVE_FONTS } from "./fonts";
import { generateSceneVariant } from "./SceneGenerator";
import { TransitionWrapper, TransitionType } from "./Transitions/TransitionWrapper";
import { EnvironmentLayer } from "./EnvironmentLayer";
import { EnvironmentState } from "./VarianceTypes";
import { WARP19_DURATIONS, WARP19_STARTS, WARP19_TOTAL } from "./PacingEngine";
import { MicroResetType } from "./MicroAnimationReset";
import { getCueFrame } from "./AudioSyncMap";
import assetsRaw from "./assets.json";
// Try to import processed assets if they exist, otherwise fallback
import processedAssets from "./assets.processed.json";
const assets = { ...assetsRaw, ...processedAssets };

// Helper to force DATA_VICE layout for Chart scenes
import { GhostHost } from "./GhostHost";

// WARP 11.0: Strict Content Mapping
const getStrictVariant = (sceneId: string) => {
    let hints: { hasChart?: boolean; hasImage?: boolean; heroVideo?: boolean } = { hasChart: false, hasImage: false };

    // MANUAL LOGIC MAPPING based on Script/Assets
    switch (sceneId) {
        case "s2": // Line Chart
        case "s3": // Line Chart
        case "s5": // Line Chart -> OVERRIDE: HERO VIDEO (Full Bleed)
            hints.heroVideo = true;
            break;
        case "s12": // "New Operator" -> OVERRIDE: HERO VIDEO (Split)
            hints.heroVideo = true;
            break;
        case "s4": // Bar Chart
        case "s8": // Bar Chart
        case "s11": // Line Chart
            hints.hasChart = true;
            break;
        case "s7": // Verdict Card + Fire Image -> Evidence
            hints.hasImage = true; // (If image exists in assets.json)
            break;
        case "s1":  // "The Government Is Printing" -> Statement
        case "s6":  // "Bypassing Banks" -> Statement (Text dominant)
        case "s9":  // Stat Lines -> Statement
        case "s10": // "Saver -> Spender" -> Statement
        default:
            // Default to Statement if no heavy visual
            break;
    }

    // Check if asset actually exists (runtime safety)
    const rawIds = {
        s1: { img: assets.scene1_image },
        s2: { img: assets.scene2_image },
        s3: { img: assets.scene3_image },
        s4: { img: assets.scene4_image },
        s5: { img: assets.scene5_image },
        s6: { img: assets.scene6_image },
        s7: { img: assets.scene7_image },
        s8: { img: assets.scene8_image },
        s9: { img: assets.scene9_image },
        s10: { img: assets.scene10_image },
        s11: { img: assets.scene11_image },
        s12: { img: assets.scene12_image },
    };

    // Corroborate strict logic with actual asset presence
    // If Logic says EVIDENCE but no image, downgrade to STATEMENT.
    // If Logic says DATA, force DATA (Charts are code-generated).

    // @ts-ignore
    const assetData = rawIds[sceneId];
    if (hints.hasImage && !assetData?.img) {
        hints.hasImage = false;
    }

    return generateSceneVariant(sceneId, hints);
};

/*
 * THE WEALTH ARCHIVE — Main Composition
 * ────────────────────────────────────────
 * Fiscal Dominance documentary re-interpreted as a classified dossier.
 * 12 scenes, camera-rove whip-pans (no fades), stepped-frame animations.
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  CAMERA ROVE ENGINE                                         │
 * │  All 12 scenes live at absolute positions on a virtual      │
 * │  4320 × 5760px desk (4 cols × 3 rows). The viewport        │
 * │  (1080 × 1920) translates between scenes using a harsh      │
 * │  spring (stiffness: 280, damping: 18) — whip-pan with       │
 * │  physical overshoot. No fades. No dissolves.                │
 * │                                                             │
 * │  Grid:                                                      │
 * │  S1(0,0)  S2(1,0)  S3(2,0)  S4(3,0)                        │
 * │  S5(0,1)  S6(1,1)  S7(2,1)  S8(3,1)                        │
 * │  S9(0,2) S10(1,2) S11(2,2) S12(3,2)                        │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Durations (30 fps, total = 2130f to match audio):
 *   S1:  198f  S2:  168f  S3:  198f  S4:  168f
 *   S5:  198f  S6:  198f  S7:  198f  S8:  168f
 *   S9:  168f  S10: 168f  S11: 198f  S12: 102f
 *
 * Step frame: Math.floor(frame / 3) * 3 → ~10fps stutter on drawn elements
 */

// ─── Scene manifest — WARP 19.0 Asymmetric Pacing ────────────────────────────
// Durations sourced from PacingEngine.ts (WARP19_DURATIONS).
// Pattern enforces Jolt & Settle / Slow Reveal rhythm — no 3 consecutive
// scenes at the same tier. Hold & Evolve micro-resets auto-fire at 90f
// for any scene whose duration exceeds 90f.
//
// Rhythm:   STAC  LEG  STAC  LEG  MED  STAC  LEG  STAC  MED  MED  LEG  MED
// Frames:    45   135   75   120   60   45   120   75   105   60   135   90
// Seconds:  1.5   4.5  2.5   4.0  2.0  1.5   4.0  2.5   3.5  2.0  4.5  3.0
//
// Total: 1065 frames (35.5s) — matches audio narration segments
const GRID_POSITIONS = [
    { col: 0, row: 0 }, // S1
    { col: 1, row: 0 }, // S2
    { col: 2, row: 0 }, // S3
    { col: 3, row: 0 }, // S4
    { col: 0, row: 1 }, // S5
    { col: 1, row: 1 }, // S6
    { col: 2, row: 1 }, // S7
    { col: 3, row: 1 }, // S8
    { col: 0, row: 2 }, // S9
    { col: 1, row: 2 }, // S10
    { col: 2, row: 2 }, // S11
    { col: 3, row: 2 }, // S12
] as const;

const SCENES = GRID_POSITIONS.map((pos, i) => ({
    start: WARP19_STARTS[i],
    dur:   WARP19_DURATIONS[i],
    col:   pos.col,
    row:   pos.row,
}));

// WARP 19.0: Micro-reset type per scene (for scenes that fire Hold & Evolve)
// Only matters for scenes where dur > 90f.
const SCENE_MICRO_RESETS: MicroResetType[] = [
    "Z_PUNCH_IN",       // S1  — 45f  (no reset)
    "HIGHLIGHTER",      // S2  — 135f → draws gold ellipse around M2 peak at 90f
    "Z_PUNCH_IN",       // S3  — 75f  (no reset)
    "REDACTION_REVEAL", // S4  — 120f → reveals "PEAK DEFICIT" label at 90f
    "Z_PUNCH_IN",       // S5  — 60f  (no reset)
    "Z_PUNCH_IN",       // S6  — 45f  (no reset)
    "REDACTION_REVEAL", // S7  — 120f → reveals "COCHRANE 2023" citation at 90f
    "Z_PUNCH_IN",       // S8  — 75f  (no reset)
    "HIGHLIGHTER",      // S9  — 105f → gold circle on Bitcoin +290% stat at 90f
    "Z_PUNCH_IN",       // S10 — 60f  (no reset)
    "HIGHLIGHTER",      // S11 — 135f → circles the 2024 $1.1T debt service bar at 90f
    "Z_PUNCH_IN",       // S12 — 90f  (fires exactly at boundary — subtle zoom)
];

const SCENE_MICRO_LABELS: (string | undefined)[] = [
    undefined,           // S1
    undefined,           // S2
    undefined,           // S3
    "PEAK DEFICIT",      // S4
    undefined,           // S5
    undefined,           // S6
    "COCHRANE — 2023",   // S7
    undefined,           // S8
    undefined,           // S9
    undefined,           // S10
    undefined,           // S11
    undefined,           // S12
];

// ─── Camera rove hook ────────────────────────────────────────────────────────
function useCameraPosition(): { x: number; y: number } {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    // Find which scene we're currently in
    let currIdx = 0;
    for (let i = 0; i < SCENES.length; i++) {
        if (frame >= SCENES[i].start) currIdx = i;
    }

    const curr = SCENES[currIdx];
    const prev = currIdx > 0 ? SCENES[currIdx - 1] : curr;

    const targetX = curr.col * 1080;
    const targetY = curr.row * 1920;
    const prevX = prev.col * 1080;
    const prevY = prev.row * 1920;

    // Spring: stiffness 280, damping 18 → pronounced overshoot whip-pan
    const panP = spring({
        frame: frame - curr.start,
        fps,
        config: { stiffness: 280, damping: 18, mass: 1 },
    });

    // Allow overshoot (panP can exceed 1.0 with low damping)
    const x = prevX + (targetX - prevX) * panP;
    const y = prevY + (targetY - prevY) * panP;

    return { x, y };
}

// ─── Separator line between Declaration sections ──────────────────────────────
const Divider: React.FC<{ delay?: number }> = ({ delay = 20 }) => {
    const frame = useSceneFrame();
    const w = interpolate(frame, [delay, delay + 24], [0, 780], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });
    return (
        <div style={{ width: w, height: 1, background: `linear - gradient(to right, ${C.GOLD}44, transparent)`, margin: "18px 0" }} />
    );
};

// ─── Stat Row (archive style) ─────────────────────────────────────────────────
const StatLine: React.FC<{
    label: string;
    value: string;
    color?: string;
    delay?: number;
}> = ({ label, value, color = C.GOLD, delay = 0 }) => {
    const frame = useSceneFrame();
    const p = interpolate(frame, [delay, delay + 18], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });
    return (
        <div style={{
            opacity: p,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            padding: "10px 0",
            borderBottom: `1px solid ${C.GOLD} 1a`,
        }}>
            <span style={{ fontFamily: ARCHIVE_FONTS.mono, fontSize: 22, color: C.CREAM_DIM, letterSpacing: "0.05em", textTransform: "uppercase", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>{label}</span>
            <span style={{ fontFamily: ARCHIVE_FONTS.mono, fontSize: 32, fontWeight: 700, color, letterSpacing: "-0.01em", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>{value}</span>
        </div>
    );
};

// ─── Two-column verdict card ──────────────────────────────────────────────────
const VerdictCard: React.FC<{
    leftLabel: string; leftSub: string; leftMark: string; leftColor: string;
    rightLabel: string; rightSub: string; rightMark: string; rightColor: string;
}> = ({ leftLabel, leftSub, leftMark, leftColor, rightLabel, rightSub, rightMark, rightColor }) => {
    const frame = useSceneFrame();
    const lp = interpolate(frame, [20, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const rp = interpolate(frame, [30, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    const vp = interpolate(frame, [55, 75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

    // Micro-animation: Drift
    const driftY = Math.sin(frame * 0.02) * 3;

    const col = (p: number, borderColor: string): React.CSSProperties => ({
        opacity: p, transform: `translateY(${(1 - p) * 20}px)`,
        flex: 1, padding: "24px 20px",
        background: `${borderColor}08`,
        border: `1px solid ${borderColor} 30`,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center",
    });

    return (
        <div style={{ display: "flex", gap: 20, width: "100%", transform: `translateY(${driftY}px)` }}>
            <div style={col(lp, leftColor)}>
                <div style={{ fontFamily: ARCHIVE_FONTS.serif, fontSize: 26, color: C.CREAM, letterSpacing: "0.04em", textTransform: "uppercase", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>{leftLabel}</div>
                <div style={{ fontFamily: ARCHIVE_FONTS.mono, fontSize: 18, color: C.CREAM_DIM, textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>{leftSub}</div>
                <div style={{ fontSize: 72, opacity: vp, color: leftColor, textShadow: "0 4px 8px rgba(0,0,0,0.5)" }}>{leftMark}</div>
            </div>
            <div style={col(rp, rightColor)}>
                <div style={{ fontFamily: ARCHIVE_FONTS.serif, fontSize: 26, color: C.CREAM, letterSpacing: "0.04em", textTransform: "uppercase", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>{rightLabel}</div>
                <div style={{ fontFamily: ARCHIVE_FONTS.mono, fontSize: 18, color: C.CREAM_DIM, textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}>{rightSub}</div>
                <div style={{ fontSize: 72, opacity: vp, color: rightColor, textShadow: "0 4px 8px rgba(0,0,0,0.5)" }}>{rightMark}</div>
            </div>
        </div>
    );
};

// ─── Main composition ─────────────────────────────────────────────────────────
export const WealthArchiveVideo: React.FC = () => {
    const frame = useCurrentFrame();
    const { x: camX, y: camY } = useCameraPosition();

    // Local frame per scene
    const lf = (sceneIdx: number) => frame - SCENES[sceneIdx].start;

    // SCENE CULLING: Only render scenes that are currently visible or in transition
    // Buffer of 30 frames for whip-pan transitions
    const isVisible = (idx: number) => {
        const { start, dur } = SCENES[idx];
        const end = start + dur;
        return frame >= start - 40 && frame <= end + 40;
    };

    // Helper to get Transition Props for a specific scene
    const getTransProps = (idx: number) => {
        const { start, dur } = SCENES[idx];
        const local = frame - start;
        const isEntering = local < 30; // First 30 frames
        const isExiting = local > dur - 30; // Last 30 frames

        // Determine Type:
        // If Entering: Use the transition from Previous Scene (idx - 1)
        // If Exiting: Use the transition for Current Scene (idx)

        let type: TransitionType = "NONE";
        if (isEntering && idx > 0) type = TRANSITIONS[idx - 1];
        else if (isExiting && idx < TRANSITIONS.length) type = TRANSITIONS[idx];

        return { type, entering: isEntering, exiting: isExiting, duration: dur };
    };

    // ─── WARP 14.0: TRANSITION MATRIX ─────────────────────────────────────────────
    // Logic: Defines the transition style for the LINK betwen Scene N and Scene N+1.
    // Array Index i = Transition from Scene i to Scene i+1.
    const TRANSITIONS: TransitionType[] = [
        "Z_AXIS_PORTAL",        // S1 -> S2 (Zoom into "O" or similar)
        "INFINITE_DESK_LEFT",   // S2 -> S3 (Data Swipe)
        "INFINITE_DESK_LEFT",   // S3 -> S4 (Data Swipe)
        "INFINITE_DESK_DOWN",   // S4 -> S5 (Row Change)
        "INFINITE_DESK_LEFT",   // S5 -> S6
        "INK_BLEED",            // S6 -> S7 (Statement -> Evidence/Fire)
        "INFINITE_DESK_RIGHT",  // S7 -> S8 (Evidence -> Data)
        "INFINITE_DESK_DOWN",   // S8 -> S9 (Row Change)
        "INFINITE_DESK_LEFT",   // S9 -> S10
        "INK_BLEED",            // S10 -> S11 (Statement -> Data/Endgame)
        "FLASHBULB",            // S11 -> S12 (The Crash/Flash)
        "NONE"                  // S12 End
    ];

    return (
        <AbsoluteFill style={{ backgroundColor: C.NAVY, overflow: "hidden" }}>
            {/* ROOT BACKGROUND: Decoupled for Infinite Desk */}
            <EnvironmentLayer env={EnvironmentState.IMMERSIVE_BLEED} />

            <Audio src={staticFile("first_video.mp4")} />

            {/* ═══ VIRTUAL DESK — all 12 scenes positioned on 4×3 grid ════════ */}
            <div
                style={{
                    position: "absolute",
                    width: 4320,
                    height: 5760,
                    transform: `translate(${-camX}px, ${-camY}px)`,
                    willChange: "transform",
                }}
            >

                {/* ══════ S1 · FRAMES 0–198 ════════════════════════════════════
                    "$34.7T — Central banks stopped. The government started."
                    Grid: (0,0) | Mode: Declaration + DataTicker
                   ═══════════════════════════════════════════════════════════ */}
                {isVisible(0) && (
                    <div style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }}>
                        <TransitionWrapper {...getTransProps(0)} frame={lf(0)}>
                            <ArchiveScene
                                sceneId="s1"
                                sceneLabel="01 · 12"
                                actLabel="Act I — The Shift"
                                localFrame={lf(0)}
                                videoSrc={assets.scene1_video}
                                variant={getStrictVariant("s1")}
                                renderBackground={false}
                                sceneDuration={SCENES[0].dur}
                                microReset={SCENE_MICRO_RESETS[0]}
                                microResetLabel={SCENE_MICRO_LABELS[0]}
                            >
                                {/* S1 sync: "printing" at f28, "government" at f81, "Fed" at f129 */}
                                <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                                    <KineticTypography
                                        startFrame={getCueFrame(0, "SCENE_START")}
                                        lines={[
                                            {
                                                units: [
                                                    { text: "THE", type: "CONNECTIVE" },
                                                    { text: "GOVERNMENT", type: "HERO", animation: "SLIDE", weight: "BOLD" }
                                                ],
                                                align: "baseline",
                                                justify: false
                                            },
                                            {
                                                units: [
                                                    { text: "IS PRINTING", type: "HERO", animation: "REDACTION", weight: "BLACK", color: C.GOLD }
                                                ],
                                                align: "center"
                                            }
                                        ]}
                                    />
                                    <Divider delay={getCueFrame(0, "HERO_WORD") + 4} />
                                    <DataTicker
                                        to={34.7} prefix="$" suffix="T"
                                        label="Total US National Debt"
                                        startDelay={getCueFrame(0, "HERO_WORD")} duration={50}
                                        color={C.GOLD} size={96}
                                    />
                                    <GoldHighlight width={380} startFrame={getCueFrame(0, "HERO_WORD") + 8} filterId="gh1" />
                                    <div style={{ marginTop: 32 }}>
                                        <div style={{ position: "relative" }}>
                                            <Declaration
                                                lines={[{ text: "Not the Fed.", color: C.CREAM_DIM, size: 52 }]}
                                                startDelay={getCueFrame(0, "EMPHASIS")}
                                            />
                                            <RedPenStrike width={320} startFrame={getCueFrame(0, "EMPHASIS") + 8} filterId="rp1" />
                                        </div>
                                    </div>
                                    <div style={{ marginTop: "auto" }}>
                                        <SourceStamp
                                            classification="EXHIBIT 001 — DEBT SPIRAL"
                                            source="Source: St. Louis Fed (FRED), 2024"
                                            startDelay={getCueFrame(0, "HARD_CUT")}
                                        />
                                    </div>
                                </div>
                            </ArchiveScene>
                        </TransitionWrapper>
                    </div>
                )}

                {/* ══════ S2 · FRAMES 198–366 ══════════════════════════════════
                    "It took 215 years to print the first $7T. It took 28 months to print the last $7T."
                    Grid: (1,0) | Mode: LineChart (Data Hero)
                   ═══════════════════════════════════════════════════════════ */}
                {isVisible(1) && (
                    <div style={{ position: "absolute", left: 1080, top: 0, width: 1080, height: 1920 }}>
                        <TransitionWrapper {...getTransProps(1)} frame={lf(1)}>
                            <ArchiveScene
                                sceneId="s2"
                                sceneLabel="02 · 12"
                                heroText="CHASING A MOVING TIGER"
                                actLabel="Act I — The Shift"
                                localFrame={lf(1)}
                                videoSrc={assets.scene2_video}
                                videoSrcSecondary={assets.scene8_video} // Conflict Reality
                                imageSrc={assets.scene2_image}
                                variant={getStrictVariant("s2")}
                                renderBackground={false}
                                sceneDuration={SCENES[1].dur}
                                microReset={SCENE_MICRO_RESETS[1]}
                                microResetLabel={SCENE_MICRO_LABELS[1]}
                            >
                                {/* S2 sync: "chasing" at local f0, chart draws immediately, "tiger." at local f47 */}
                                <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                                    <PhysicalLineChart
                                        title="US M2 Money Supply ($T)"
                                        data={[
                                            { label: "1800", value: 0.1 },
                                            { label: "1900", value: 1.5 },
                                            { label: "1970", value: 3.2 },
                                            { label: "2000", value: 6.8 },
                                            { label: "2019", value: 14.2 },
                                            { label: "2022", value: 21.6 },
                                            { label: "2024", value: 20.8 },
                                        ]}
                                        lineLabel="EXPONENTIAL"
                                        color={C.GOLD}
                                        width={780} height={460}
                                        startFrame={getCueFrame(1, "CHART_DRAW_START")} drawDuration={80}
                                        filterId="lc2"
                                    />
                                    <div style={{ marginTop: "auto" }}>
                                        <SourceStamp
                                            classification="EXHIBIT 002 — M2 SUPPLY"
                                            source="Source: Federal Reserve Economic Data"
                                            startDelay={getCueFrame(1, "HARD_CUT")}
                                        />
                                    </div>
                                </div>
                            </ArchiveScene>
                        </TransitionWrapper>
                    </div>
                )}

                {/* ══════ S3 · FRAMES 366–564 ══════════════════════════════════
                    "Interest rates were at 0% for 14 years. It was an anomaly."
                    Grid: (2,0) | Mode: LineChart (Interest Rates)
                   ═══════════════════════════════════════════════════════════ */}
                {isVisible(2) && (
                    <div style={{ position: "absolute", left: 2160, top: 0, width: 1080, height: 1920 }}>
                        <TransitionWrapper {...getTransProps(2)} frame={lf(2)}>
                            <ArchiveScene
                                sceneId="s3"
                                sceneLabel="03 · 12"
                                heroText="THE ZIRP ERA"
                                actLabel="Act I — The Shift"
                                localFrame={lf(2)}
                                videoSrc={assets.scene3_video}
                                videoSrcSecondary={assets.scene10_video} // Conflict Reality
                                imageSrc={assets.scene3_image}
                                variant={getStrictVariant("s3")}
                                renderBackground={false}
                                sceneDuration={SCENES[2].dur}
                                microReset={SCENE_MICRO_RESETS[2]}
                                microResetLabel={SCENE_MICRO_LABELS[2]}
                            >
                                {/* S3 sync: "rates" at local f28, chart draws on "rates", "growth." at local f48 */}
                                <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                                    <Declaration
                                        lines={[
                                            { text: "The Only", color: C.CREAM_DIM, size: 72 },
                                            { text: "Engine Of", color: C.GOLD, size: 88 },
                                            { text: "Growth.", color: C.OXBLOOD, size: 100 }
                                        ]}
                                        startDelay={getCueFrame(2, "SCENE_START")}
                                        lineStagger={10}
                                    />
                                    <div style={{ marginTop: 24 }}>
                                        <PhysicalLineChart
                                            title="Federal Funds Rate (%)"
                                            data={[
                                                { label: "2000", value: 6.5 },
                                                { label: "2008", value: 0.2 },
                                                { label: "2015", value: 0.2 },
                                                { label: "2018", value: 2.4 },
                                                { label: "2020", value: 0.1 },
                                                { label: "2022", value: 4.5 },
                                                { label: "2024", value: 5.5 },
                                            ]}
                                            lineLabel="ZIRP ERA"
                                            color={C.OXBLOOD}
                                            width={780} height={460}
                                            startFrame={getCueFrame(2, "CHART_DRAW_START")} drawDuration={80}
                                            filterId="lc3"
                                        />
                                    </div>
                                    <div style={{ marginTop: "auto" }}>
                                        <SourceStamp
                                            classification="EXHIBIT 003 — ZIRP ANOMALY"
                                            source="Source: Federal Reserve Board"
                                            startDelay={getCueFrame(2, "HARD_CUT")}
                                        />
                                    </div>
                                </div>
                            </ArchiveScene>
                        </TransitionWrapper>
                    </div>
                )}

                {/* ══════ S4 · FRAMES 564–732 ══════════════════════════════════
                    "The economy is addicted to cheap debt."
                    Grid: (3,0) | Mode: BarChart/Histogram
                   ═══════════════════════════════════════════════════════════ */}
                {isVisible(3) && (
                    <div style={{ position: "absolute", left: 3240, top: 0, width: 1080, height: 1920 }}>
                        <TransitionWrapper {...getTransProps(3)} frame={lf(3)}>
                            <ArchiveScene
                                sceneId="s4"
                                sceneLabel="04 · 12"
                                actLabel="Act II — Addiction"
                                localFrame={lf(3)}
                                videoSrc={assets.scene4_video}
                                imageSrc={assets.scene4_image}
                                variant={getStrictVariant("s4")}
                                renderBackground={false}
                                sceneDuration={SCENES[3].dur}
                                microReset={SCENE_MICRO_RESETS[3]}
                                microResetLabel={SCENE_MICRO_LABELS[3]}
                            >
                                {/* S4 sync: "addicted" at local f28, bars slam on that word, "stability." at local f127 */}
                                <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                                    <Declaration
                                        lines={[
                                            { text: "Addicted", color: C.CREAM, size: 88 },
                                            { text: "To Cheap", color: C.CREAM_DIM, size: 80 },
                                            { text: "Debt.", color: C.OXBLOOD, size: 100 },
                                        ]}
                                        startDelay={getCueFrame(3, "SCENE_START")}
                                        lineStagger={10}
                                    />
                                    <div style={{ marginTop: 28 }}>
                                        <PhysicalBarChart
                                            title="Annual US Deficit ($B)"
                                            data={[
                                                { label: "2019", value: 984 },
                                                { label: "2020", value: 3132 },
                                                { label: "2021", value: 2776 },
                                                { label: "2022", value: 1375 },
                                                { label: "2023", value: 1695, sublabel: "↑" },
                                            ]}
                                            color={C.GOLD}
                                            highlightLast
                                            width={780} height={460}
                                            startFrame={getCueFrame(3, "CHART_DRAW_START")} drawDuration={35}
                                        />
                                    </div>
                                    <div style={{ marginTop: "auto" }}>
                                        <SourceStamp
                                            classification="EXHIBIT 004 — DEFICIT"
                                            source="Source: Congressional Budget Office (CBO)"
                                            startDelay={getCueFrame(3, "HARD_CUT")}
                                        />
                                    </div>
                                </div>
                            </ArchiveScene>
                        </TransitionWrapper>
                    </div>
                )}

                {/* ══════ S5 · FRAMES 732–930 ══════════════════════════════════
                    "In the current cycle, the engine changed."
                    Grid: (0,1) | Mode: Declaration + LineChart (crossover)
                   ═══════════════════════════════════════════════════════════ */}
                {isVisible(4) && (
                    <div style={{ position: "absolute", left: 0, top: 1920, width: 1080, height: 1920 }}>
                        <TransitionWrapper {...getTransProps(4)} frame={lf(4)}>
                            <ArchiveScene
                                sceneId="s5"
                                sceneLabel="05 · 12"
                                heroText="FISCAL DOMINANCE ARRIVED"
                                actLabel="Act II — Addiction"
                                localFrame={lf(4)}
                                videoSrc={assets.scene5_video}
                                videoSrcSecondary={assets.scene12_video} // Conflict Reality
                                imageSrc={assets.scene5_image}
                                variant={getStrictVariant("s5")}
                                renderBackground={false}
                                sceneDuration={SCENES[4].dur}
                                microReset={SCENE_MICRO_RESETS[4]}
                                microResetLabel={SCENE_MICRO_LABELS[4]}
                            >
                                {/* S5 sync: "changed." at local f50, crossover chart draws; "dominance" at local f79; "arrived." at local f88 */}
                                <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                                    <Declaration
                                        lines={[
                                            { text: "The Engine", color: C.CREAM_DIM, size: 72 },
                                            { text: "Changed.", color: C.GOLD, size: 104 },
                                        ]}
                                        startDelay={getCueFrame(4, "SCENE_START")}
                                        lineStagger={12}
                                    />
                                    <Divider delay={getCueFrame(4, "SCENE_START") + 12} />
                                    <div style={{ marginTop: 8 }}>
                                        <PhysicalLineChart
                                            title="Monetary vs Fiscal Dominance (% influence)"
                                            data={[
                                                { label: "2008", value: 90 },
                                                { label: "2012", value: 82 },
                                                { label: "2016", value: 74 },
                                                { label: "2019", value: 60 },
                                                { label: "2020", value: 42 },
                                                { label: "2022", value: 30 },
                                                { label: "2024", value: 22 },
                                            ]}
                                            lineLabel="MONETARY"
                                            color={C.GOLD}
                                            secondLine={{
                                                label: "FISCAL",
                                                color: C.OXBLOOD,
                                                data: [
                                                    { label: "2008", value: 18 },
                                                    { label: "2012", value: 28 },
                                                    { label: "2016", value: 44 },
                                                    { label: "2019", value: 56 },
                                                    { label: "2020", value: 72 },
                                                    { label: "2022", value: 82 },
                                                    { label: "2024", value: 92 },
                                                ],
                                            }}
                                            width={780} height={500}
                                            startFrame={getCueFrame(4, "CHART_DRAW_START")} drawDuration={50}
                                            filterId="lc5"
                                        />
                                    </div>
                                    <div style={{ marginTop: "auto" }}>
                                        <SourceStamp
                                            classification="EXHIBIT 005 — CROSSOVER"
                                            source="Source: IMF Fiscal Monitor"
                                            startDelay={getCueFrame(4, "HARD_CUT")}
                                        />
                                    </div>
                                </div>
                            </ArchiveScene>
                        </TransitionWrapper>
                    </div>
                )}

                {/* ══════ S6 · FRAMES 930–1128 ═════════════════════════════════
                    "Governments are bypassing banks."
                    Grid: (1,1) | Mode: Declaration + Evidence Card (flow)
                   ═══════════════════════════════════════════════════════════ */}
                {isVisible(5) && (
                    <div style={{ position: "absolute", left: 1080, top: 1920, width: 1080, height: 1920 }}>
                        <TransitionWrapper {...getTransProps(5)} frame={lf(5)}>
                            <ArchiveScene
                                sceneId="s6"
                                sceneLabel="06 · 12"
                                actLabel="Act II — Addiction"
                                localFrame={lf(5)}
                                videoSrc={assets.scene6_video}
                                imageSrc={assets.scene6_image}
                                variant={getStrictVariant("s6")}
                                renderBackground={false}
                                sceneDuration={SCENES[5].dur}
                                microReset={SCENE_MICRO_RESETS[5]}
                                microResetLabel={SCENE_MICRO_LABELS[5]}
                            >
                                {/* S6 sync: "bypassing" at local f22, stomp fires; "banks" at local f44; "economy." at local f56 */}
                                <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                                    <KineticTypography
                                        startFrame={getCueFrame(5, "SCENE_START")}
                                        lines={[
                                            {
                                                units: [
                                                    { text: "BYPASSING", type: "HERO", animation: "STOMP", weight: "BLACK", color: C.OXBLOOD }
                                                ],
                                            },
                                            {
                                                units: [
                                                    { text: "THE", type: "CONNECTIVE" },
                                                    { text: "BANKS.", type: "HERO", animation: "SLIDE", weight: "BOLD", color: C.CREAM }
                                                ],
                                                align: "baseline",
                                                justify: false
                                            }
                                        ]}
                                    />
                                    <Divider delay={getCueFrame(5, "HERO_WORD") + 4} />
                                    <EvidenceCard width={780} startFrame={getCueFrame(5, "HERO_WORD")} label="Fiscal Transmission">
                                        <FlowArrow from="🏛 TREASURY" to="🏦 BANKS" label="OLD ROUTE" striked startFrame={getCueFrame(5, "HERO_WORD") + 6} />
                                        <FlowArrow from="🏛 TREASURY" to="📈 ECONOMY" label="DIRECT — 2020–present" color={C.GOLD} startFrame={getCueFrame(5, "EMPHASIS")} />
                                    </EvidenceCard>
                                    <div style={{ marginTop: "auto" }}>
                                        <SourceStamp
                                            classification="EXHIBIT 006 — DISINTERMEDIATION"
                                            source="Source: BIS Working Papers, 2023"
                                            startDelay={getCueFrame(5, "HARD_CUT")}
                                        />
                                    </div>
                                </div>
                            </ArchiveScene>
                        </TransitionWrapper>
                    </div>
                )}

                {/* ══════ S7 · FRAMES 1128–1326 ════════════════════════════════
                    "Inflation is a policy choice, not a supply chain accident."
                    Grid: (2,1) | Mode: Declaration + Verdict Card
                   ═══════════════════════════════════════════════════════════ */}
                {isVisible(6) && (
                    <div style={{ position: "absolute", left: 2160, top: 1920, width: 1080, height: 1920 }}>
                        <TransitionWrapper {...getTransProps(6)} frame={lf(6)}>
                            <ArchiveScene
                                sceneId="s7"
                                sceneLabel="07 · 12"
                                actLabel="Act III — The Burn"
                                localFrame={lf(6)}
                                videoSrc={assets.scene7_video}
                                imageSrc={assets.scene7_image}
                                variant={getStrictVariant("s7")}
                                renderBackground={false}
                                sceneDuration={SCENES[6].dur}
                                microReset={SCENE_MICRO_RESETS[6]}
                                microResetLabel={SCENE_MICRO_LABELS[6]}
                            >
                                {/* S7 sync: "Inflation" at local f0, "policy" at local f34, "accident" at local f55, "chain." at local f66 */}
                                <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                                    <Declaration
                                        lines={[
                                            { text: "Policy", color: C.CREAM, size: 80 },
                                            { text: "Choice.", color: C.GOLD, size: 96 },
                                            { text: "Not Accident.", color: C.CREAM_DIM, size: 64 },
                                        ]}
                                        startDelay={getCueFrame(6, "SCENE_START")}
                                        lineStagger={10}
                                    />
                                    <Divider delay={getCueFrame(6, "SCENE_START") + 12} />
                                    <div style={{ marginTop: 8 }}>
                                        <VerdictCard
                                            leftLabel="Accident" leftSub="Supply shocks · demand pull"
                                            leftMark="✕" leftColor={C.OXBLOOD}
                                            rightLabel="Policy Tool" rightSub="Debt erosion via inflation"
                                            rightMark="✓" rightColor={C.GOLD}
                                        />
                                    </div>
                                    <div style={{ marginTop: "auto" }}>
                                        <SourceStamp
                                            classification="EXHIBIT 007 — FTPL"
                                            source="Source: Cochrane (2023), Fiscal Theory of the Price Level"
                                            startDelay={getCueFrame(6, "HARD_CUT")}
                                        />
                                    </div>
                                </div>
                            </ArchiveScene>
                        </TransitionWrapper>
                    </div>
                )}

                {/* ══════ S8 · FRAMES 1326–1494 ════════════════════════════════
                    "Zombie companies. Cheap debt is now a trap."
                    Grid: (3,1) | Mode: Declaration + BarChart
                   ═══════════════════════════════════════════════════════════ */}
                {isVisible(7) && (
                    <div style={{ position: "absolute", left: 3240, top: 1920, width: 1080, height: 1920 }}>
                        <TransitionWrapper {...getTransProps(7)} frame={lf(7)}>
                            <ArchiveScene
                                sceneId="s8"
                                sceneLabel="08 · 12"
                                heroText="ZOMBIE COMPANIES"
                                actLabel="Act III — The Burn"
                                localFrame={lf(7)}
                                videoSrc={assets.scene8_video}
                                videoSrcSecondary={assets.scene4_video} // Conflict Reality
                                imageSrc={assets.scene8_image}
                                variant={getStrictVariant("s8")}
                                renderBackground={false}
                                sceneDuration={SCENES[7].dur}
                                microReset={SCENE_MICRO_RESETS[7]}
                                microResetLabel={SCENE_MICRO_LABELS[7]}
                            >
                                {/* S8 sync: "Zombie" at local f0 (slam + chart), "2" at local f23, "trap." at local f41 */}
                                <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                                    <Declaration
                                        lines={[
                                            { text: "2% Debt.", color: C.CREAM, size: 88 },
                                            { text: "Now A Trap.", color: C.OXBLOOD, size: 88 },
                                        ]}
                                        startDelay={getCueFrame(7, "SCENE_START")}
                                        lineStagger={12}
                                    />
                                    <div style={{ marginTop: 28 }}>
                                        <PhysicalBarChart
                                            title="Zombie Firms — % of Listed Companies"
                                            data={[
                                                { label: "2008", value: 6 },
                                                { label: "2012", value: 10 },
                                                { label: "2015", value: 12 },
                                                { label: "2019", value: 16, sublabel: "Peak ZIRP" },
                                                { label: "2022", value: 22, sublabel: "↑ Surge" },
                                            ]}
                                            color={C.OXBLOOD}
                                            highlightLast
                                            width={780} height={460}
                                            startFrame={getCueFrame(7, "CHART_DRAW_START")} drawDuration={45}
                                        />
                                    </div>
                                    <div style={{ marginTop: "auto" }}>
                                        <SourceStamp
                                            classification="EXHIBIT 008 — ZOMBIE ECONOMY"
                                            source="Source: BIS Quarterly Review, 2023"
                                            startDelay={getCueFrame(7, "HARD_CUT")}
                                        />
                                    </div>
                                </div>
                            </ArchiveScene>
                        </TransitionWrapper>
                    </div>
                )}

                {/* ══════ S9 · FRAMES 1494–1662 ════════════════════════════════
                    "Real assets win when currency is devalued."
                    Grid: (0,2) | Mode: Declaration + Stat Lines
                   ═══════════════════════════════════════════════════════════ */}
                {isVisible(8) && (
                    <div style={{ position: "absolute", left: 0, top: 3840, width: 1080, height: 1920 }}>
                        <TransitionWrapper {...getTransProps(8)} frame={lf(8)}>
                            <ArchiveScene
                                sceneId="s9"
                                sceneLabel="09 · 12"
                                heroText="CURRENCY DEVALUATION"
                                actLabel="Act III — The Burn"
                                localFrame={lf(8)}
                                videoSrc={assets.scene9_video}
                                imageSrc={assets.scene9_image}
                                variant={getStrictVariant("s9")}
                                renderBackground={false}
                                sceneDuration={SCENES[8].dur}
                                microReset={SCENE_MICRO_RESETS[8]}
                                microResetLabel={SCENE_MICRO_LABELS[8]}
                            >
                                {/* S9 sync: "assets" at local f3, "win" at local f14, "devalued" at local f82, "deficits." at local f111 */}
                                <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                                    <Declaration
                                        lines={[
                                            { text: "Real Assets", color: C.GOLD, size: 88 },
                                            { text: "Win.", color: C.CREAM, size: 120 },
                                        ]}
                                        startDelay={getCueFrame(8, "SCENE_START")}
                                        lineStagger={12}
                                    />
                                    <Divider delay={getCueFrame(8, "HERO_WORD") + 4} />
                                    <div style={{ marginTop: 8 }}>
                                        <StatLine label="Gold"        value="+42%"  color={C.GOLD}    delay={getCueFrame(8, "HERO_WORD") + 8} />
                                        <StatLine label="Real Estate" value="+38%"  color={C.GOLD}    delay={getCueFrame(8, "HERO_WORD") + 16} />
                                        <StatLine label="Commodities" value="+31%"  color={C.GOLD}    delay={getCueFrame(8, "HERO_WORD") + 24} />
                                        <StatLine label="Bitcoin"     value="+290%" color={C.GOLD}    delay={getCueFrame(8, "HERO_WORD") + 32} />
                                        <StatLine label="Cash (Real)" value="−24%"  color={C.OXBLOOD} delay={getCueFrame(8, "HERO_WORD") + 40} />
                                    </div>
                                    <div style={{ marginTop: "auto" }}>
                                        <SourceStamp
                                            classification="EXHIBIT 009 — ASSET PROTECTION"
                                            source="Source: Goldman Sachs Research, 2024"
                                            startDelay={getCueFrame(8, "HARD_CUT")}
                                        />
                                    </div>
                                </div>
                            </ArchiveScene>
                        </TransitionWrapper>
                    </div>
                )}

                {/* ══════ S10 · FRAMES 1662–1830 ═══════════════════════════════
                    "Wealth redistributed from the saver to the spender."
                    Grid: (1,2) | Mode: Declaration + DataTicker + Stat Lines
                   ═══════════════════════════════════════════════════════════ */}
                {isVisible(9) && (
                    <div style={{ position: "absolute", left: 1080, top: 3840, width: 1080, height: 1920 }}>
                        <TransitionWrapper {...getTransProps(9)} frame={lf(9)}>
                            <ArchiveScene
                                sceneId="s10"
                                sceneLabel="10 · 12"
                                actLabel="Act III — The Burn"
                                localFrame={lf(9)}
                                videoSrc={assets.scene10_video}
                                imageSrc={assets.scene10_image}
                                variant={getStrictVariant("s10")}
                                renderBackground={false}
                                sceneDuration={SCENES[9].dur}
                                microReset={SCENE_MICRO_RESETS[9]}
                                microResetLabel={SCENE_MICRO_LABELS[9]}
                            >
                                {/* S10 sync: "Wealth" at local f0, "redistributed" at local f20, "saver" at local f85, "spender." at local f100 */}
                                <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                                    <KineticTypography
                                        startFrame={getCueFrame(9, "SCENE_START")}
                                        lines={[
                                            {
                                                units: [
                                                    { text: "SAVER", type: "HERO", weight: "REGULAR", color: C.CREAM_DIM },
                                                    { text: "→", type: "HERO", weight: "LIGHT", color: C.GOLD },
                                                    { text: "SPENDER", type: "HERO", animation: "STOMP", weight: "BLACK", color: C.OXBLOOD }
                                                ],
                                                align: "baseline",
                                                justify: false
                                            }
                                        ]}
                                    />
                                    <Divider delay={getCueFrame(9, "HERO_WORD") + 4} />
                                    <DataTicker
                                        from={0} to={-0.8} decimals={1} suffix="% real yield"
                                        label="What savers actually earn after inflation"
                                        startDelay={getCueFrame(9, "HERO_WORD")} duration={30}
                                        color={C.OXBLOOD} size={80}
                                    />
                                    <GoldHighlight width={440} startFrame={getCueFrame(9, "HERO_WORD") + 12} filterId="gh10" />
                                    <div style={{ marginTop: 24 }}>
                                        <StatLine label="Nominal Rate"  value="5.25%"  color={C.GOLD}    delay={getCueFrame(9, "EMPHASIS")} />
                                        <StatLine label="CPI Inflation" value="3.40%"  color={C.GOLD}    delay={getCueFrame(9, "EMPHASIS") + 8} />
                                        <StatLine label="Real Yield"    value="−0.8%"  color={C.OXBLOOD} delay={getCueFrame(9, "EMPHASIS") + 16} />
                                        <StatLine label="Wealth Eroded" value="−$12T"  color={C.OXBLOOD} delay={getCueFrame(9, "EMPHASIS") + 24} />
                                    </div>
                                    <div style={{ marginTop: "auto" }}>
                                        <SourceStamp
                                            classification="EXHIBIT 010 — WEALTH TRANSFER"
                                            source="Source: FRED, 2024"
                                            startDelay={getCueFrame(9, "HARD_CUT")}
                                        />
                                    </div>
                                </div>
                            </ArchiveScene>
                        </TransitionWrapper>
                    </div>
                )}

                {/* ══════ S11 · FRAMES 1830–2028 ═══════════════════════════════
                    "The risk is no longer a crash. It is a slow, hot burn."
                    Grid: (2,2) | Mode: Declaration + LineChart (dual)
                   ═══════════════════════════════════════════════════════════ */}
                {isVisible(10) && (
                    <div style={{ position: "absolute", left: 2160, top: 3840, width: 1080, height: 1920 }}>
                        <TransitionWrapper {...getTransProps(10)} frame={lf(10)}>
                            <ArchiveScene
                                sceneId="s11"
                                sceneLabel="11 · 12"
                                actLabel="Act IV — The Endgame"
                                localFrame={lf(10)}
                                videoSrc={assets.scene11_video}
                                imageSrc={assets.scene11_image}
                                variant={getStrictVariant("s11")}
                                renderBackground={false}
                                sceneDuration={SCENES[10].dur}
                                microReset={SCENE_MICRO_RESETS[10]}
                                microResetLabel={SCENE_MICRO_LABELS[10]}
                            >
                                {/* S11 sync: "risk" at local f14, "crash." at local f44, "burn." at local f128 */}
                                <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                                    <Declaration
                                        lines={[
                                            { text: "No Crash.", color: C.GOLD, size: 80 },
                                            { text: "A Slow,", color: C.OXBLOOD, size: 92 },
                                            { text: "Hot Burn.", color: C.OXBLOOD, size: 92 },
                                        ]}
                                        startDelay={getCueFrame(10, "SCENE_START")}
                                        lineStagger={10}
                                    />
                                    <div style={{ marginTop: 20 }}>
                                        <PhysicalLineChart
                                            title="Interest Payments on US Debt ($B)"
                                            data={[
                                                { label: "2010", value: 413 },
                                                { label: "2015", value: 402 },
                                                { label: "2018", value: 523 },
                                                { label: "2020", value: 522 },
                                                { label: "2022", value: 724 },
                                                { label: "2023", value: 879 },
                                                { label: "2024", value: 1100 },
                                            ]}
                                            lineLabel="US DEBT SERVICE"
                                            color={C.OXBLOOD}
                                            width={780} height={460}
                                            startFrame={getCueFrame(10, "CHART_DRAW_START")} drawDuration={55}
                                            filterId="lc11"
                                        />
                                    </div>
                                    <div style={{ marginTop: "auto" }}>
                                        <SourceStamp
                                            classification="EXHIBIT 011 — DEBT SERVICE"
                                            source="Source: US Treasury Monthly Statement"
                                            startDelay={getCueFrame(10, "HARD_CUT")}
                                        />
                                    </div>
                                </div>
                            </ArchiveScene>
                        </TransitionWrapper>
                    </div>
                )}

                {/* ══════ S12 · FRAMES 2028–2130 ═══════════════════════════════
                    "We need a new operator."
                    Grid: (3,2) | Mode: Declaration + Final Statement
                   ═══════════════════════════════════════════════════════════ */}
                {isVisible(11) && (
                    <div style={{ position: "absolute", left: 3240, top: 3840, width: 1080, height: 1920 }}>
                        <TransitionWrapper {...getTransProps(11)} frame={lf(11)}>
                            <ArchiveScene
                                sceneId="s12"
                                sceneLabel="12 · 12"
                                actLabel="Act IV — The Endgame"
                                localFrame={lf(11)}
                                videoSrc={assets.scene12_video}
                                videoSrcSecondary={assets.scene6_video} // Conflict Reality
                                imageSrc={assets.scene12_image}
                                variant={getStrictVariant("s12")}
                                renderBackground={false}
                                sceneDuration={SCENES[11].dur}
                                microReset={SCENE_MICRO_RESETS[11]}
                                microResetLabel={SCENE_MICRO_LABELS[11]}
                            >
                                {/* S12 sync: "printing" at local f17, "stopped." at local f44, "found" at local f85, "operator." at local f102 */}
                                <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                                    <GoldHighlight width={600} startFrame={getCueFrame(11, "HERO_WORD")} filterId="gh12" />
                                    <Declaration
                                        lines={[
                                            { text: "It Found", color: C.CREAM, size: 72 },
                                            { text: "A New", color: C.CREAM_DIM, size: 64 },
                                            { text: "Operator.", color: C.GOLD, size: 100 },
                                        ]}
                                        startDelay={getCueFrame(11, "HERO_WORD")}
                                        lineStagger={14}
                                    />
                                    <div style={{ marginTop: 60, alignSelf: "center" }}>
                                        <SourceStamp
                                            classification="CLASSIFIED — TOP SECRET"
                                            source="Project Spinning Halley"
                                            startDelay={getCueFrame(11, "HARD_CUT")}
                                        />
                                    </div>
                                </div>
                            </ArchiveScene>
                        </TransitionWrapper>
                    </div>
                )}

            </div >

            {/* WARP 18.0: The Ghost Host Protocol */}
            <GhostHost />

            <GlobalLens />
        </AbsoluteFill >
    );
};

/* ─── FlowArrow ── local helper for the disintermediation scene (S6) ─────── */
const FlowArrow: React.FC<{
    from: string;
    to: string;
    label: string;
    color?: string;
    striked?: boolean;
    startFrame?: number;
}> = ({ from, to, label, color = C.NAVY, striked = false, startFrame = 0 }) => {
    const frame = useCurrentFrame();
    const p = interpolate(frame, [startFrame, startFrame + 20], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    return (
        <div
            style={{
                opacity: p,
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 0",
                borderBottom: `1px solid ${C.GOLD} 18`,
                position: "relative",
            }}
        >
            <span style={{ fontFamily: ARCHIVE_FONTS.mono, fontSize: 20, color: C.NAVY }}>{from}</span>
            <span style={{ fontFamily: ARCHIVE_FONTS.mono, fontSize: 24, color: C.OXBLOOD }}> → </span>
            <span style={{ fontFamily: ARCHIVE_FONTS.mono, fontSize: 20, color: C.NAVY }}>{to}</span>
            <span style={{ fontFamily: ARCHIVE_FONTS.mono, fontSize: 16, color: C.NAVY, marginLeft: "auto", letterSpacing: "0.06em", opacity: 0.7 }}>{label}</span>
            {striked && (
                <div style={{
                    position: "absolute", left: 0, top: "50%", right: 0, height: 2,
                    background: C.OXBLOOD, opacity: 0.7,
                    transform: "translateY(-50%)",
                }} />
            )}
        </div>
    );
};
