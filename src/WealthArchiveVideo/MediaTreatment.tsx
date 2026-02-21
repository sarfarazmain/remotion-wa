import React from "react";
import { AbsoluteFill, Img, Video, interpolate, spring, useVideoConfig, random, staticFile } from "remotion";
import { useSceneFrame } from "./SceneContext";
import { stepped } from "./Typography";
import { C } from "./fonts";

/*
 * SOP PART 6: The Stock Media Treatment Protocol (Enhanced)
 * ─────────────────────────────────────────────────────────
 * Rule 1: Stock Video = "The Atmosphere" (Background, blurred, tinted)
 * Rule 2: Stock Image = "The Evidence" (Foreground, sharp, stutter 12fps)
 *
 * This component now handles THREE modes:
 *  1. Only Video (Atmosphere)
 *  2. Only Image (Evidence)
 *  3. Both (Composite: Image floating over blurred Video)
 */

interface MediaTreatmentProps {
    src?: string;       // Legacy prop (treated as primary if others missing)
    type?: "image" | "video"; // Legacy prop

    videoSrc?: string;  // The Atmosphere
    imageSrc?: string;  // The Evidence

    style?: "A" | "B" | "C" | "D";
    seed?: number;
}

export const MediaTreatment: React.FC<MediaTreatmentProps> = ({
    src,
    type = "image",
    videoSrc,
    imageSrc,
    style = "A",
    seed = 0
}) => {
    const frame = useSceneFrame();
    const { fps } = useVideoConfig();

    // Resolve sources
    // If legacy 'src' is provided, map it to video/image based on 'type'
    const finalVideo = videoSrc || (type === "video" ? src : undefined);
    const finalImage = imageSrc || (type === "image" ? src : undefined);

    // Resolve local video paths using staticFile
    const resolvedVideo = (finalVideo && finalVideo.startsWith("/"))
        ? staticFile(finalVideo.slice(1))
        : finalVideo;

    // ─── SOP FILTERS ──────────────────────────────────────────────────────────
    // "Grayscale 100%, Sepia 30%, Contrast 120%, Brightness 40%"
    // Atmosphere gets blur. Evidence gets drop shadow.
    const COMMON_FILTER = "grayscale(100%) sepia(20%) contrast(110%) brightness(50%)";
    const ATMOSPHERE_FILTER = `${COMMON_FILTER} blur(6px)`;
    const EVIDENCE_FILTER = "grayscale(100%) sepia(10%) contrast(125%) brightness(90%) drop-shadow(0 20px 30px rgba(0,0,0,0.8))";

    // ─── ANIMATORS ────────────────────────────────────────────────────────────

    // 1. Atmosphere Animation (Smooth 30fps)
    // Slow pan/scale to keep it alive
    const atmScale = interpolate(frame, [0, 300], [1.1, 1.25]);
    const atmPan = interpolate(frame, [0, 300], [0, -30]);

    // 2. Evidence Animation (Stutter 12fps)
    // "The Framerate Friction Law"
    // Use stepped frame for transform to create stop-motion feel
    const sf = stepped(frame, 3); // Update every 3 frames = 10fps (at 30fps base)

    // Entry spring (using smooth frame for fluid drop-in, but maybe stepped transform?)
    // SOP says "stutters into the frame". 
    // Let's use smooth physics for the BIG move, but stepped noise/drift.

    const drop = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
    const smoothY = interpolate(drop, [0, 1], [-500, 0]);
    const smoothScale = interpolate(frame, [0, 300], [1, 1.05]);
    const smoothRot = interpolate(frame, [0, 300], [-1, 2]);

    // Apply "Friction" / Stutter to drift
    const driftY = Math.sin(sf * 0.1) * 5;
    const driftR = Math.cos(sf * 0.08) * 0.5;

    // Style-specific transforms
    let evidenceTransform = "";
    let evidenceContainerStyle: React.CSSProperties = {};

    if (style === "B") { // Cutout / Photo
        // Combine smooth entry with stuttery drift
        evidenceTransform = `translateY(${smoothY + driftY}px) scale(${smoothScale}) rotate(${smoothRot + driftR}deg)`;
        evidenceContainerStyle = {
            width: 800, height: 600,
            padding: 16, background: "#f0f0f0",
            boxShadow: "15px 15px 0px rgba(0,0,0,0.8)",
            display: "flex", justifyContent: "center", alignItems: "center",
            transform: evidenceTransform
        };
    } else if (style === "C") { // Circle / Window
        evidenceTransform = `scale(1.4) rotate(${smoothRot}deg)`;
        evidenceContainerStyle = {
            width: 700, height: 700, borderRadius: "50%",
            border: `2px solid ${C.GOLD}`, overflow: "hidden",
            transform: evidenceTransform
        };
    } else { // Style A/D (Full) - but if it's Evidence Image, it shouldn't be full screen if Video is behind?
        // If we have BOTH video and image, and style A (default), treat Image as "Object"
        // Default to "Photo" look if unspecified but composited.
        evidenceTransform = `translateY(${smoothY}px) scale(${smoothScale})`;
        evidenceContainerStyle = {
            width: "90%", height: "auto",
            border: "10px solid white",
            boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
            transform: evidenceTransform
        };
    }

    // ─── RENDER ───────────────────────────────────────────────────────────────

    return (
        <AbsoluteFill>
            {finalVideo && (
                <AbsoluteFill style={{ overflow: "hidden" }}>
                    <Video
                        src={resolvedVideo}
                        muted loop
                        style={{
                            width: "100%", height: "100%", objectFit: "cover",
                            // Optimization: If pre-baked (local processed file), disable runtime filter
                            filter: (finalVideo.includes("processed") || finalVideo.includes("atmosphere")) ? "none" : ATMOSPHERE_FILTER,
                            transform: `scale(${atmScale}) translateY(${atmPan}px)`,
                            opacity: finalImage ? 0.6 : 0.8 // Dim if evidence is present
                        }}
                    />
                    {/* Vignette for Atmosphere */}
                    <AbsoluteFill style={{ background: "radial-gradient(circle, transparent 40%, #000 100%)", mixBlendMode: "multiply" }} />
                </AbsoluteFill>
            )}

            {/* LAYER 2: EVIDENCE (Foreground Image) */}
            {finalImage && (
                <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={evidenceContainerStyle}>
                        <div style={{ width: "100%", height: "100%", overflow: "hidden", filter: EVIDENCE_FILTER }}>
                            <Img
                                src={finalImage}
                                style={{
                                    width: "100%", height: "100%", objectFit: "cover",
                                }}
                            />
                        </div>
                    </div>
                </AbsoluteFill>
            )}

            {/* Texture Overlay (Unified Lighting) */}
            <AbsoluteFill
                style={{
                    mixBlendMode: "overlay",
                    pointerEvents: "none",
                    opacity: 0.25,
                    backgroundImage: `url(${staticFile("noise.bmp")})`,
                    backgroundSize: "256px 256px",
                    transform: `translate(${random(seed) * 20}px, ${random(frame) * 20}px)`
                }}
            />
        </AbsoluteFill>
    );
};
