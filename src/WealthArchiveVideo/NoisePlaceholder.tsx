import React, { useMemo } from "react";
import { random, AbsoluteFill } from "remotion";

export const NoisePlaceholder: React.FC<{
    opacity?: number;
    baseColor?: string;
}> = ({ opacity = 0.15, baseColor = "#111827" }) => {
    // Generate static noise pattern
    // We use a small SVG pattern to simulate grain

    return (
        <AbsoluteFill style={{ backgroundColor: baseColor }}>
            <svg width="100%" height="100%">
                <filter id="noiseFilter">
                    <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.85"
                        numOctaves="3"
                        stitchTiles="stitch"
                    />
                    <feColorMatrix type="saturate" values="0" />
                </filter>

                <rect width="100%" height="100%" filter="url(#noiseFilter)" opacity={opacity} />
            </svg>
            <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "monospace", color: "rgba(255,255,255,0.2)",
                fontSize: 24, letterSpacing: 4
            }}>
                NO SIGNAL
            </div>
        </AbsoluteFill>
    );
};
