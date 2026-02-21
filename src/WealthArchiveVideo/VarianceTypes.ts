/**
 * THE VARIANCE ENGINE: Combinatorial Types
 * ─────────────────────────────────────────
 * Defines the 4 axes of variance for the Wealth Archive.
 * UPDATED for WARP 10.0 Alignment Protocol.
 */

export enum EnvironmentState {
    VOID = "VOID",             // 30% - Static Midnight Navy
    IMMERSIVE_BLEED = "BLEED", // 40% - Tinted video background
    SIGNAL_GRID = "GRID",      // 30% - Architectural/Halftone overlay
}

export enum AssetContainer {
    ARCHIVAL_SCRAP = "SCRAP",       // Torn edges, rotated
    CLASSIFIED_WINDOW = "WINDOW",   // Sharp border, geometric crop
    ISOLATED_SUBJECT = "ISOLATED",  // Cutout, hard shadow
    TYPOGRAPHIC_MASK = "MASK",      // Video inside text
}

// WARP 10.0: Replaced TextAnchor with strict Layout Engines
export enum LayoutEngine {
    OFFSET_STACK = "OFFSET_STACK", // Photo Top-Right, Text Bottom-Left (Overlap)
    DATA_VICE = "DATA_VICE",       // Chart Bottom, Label Top (Vice grip)
    FULL_BLEED = "FULL_BLEED",     // Legacy/Override (10% chance)
}

export enum PhysicsProfile {
    SLAM = "SLAM",           // High stiffness, small bounce
    GLIDE = "GLIDE",         // Slow, controlled slide
    STOP_MOTION = "POSTER",  // 7.5fps stutter
}


// WARP 11.0: The If/Then Logic Gates
export enum HeroType {
    DATA_STATE = "DATA_STATE",           // Chart is King. Image is Texture.
    EVIDENCE_STATE = "EVIDENCE_STATE",   // Image is King. Text balances.
    STATEMENT_STATE = "STATEMENT_STATE", // Text is King. No assets.
    HERO_VIDEO = "HERO_VIDEO",           // WARP 15.0: Video Breathher
}

// WARP 11.0: Text Protection Protocol
export enum TextProtection {
    PLACARD = "PLACARD",       // Box behind text (Cream/Gold)
    BURN = "BURN",             // Heavy drop shadow
    NONE = "NONE"              // Only allowed on solid backgrounds
}

// WARP 10.1: Shape Variance (Breaking the Rectangle)
export enum ShapeTreatment {
    FULL_BLEED = "FULL",                 // Standard rectangular fill
    HIGH_CONTRAST_BLEED = "CONTRAST",    // Crushing contrast filter (Negative Space)
    TRANSPARENT_CUTOUT = "CUTOUT",       // Simulated cutout (Drop Shadow)
    ARCHIVAL_RAG = "RAG"                 // Jagged/Torn edges (SVG Clip)
}

// WARP 17.0: The "Hero Video" Protocol Architectures
export enum VideoTreatment {
    FULL_BLEED = "FULL_BLEED",             // 100% Bleed + Grayscale + Vignette
    CINEMATIC_LETTERBOX = "LETTERBOX",     // 16:9 Box + Navy Top/Bot
    CLASSIFIED_VIEWFINDER = "VIEWFINDER",  // Thick Dossier Window + Inner Shadow
    LUMA_WINDOW = "LUMA_WINDOW",           // Radial gradient mask
    SPLIT_REALITY = "SPLIT_REALITY",       // Legacy (Model A only for Images)
    NONE = "NONE"
}

// WARP 17.3: The Optical Anchor Protocol
export enum OpticalAnchorType {
    WATERMARK = "WATERMARK",         // Layer 2, opacity 20%, massive size, behind video
    FRAME_BREAKER = "FRAME_BREAKER", // Layer 4, opacity 100%, 50% overlap bottom edge
    NONE = "NONE"
}

export interface SceneVariantConfig {
    seed: number;
    environment: EnvironmentState;
    assetMode: AssetContainer;
    layoutEngine: LayoutEngine;
    heroType: HeroType;         // Driven by Content Logic
    videoTreatment: VideoTreatment; // driven by HeroType.HERO_VIDEO
    opticalAnchor: OpticalAnchorType; // WARP 17.3: Primary Anchor
    shapeTreatment: ShapeTreatment;
    physics: PhysicsProfile;
    textProtection: TextProtection; // NEW: Legibility enforcement
    randomValue: number;
    hasChart?: boolean;
}

