import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { C, ARCHIVE_FONTS } from "./fonts";
import { PACING, getHoldEvolveTriggers } from "./PacingEngine";

/**
 * WARP 19.0 — Hold & Evolve Protocol
 * ─────────────────────────────────────
 * When a scene's audio runs longer than 4.5s (135f), we cannot cut away —
 * that destroys learning context. Instead, at the 3.0s mark (90f) we inject
 * one of three Micro-Animation Resets. Each resets the viewer's 4.5s timer
 * without changing the underlying layout.
 *
 * Three variants:
 *   1. Z_PUNCH_IN     — camera zooms to 115%, focusing on a data point
 *   2. REDACTION_REVEAL — dark block slides away to expose a secondary label
 *   3. HIGHLIGHTER    — antique gold marker draws a rough circle on the content
 *
 * Usage (inside ArchiveScene):
 *   <MicroAnimationReset
 *     type="Z_PUNCH_IN"
 *     localFrame={localFrame}
 *     triggerAt={PACING.HOLD_EVOLVE_AT}
 *     duration={sceneDuration}
 *   />
 */

export type MicroResetType = "Z_PUNCH_IN" | "REDACTION_REVEAL" | "HIGHLIGHTER";

interface MicroAnimationResetProps {
    type: MicroResetType;
    localFrame: number;
    /** Frame at which the reset fires (default: PACING.HOLD_EVOLVE_AT = 90) */
    triggerAt?: number;
    /** Total duration of this scene in frames */
    duration: number;
    /** Optional: highlight label text for REDACTION_REVEAL */
    revealLabel?: string;
}

/**
 * Z-Punch: scale the entire scene content to 115% via an AbsoluteFill wrapper.
 * SOP Part VI (DATA STATE): Physics = SLAM (High stiffness, low bounce).
 * The overlay covers inset:0 so the parent's `zoom` CSS property propagates
 * the scale to all children beneath it in the compositing stack.
 */
export const ZPunchIn: React.FC<{ localFrame: number; triggerAt: number; children?: React.ReactNode }> = ({ localFrame, triggerAt, children }) => {
    const { fps } = useVideoConfig();
    const relFrame = localFrame - triggerAt;

    // SLAM physics: high stiffness, pronounced bounce
    const punchIn = spring({
        frame: Math.max(0, relFrame),
        fps,
        config: { stiffness: 400, damping: 12, mass: 1 },
    });

    // Ease back to 1.07 (GLIDE physics: slow return)
    const easeBack = spring({
        frame: Math.max(0, relFrame - 12),
        fps,
        config: { stiffness: 60, damping: 18, mass: 1 },
    });

    const scale = relFrame < 0
        ? 1
        : interpolate(punchIn, [0, 1], [1, 1.15]) - interpolate(easeBack, [0, 1], [0, 0.08]);

    // Before trigger: render children unscaled
    if (relFrame < 0) return <>{children}</>;

    return (
        <div
            style={{
                position: "absolute",
                inset: 0,
                transform: `scale(${scale})`,
                transformOrigin: "center 60%", // Focus toward chart/data area
                willChange: "transform",
                pointerEvents: "none",
                zIndex: 10,
            }}
        >
            {children}
        </div>
    );
};

/** Redaction Reveal: dark classified block slides left to expose a label */
export const RedactionReveal: React.FC<{
    localFrame: number;
    triggerAt: number;
    label?: string;
}> = ({ localFrame, triggerAt, label = "CLASSIFIED DATA" }) => {
    const { fps } = useVideoConfig();
    const relFrame = localFrame - triggerAt;

    if (relFrame < 0) return null;

    const slideP = spring({
        frame: relFrame,
        fps,
        config: { stiffness: 180, damping: 22 },
    });

    // Block slides from 0% offset → -100% (fully off left)
    const translateX = interpolate(slideP, [0, 1], [0, -100]);
    const labelOpacity = interpolate(slideP, [0.6, 1], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    return (
        <div
            style={{
                position: "absolute",
                bottom: 340,
                left: 86,
                width: 420,
                height: 52,
                overflow: "hidden",
                zIndex: 11,
                pointerEvents: "none",
            }}
        >
            {/* The label beneath the redaction block */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: 12,
                    opacity: labelOpacity,
                    fontFamily: ARCHIVE_FONTS.mono,
                    fontSize: 18,
                    color: C.GOLD,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    textShadow: "0 2px 8px rgba(0,0,0,0.9)",
                }}
            >
                ▶ {label}
            </div>

            {/* The sliding redaction block */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background: C.NAVY,
                    border: `1px solid ${C.GOLD}44`,
                    transform: `translateX(${translateX}%)`,
                    willChange: "transform",
                    display: "flex",
                    alignItems: "center",
                    paddingLeft: 12,
                    gap: 8,
                }}
            >
                <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: C.OXBLOOD,
                    boxShadow: `0 0 6px ${C.OXBLOOD}`,
                }} />
                <span style={{
                    fontFamily: ARCHIVE_FONTS.mono,
                    fontSize: 14,
                    color: C.CREAM_DIM,
                    letterSpacing: "0.2em",
                    opacity: 0.7,
                }}>
                    ██████████████
                </span>
            </div>
        </div>
    );
};

