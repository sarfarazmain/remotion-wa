import React from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { FONTS } from "../fonts";

/*
 * KINETIC TYPOGRAPHY — Senior Editor SOP
 * ───────────────────────────────────────
 * ✅ interpolate() + Easing.out(Easing.exp) — no bounce, no overshoot
 * ✅ clipPath structural reveal — text feels "engraved", not animated
 * ✅ Numeric Slam for BigNumber (120% → 100% settle)
 * ✅ No scale pops — authority, not decoration
 */

interface KTWord {
    text: string;
    emphasis?: boolean;
}

export const KineticText: React.FC<{
    words: KTWord[];
    startDelay?: number;
    charGap?: number;
    fontSize?: number;
    accentColor?: string;
    baseColor?: string;
}> = ({
    words,
    startDelay = 20,
    charGap = 2,
    fontSize = 64,
    accentColor = "#1de4ff",
    baseColor = "rgba(238,244,255,0.50)",
}) => {
        const frame = useCurrentFrame();

        // Pre-compute a global character index for the stagger animation.
        // Each word item gets its own group; a cross-item space is counted but
        // rendered via columnGap (not a character span) — so we only advance
        // globalIndex for actual text characters within each word's text string.
        let globalIndex = 0;
        const processedWords = words.map((word) => {
            // Split the text into sub-tokens on spaces so internal multi-word
            // strings (e.g. "NOT A CRASH.") also wrap at space boundaries.
            const tokens = word.text.split(" ");
            const tokenGroups = tokens.map((token) => {
                const charGroups = [...token].map((ch) => {
                    const idx = globalIndex++;
                    return { ch, idx };
                });
                return charGroups;
            });
            return { word, tokenGroups };
        });

        // SOP: Structural Reveal — Horizontal Wipe (unchanged)
        const wipeProgress = interpolate(frame, [startDelay, startDelay + 40], [0, 100], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.cubic),
        });

        const wordGap = Math.round(fontSize * 0.30); // inter-word gap (px)
        const lineGap = Math.round(fontSize * 0.18); // row gap between wrapped lines

        const renderChar = (ch: string, idx: number, emphasis: boolean) => {
            const charStart = startDelay + idx * (charGap * 1.5);
            const p = interpolate(frame, [charStart, charStart + 20], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: Easing.out(Easing.exp),
            });
            const y = (1 - p) * 14;
            const color = emphasis ? accentColor : baseColor;

            return (
                <span
                    key={idx}
                    style={{
                        display: "inline-block",
                        transform: `translateY(${y}px)`,
                        fontFamily: FONTS.title,
                        fontSize,
                        fontWeight: 400,
                        color,
                        textShadow: emphasis
                            ? `0 0 20px ${color}, 0 0 40px ${color}44`
                            : "none",
                    }}
                >
                    {ch}
                </span>
            );
        };

        return (
            <div
                style={{
                    display: "flex",
                    flexWrap: "wrap",
                    // columnGap = inter-word space (between flex items = word groups)
                    // rowGap    = vertical breathing between wrapped lines
                    columnGap: wordGap,
                    rowGap: lineGap,
                    justifyContent: "flex-start",
                    alignItems: "baseline",
                    maxWidth: 960,
                    clipPath: `inset(0 ${100 - wipeProgress}% 0 0)`,
                }}
            >
                {processedWords.flatMap(({ word, tokenGroups }, wi) =>
                    tokenGroups.map((charGroup, ti) => (
                        // Each token (sub-word) is an unbreakable inline-flex group.
                        // The outer flex container wraps at these group boundaries,
                        // never mid-character.
                        <span
                            key={`${wi}-${ti}`}
                            style={{ display: "inline-flex", alignItems: "baseline" }}
                        >
                            {charGroup.map(({ ch, idx }) =>
                                renderChar(ch, idx, !!word.emphasis)
                            )}
                        </span>
                    ))
                )}
            </div>
        );
    };



