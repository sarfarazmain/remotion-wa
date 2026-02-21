/*
 * FONT LOADER — Remotion best practice
 * ─────────────────────────────────────
 * Using @remotion/google-fonts instead of CSS @import.
 * This ensures fonts are loaded BEFORE any frame renders,
 * preventing FOUT (Flash of Unstyled Text) in rendered output.
 *
 * Call loadFont() at module scope — Remotion handles the rest.
 */

import { loadFont as loadBebasNeue } from "@remotion/google-fonts/BebasNeue";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadShareTechMono } from "@remotion/google-fonts/ShareTechMono";
import { loadFont as loadOrbitron } from "@remotion/google-fonts/Orbitron";

const { fontFamily: bebasNeue } = loadBebasNeue("normal", {
    weights: ["400"],
    subsets: ["latin"],
});
const { fontFamily: inter } = loadInter("normal", {
    weights: ["400", "600", "700"],
    subsets: ["latin"],
    ignoreTooManyRequestsWarning: true,
});
const { fontFamily: shareTechMono } = loadShareTechMono("normal", {
    weights: ["400"],
    subsets: ["latin"],
});
const { fontFamily: orbitron } = loadOrbitron("normal", {
    weights: ["400", "700"],
    subsets: ["latin"],
});

export const FONTS = {
    /** Impact titles / kickers — "NOT PRINTING", "FISCAL DOMINANCE" */
    title: bebasNeue,
    /** Body text, chart labels, general UI */
    body: inter,
    /** Monospace data — HUD, ticker, stat labels, source citations */
    mono: shareTechMono,
    /** Techy accent — scene counters, act labels */
    tech: orbitron,
} as const;
