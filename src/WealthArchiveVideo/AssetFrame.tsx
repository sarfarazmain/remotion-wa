/*
 * ASSET FRAME (Axis 2 + Axis 4 Physics)
 * ─────────────────────────────────────
 * Wraps the MediaTreatment in a specific geometric container.
 * Applies the combinatorial Physics Profile for entry animation.
 */

import React from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { AssetContainer, SceneVariantConfig, ShapeTreatment } from "./VarianceTypes";
import { MediaTreatment } from "./MediaTreatment";
import { C } from "./fonts";
import { useVarianceTransition } from "./motion";
import { FORMAT_LAWS } from "./LayoutConstants";

interface AssetFrameProps {
    variant: SceneVariantConfig;
    mediaSrc?: string;
    mediaType?: "image" | "video";
    videoSrc?: string;
    imageSrc?: string;
}

export const AssetFrame: React.FC<AssetFrameProps> = ({
    variant,
    mediaSrc,
    mediaType = "image",
    videoSrc,
    imageSrc,
}) => {
    const { assetMode, randomValue, seed, physics } = variant;

    // AXIS 4: PHYSICS ANIMATION
    // Drive the entry using the selected profile (Slam, Glide, Poster)
    // Start slightly delayed (frame 15) so we see the environment first
    const progress = useVarianceTransition(physics, 15);

    // Common Entry: Fall from above + Scale up (Slam) or Fade up (Glide)
    // We'll map progress (0->1) to translateY and Opacity

    // Default "In" state is 0 stable. "Out" state is -100px or similar.
    const entryY = interpolate(progress, [0, 1], [-200, 0]);
    const entryOpacity = interpolate(progress, [0, 0.5], [0, 1]);
    const entryScale = interpolate(progress, [0, 1], [0.8, 1]); // Expand in

    // Dynamic rotation for natural feel (WARP 10.0: -2 to +3 deg)
    const minRot = FORMAT_LAWS.PHOTO_ROTATION[0];
    const maxRot = FORMAT_LAWS.PHOTO_ROTATION[1];
    const baseRotation = interpolate(randomValue, [0, 1], [minRot, maxRot]);

    // CONTAINER 1: THE ARCHIVAL SCRAP
    if (assetMode === AssetContainer.ARCHIVAL_SCRAP) {
        return (
            <AbsoluteFill
                style={{
                    transform: `translateY(${entryY}px) scale(${entryScale * 0.85}) rotate(${baseRotation}deg)`,
                    opacity: entryOpacity,
                    // SHAPE VARIANCE: RAG vs DEFAULT
                    boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
                    clipPath: variant.shapeTreatment === ShapeTreatment.ARCHIVAL_RAG
                        ? "polygon(2% 0, 98% 2%, 100% 98%, 0 100%)" // Jagged
                        : "none", // Default square if not rag
                }}
            >
                <MediaTreatment
                    src={mediaSrc} type={mediaType}
                    videoSrc={videoSrc} imageSrc={imageSrc}
                    style="A" seed={seed}
                />
            </AbsoluteFill>
        );
    }

    // CONTAINER 2: THE CLASSIFIED WINDOW
    if (assetMode === AssetContainer.CLASSIFIED_WINDOW) {
        return (
            <div style={{
                position: "absolute",
                width: "100%", height: "100%", // Fill the ArchiveScene wrapper
                border: `2px solid ${C.GOLD}`,
                overflow: "hidden",
                boxShadow: "0 0 30px rgba(0,0,0,0.8)",
                opacity: entryOpacity,
                transform: `translateY(${entryY}px) scale(${entryScale})`,
                // SHAPE VARIANCE: HIGH CONTRAST BLEED
                ...(variant.shapeTreatment === ShapeTreatment.HIGH_CONTRAST_BLEED ? {
                    filter: "contrast(1.5) brightness(0.7) grayscale(100%)",
                    border: "none", // Remove gold border for bleed
                } : {})
            }}>
                <MediaTreatment
                    src={mediaSrc} type={mediaType}
                    videoSrc={videoSrc} imageSrc={imageSrc}
                    style="B" seed={seed}
                />
            </div>
        );
    }

    // CONTAINER 3: ISOLATED SUBJECT
    if (assetMode === AssetContainer.ISOLATED_SUBJECT) {
        const shadowOffset = 20;
        return (
            <AbsoluteFill style={{ opacity: entryOpacity, transform: `translateY(${entryY}px)` }}>
                {/* Shadow Layer - Hide if CUTOUT to assume alpha transparency or different shadow */}
                {variant.shapeTreatment !== ShapeTreatment.TRANSPARENT_CUTOUT && (
                    <div style={{
                        position: "absolute",
                        left: shadowOffset, top: shadowOffset, width: "100%", height: "100%",
                        background: "black", opacity: 0.5,
                        filter: "blur(4px)",
                        transform: "scale(0.8)",
                    }} />
                )}

                {/* Subject Layer */}
                <div style={{ width: "100%", height: "100%", transform: "scale(0.8)" }}>
                    <MediaTreatment
                        src={mediaSrc} type={mediaType}
                        videoSrc={videoSrc} imageSrc={imageSrc}
                        style="C" seed={seed}
                    />
                </div>
            </AbsoluteFill>
        );
    }

    // CONTAINER 4: TYPOGRAPHIC MASK (Fallback to Window)
    return (
        <AbsoluteFill style={{ padding: 100, opacity: entryOpacity, transform: `scale(${entryScale})` }}>
            <MediaTreatment
                src={mediaSrc} type={mediaType}
                videoSrc={videoSrc} imageSrc={imageSrc}
                style="D" seed={seed}
            />
        </AbsoluteFill>
    );
};
