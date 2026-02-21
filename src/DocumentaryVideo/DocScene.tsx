import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";
import { CinematicBackground } from "./Visuals/CinematicBackground";
import { CornerBrackets, TopBar, Eyebrow, LowerThird, Ticker, Scanlines, ProgressBar, PALETTE } from "./Visuals/HUD";

/*
 * DocScene — Full documentary scene wrapper.
 * Every scene gets: background + corner brackets + top bar +
 * eyebrow + content + lower third + ticker + scanlines.
 *
 * Senior Editor SOP:
 * ✅ interpolate + Easing — no bounce, no overshoot
 * ✅ Controlled entrance/exit — authority, not decoration
 */

interface DocSceneProps {
    src?: string;
    children?: React.ReactNode;
    bgType?: "video" | "image" | "abstract" | "clean";
    blur?: number;
    nebulaColor?: string;
    // HUD props
    sceneLabel?: string;  // e.g. "01/12"
    actLabel?: string;    // e.g. "ACT I — THE OLD REGIME"
    eyebrow?: string;     // e.g. "MONETARY SHIFT"
    cornerColor?: string;
    ltTitle?: string;     // Lower third title
    ltSource?: string;    // Lower third source
    // Progress
    totalFrames?: number;
    fadeOutFrames?: number;  // Default = fps (30f). Use 90+ for a slow final-scene fade.
}

export const DocScene: React.FC<DocSceneProps> = ({
    src, children,
    bgType = "abstract", blur = 0, nebulaColor,
    sceneLabel = "", actLabel = "",
    eyebrow,
    cornerColor = PALETTE.RD,
    ltTitle, ltSource,
    totalFrames = 180,
    fadeOutFrames,
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();
    const fadeFrames = fadeOutFrames ?? fps;

    // SOP: controlled acceleration, no overshoot
    const entrance = interpolate(frame, [8, 28], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.exp),
    });

    const exitStart = totalFrames - fadeFrames;
    const exit = interpolate(frame, [exitStart, exitStart + fadeFrames], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.quad),  // slow linear-ish fade for last scene
    });

    const visualOpacity = entrance * (1 - exit);

    // SOP: Parallax Drift
    // Content drifts slowly upward (-15px) over the entire scene
    const drift = interpolate(frame, [0, totalFrames], [0, -15]);
    const visualY = (1 - entrance) * 14 + drift;

    const progress = Math.min(frame / totalFrames, 1);

    return (
        <AbsoluteFill style={{ backgroundColor: "#04070e", overflow: "hidden" }}>

            <CinematicBackground src={src} type={bgType} blur={blur} nebulaColor={nebulaColor} />

            {/* SCANLINES */}
            <Scanlines />

            {/* CORNER BRACKETS */}
            <CornerBrackets color={cornerColor} />

            {/* TOP BAR */}
            {sceneLabel && <TopBar sceneLabel={sceneLabel} actLabel={actLabel} />}

            {/* EYEBROW */}
            {eyebrow && (
                <div style={{ position: "absolute", top: 68, width: "100%", display: "flex", justifyContent: "center", zIndex: 20 }}>
                    <Eyebrow text={eyebrow} />
                </div>
            )}

            {/* MAIN CONTENT — absolute-positioned safe zone
                Top: clears topbar (32px) + eyebrow (36px) + gap = 140px
                Bottom: clears lower third (64px) + ticker (24px) + gap = 120px
                This gives children a defined height (~1660px) to fill with space-between. */}
            <div
                style={{
                    position: "absolute",
                    top: eyebrow ? 140 : 80,
                    bottom: ltTitle ? 120 : 60,
                    left: 60,
                    right: 60,
                    display: "flex",
                    flexDirection: "column",
                    opacity: visualOpacity,
                    transform: `translateY(${visualY}px)`,
                    overflow: "hidden",
                }}
            >
                {children}
            </div>

            {/* LOWER THIRD */}
            {ltTitle && ltSource && <LowerThird title={ltTitle} source={ltSource} />}

            {/* PROGRESS + TICKER */}
            <ProgressBar progress={progress} />
            <Ticker />
        </AbsoluteFill>
    );
};
