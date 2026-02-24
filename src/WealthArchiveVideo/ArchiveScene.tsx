import React, { useMemo } from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { C, ARCHIVE_FONTS } from "./fonts";
import { DeskLayer, NoiseLayer, LensLayer, DocumentBorder } from "./Layers";
import { SceneContext } from "./SceneContext";
import { SceneVariantConfig, LayoutEngine, HeroType, TextProtection } from "./VarianceTypes";
import { EnvironmentLayer } from "./EnvironmentLayer";
import { AssetFrame } from "./AssetFrame";
import { generateSceneVariant } from "./SceneGenerator";
import { SAFE_BOX, FORMAT_LAWS } from "./LayoutConstants";
import { HeroVideo } from "./HeroVideo/HeroVideo";
import { MicroAnimationReset, MicroResetType } from "./MicroAnimationReset";
import { PACING, needsHoldEvolve } from "./PacingEngine";

/*
 * ARCHIVE SCENE — Parametric Layout Engine
 * ────────────────────────────────────────
 * Now driven by the "Variance Config" (Environment, Asset, Anchor, Physics).
 * 6-Layer Compositor with combinatorial logic.
 */

interface ArchiveSceneProps {
    children: React.ReactNode;
    sceneId: string;
    sceneLabel?: string;
    heroText?: string;
    actLabel?: string;
    localFrame: number;

    // Media props
    mediaSrc?: string;
    mediaType?: "image" | "video";
    videoSrc?: string;
    videoSrcSecondary?: string;
    imageSrc?: string;

    // THE ENGINE INPUT
    // If not provided, we generate one deterministically from sceneId
    variant?: SceneVariantConfig;
    renderBackground?: boolean; // WARP 14.0 decoupling

    // WARP 19.0: Hold & Evolve Protocol
    /** Total duration of this scene in frames — used for micro-animation reset */
    sceneDuration?: number;
    /** Which micro-reset to fire at 3s mark if scene > 4.5s */
    microReset?: MicroResetType;
    /** Optional label for REDACTION_REVEAL micro-reset */
    microResetLabel?: string;
    /** Optional: semantic target element for HIGHLIGHTER positioning */
    highlighterTarget?: string;

    // HUD Metadata override
    hudTimestamp?: string;
    hudCitation?: string;
}

