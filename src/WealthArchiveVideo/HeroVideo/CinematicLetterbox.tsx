import React from "react";
import { AbsoluteFill } from "remotion";
import { C, ARCHIVE_FONTS } from "../fonts";
import { SafeMedia } from "../SafeMedia";
import { OpticalAnchorType } from "../VarianceTypes";

interface Props {
    src?: string;
    label?: string; // Optional label if needed, but pure letterbox usually stands alone
    opticalAnchor?: OpticalAnchorType;
    anchorWord?: string;
}

export const CinematicLetterbox: React.FC<Props> = ({ src, opticalAnchor, anchorWord }) => {
    // 16:9 Aspect Ratio on a 1080 width screen means height is 607.5px.
    // 2.35:1 means height is ~460px. Let's use a classic 16:9 or slightly wider.
    const height = 1080 * (9 / 16); // 607.5

    return (
        <AbsoluteFill style={{ backgroundColor: "transparent", display: "flex", justifyContent: "center", alignItems: "center" }}>

            {/* LAYER 2: The Monolithic Watermark (Behind Video) */}
            {opticalAnchor === OpticalAnchorType.WATERMARK && anchorWord && (
                <div style={{
                    position: "absolute",
                    zIndex: 2,
                    fontFamily: ARCHIVE_FONTS.serif,
                    fontSize: 220,
                    color: C.GOLD,
                    opacity: 0.2,
                    whiteSpace: "nowrap",
                    transform: "scale(1.5)", // Extreme bleed
                    pointerEvents: "none"
                }}>
                    {anchorWord.toUpperCase()}
                </div>
            )}

            {/* LAYER 3: The Cinematic Projection (Video Container) */}
            <div style={{
                position: "relative",
                width: "100%",
                height: height,
                borderTop: `2px solid ${C.GOLD}`,
                borderBottom: `2px solid ${C.GOLD}`,
                backgroundColor: "#000",
                overflow: "hidden",
                zIndex: 3,
                boxShadow: "0 20px 50px rgba(0,0,0,0.8)"
            }}>
                <div style={{ width: "100%", height: "100%", filter: "sepia(0.5) contrast(1.1) brightness(0.9)" }}>
                    <SafeMedia
                        src={src}
                        objectFit="cover"
                        placeholderOpacity={0.2}
                    />
                </div>
            </div>

            {/* LAYER 4: The Frame Breaker (In Front of Video, Overlapping Bottom Edge) */}
            {opticalAnchor === OpticalAnchorType.FRAME_BREAKER && anchorWord && (
                <div style={{
                    position: "absolute",
                    zIndex: 4,
                    // Anchor to exact bottom of the Letterbox container
                    top: "50%",
                    marginTop: (height / 2),
                    transform: "translateY(-50%)", // Pull it exactly 50% over the edge
                    fontFamily: ARCHIVE_FONTS.serif,
                    fontSize: 100,
                    color: C.CREAM,
                    letterSpacing: "0.1em",
                    textShadow: "0px 15px 30px rgba(0,0,0,0.9)",
                    pointerEvents: "none",
                    whiteSpace: "nowrap"
                }}>
                    {anchorWord.toUpperCase()}
                </div>
            )}

        </AbsoluteFill>
    );
};
