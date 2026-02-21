import { random } from "remotion";
import {
    SceneVariantConfig,
    EnvironmentState,
    AssetContainer,
    LayoutEngine,
    PhysicsProfile,
    HeroType,
    ShapeTreatment,
    TextProtection,
    VideoTreatment,
    OpticalAnchorType
} from "./VarianceTypes";

/**
 * WARP 11.0: THE LOGIC ENGINE (Combinatorial Determinism)
 * ─────────────────────────────────────────────────────
 * Randomization is DEAD. This engine strictly maps content types
 * to their mandatory visual hierarchy.
 */

type ContentHints = {
    hasChart?: boolean;
    hasImage?: boolean;
    hasVideo?: boolean;
    heroVideo?: boolean;
};

export const generateSceneVariant = (seed: number | string, content: ContentHints = {}): SceneVariantConfig => {
    // 1. Canonicalize seed for consistency
    const seedNum = typeof seed === "string"
        ? seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
        : seed;

    // Minimal entropy for non-critical variances (rotation, float)
    const r = (offset: number = 0) => random(`${seedNum}-${offset}`);

    // ─── 1. DETERMINE STATE (The "If/Then" Engine) ───────────────────────────
    let hero = HeroType.STATEMENT_STATE; // Default

    if (content.hasChart) {
        hero = HeroType.DATA_STATE;
    } else if (content.hasImage) {
        hero = HeroType.EVIDENCE_STATE;
    } else {
        hero = HeroType.STATEMENT_STATE;
    }

    // ─── 2. ASSIGN MANDATORY ATTRIBUTES ──────────────────────────────────────
    let layout = LayoutEngine.OFFSET_STACK;
    let shape = ShapeTreatment.FULL_BLEED;
    let env = EnvironmentState.VOID;
    let asset = AssetContainer.CLASSIFIED_WINDOW;
    let protection = TextProtection.NONE;

    // LOGIC GATE A: DATA STATE
    if (hero === HeroType.DATA_STATE) {
        layout = LayoutEngine.DATA_VICE; // Clamp text to edges
        // Background image must be texture only
        env = EnvironmentState.IMMERSIVE_BLEED;
        shape = ShapeTreatment.FULL_BLEED; // Charts are rectangular
        protection = TextProtection.BURN; // Shadow only (Placard hides texture)
    }

    // LOGIC GATE B: EVIDENCE STATE
    else if (hero === HeroType.EVIDENCE_STATE) {
        layout = LayoutEngine.OFFSET_STACK; // Balance Text vs Image
        env = EnvironmentState.VOID; // Clean background for subject

        // Shape Enforcement: No Digital Rectangles
        asset = r(2) > 0.5 ? AssetContainer.ARCHIVAL_SCRAP : AssetContainer.ISOLATED_SUBJECT;
        shape = asset === AssetContainer.ISOLATED_SUBJECT
            ? ShapeTreatment.TRANSPARENT_CUTOUT
            : ShapeTreatment.ARCHIVAL_RAG;

        protection = TextProtection.BURN; // Hard shadow sufficient on void/blur
    }

    // LOGIC GATE C: STATEMENT STATE / HERO VIDEO
    else {
        // WARP 15.0: Hero Video Injection
        // If content has video but no chart/image (or strictly designated), it might be a HERO VIDEO.
        // For now, we'll use a deterministic hash or explicit hint "video-hero" if we had one.
        // Let's say 20% of "Statement" scenes become "Hero Videos" if they have a video source?
        // OR: We rely on the "Strict Variant" passed from index.tsx overrides.

        // For this implementation, we assume index.tsx might force it via hints, 
        // OR we just roll for it if it's a generic statement scene.

        // Let's add a "hero-video" hint support
        // @ts-ignore
        if (content.heroVideo) {
            hero = HeroType.HERO_VIDEO;
            layout = LayoutEngine.FULL_BLEED;
            env = EnvironmentState.VOID; // Hero Videos manage their own background
            asset = AssetContainer.CLASSIFIED_WINDOW;
            protection = TextProtection.NONE;
        } else {
            layout = LayoutEngine.FULL_BLEED; // Text fills screen
            env = EnvironmentState.SIGNAL_GRID; // Technical background
            asset = AssetContainer.TYPOGRAPHIC_MASK; // Video inside text
            protection = TextProtection.BURN;
        }
    }

    // ─── 3. ASSIGN VIDEO TREATMENT & OPTICAL ANCHOR (If Hero Video) ────
    let videoTreatment = VideoTreatment.NONE;
    let opticalAnchor = OpticalAnchorType.NONE;

    if (hero === HeroType.HERO_VIDEO) {
        const roll = r(10); // Standard random roll
        if (roll < 0.25) videoTreatment = VideoTreatment.FULL_BLEED;
        else if (roll < 0.50) videoTreatment = VideoTreatment.CINEMATIC_LETTERBOX;
        else if (roll < 0.75) videoTreatment = VideoTreatment.CLASSIFIED_VIEWFINDER;
        else videoTreatment = VideoTreatment.LUMA_WINDOW;

        // WARP 17.3: The Optical Anchor Roll (only for non-full-bleed)
        if (videoTreatment !== VideoTreatment.FULL_BLEED) {
            const anchorRoll = r(11);
            if (anchorRoll < 0.45) opticalAnchor = OpticalAnchorType.WATERMARK;
            else if (anchorRoll < 0.90) opticalAnchor = OpticalAnchorType.FRAME_BREAKER;
            // 10% chance of NO anchor (rely solely on HUD)
        }
    }

    // ─── 4. PHYSICS & POLISH ─────────────────────────────────────────────────
    // Physics matches the "Weight" of the hero
    let physics = PhysicsProfile.GLIDE;
    if (hero === HeroType.DATA_STATE) physics = PhysicsProfile.SLAM; // Data hits hard
    if (hero === HeroType.EVIDENCE_STATE) physics = PhysicsProfile.STOP_MOTION; // Paper feel
    if (hero === HeroType.HERO_VIDEO) physics = PhysicsProfile.GLIDE; // Cinematic

    return {
        seed: seedNum,
        environment: env,
        assetMode: asset,
        layoutEngine: layout,
        heroType: hero,
        videoTreatment,
        opticalAnchor,
        shapeTreatment: shape,
        physics: physics,
        textProtection: protection,
        randomValue: r(5),
        hasChart: content.hasChart
    };
};
