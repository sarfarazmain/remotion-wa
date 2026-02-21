import React from "react";
import { useVideoConfig, interpolate, Audio, staticFile } from "remotion";

interface Props {
    children: React.ReactNode;
    frame: number;
    duration: number;
    entering?: boolean;
    exiting?: boolean;
}

export const Flashbulb: React.FC<Props> = ({ children, frame, duration, entering, exiting }) => {
    // LOGIC:
    // "Explosive, split-second burst of light... accompanied by film burns."

    // This is an Overlay effect.
    // Whether entering or exiting, the flash happens at the cut point (Enter Frame 0, Exit Frame End).

    if (entering) {
        // Flash happens at start of Scene B
        const flashOpacity = interpolate(frame, [0, 2, 10], [1, 1, 0], {
            extrapolateRight: "clamp"
        });

        return (
            <div style={{ position: "relative", width: "100%", height: "100%" }}>
                {children}
                <div style={{
                    position: "absolute",
                    top: 0, left: 0, width: "100%", height: "100%",
                    backgroundColor: "white",
                    opacity: flashOpacity,
                    pointerEvents: "none",
                    mixBlendMode: "screen", // Blends additively
                }} />
                {/* Audio Trigger would ideally be here or in parent */}
            </div>
        );
    }

    // Exiting scenes don't really need to do anything for Flashbulb, as the Entering scene brings the flash.
    return <>{children}</>;
};
