import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate, Easing } from "remotion";
import { ARCHIVE_FONTS, C } from "./fonts";

/**
 * WARP 12.0: KINETIC TYPOGRAPHY & SCALE VARIANCE
 * ──────────────────────────────────────────────
 * 1. Extreme Contrast (5x Rule): Hero (100-120px) vs Connective (24px).
 * 2. Weight Distribution: Light setup, Black impact.
 * 3. Kinetic Alignment: Rigid Baseline & Institutional Block.
 * 4. Motion Physics: Masked Slide, Stomp, Redaction Reveal.
 * 5. Word Count Cap: Max 5 words per beat.
 */

export type KineticUnitType = "HERO" | "CONNECTIVE";
export type KineticWeight = "LIGHT" | "REGULAR" | "BOLD" | "BLACK";
export type KineticAnim = "SLIDE" | "STOMP" | "REDACTION";

export interface KineticUnit {
    text: string;
    type?: KineticUnitType; // Default CONNECTIVE
    weight?: KineticWeight; // Default REGULAR
    animation?: KineticAnim; // Default SLIDE
    color?: string; // Default derived from type (Gold/Cream)
    extraTracking?: number; // For "Institutional Block" manual tuning
}

export interface KineticLine {
    units: KineticUnit[];
    justify?: boolean; // If true, space-between units to form a block
    align?: "baseline" | "center" | "flex-end" | "flex-start"; // Default baseline
}

/** 
 * A "Beat" is a screen-replacing sequence. 
 * The component renders ONE beat. 
 * Parent orchestrates sequencing via startFrame/opacity.
 */
export interface KineticBeatProps {
    lines: KineticLine[];
    startFrame?: number; // When this beat starts relative to scene
    stagger?: number; // Delay between lines
}

// ─── STYLES ───
const UNIT_STYLES = {
    HERO: {
        fontFamily: ARCHIVE_FONTS.serif,
        fontSize: 120, // 5x Scale Rule
        textTransform: "uppercase" as const,
        lineHeight: 0.9,
        textShadow: "0px 10px 30px rgba(0,0,0,0.9)", // The Burn Rule
    },
    CONNECTIVE: {
        fontFamily: ARCHIVE_FONTS.mono,
        fontSize: 24,
        textTransform: "uppercase" as const,
        lineHeight: 1.4,
    },
};

const WEIGHT_MAP = {
    LIGHT: 300, // Fallback if 400 is lightest loaded, use 400
    REGULAR: 400,
    BOLD: 700,
    BLACK: 900,
};

// ─── ANIMATION HOOKS ───

// ─── SUB-COMPONENT: UNIT RENDERER ───
// Extracts hook calls to ensure they run at top-level per unit

const KineticUnitRenderer: React.FC<{
    unit: KineticUnit;
    localFrame: number;
    fps: number;
    delay: number;
}> = ({ unit, localFrame, fps, delay }) => {
    // Determine Styles
    const isHero = unit.type === "HERO";
    const styleBase = isHero ? UNIT_STYLES.HERO : UNIT_STYLES.CONNECTIVE;
    const color = unit.color || (isHero ? C.GOLD : C.CREAM);
    const weight = WEIGHT_MAP[unit.weight || (isHero ? "BLACK" : "REGULAR")];
    const tracking = unit.extraTracking ? `${unit.extraTracking}em` : (isHero ? "-0.02em" : "0.05em");

    // Determine Animation
    const animType = unit.animation || "SLIDE";
    const activeFrame = localFrame - delay;

    // Call all hooks unconditionally (Rules of Hooks)
    // We'll use the result based on animType, but hooks must run.

    // 1. STOMP
    const stompRaw = spring({
        frame: activeFrame,
        fps,
        config: { stiffness: 400, damping: 10, mass: 0.5 },
    });
    const stompScale = interpolate(stompRaw, [0, 1], [2.0, 1], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp"
    });
    const stompY = interpolate(activeFrame, [3, 4, 6], [0, 8, 0], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp"
    });

    // 2. SLIDE
    const slideP = spring({
        frame: activeFrame,
        fps,
        config: { stiffness: 250, damping: 20 },
    });
    const slideY = interpolate(slideP, [0, 1], [110, 0]);

    // 3. REDACTION
    const redactionP = interpolate(activeFrame, [0, 12], [0, 100], {
        extrapolateLeft: "clamp", extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
    });

    // RENDER LOGIC
    if (animType === "STOMP") {
        return (
            <div style={{
                ...styleBase,
                fontWeight: weight,
                color,
                letterSpacing: tracking,
                transform: `scale(${stompScale}) translateY(${stompY}px)`,
                opacity: stompRaw,
            }}>
                {unit.text}
            </div>
        );
    }

    if (animType === "REDACTION") {
        return (
            <div style={{ position: "relative", overflow: "hidden" }}>
                <div style={{
                    ...styleBase,
                    fontWeight: weight,
                    color,
                    letterSpacing: tracking,
                }}>
                    {unit.text}
                </div>
                {/* The Cover */}
                <div style={{
                    position: "absolute",
                    top: -10, bottom: -10, left: -10, right: -10,
                    background: C.GOLD,
                    transform: `translateX(${redactionP}%)`,
                    opacity: redactionP > 98 ? 0 : 1,
                }} />
            </div>
        );
    }

    // Default: SLIDE
    return (
        <div style={{ overflow: "hidden" }}>
            <div style={{
                ...styleBase,
                fontWeight: weight,
                color,
                letterSpacing: tracking,
                transform: `translateY(${slideY}%)`,
            }}>
                {unit.text}
            </div>
        </div>
    );
};

// ─── MAIN COMPONENT ───

export const KineticTypography: React.FC<KineticBeatProps> = ({
    lines,
    startFrame = 0,
    stagger = 8
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const localFrame = frame - startFrame;

    return (
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: 16, // Vertical rhythm
            width: "100%",
            alignItems: "center",
        }}>
            {lines.map((line, lineIdx) => {
                const lineDelay = lineIdx * stagger;

                return (
                    <div
                        key={lineIdx}
                        style={{
                            display: "flex",
                            flexDirection: "row",
                            width: line.justify ? "100%" : "auto",
                            justifyContent: line.justify ? "space-between" : "center",
                            alignItems: line.align || "baseline",
                            gap: line.justify ? 0 : 24,
                        }}
                    >
                        {line.units.map((unit, unitIdx) => (
                            <KineticUnitRenderer
                                key={unitIdx}
                                unit={unit}
                                localFrame={localFrame}
                                fps={fps}
                                delay={lineDelay + (unitIdx * 4)} // Internal stagger
                            />
                        ))}
                    </div>
                );
            })}
        </div>
    );
};
