import React from "react";
import { AbsoluteFill, Video, Img, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

/*
 * CINEMATIC BACKGROUND — Multi-layer rendering
 * Matching the Canvas reference's 6-layer stack:
 * 1. Background content (video or abstract grid)
 * 2. Nebula gradient (act-colored radial)
 * 3. Floating particles
 * 4. Grid overlay
 * 5. Vignette
 * 6. Film grain
 */

interface CinematicBackgroundProps {
    src?: string;
    type: "video" | "image" | "abstract" | "clean";
    blur?: number;
    nebulaColor?: string; // Act-colored nebula tint
}

// Deterministic particle positions
const PARTICLES = Array.from({ length: 35 }, (_, i) => ({
    x: ((i * 137.5) % 100),
    y: ((i * 97.3 + 33) % 100),
    size: 1 + (i % 3) * 0.5,
    speed: 0.08 + (i % 5) * 0.04,
    hueShift: i % 2 === 0 ? 195 : 350,
    phase: i * 0.7,
}));

export const CinematicBackground: React.FC<CinematicBackgroundProps> = ({
    src, type, blur = 0, nebulaColor = "rgba(8,28,90,0.25)"
}) => {
    const frame = useCurrentFrame();
    const { fps } = useVideoConfig();

    const bgOpacity = spring({
        fps,
        frame,
        config: { damping: 25, stiffness: 50, mass: 0.8 },
        durationInFrames: 30,
    });

    const panY = interpolate(frame, [0, 400], [0, -12]);

    // SOP: Slow 5% zoom push to create "inevitability"
    const scalePush = interpolate(frame, [0, 400], [1, 1.05]);

    return (
        <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#04070e" }}>

            {/* LAYER 1: BACKGROUND CONTENT */}
            <AbsoluteFill style={{ opacity: bgOpacity }}>
                {type === "video" && src ? (
                    <Video
                        src={src}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            // SOP: Parallax pan + Slow zoom push
                            transform: `scale(${1.12 * scalePush}) translateY(${panY}px)`,
                            filter: `saturate(0.15) contrast(1.1) brightness(0.3) blur(${blur}px)`,
                        }}
                        muted
                    />
                ) : type === "image" && src ? (
                    <Img
                        src={src}
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            // SOP: Parallax pan + Slow zoom push - Same as video for consistency
                            transform: `scale(${1.12 * scalePush}) translateY(${panY}px)`,
                            filter: `saturate(0.15) contrast(1.1) brightness(0.3) blur(${blur}px)`,
                        }}
                    />
                ) : type === "abstract" ? (
                    <AbsoluteFill>
                        {/* Grid lines */}
                        <div
                            style={{
                                position: "absolute",
                                width: "250%",
                                height: "250%",
                                backgroundImage: `
									linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
									linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
								`,
                                backgroundSize: "45px 45px",
                                transform: `
									perspective(700px)
									rotateX(60deg)
									translateY(${frame * 0.25}px)
									translateZ(-350px)
								`,
                                opacity: 0.6,
                            }}
                        />
                    </AbsoluteFill>
                ) : (
                    <AbsoluteFill style={{ background: "#04070e" }} />
                )}
            </AbsoluteFill>

            {/* LAYER 2: NEBULA GRADIENT */}
            <AbsoluteFill
                style={{
                    background: `radial-gradient(ellipse at 50% 40%, ${nebulaColor}, transparent 75%)`,
                    pointerEvents: "none",
                }}
            />

            {/* LAYER 3: FLOATING PARTICLES */}
            <AbsoluteFill style={{ pointerEvents: "none" }}>
                {PARTICLES.map((p, i) => {
                    const x = ((p.x + frame * p.speed) % 110) - 5;
                    const y = ((p.y + frame * p.speed * 0.6 + Math.sin(frame * 0.02 + p.phase) * 8) % 110) - 5;
                    const alpha = 0.06 + Math.sin(frame * 0.015 + p.phase) * 0.04;

                    return (
                        <div
                            key={i}
                            style={{
                                position: "absolute",
                                left: `${x}%`,
                                top: `${y}%`,
                                width: p.size * 2,
                                height: p.size * 2,
                                borderRadius: "50%",
                                background: p.hueShift === 195 ? `rgba(29,228,255,${alpha})` : `rgba(255,58,94,${alpha})`,
                                filter: p.size > 1.2 ? "blur(1px)" : undefined,
                            }}
                        />
                    );
                })}
            </AbsoluteFill>

            {/* LAYER 4: VIGNETTE */}
            <AbsoluteFill
                style={{
                    background: "radial-gradient(ellipse at center, transparent 20%, rgba(4,7,14,0.88) 100%)",
                    pointerEvents: "none",
                }}
            />

            {/* LAYER 5: FILM GRAIN */}
            <AbsoluteFill
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.12'/%3E%3C/svg%3E")`,
                    opacity: 0.5,
                    pointerEvents: "none",
                    mixBlendMode: "overlay",
                }}
            />
        </AbsoluteFill>
    );
};