/*
 * STRIKETHROUGH — Animated red line sweeping over text
 * Used to cross out "NOT PRINTING" etc.
 */
export const Strikethrough: React.FC<{
    width: number;
    startFrame?: number;
    color?: string;
}> = ({ width, startFrame = 30, color = "#ff3a5e" }) => {
    const frame = useCurrentFrame();
    const progress = interpolate(frame, [startFrame, startFrame + 18], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.exp),
    });
    return (
        <div
            style={{
                position: "absolute",
                left: 0,
                top: "50%",
                width: width * progress,
                height: 5,
                background: color,
                filter: `drop-shadow(0 0 10px ${color}) drop-shadow(0 0 20px ${color}66)`,
                transform: "translateY(-50%)",
                pointerEvents: "none",
            }}
        />
    );
};

/*
 * BIG NUMBER — Numeric Slam (SOP Option A)
 * Fades in at 120% scale → settles to 100%. No bounce.
 */
export const BigNumber: React.FC<{
    value: string;
    label: string;
    sublabel?: string;
    color?: string;
}> = ({ value, label, sublabel, color = "#1de4ff" }) => {
    const frame = useCurrentFrame();

    const p = interpolate(frame, [15, 35], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.exp),
    });

    // 120% → 100% settle
    const scale = 1.2 - p * 0.2;

    const labelOp = interpolate(frame, [40, 60], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
    });

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 16, opacity: p }}>
            <div
                style={{
                    position: "relative",
                    transform: `scale(${scale})`,
                    transformOrigin: "left center",
                    fontFamily: FONTS.title,
                    fontSize: 130,
                    fontWeight: 400,
                    color,
                    textShadow: `0 0 40px ${color}88, 0 0 80px ${color}33`,
                    letterSpacing: -2,
                    lineHeight: 1,
                }}
            >
                {value}
            </div>
            <div
                style={{
                    opacity: labelOp,
                    fontFamily: FONTS.mono,
                    fontSize: 15,
                    fontWeight: 400,
                    color: "rgba(238,244,255,0.5)",
                    letterSpacing: 4,
                    textTransform: "uppercase",
                }}
            >
                {label}
            </div>
            {sublabel && (
                <div
                    style={{
                        opacity: labelOp * 0.6,
                        fontFamily: FONTS.mono,
                        fontSize: 22,
                        color: "rgba(238,244,255,0.3)",
                        letterSpacing: 2,
                    }}
                >
                    {sublabel}
                </div>
            )}
        </div>
    );
};

/*
 * STAT BOX — Pure opacity + X slide, no scale pop
 */
export const StatBox: React.FC<{
    label: string;
    value: string;
    color: string;
    delay?: number;
}> = ({ label, value, color, delay = 0 }) => {
    const frame = useCurrentFrame();

    const progress = interpolate(frame, [delay, delay + 22], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.exp),
    });

    const slideX = (1 - progress) * -28;

    return (
        <div
            style={{
                opacity: progress,
                transform: `translateX(${slideX}px)`,
                padding: "14px 24px",
                background: `${color}0d`,
                border: `1px solid ${color}44`,
                borderRadius: 6,
                textAlign: "center",
                boxShadow: `0 0 18px ${color}1a, inset 0 0 20px ${color}08`,
            }}
        >
            <div
                style={{
                    fontFamily: FONTS.mono,
                    fontSize: 22,
                    color: `${color}99`,
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                    marginBottom: 8,
                }}
            >
                {label}
            </div>
            <div
                style={{
                    fontFamily: FONTS.title,
                    fontSize: 40,
                    color,
                    textShadow: `0 0 16px ${color}77`,
                }}
            >
                {value}
            </div>
        </div>
    );
};

/*
 * STAT ROW — Horizontal asset row for the real-assets scene
 * icon · name · value with slide-in stagger
 */
