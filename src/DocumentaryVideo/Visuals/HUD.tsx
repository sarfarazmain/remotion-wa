import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { FONTS } from "../fonts";

/*
 * HUD — Persistent documentary overlay
 * ─────────────────────────────────────
 * ✅ interpolate() + Easing — no bounce, no overshoot
 * ✅ FONTS from @remotion/google-fonts
 * ✅ Senior Editor SOP: structural, deliberate motion
 */

const TICKER_TEXT = "US DEBT: $34.7T  ◆  FED RATE: 5.25%  ◆  10Y YIELD: 4.62%  ◆  CPI: 3.4%  ◆  REAL YIELD: −0.8%  ◆  GOLD: $2,341  ◆  DXY: 104.8  ◆  DEFICIT: $1.7T  ◆  S&P: 5,234  ◆  M2: $21T  ◆  ";

// ── COLORS ──
const CY = "#1de4ff";
const RD = "#ff3a5e";
const GD = "#f5c518";
const WH = "#eef4ff";

// ═══════════════════════════════════════════
// CORNER BRACKETS
// ═══════════════════════════════════════════
export const CornerBrackets: React.FC<{
    color?: string;
}> = ({ color = RD }) => {
    const frame = useCurrentFrame();

    // SOP: snap into place, no bounce
    const progress = interpolate(frame, [5, 15], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.exp),
    });

    const s = 22;
    const m = 12;
    const lw = 2;
    const style: React.CSSProperties = {
        position: "absolute",
        pointerEvents: "none",
        zIndex: 50,
        opacity: progress,
    };

    return (
        <>
            <div style={{
                ...style, top: m, left: m, width: s, height: s,
                borderTop: `${lw}px solid ${color}`,
                borderLeft: `${lw}px solid ${color}`,
                filter: `drop-shadow(0 0 8px ${color})`,
            }} />
            <div style={{
                ...style, top: m, right: m, width: s, height: s,
                borderTop: `${lw}px solid ${color}`,
                borderRight: `${lw}px solid ${color}`,
                filter: `drop-shadow(0 0 8px ${color})`,
            }} />
            <div style={{
                ...style, bottom: m + 22, left: m, width: s, height: s,
                borderBottom: `${lw}px solid ${color}`,
                borderLeft: `${lw}px solid ${color}`,
                filter: `drop-shadow(0 0 8px ${color})`,
            }} />
            <div style={{
                ...style, bottom: m + 22, right: m, width: s, height: s,
                borderBottom: `${lw}px solid ${color}`,
                borderRight: `${lw}px solid ${color}`,
                filter: `drop-shadow(0 0 8px ${color})`,
            }} />
        </>
    );
};

// ═══════════════════════════════════════════
// TOP BAR
// ═══════════════════════════════════════════
export const TopBar: React.FC<{
    sceneLabel: string;
    actLabel: string;
}> = ({ sceneLabel, actLabel }) => {
    return (
        <div
            style={{
                position: "absolute",
                top: 0, left: 0, width: "100%", height: 44,
                background: "linear-gradient(to bottom, rgba(4,7,14,0.95), transparent)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 18px",
                zIndex: 50,
                fontFamily: FONTS.mono,
                fontSize: 11,
            }}
        >
            <span style={{ color: "rgba(238,244,255,0.35)", letterSpacing: 1 }}>
                {sceneLabel}
            </span>
            <span style={{ color: "rgba(238,244,255,0.5)", letterSpacing: 2, textTransform: "uppercase" }}>
                {actLabel}
            </span>
        </div>
    );
};

// ═══════════════════════════════════════════
// EYEBROW
// ═══════════════════════════════════════════
export const Eyebrow: React.FC<{
    text: string;
    color?: string;
    accentColor?: string;
}> = ({ text, color = "rgba(238,244,255,0.55)", accentColor = RD }) => {
    const frame = useCurrentFrame();

    const progress = interpolate(frame, [15, 40], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.exp),
    });

    return (
        <div
            style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
                gap: 12,
                opacity: progress,
            }}
        >
            <div style={{ width: 28 * progress, height: 1.5, background: accentColor, filter: `drop-shadow(0 0 4px ${accentColor})` }} />
            <span
                style={{
                    fontFamily: FONTS.mono,
                    fontSize: 13,
                    color,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    whiteSpace: "nowrap",
                }}
            >
                {text}
            </span>
            <div style={{ width: 28 * progress, height: 1.5, background: accentColor, filter: `drop-shadow(0 0 4px ${accentColor})` }} />
        </div>
    );
};

