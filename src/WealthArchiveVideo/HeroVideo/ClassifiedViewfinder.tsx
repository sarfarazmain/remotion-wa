import React from "react";
import { AbsoluteFill } from "remotion";
import { C, ARCHIVE_FONTS } from "../fonts";
import { SafeMedia } from "../SafeMedia";
import { OpticalAnchorType } from "../VarianceTypes";

interface Props {
    src?: string;
    label?: string; // "EVIDENCE", "SURVEILLANCE"
    opticalAnchor?: OpticalAnchorType;
    anchorWord?: string;
}

export const ClassifiedViewfinder: React.FC<Props> = ({ src, label = "CLASSIFIED", opticalAnchor, anchorWord }) => {

    const containerHeight = 1200;

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

            {/* LAYER 3: CONTAINER - Thick Dossier Look */}
            <div style={{
                zIndex: 3,
                width: 900,
                height: containerHeight, // 3:4 aspect ratio approx
                position: "relative",
                backgroundColor: C.CREAM,
                padding: 24, // Massive padding for the physical polaroid/dossier frame
                boxShadow: "0 40px 80px rgba(0,0,0,0.9)", // Outer physical shadow
                overflow: "hidden", // Protects inner boundaries
            }}>
                {/* INNER VIDEO WRAPPER */}
                <div style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    backgroundColor: "#000",
                }}>
                    <div style={{ width: "100%", height: "100%", filter: "grayscale(20%) sepia(0.2)" }}>
                        <SafeMedia
                            src={src}
                            objectFit="cover"
                            placeholderOpacity={0.3}
                        />
                    </div>
                    {/* EXTREME INNER SHADOW overlays the video to sit deep inside the paper */}
                    <div style={{
                        position: "absolute", inset: 0,
                        boxShadow: "inset 0 30px 60px rgba(0,0,0,0.95), inset 0 0 20px rgba(0,0,0,0.8)",
                        pointerEvents: "none"
                    }} />
                </div>
            </div>

            {/* LABEL BELOW */}
            <div style={{
                position: "absolute",
                zIndex: 4,
                bottom: 80,
                textAlign: "center"
            }}>
                <h2 style={{
                    fontFamily: ARCHIVE_FONTS.serif,
                    fontSize: 80,
                    color: C.CREAM,
                    letterSpacing: "0.2em",
                    margin: 0,
                    opacity: 0.9,
                    textShadow: "0 4px 10px black"
                }}>
                    {label}
                </h2>
            </div>

            {/* LAYER 4: The Frame Breaker */}
            {opticalAnchor === OpticalAnchorType.FRAME_BREAKER && anchorWord && (
                <div style={{
                    position: "absolute",
                    zIndex: 5,
                    top: "50%",
                    marginTop: (containerHeight / 2),
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