export const StatRow: React.FC<{
    icon: string;
    name: string;
    value: string;
    color: string;
    delay?: number;
    positive?: boolean;
}> = ({ icon, name, value, color, delay = 0, positive = true }) => {
    const frame = useCurrentFrame();

    const p = interpolate(frame, [delay, delay + 24], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.exp),
    });

    return (
        <div
            style={{
                opacity: p,
                transform: `translateX(${(1 - p) * -20}px)`,
                display: "flex",
                alignItems: "center",
                gap: 20,
                padding: "14px 20px",
                background: `${color}08`,
                border: `1px solid ${color}28`,
                borderRadius: 6,
                width: 620,
            }}
        >
            <span style={{ fontSize: 80, lineHeight: 1 }}>{icon}</span>
            <span
                style={{
                    fontFamily: FONTS.mono,
                    fontSize: 30,
                    color: "rgba(238,244,255,0.7)",
                    letterSpacing: 1,
                    flex: 1,
                    textTransform: "uppercase",
                }}
            >
                {name}
            </span>
            <span
                style={{
                    fontFamily: FONTS.title,
                    fontSize: 56,
                    color,
                    textShadow: `0 0 14px ${color}88`,
                }}
            >
                {positive ? "+" : ""}{value}
            </span>
        </div>
    );
};

/*
 * TWO-COLUMN CHOICE — Side-by-side comparison card
 */
export const TwoColChoice: React.FC<{
    leftLabel: string;
    leftSub: string;
    leftIcon: string;
    leftVerdictIcon: string;
    leftVerdictColor: string;
    rightLabel: string;
    rightSub: string;
    rightIcon: string;
    rightVerdictIcon: string;
    rightVerdictColor: string;
}> = ({ leftLabel, leftSub, leftIcon, leftVerdictIcon, leftVerdictColor, rightLabel, rightSub, rightIcon, rightVerdictIcon, rightVerdictColor }) => {
    const frame = useCurrentFrame();

    const leftP = interpolate(frame, [20, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.exp) });
    const rightP = interpolate(frame, [30, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.exp) });
    const verdictP = interpolate(frame, [55, 75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.exp) });

    const colStyle = (p: number, borderColor: string): React.CSSProperties => ({
        opacity: p,
        transform: `translateY(${(1 - p) * 20}px)`,
        flex: 1,
        padding: "28px 24px",
        background: `${borderColor}07`,
        border: `1px solid ${borderColor}28`,
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        textAlign: "center",
    });

    return (
        <div style={{ display: "flex", gap: 24, width: 700 }}>
            <div style={colStyle(leftP, leftVerdictColor)}>
                <span style={{ fontSize: 70 }}>{leftIcon}</span>
                <div style={{ fontFamily: FONTS.mono, fontSize: 26, color: "rgba(238,244,255,0.55)", letterSpacing: 1.5, textTransform: "uppercase" }}>{leftLabel}</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 22, color: "rgba(238,244,255,0.35)" }}>{leftSub}</div>
                <div style={{ fontSize: 80, opacity: verdictP, color: leftVerdictColor, textShadow: `0 0 20px ${leftVerdictColor}` }}>{leftVerdictIcon}</div>
            </div>
            <div style={colStyle(rightP, rightVerdictColor)}>
                <span style={{ fontSize: 70 }}>{rightIcon}</span>
                <div style={{ fontFamily: FONTS.mono, fontSize: 26, color: "rgba(238,244,255,0.55)", letterSpacing: 1.5, textTransform: "uppercase" }}>{rightLabel}</div>
                <div style={{ fontFamily: FONTS.mono, fontSize: 22, color: "rgba(238,244,255,0.35)" }}>{rightSub}</div>
                <div style={{ fontSize: 80, opacity: verdictP, color: rightVerdictColor, textShadow: `0 0 20px ${rightVerdictColor}` }}>{rightVerdictIcon}</div>
            </div>
        </div>
    );
};
