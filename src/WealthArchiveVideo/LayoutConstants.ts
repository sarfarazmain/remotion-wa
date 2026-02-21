/**
 * WARP 10.0: Strict Spatial Alignment & Banding Protocol
 * ──────────────────────────────────────────────────────
 * Mathematical blueprint for X/Y coordinates to avoid "Death Bands".
 * Canvas: 1080x1920
 */

// CANVAS DIMENSIONS
export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1920;

// 🚫 PART 1: DEATH BANDS (Strict Exclusion Zones)
export const DEATH_BANDS = {
    TOP_BLEED: { yMin: 0, yMax: 1920 * 0.15 },            // 0% - 15%
    ENGAGEMENT_GUTTER: { xMin: 1080 * 0.80, xMax: 1080 }, // 80% - 100% (Right)
    TITLE_TRENCH: { yMin: 1920 * 0.75, yMax: 1920 },      // 75% - 100% (Bottom)
    HARDWARE_MARGIN: { xMin: 0, xMax: 1080 * 0.08 },      // 0% - 8% (Left)
};

// 🟩 PART 2: ARCHIVE SAFE BOX
// The remaining area where content is allowed.
// X: 8% to 80% | Y: 15% to 75%
export const SAFE_BOX = {
    x: 1080 * 0.08,             // 86.4px
    y: 1920 * 0.15,             // 288px
    width: 1080 * 0.72,         // 777.6px (80% - 8%)
    height: 1920 * 0.60,        // 1152px (75% - 15%)

    // Helper accessors for absolute edges
    left: 1080 * 0.08,
    right: 1080 * 0.80,
    top: 1920 * 0.15,
    bottom: 1920 * 0.75,
};

// 📏 PART 4: FORMATTING LAWS
export const FORMAT_LAWS = {
    TEXT_PADDING: 48,           // Rigid padding inside text placards
    SCALE_CAP_HEIGHT: 0.60,     // Max height of stock photo relative to Safe Box
    PHOTO_ROTATION: [-2, 3],    // Allowed rotation degrees
    OFFSET_STACK_OVERLAP: 0.15, // 15% overlap
    DATA_VICE_TAB_OVERLAP: -10, // -10px overlap
};
