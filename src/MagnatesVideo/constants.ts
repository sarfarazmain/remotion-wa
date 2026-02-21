import { loadFont } from "@remotion/google-fonts/cinzel";
import { loadFont as loadInter } from "@remotion/google-fonts/inter";

// Load fonts
export const primaryFont = loadFont().fontFamily;
export const bodyFont = loadInter("normal", {
  weights: ["400", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
}).fontFamily;

export const THEME = {
  colors: {
    background: "#050507", // Near-black charcoal
    text: {
      primary: "#E5E5E0", // Warm grey / ivory
      secondary: "#A0A0A0",
    },
    accents: {
      gold: "#D4AF37", // Wealth, power
      red: "#C0392B", // Risk, danger
      teal: "#2E86AB", // Growth, liquidity
    },
  },
  spacing: {
    pageMargin: 60,
  },
};

export const COMP_WIDTH = 1080;
export const COMP_HEIGHT = 1920;
export const FPS = 30;