// ═══════════════════════════════════════════
// LOWER THIRD
// ═══════════════════════════════════════════
export const LowerThird: React.FC<{
    title: string;
    source: string;
}> = ({ title, source }) => {
    const frame = useCurrentFrame();

    const progress = interpolate(frame, [90, 110], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.exp),
    });

    const slideX = (1 - progress) * -30;

    return (
        <div
            style={{
                position: "absolute",
                bottom: 40, left: 16, right: 30,
                opacity: progress,
                transform: `translateX(${slideX}px)`,
                zIndex: 50,
            }}
        >
            <div
                style={{
                    background: "rgba(4,7,14,0.9)",
                    padding: "8px 16px 8px 20px",
                    borderLeft: `3px solid ${RD}`,
                    filter: `drop-shadow(0 0 6px ${RD}44)`,
                    display: "inline-block",
                }}
            >
                <div style={{ fontFamily: FONTS.mono, fontSize: 12, fontWeight: 700, color: WH, letterSpacing: 0.5 }}>
                    {title}
                </div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: "rgba(238,244,255,0.45)", marginTop: 3 }}>
                    {source}
                </div>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════
// TICKER
// ═══════════════════════════════════════════
export const Ticker: React.FC = () => {
    const frame = useCurrentFrame();
    const scrollX = -(frame * 1.5);

    return (
        <div
            style={{
                position: "absolute",
                bottom: 0, left: 0, width: "100%", height: 22,
                background: "rgba(4,7,14,0.95)",
                borderTop: "1px solid rgba(255,255,255,0.08)",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                zIndex: 50,
            }}
        >
            <div style={{ width: 5, height: 10, background: RD, marginLeft: 8, marginRight: 6, filter: `drop-shadow(0 0 4px ${RD})`, flexShrink: 0 }} />
            <span style={{ fontFamily: FONTS.mono, fontSize: 9, fontWeight: 700, color: RD, marginRight: 12, flexShrink: 0 }}>
                LIVE
            </span>
            <div style={{ whiteSpace: "nowrap", fontFamily: FONTS.mono, fontSize: 10, color: "rgba(255,255,255,0.3)", transform: `translateX(${scrollX}px)` }}>
                {TICKER_TEXT}{TICKER_TEXT}{TICKER_TEXT}
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════
// SCANLINES
// ═══════════════════════════════════════════
export const Scanlines: React.FC = () => (
    <div
        style={{
            position: "absolute",
            top: 0, left: 0, width: "100%", height: "100%",
            backgroundImage: "repeating-linear-gradient(to bottom, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 3px)",
            pointerEvents: "none",
            zIndex: 45,
        }}
    />
);

// ═══════════════════════════════════════════
// PROGRESS BAR
// ═══════════════════════════════════════════
export const ProgressBar: React.FC<{ progress: number }> = ({ progress }) => (
    <div
        style={{
            position: "absolute",
            bottom: 22, left: 0,
            width: `${progress * 100}%`,
            height: 2,
            background: `linear-gradient(to right, ${CY}, ${RD})`,
            filter: `drop-shadow(0 0 4px ${RD})`,
            zIndex: 50,
        }}
    />
);

// ═══════════════════════════════════════════
// AUDIO WAVEFORM — frequency bar visualizer
// ═══════════════════════════════════════════
export const AudioWaveform: React.FC<{
    src: string;
    color?: string;
    barCount?: number;
    width?: number;
    height?: number;
}> = ({ src, color = CY, barCount = 40, width = 300, height = 48 }) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const audioData = useAudioData(src);

    if (!audioData) {
        return <div style={{ width, height }} />;
    }

    const visualization = visualizeAudio({
        fps,
        frame,
        audioData,
        numberOfSamples: barCount * 2,
        smoothing: true,
    });

    const bars = visualization.slice(0, barCount);
    const barW = (width / barCount) * 0.55;
    const gap = (width / barCount) * 0.45;

    return (
        <svg width={width} height={height} style={{ display: "block" }}>
            {bars.map((val, i) => {
                const barH = Math.max(3, val * height * 2.5);
                return (
                    <rect
                        key={i}
                        x={i * (barW + gap)}
                        y={(height - barH) / 2}
                        width={barW}
                        height={barH}
                        fill={color}
                        opacity={0.6 + val * 0.4}
                        rx={barW / 2}
                        style={{ filter: `drop-shadow(0 0 3px ${color}66)` }}
                    />
                );
            })}
        </svg>
    );
};

export const PALETTE = { CY, RD, GD, GN: "#00ff87", WH, BG: "#04070e" };
