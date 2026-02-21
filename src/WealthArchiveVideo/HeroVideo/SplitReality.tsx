import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "../fonts";
import { SafeMedia } from "../SafeMedia";

interface Props {
    srcTop?: string;
    srcBottom?: string; // Fallback to srcTop if missing
    label?: string; // Deprecated by Model A, but keeping for interface compatibility
}

export const SplitReality: React.FC<Props> = ({ srcTop, srcBottom }) => {
    const btm = srcBottom || srcTop;

    return (
        <AbsoluteFill style={{ backgroundColor: "#111827" }}>
            {/* BACKGROUND (The Reality) - Midnight Navy Wash */}
            <div style={{
                position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                overflow: "hidden",
            }}>
                <div style={{
                    width: "100%", height: "100%",
                    // Tint first (sepia/hue), darken (brightness/contrast)
                    filter: "sepia(1) hue-rotate(180deg) brightness(0.7) contrast(1.2)",
                    opacity: 0.3, // Heavy mist over reality
                }}>
                    <SafeMedia
                        src={btm}
                        objectFit="cover"
                        style={{ width: "100%", height: "100%", objectPosition: "center" }}
                        placeholderOpacity={0.4}
                    />
                </div>
            </div>

            {/* FOREGROUND (The Illusion) - Classified Evidence Drop */}
            <div style={{
                position: "absolute", top: "50%", left: "50%",
                width: "55%",
                aspectRatio: "3/4", // Dossier photo aspect ratio
                transform: "translate(-50%, -50%) rotate(-3deg)",
                border: `3px solid ${C.GOLD}`,
                boxShadow: "0px 20px 50px rgba(0,0,0,0.9)",
                overflow: "hidden",
                zIndex: 10,
                backgroundColor: "#111827",
            }}>
                <div style={{ width: "100%", height: "100%", filter: "sepia(0.8) contrast(1.1)" }}>
                    <SafeMedia
                        src={srcTop}
                        objectFit="cover"
                        style={{ width: "100%", height: "100%", objectPosition: "center" }}
                        placeholderOpacity={0.2}
                    />
                </div>
            </div>
        </AbsoluteFill>
    );
};