/** Highlighter: rough gold ellipse draws around the content focus area */
export const HighlighterCircle: React.FC<{
    localFrame: number;
    triggerAt: number;
    cx?: number;
    cy?: number;
    rx?: number;
    ry?: number;
}> = ({
    localFrame,
    triggerAt,
    cx = 540,
    cy = 1100,
    rx = 260,
    ry = 80,
}) => {
    const { fps } = useVideoConfig();
    const relFrame = localFrame - triggerAt;
    if (relFrame < 0) return null;

    // SOP Part VI (EVIDENCE_STATE): STOP-MOTION posterized to 12fps (4-frame steps)
    const steppedFrame = Math.floor(relFrame / 4) * 4;

    // Spring physics instead of banned linear easing (SOP Part I)
    const drawSpring = spring({
        frame: steppedFrame,
        fps,
        config: { stiffness: 200, damping: 20 },
    });
    const drawP = drawSpring;

    // Circumference of an ellipse (Ramanujan approximation)
    const h = Math.pow((rx - ry) / (rx + ry), 2);
    const circumference = Math.PI * (rx + ry) * (1 + (3 * h) / (10 + Math.sqrt(4 - 3 * h)));

    // SVG stroke-dasharray trick for progressive draw
    const dashArray = `${drawP * circumference} ${circumference}`;

    // Slight wobble on the ellipse via feTurbulence (static seed, low freq)
    const filterId = "highlighter-turbulence";
    const opacity = interpolate(relFrame, [0, 5, 18, 20], [0, 1, 1, 0.85], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    return (
        <svg
            style={{
                position: "absolute",
                inset: 0,
                width: 1080,
                height: 1920,
                pointerEvents: "none",
                zIndex: 12,
                opacity,
            }}
        >
            <defs>
                <filter id={filterId}>
                    <feTurbulence
                        type="turbulence"
                        baseFrequency="0.04"
                        numOctaves="2"
                        seed="7"
                        result="noise"
                    />
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="noise"
                        scale="4"
                        xChannelSelector="R"
                        yChannelSelector="G"
                    />
                </filter>
            </defs>
            <ellipse
                cx={cx}
                cy={cy}
                rx={rx}
                ry={ry}
                fill="none"
                stroke={C.GOLD}
                strokeWidth={5}
                strokeDasharray={dashArray}
                strokeDashoffset={0}
                strokeLinecap="round"
                filter={`url(#${filterId})`}
                opacity={0.85}
            />
        </svg>
    );
};

/**
 * Top-level selector — choose the right micro-reset type per scene.
 * Place this inside ArchiveScene, it is a zero-footprint overlay (pointerEvents: none).
 */
/**
 * WARP 19.0 — Multi-trigger Hold & Evolve.
 * Fires micro-resets at every 90-frame interval within the scene.
 * For scenes > 180f this means triggers at 90f AND 180f (etc.).
 */
export const MicroAnimationReset: React.FC<MicroAnimationResetProps> = ({
    type,
    localFrame,
    triggerAt = PACING.HOLD_EVOLVE_AT,
    duration,
    revealLabel,
}) => {
    // Only activate if scene is long enough to need the reset
    if (duration <= PACING.HOLD_EVOLVE_AT) return null;

    // WARP 19.0: fire at EVERY 90-frame interval, not just the first
    const triggers = getHoldEvolveTriggers(duration);
    if (triggers.length === 0) return null;

    const renderReset = (t: number, key: number) => {
        switch (type) {
            case "REDACTION_REVEAL":
                return <RedactionReveal key={key} localFrame={localFrame} triggerAt={t} label={revealLabel} />;
            case "HIGHLIGHTER":
                return <HighlighterCircle key={key} localFrame={localFrame} triggerAt={t} />;
            case "Z_PUNCH_IN":
            default:
                return <ZPunchIn key={key} localFrame={localFrame} triggerAt={t} />;
        }
    };

    return <>{triggers.map((t, i) => renderReset(t, i))}</>;
};
