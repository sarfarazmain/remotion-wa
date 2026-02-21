/*
 * WEALTH ARCHIVE — Font Loader
 * ─────────────────────────────
 * Cinzel       → Header declarations, ALL CAPS, commanding weight
 * JetBrainsMono → Data, annotations, tickers — typewriter feel
 *
 * Trinity Palette:
 *   NAVY    = #111827  (base substrate — institutional weight)
 *   CREAM   = #F4F1EA  (parchment text — no digital white)
 *   GOLD    = #C5A059  (signal color — charts, highlights, accent)
 *   OXBLOOD = #8B1A1A  (crash / negative signal lines)
 */

import { loadFont as loadCinzel } from "@remotion/google-fonts/Cinzel";
import { loadFont as loadJetBrainsMono } from "@remotion/google-fonts/JetBrainsMono";

const { fontFamily: cinzel } = loadCinzel("normal", {
    weights: ["400", "700", "900"],
    subsets: ["latin"],
});

const { fontFamily: jetBrainsMono } = loadJetBrainsMono("normal", {
    weights: ["400", "700"],
    subsets: ["latin"],
});

export const ARCHIVE_FONTS = {
    /** Cinzel 700 — header declarations, ALL CAPS stamp */
    serif: cinzel,
    /** JetBrains Mono — data tickers, percentages, source citations */
    mono: jetBrainsMono,
} as const;

/** Trinity Palette */
export const C = {
    NAVY: "#111827",
    CREAM: "#F4F1EA",
    GOLD: "#C5A059",
    OXBLOOD: "#8B1A1A",
    GOLD_DIM: "rgba(197,160,89,0.35)",
    CREAM_DIM: "rgba(244,241,234,0.45)",
    CREAM_FAINT: "rgba(244,241,234,0.15)",
} as const;
