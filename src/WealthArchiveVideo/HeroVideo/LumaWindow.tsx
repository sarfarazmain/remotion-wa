import React from "react";
import { AbsoluteFill } from "remotion";
import { SafeMedia } from "../SafeMedia";
import { C, ARCHIVE_FONTS } from "../fonts";
import { OpticalAnchorType } from "../VarianceTypes";

interface Props {
    src?: string;
    opticalAnchor?: OpticalAnchorType;
    anchorWord?: string;
}

export const LumaWindow: React.FC<Props> = ({ src, opticalAnchor, anchorWord }) => {

    const lumaHeight = 800;

    return (
        <AbsoluteFill style={{ backgroundColor: "transparent", display: "flex", justifyContent: "center", alignItems: "center" }}>

            {/* LAYER 2: The Monolithic Watermark */}
            {opticalAnchor === OpticalAnchorType.WATERMARK && anchorWord && (
                <div style={{
                    position: "absolute",
                    zIndex: 2,
                    fontFamily: ARCHIVE_FONTS.serif,
                    fontSize: 220,
                    color: C.GOLD,
                    opacity: 0.2,
                    whiteSpace: "nowrap",
                    transform: "scale(1.5)",
                    pointerEvents: "none"
                }}>
                    {anchorWord.toUpperCase()}
                </div>
            )}

            {/* LAYER 3: LUMA Masking */}
            <div style={{
                zIndex: 3,
                width: "100%",
                height: lumaHeight,
                // The Organic Blend: video emerges directly out of the darkness
                WebkitMaskImage: "radial-gradient(circle at center, black 30%, transparent 70%)",
                maskImage: "radial-gradient(circle at center, black 30%, transparent 70%)",
            }}>
                <div style={{ width: "100%", height: "100%", filter: "sepia(0.8) hue-rotate(180deg) brightness(1.2) contrast(1.1)" }}>
                    <SafeMedia
                        src={src}
                        objectFit="cover"
                        placeholderOpacity={0.1}
                    />
                </div>
            </div>

            {/* LAYER 4: The Frame Breaker */}
            {opticalAnchor === OpticalAnchorType.FRAME_BREAKER && anchorWord && (
                <div style={{
                    position: "absolute",
                    zIndex: 5,
                    top: "50%",
                    marginTop: (lumaHeight / 2) - 100, // Slightly tighter overlap due to radial bleed
                    transform: "translateY(-50%)",
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
