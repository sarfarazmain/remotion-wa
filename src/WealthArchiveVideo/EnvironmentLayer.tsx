/*
 * ENVIRONMENT LAYER (Axis 1)
 * ──────────────────────────
 * Renders the deep background state based on the Variance Engine.
 */

import React from "react";
import { AbsoluteFill, Video, staticFile } from "remotion";
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

            {/* VARIANT A: The Immersive Bleed (Video) */}
            {env === EnvironmentState.IMMERSIVE_BLEED && (
                <AbsoluteFill style={{ opacity: 0.2 }}>
                    <Video
                        src={staticFile("assets/processed/scene6_atmosphere.mp4")} // Placeholder: ideally distinct ambiances
                        style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            filter: "grayscale(100%) sepia(80%) contrast(1.2) brightness(0.6) blur(8px)",
                        }}
                        loop
                        muted
                    />
                </AbsoluteFill>
            )}
        </AbsoluteFill>
    );
};
