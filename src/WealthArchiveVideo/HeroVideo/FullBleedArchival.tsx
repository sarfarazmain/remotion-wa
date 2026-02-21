import React from "react";
import { AbsoluteFill, useCurrentFrame, interpolate, random } from "remotion";
import { C, ARCHIVE_FONTS } from "../fonts";
import { SafeMedia } from "../SafeMedia";

interface Props {
    src?: string;
    text?: string;
}

export const FullBleedArchival: React.FC<Props> = ({ src, text }) => {
    const frame = useCurrentFrame();

    // 1. FILM SCRATCH / GRAIN
    // Simulating 12fps scratch overlay
    const scratchX = random(Math.floor(frame / 3)) * 1000;
    const scratchOpacity = random(Math.floor(frame / 3) + 10);

    return (
        <AbsoluteFill style={{ backgroundColor: "#111827" }}>
            {/* VIDEO LAYER - Treated */}
            <div style={{
                width: "100%", height: "100%",
                filter: "grayscale(100%) contrast(140%) sepia(20%) brightness(0.9)",
            }}>
                <SafeMedia
                    src={src}
                    objectFit="cover"
                    placeholderOpacity={0.3}
                />
            </div>

            {/* VIGNETTE - Aggressive */}
            <div style={{
                position: "absolute", inset: 0,
                background: "radial-gradient(circle at center, transparent 30%, #030612 100%)",
                mixBlendMode: "multiply",
            }} />

            {/* FILM SCRATCH OVERLAY */}
            <div style={{
                position: "absolute", left: scratchX, top: 0, width: 2, height: "100%",
                background: "rgba(255,255,255,0.4)",
                opacity: scratchOpacity > 0.8 ? 0.6 : 0,
                mixBlendMode: "overlay",
            }} />

            {/* CENTER TEXT - MACRO DECLARATION (PATH A) */}
            {text && (() => {
                const words = text.split(" ");
                const line1 = words[0];
                const line2 = words.slice(1).join(" ");

                return (
                    <div style={{
                        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                        display: "flex", flexDirection: "column", alignItems: "center",
                        width: "100%", textAlign: "center",
                    }}>
                        <span style={{
                            fontFamily: ARCHIVE_FONTS.mono,
                            fontSize: 24,
                            color: C.CREAM,
                            letterSpacing: "0.4em",
                            textTransform: "uppercase",
                            textShadow: "0px 10px 30px rgba(0,0,0,0.9)", // The Burn Rule
                        }}>
                            {line1}
                        </span>
                        {line2 && (
                            <span style={{
                                fontFamily: ARCHIVE_FONTS.serif,
                                fontSize: 120,
                                color: C.GOLD,
                                fontWeight: 700,
                                lineHeight: 1.1,
                                textTransform: "uppercase",
                                textShadow: "0px 10px 30px rgba(0,0,0,0.9)", // The Burn Rule
                                whiteSpace: "nowrap",
                            }}>
                                {line2}
                            </span>
                        )}
                    </div>
                );
            })()}
        </AbsoluteFill>
    );
};