export const ArchiveScene: React.FC<ArchiveSceneProps> = ({
    children,
    sceneId,
    sceneLabel,
    heroText,
    actLabel,
    localFrame,
    mediaSrc,
    mediaType = "image",
    videoSrc,
    videoSrcSecondary,
    imageSrc,
    variant: propVariant,
    renderBackground = true,
    sceneDuration,
    microReset = "Z_PUNCH_IN",
    microResetLabel,
    highlighterTarget,
    hudTimestamp,
    hudCitation,
}) => {
    // 1. Generate or use provided Variant Config
    const variant = useMemo(() => {
        if (propVariant) return propVariant;
        return generateSceneVariant(sceneId);
    }, [propVariant, sceneId]);

    const headerOpacity = interpolate(localFrame, [0, 16], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
    });

    // ─── WARP 15.0: HERO VIDEO OVERRIDE ──────────────────────────────────────
    if (variant.heroType === HeroType.HERO_VIDEO) {

        // Construct HUD Path (e.g. ARCHIVE // FILE_s12 // ACT_IV)
        const formattedAct = actLabel ? actLabel.toUpperCase().replace(/[^A-Z]/g, '_').replace(/_+/g, '_').replace(/_$/, '') : "EVIDENCE_LOG";
        const hudPath = `ARCHIVE // FILE_${sceneId.toUpperCase()} // ${formattedAct}`;

        return (
            <AbsoluteFill style={{ backgroundColor: "#030612" }}>
                <HeroVideo
                    treatment={variant.videoTreatment}
                    opticalAnchor={variant.opticalAnchor}
                    anchorWord={heroText || sceneLabel || "CLASSIFIED"}
                    src={videoSrc || imageSrc || ""}
                    text={variant.videoTreatment === "SPLIT_REALITY" ? "DISCONNECT" : (heroText || sceneLabel || "HERO")}
                    srcSecondary={videoSrcSecondary || imageSrc} // Pass to split
                    hudPath={hudPath}
                    hudTimestamp={hudTimestamp || `REC: 2024-10-${sceneId.replace(/\D/g, '').padStart(2, '0')}`}
                    hudCitation={hudCitation || "SOURCE: FEDERAL RESERVE ARCHIVES"}
                />
            </AbsoluteFill>
        );
    }

    // Check if we have ANY media to show
    const hasMedia = mediaSrc || videoSrc || imageSrc;

    // WARP 10.0: Strict Layout Engine
    // ──────────────────────────────
    // Calculates absolute coordinates for Asset (Photo/Chart) and Text (Children)
    // based on the Safe Box and Layout Engine rules.

    let assetStyle: React.CSSProperties = {};
    let textContainerStyle: React.CSSProperties = {};

    if (variant.layoutEngine === LayoutEngine.OFFSET_STACK) {
        // ENGINE 1: OFFSET STACK (Text + Photo)
        // Photo: Top-Right Anchor
        // Text: Bottom-Left Anchor
        // Overlap: 15% (Physical Paperclip depth)

        // Photo Position (AssetFrame Wrapper)
        const photoHeight = 800; // Approx 40% screen height, well within 60% cap
        const photoWidth = 600;  // Aspect ratio
        const photoBottom = SAFE_BOX.top + photoHeight;

        assetStyle = {
            position: "absolute",
            top: SAFE_BOX.top,
            left: SAFE_BOX.right - photoWidth, // Align Right Edge to Safe Right
            width: photoWidth,
            height: photoHeight,
            zIndex: 2, // Photo is below text
        };

        // Text Position (Children Wrapper)
        // Calculate Top based on Overlap
        // Overlap = 15% of Photo Height
        const overlapPx = photoHeight * FORMAT_LAWS.OFFSET_STACK_OVERLAP; // 120px
        const textTop = photoBottom - overlapPx; // 1088 - 120 = 968

        // Text Height constrained by Safe Bottom
        // This ensures the Text ends exactly at the Safe Bottom
        const textHeight = SAFE_BOX.bottom - textTop;
        const textWidth = 600;

        textContainerStyle = {
            position: "absolute",
            left: SAFE_BOX.left,
            top: textTop,
            width: textWidth,
            height: textHeight,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end", // Text sits at bottom
            alignItems: "flex-start", // Left Aligned
            zIndex: 4, // Text is ON TOP
        };
    }
    else if (variant.layoutEngine === LayoutEngine.DATA_VICE) {
        // ENGINE 2: DATA VICE (Chart + Text)
        // Chart: Bottom Anchor (Flush)
        // Label: Top Anchor (Pushed down by gravity)

        // Chart Position (AssetFrame Wrapper)
        // Width: Full Safe Box
        // Height: ~45% screen
        const chartHeight = 850;

        assetStyle = {
            position: "absolute",
            left: SAFE_BOX.left,
            top: SAFE_BOX.bottom - chartHeight, // Flush Bottom
            width: SAFE_BOX.width,
            height: chartHeight,
            zIndex: 2,
        };

        // Text Label (Children Wrapper)
        // Sits exactly on top of the chart with -5px to -10px overlap
        const labelHeight = 200; // Small placard

        textContainerStyle = {
            position: "absolute",
            left: SAFE_BOX.left, // Full width for centering
            top: (SAFE_BOX.bottom - chartHeight) - labelHeight + Math.abs(FORMAT_LAWS.DATA_VICE_TAB_OVERLAP),
            width: SAFE_BOX.width,
            height: labelHeight,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end", // Sitting on chart
            alignItems: "center", // Center Aligned Title
            textAlign: "center",
            zIndex: 3,
        };
    }
    else {
        // FALLBACK / FULL BLEED (Legacy Center)
        assetStyle = { position: "absolute", width: "100%", height: "100%" };
        textContainerStyle = {
            position: "absolute", left: SAFE_BOX.left, top: SAFE_BOX.top, width: SAFE_BOX.width, height: 1000,
            display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center"
        };
    }

    // ─── WARP 11.0 RENDERING LOGIC ───────────────────────────────────────────

    // LAYER 1: Asset Container (Image/Video)
    // LAYER 2: Text/Chart Container (Children)

    // Default Z-Indices (Standard Stacking)
    let assetZ = 2;
    let contentZ = 4;
    let assetFilter = "none";
    let assetOpacity = 1;
    let contentOpacity = 1;

    // IF DATA STATE: Content (Chart) is King (Z=5). Asset is Texture (Z=1).
    if (variant.heroType === HeroType.DATA_STATE) {
        assetZ = 1;
        contentZ = 5;
        assetFilter = "grayscale(100%) brightness(30%) blur(4px)";
        assetOpacity = 0.4;
    }
    // IF EVIDENCE STATE: Asset is King (Z=5). Content MUST be legible (Z=6).
    else if (variant.heroType === HeroType.EVIDENCE_STATE) {
        assetZ = 5;
        contentZ = 6; // Text on top of Image
    }
    // IF STATEMENT STATE: Content (Text) is King (Z=5). Asset is Texture (Z=1).
    else {
        assetZ = 1;
        contentZ = 5;
        assetFilter = "grayscale(100%) sepia(20%) brightness(40%)";
        assetOpacity = 0.6;
    }

    // ... (rest of render) ...

    if (variant.layoutEngine === LayoutEngine.OFFSET_STACK) {
        // ... (Offset Stack Logic - unchanged) ...
        const photoHeight = 800; // Approx 40% screen height, well within 60% cap
        const photoWidth = 600;  // Aspect ratio
        const photoBottom = SAFE_BOX.top + photoHeight;

        assetStyle = {
            position: "absolute",
            top: SAFE_BOX.top,
            left: SAFE_BOX.right - photoWidth, // Align Right Edge to Safe Right
            width: photoWidth,
            height: photoHeight,
            zIndex: 2, // Photo is below text
        };

        const overlapPx = photoHeight * FORMAT_LAWS.OFFSET_STACK_OVERLAP; // 120px
        const textTop = photoBottom - overlapPx; // 1088 - 120 = 968
        const textHeight = SAFE_BOX.bottom - textTop;
        const textWidth = 600;

        textContainerStyle = {
            position: "absolute",
            left: SAFE_BOX.left,
            top: textTop,
            width: textWidth,
            height: textHeight,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end", // Text sits at bottom
            alignItems: "flex-start", // Left Aligned
            zIndex: 4, // Text is ON TOP
        };
    }
    else if (variant.layoutEngine === LayoutEngine.DATA_VICE) {
        // ENGINE 2: DATA VICE (Chart + Text)
        // Chart: Bottom Anchor (Flush)
        // Label: Top Anchor (Pushed down by gravity)

        // Chart Position (AssetFrame Wrapper - Texture)
        const chartHeight = 850;

        assetStyle = {
            position: "absolute",
            left: SAFE_BOX.left,
            top: SAFE_BOX.bottom - chartHeight, // Flush Bottom
            width: SAFE_BOX.width,
            height: chartHeight,
            zIndex: 2,
        };

        // Text/Chart Label (Children Wrapper)
        // FIX: Use Full Safe Box height to allow flex stacking
        textContainerStyle = {
            position: "absolute",
            left: SAFE_BOX.left,
            top: SAFE_BOX.top,
            width: SAFE_BOX.width,
            height: SAFE_BOX.height, // Full Safe Area
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end", // Stack from bottom (Chart -> Text)
            alignItems: "center", // Center Aligned
            textAlign: "center",
            zIndex: 3,
        };
    }
    else {
        // FALLBACK / FULL BLEED (Legacy Center)
        assetStyle = { position: "absolute", width: "100%", height: "100%" };
        textContainerStyle = {
            position: "absolute", left: SAFE_BOX.left, top: SAFE_BOX.top, width: SAFE_BOX.width, height: 1000,
            display: "flex", justifyContent: "center", alignItems: "center", textAlign: "center"
        };
    }
    return (
        <SceneContext.Provider value={localFrame}>
            <AbsoluteFill>
                {/* Z-0: BACKGROUND ENVIRONMENT (Paper Texture + Vignette) */}
                {/* Z-0: BACKGROUND ENVIRONMENT (Paper Texture + Vignette) */}
                {renderBackground && <EnvironmentLayer env={variant.environment} />}

                {/* Z-1: Desk Substrate */}
                <div style={{ opacity: 0.5, mixBlendMode: "multiply" }}><DeskLayer /></div>

                {/* ASSET LAYER (Image/Video) */}
                {hasMedia && (
                    <div
                        style={{
                            ...assetStyle,
                            zIndex: assetZ,
                            filter: assetFilter,
                            opacity: assetOpacity,
                            // SOP Part I: CSS transition removed — banned linear easing + non-functional in Remotion frame-based rendering
                            mixBlendMode: variant.heroType === HeroType.DATA_STATE ? "multiply" : "normal",
                        }}
                    >
                        <AssetFrame
                            variant={variant}
                            mediaSrc={mediaSrc}
                            mediaType={mediaType}
                            videoSrc={videoSrc}
                            imageSrc={imageSrc}
                        />
                    </div>
                )}

                {/* Z-2.5: Noise/Grain (Global) */}
                <NoiseLayer />

                {/* Z-3: UI Chrome */}
                <DocumentBorder />
                <div
                    style={{
                        position: "absolute",
                        top: 308, left: 48, right: 228,
                        display: "flex", justifyContent: "space-between", alignItems: "baseline",
                        opacity: headerOpacity, pointerEvents: "none", zIndex: 3
                    }}
                >
                    {sceneLabel && (
                        <span style={{ fontFamily: ARCHIVE_FONTS.mono, fontSize: 16, color: C.GOLD, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                            {sceneLabel}
                        </span>
                    )}
                    {actLabel && (
                        <span style={{ fontFamily: ARCHIVE_FONTS.mono, fontSize: 15, color: C.CREAM_DIM, letterSpacing: "0.10em", textTransform: "uppercase" }}>
                            {actLabel}
                        </span>
                    )}
                </div>
                <div
                    style={{
                        position: "absolute", top: 336, left: 48, width: 780, height: 1,
                        background: `linear-gradient(to right, ${C.GOLD}55, transparent)`,
                        opacity: headerOpacity * 0.6, zIndex: 3
                    }}
                />

                {/* CONTENT LAYER (Charts/Text) */}
                <div
                    style={{
                        ...textContainerStyle,
                        zIndex: contentZ,
                        opacity: contentOpacity,
                        // APPLY BURN: Drop Shadow on Container
                        filter: variant.textProtection === "BURN"
                            ? "drop-shadow(0px 4px 10px rgba(0,0,0,0.8))"
                            : "none"
                    }}
                >
                    {/* TEXT PROTECTION */}
                    {variant.textProtection === "PLACARD" ? (
                        <div style={{
                            background: `${C.CREAM}F2`,
                            padding: "40px",
                            border: `1px solid ${C.GOLD}`,
                            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                            maxWidth: "100%",
                        }}>
                            <div style={{ pointerEvents: "auto" }}>
                                {children}
                            </div>
                        </div>
                    ) : (
                        <div style={{ pointerEvents: "auto", maxWidth: "100%" }}>
                            {children}
                        </div>
                    )}
                </div>

                {/* WARP 19.0 — Hold & Evolve: fires at 3s if scene > 4.5s */}
                {sceneDuration && needsHoldEvolve(sceneDuration) && (
                    <MicroAnimationReset
                        type={microReset}
                        localFrame={localFrame}
                        triggerAt={PACING.HOLD_EVOLVE_AT}
                        duration={sceneDuration}
                        revealLabel={microResetLabel}
                        highlighterTarget={highlighterTarget}
                    />
                )}

                {/* Z-6: Lens */}
                <LensLayer sceneId={sceneId} />
            </AbsoluteFill>
        </SceneContext.Provider>
    );
};
