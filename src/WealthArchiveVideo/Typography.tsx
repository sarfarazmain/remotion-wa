import React from "react";
import { interpolate, Easing, spring, useVideoConfig } from "remotion";
import { useSceneFrame } from "./SceneContext";
import { ARCHIVE_FONTS, C } from "./fonts";

/*
 * TYPOGRAPHY — The Wealth Archive
 * ─────────────────────────────────
 * One principle: text STAMPS. It does not fade, slide sideways, or float.
 * It erupts from below a clipping boundary and slams into place.
 *
 * Only 2-3 words max on screen at one time.
 * The words are the argument. Treat them like evidence labels.
 */

/* ─── Step frame helper ───────────────────────────────────────────────────── */
/** Posterized time: feeds into drawn/physical animations at ~10fps on 30fps */
export const stepped = (frame: number, step = 3): number =>
    Math.floor(frame / step) * step;

/* ─── Declaration ─────────────────────────────────────────────────────────── */
/*
 * Master serif stamp component. Each line is hidden in overflow:hidden
 * and erupts upward using a high-stiffness spring (~5 frames to settle).
 * up to 3 lines, each with a configurable stagger delay.
 */
interface DeclLine {
    text: string;
    color?: string;
    size?: number;
}

export const Declaration: React.FC<{
    lines: DeclLine[];
    /** Frame at which the FIRST line stamps in */
    startDelay?: number;
    /** Frames between each subsequent line stamp */
    lineStagger?: number;
}> = ({ lines, startDelay = 0, lineStagger = 10 }) => {
    const frame = useSceneFrame();
    const { fps } = useVideoConfig();

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {lines.map((line, i) => {
                const triggerFrame = startDelay + i * lineStagger;
                const elapsed = frame - triggerFrame;

                // High-stiffness spring: settles in ~4-5 frames (physical stamp)
                const p = spring({
                    frame: elapsed,
                    fps,
                    config: { stiffness: 580, damping: 38, mass: 0.9 },
                });

                const translateY = (1 - p) * 110; // erupts from 110% up to 0%
                const opacity = Math.min(1, elapsed < 0 ? 0 : 1);

                return (
                    <div
                        key={i}
                        style={{
                            overflow: "hidden",
                            // Line height box — ensures clean clip plane
                            height: (line.size ?? 100) * 1.12,
                        }}
                    >
                        <div
                            style={{
                                transform: `translateY(${translateY}%)`,
                                opacity,
                                fontFamily: ARCHIVE_FONTS.serif,
                                fontWeight: 700,
                                fontSize: line.size ?? 100,
                                lineHeight: 1.08,
                                color: line.color ?? C.CREAM,
                                textTransform: "uppercase",
                                letterSpacing: "0.03em",
                                // mix-blend-mode: overlay gives the "physical on paper" bleeding
                                mixBlendMode: "normal",
                                whiteSpace: "nowrap",
                                // SOP: Strong drop shadow for legibility over video
                                textShadow: "0 10px 30px rgba(0,0,0,0.9), 0 2px 5px rgba(0,0,0,0.5)",
                            }}
                        >
                            {line.text}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

/* ─── DataTicker ──────────────────────────────────────────────────────────── */
/*
 * JetBrains Mono number that counts up from `from` to `to`.
 * Used for percentages, dollar amounts, dates.
 * Stepped frame gives the typewriter/data-feed feel.
 */
export const DataTicker: React.FC<{
    from?: number;
    to: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    label?: string;
    startDelay?: number;
    duration?: number;
    color?: string;
    size?: number;
}> = ({
    from = 0,
    to,
    prefix = "",
    suffix = "",
    decimals = 1,
    label,
    startDelay = 0,
    duration = 60,
    color = C.GOLD,
    size = 72,
}) => {
        const frame = useSceneFrame();
        const sf = stepped(frame);

        const raw = interpolate(sf, [startDelay, startDelay + duration], [from, to], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
        });

        const displayed = decimals === 0 ? Math.round(raw) : raw.toFixed(decimals);

        return (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div
                    style={{
                        fontFamily: ARCHIVE_FONTS.mono,
                        fontWeight: 700,
                        fontSize: size,
                        color,
                        lineHeight: 1,
                        textShadow: `0 10px 20px rgba(0,0,0,0.9), 0 2px 5px rgba(0,0,0,0.6), 0 0 40px ${color}33`,
                        letterSpacing: "-0.02em",
                    }}
                >
                    {prefix}{displayed}{suffix}
                </div>
                {label && (
                    <div
                        style={{
                            fontFamily: ARCHIVE_FONTS.mono,
                            fontWeight: 400,
                            fontSize: 22,
                            color: C.CREAM_DIM,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                        }}
                    >
                        — {label}
                    </div>
                )}
            </div>
        );
    };

/* ─── RedPenStrike ────────────────────────────────────────────────────────── */
/*
 * SVG line drawn with strokeDashoffset (stepped frames).
 * feTurbulence displaces edges → alcohol-marker-on-parchment feel.
 * Color: oxblood red (8B1A1A) — never neon.
 */
export const RedPenStrike: React.FC<{
    width?: number;
    startFrame?: number;
    filterId?: string;
    color?: string;
    thickness?: number;
}> = ({
    width = 600,
    startFrame = 0,
    filterId = "rpf",
    color = C.OXBLOOD,
    thickness = 6,
}) => {
        const frame = useSceneFrame();
        const sf = stepped(frame);

        const pathLen = width * 1.05;
        const progress = interpolate(sf, [startFrame, startFrame + 15], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
        });

        const height = thickness * 6;

        return (
            <svg
                width={width}
                height={height}
                style={{
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    overflow: "visible",
                }}
            >
                <defs>
                    <filter id={filterId} x="-5%" y="-50%" width="110%" height="200%">
                        <feTurbulence
                            type="turbulence"
                            baseFrequency="0.025 0.1"
                            numOctaves="3"
                            seed="4"
                            result="noise"
                        />
                        <feDisplacementMap
                            in="SourceGraphic"
                            in2="noise"
                            scale="3.5"
                            xChannelSelector="R"
                            yChannelSelector="G"
                        />
                    </filter>
                </defs>
                <line
                    x1="2"
                    y1={height / 2}
                    x2={width - 2}
                    y2={height / 2 + 3}
                    stroke={color}
                    strokeWidth={thickness}
                    strokeLinecap="round"
                    strokeDasharray={pathLen}
                    strokeDashoffset={pathLen * (1 - progress)}
                    filter={`url(#${filterId})`}
                    opacity="0.88"
                />
            </svg>
        );
    };

/* ─── GoldHighlight ───────────────────────────────────────────────────────── */
/*
 * SVG underline / highlight bar, Antique Gold, with turbulence edges.
 * Used below key data numbers or dates.
 */
export const GoldHighlight: React.FC<{
    width?: number;
    startFrame?: number;
    filterId?: string;
}> = ({ width = 400, startFrame = 0, filterId = "ghf" }) => {
    const frame = useSceneFrame();
    const sf = stepped(frame);

    const progress = interpolate(sf, [startFrame, startFrame + 18], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
    });

    return (
        <svg
            width={width}
            height={12}
            style={{ display: "block", marginTop: 4, overflow: "visible" }}
        >
            <defs>
                <filter id={filterId} x="-5%" y="-100%" width="110%" height="300%">
                    <feTurbulence
                        type="turbulence"
                        baseFrequency="0.03 0.15"
                        numOctaves="2"
                        seed="7"
                        result="noise"
                    />
                    <feDisplacementMap
                        in="SourceGraphic"
                        in2="noise"
                        scale="2.5"
                        xChannelSelector="R"
                        yChannelSelector="G"
                    />
                </filter>
            </defs>
            <rect
                x="0"
                y="4"
                width={width * progress}
                height="4"
                fill={C.GOLD}
                filter={`url(#${filterId})`}
                opacity="0.75"
                rx="1"
            />
        </svg>
    );
};

/* ─── SourceStamp ─────────────────────────────────────────────────────────── */
/*
 * Bottom-of-scene citation in JetBrains Mono.
 * Mimics a rubber stamp / archival classification mark.
 */
export const SourceStamp: React.FC<{
    classification?: string;
    source?: string;
    startDelay?: number;
}> = ({
    classification = "CLASSIFIED — FISCAL ARCHIVE",
    source,
    startDelay = 30,
}) => {
        const frame = useSceneFrame();
        const opacity = interpolate(frame, [startDelay, startDelay + 20], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
        });

        return (
            <div
                style={{
                    opacity,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                    borderTop: `1px solid ${C.GOLD_DIM}`,
                    paddingTop: 12,
                }}
            >
                <div
                    style={{
                        fontFamily: ARCHIVE_FONTS.mono,
                        fontSize: 16,
                        color: C.GOLD_DIM,
                        letterSpacing: "0.18em",
                        textTransform: "uppercase",
                        textShadow: "0 2px 4px rgba(0,0,0,0.8)",
                    }}
                >
                    {classification}
                </div>
                {source && (
                    <div
                        style={{
                            fontFamily: ARCHIVE_FONTS.mono,
                            fontSize: 18,
                            color: C.CREAM_DIM,
                            letterSpacing: "0.05em",
                            textShadow: "0 2px 4px rgba(0,0,0,0.8)",
                        }}
                    >
                        {source}
                    </div>
                )}
            </div>
        );
    };
