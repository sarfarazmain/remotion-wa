import React from "react";
import { AbsoluteFill, useCurrentFrame, random } from "remotion";
import { C } from "./fonts";

/*
 * LAYER 1 — THE DESK (Substrate)
 * Dark navy-parchment base. Never flat black — it has warmth and
 * institutional weight. Subtle grain lines simulate woven fabric.
 */
export const DeskLayer: React.FC = () => (
    <AbsoluteFill
        style={{
            background: `
                radial-gradient(ellipse at 18% 22%, #1a2033 0%, #111827 55%, #0d1018 100%)
            `,
        }}
    >
        {/* Woven fabric micro-texture via SVG */}
        <svg
            width="100%"
            height="100%"
            style={{ position: "absolute", inset: 0, opacity: 0.04 }}
        >
            <defs>
                <pattern
                    id="weave"
                    x="0"
                    y="0"
                    width="6"
                    height="6"
                    patternUnits="userSpaceOnUse"
                >
                    <line x1="0" y1="3" x2="6" y2="3" stroke={C.CREAM} strokeWidth="0.8" />
                    <line x1="3" y1="0" x2="3" y2="6" stroke={C.CREAM} strokeWidth="0.8" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#weave)" />
        </svg>
    </AbsoluteFill>
);

/*
 * LAYER 2 — CONTEXTUAL NOISE (Halftone / Blueprint)
 * Slowly panning halftone dots — evokes newspaper archive or lithograph
 * blueprint. Opacity 0.055 so it barely reads but adds organic texture.
 */
export const NoiseLayer: React.FC = () => {
    const frame = useCurrentFrame();
    // Slow pan: 0.18px/f horizontal, subtle vertical drift
    const panX = (frame * 0.18) % 60;
    const panY = (frame * 0.06) % 40;

    return (
        <AbsoluteFill style={{ overflow: "hidden", opacity: 0.055, pointerEvents: "none" }}>
            <svg
                width={1380}
                height={2160}
                style={{
                    position: "absolute",
                    top: -panY,
                    left: -panX,
                }}
            >
                <defs>
                    <pattern
                        id="halftone"
                        x="0"
                        y="0"
                        width="24"
                        height="24"
                        patternUnits="userSpaceOnUse"
                    >
                        <circle cx="12" cy="12" r="2.5" fill={C.CREAM} />
                    </pattern>
                </defs>
                <rect width="1380" height="2160" fill="url(#halftone)" />
            </svg>
        </AbsoluteFill>
    );
};

/*
 * LAYER 6 — THE LENS (Global Degradation)
 * Heavy vignette + feTurbulence film grain. Renders on top of everything.
 * The physical imperfection that makes digital feel analog.
 */
export const LensLayer: React.FC<{ sceneId?: string }> = ({ sceneId = "g" }) => {
    const frame = useCurrentFrame();
    return (
        <AbsoluteFill style={{ pointerEvents: "none" }}>
            {/* Vignette — heavy, editorial */}
            <AbsoluteFill
                style={{
                    background:
                        "radial-gradient(ellipse at 50% 50%, transparent 32%, rgba(8,10,16,0.72) 75%, rgba(4,5,10,0.94) 100%)",
                }}
            />
            {/* Film grain — 5% opacity — OPTIMIZED: Static pattern instead of live filter */}
            <AbsoluteFill
                style={{
                    opacity: 0.05,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.5' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                    backgroundSize: "150px 150px",
                    // Subtle animation of the grain position - using deterministic random
                    transform: `translate(${random(frame) * 10}px, ${random(frame + 100) * 10}px)`,
                }}
            />
            {/* Corner scratches — thin horizontal lines, film reel feel */}
            <svg
                width="100%"
                height="100%"
                style={{ position: "absolute", inset: 0, opacity: 0.12 }}
            >
                <line x1="0" y1="310" x2="1080" y2="312" stroke={C.CREAM} strokeWidth="0.5" />
                <line x1="0" y1="1600" x2="1080" y2="1598" stroke={C.CREAM} strokeWidth="0.4" />
            </svg>
        </AbsoluteFill>
    );
};

/*
 * DOCUMENT BORDER — Thin single-line border defining the "dossier page"
 * Positioned within the YouTube Shorts safe zone.
 */
export const DocumentBorder: React.FC = () => (
    <svg
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        width={1080}
        height={1920}
    >
        {/* Safe zone border: x: 32–860, y: 295–1435 */}
        <rect
            x={32}
            y={295}
            width={828}
            height={1140}
            fill="none"
            stroke={C.GOLD}
            strokeWidth="1"
            opacity="0.22"
        />
        {/* Corner brackets — top-left */}
        <line x1={32} y1={295} x2={32} y2={340} stroke={C.GOLD} strokeWidth="2" opacity="0.5" />
        <line x1={32} y1={295} x2={80} y2={295} stroke={C.GOLD} strokeWidth="2" opacity="0.5" />
        {/* Corner brackets — bottom-right */}
        <line x1={860} y1={1435} x2={860} y2={1390} stroke={C.GOLD} strokeWidth="2" opacity="0.5" />
        <line x1={860} y1={1435} x2={812} y2={1435} stroke={C.GOLD} strokeWidth="2" opacity="0.5" />
    </svg>
);
