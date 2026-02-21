import { AbsoluteFill, random } from "remotion";
import { THEME } from "./constants";

export const GlobalEffects: React.FC = () => {
    // Simple CSS-based grain using noise pattern
    // In a real production, you might use a grain video overlay, but CSS noise is good for performance here.

    return (
        <AbsoluteFill style={{ pointerEvents: "none", zIndex: 1000 }}>
            {/* Vignette */}
            <AbsoluteFill
                style={{
                    background: `radial-gradient(circle, transparent 60%, ${THEME.colors.background} 150%)`,
                    opacity: 0.6,
                }}
            />

            {/* Scanlines / Grid (very subtle) */}
            <AbsoluteFill
                style={{
                    background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03))",
                    backgroundSize: "100% 4px, 6px 100%",
                    opacity: 0.15,
                    mixBlendMode: "overlay"
                }}
            />
        </AbsoluteFill>
    );
};
