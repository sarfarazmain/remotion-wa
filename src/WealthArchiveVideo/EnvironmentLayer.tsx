/*
 * ENVIRONMENT LAYER (Axis 1)
 * ──────────────────────────
 * Renders the deep background state based on the Variance Engine.
 *
 * ARCHITECTURE NOTE (2024-02):
 * The IMMERSIVE_BLEED variant previously rendered an <OffthreadVideo> on
 * scene6_atmosphere.mp4. This caused render crashes at frame ~1450 because:
 *   - The video looped (23.5s) over the full composition (52.7s)
 *   - During scene transitions, 3+ concurrent ffmpeg streams competed for memory
 *   - Compositor cache saturated at 729MB → seek times reached 86s → timeout
 *
 * The replacement uses CSS radial gradients that replicate the same warm,
 * blurry ambient glow at zero render cost. The original video was displayed at
 * 20% opacity with grayscale + sepia + blur(8px), making it visually identical
 * to a gradient.
 */

import React from "react";
import { AbsoluteFill } from "remotion";
import { EnvironmentState } from "./VarianceTypes";
import { C } from "./fonts";

export const EnvironmentLayer: React.FC<{
    env: EnvironmentState;
}> = ({ env }) => {
    return (
        <AbsoluteFill style={{ backgroundColor: C.NAVY }}>
            {/* BASE: The Midnight Navy Void is always present */}

            {/* 1. Universal Grid (Always On) */}
            <AbsoluteFill>
                <svg width="100%" height="100%">
                    <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                        <path d="M 60 0 L 0 0 0 60" fill="none" stroke={C.GOLD} strokeWidth="0.5" opacity="0.15" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#grid)" />

                    {/* Architectural crosshairs */}
                    <line x1="50%" y1="0" x2="50%" y2="100%" stroke={C.GOLD} strokeWidth="1" opacity="0.1" strokeDasharray="4 4" />
                    <line x1="0" y1="50%" x2="100%" y2="50%" stroke={C.GOLD} strokeWidth="1" opacity="0.1" strokeDasharray="4 4" />
                </svg>
            </AbsoluteFill>

            {/* VARIANT A: The Immersive Bleed (CSS Gradient — replaces video) */}
            {env === EnvironmentState.IMMERSIVE_BLEED && (
                <AbsoluteFill style={{ opacity: 0.2 }}>
                    <div style={{
                        width: "100%",
                        height: "100%",
                        background: `
                            radial-gradient(ellipse at 25% 25%, rgba(197, 160, 89, 0.15) 0%, transparent 50%),
                            radial-gradient(ellipse at 75% 75%, rgba(197, 160, 89, 0.10) 0%, transparent 45%),
                            radial-gradient(ellipse at 50% 50%, rgba(139, 69, 19, 0.08) 0%, transparent 70%)
                        `,
                        filter: "blur(8px)",
                    }} />
                </AbsoluteFill>
            )}
        </AbsoluteFill>
    );
};
