import React from "react";
import { AbsoluteFill, useCurrentFrame, random } from "remotion";

/**
 * ─── LAYER 6: THE GLOBAL LENS ────────────────────────────────────────────────
 * WARP MASTER PROTOCOL - PART III (The 6-Layer Compositing Stack)
 * 
 * An <AbsoluteFill> spanning the entire screen containing:
 * 1. 5% artificial film grain
 * 2. Heavy vignette
 * 3. Looping 12fps scratch overlay
 */

export const GlobalLens: React.FC = () => {
    const frame = useCurrentFrame();

    // 12fps "posterized" stuttering for scratches (30fps / 12fps = 2.5 frames per update approx, we'll use 3)
    const scratchStep = Math.floor(frame / 3);
    const scratchX = random(`scratchX-${scratchStep}`) * 100;
    const scratchOpacity = random(`scratchO-${scratchStep}`) > 0.8 ? 0.4 : 0;

    return (
        <AbsoluteFill style={{ pointerEvents: "none", zIndex: 9999 }}>
            {/* 1. Heavy Vignette */}
            <div style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(circle at center, transparent 30%, #030612 100%)",
                mixBlendMode: "multiply",
            }} />

            {/* 2. Film Grain (Simulated via SVG filter or generic noise placeholder) 
                A true 5% film grain overlay - we use a repeating noise placeholder strategy 
                If a real asset drops, we use it. For now, we simulate it via a dark overlay + mix-blend */}
            <div style={{
                position: "absolute", inset: 0,
                backgroundColor: "rgba(0,0,0,0.05)",
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                mixBlendMode: "overlay",
                opacity: 0.1, // Subtle 5% physical grain
            }} />

            {/* 3. Looping 12fps Scratch Overlay */}
            <div style={{
                position: "absolute",
                left: `${scratchX}%`,
                top: 0,
                width: 2,
                height: "100%",
                background: "rgba(255,255,255,0.8)",
                opacity: scratchOpacity,
                mixBlendMode: "screen",
            }} />
        </AbsoluteFill>
    );
};
