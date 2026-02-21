import React from "react";
import { useVideoConfig, spring, interpolate } from "remotion";

interface Props {
    children: React.ReactNode;
    frame: number;
    duration: number;
    entering?: boolean;
    exiting?: boolean;
}

export const ZAxisPortal: React.FC<Props> = ({ children, frame, duration, entering, exiting }) => {
    const { fps } = useVideoConfig();

    // LOGIC:
    // If Exiting: Scale 1 -> 50 (Dive IN to the object)
    // If Entering: Scale 0.1 -> 1 (Fly OUT of the object? Or just simple fade in?)
    // The prompt implies Scene A scales UP massively to become the "portal" for Scene B.
    // So Scene A is the one stimulating the Z-Axis move.

    let scale = 1;
    let opacity = 1;

    if (exiting) {
        // Start effect 20 frames before end
        const exitFrame = frame - (duration - 20);

        if (exitFrame > 0) {
            const raw = spring({
                frame: exitFrame,
                fps,
                config: { stiffness: 200, damping: 200, mass: 1 }, // Slow exponential build
            });

            // Exponential scale
            scale = interpolate(raw, [0, 1], [1, 50], {
                extrapolateRight: "clamp",
            });

            // Fade out at the very end to avoid clipping artifacts
            opacity = interpolate(raw, [0.8, 1], [1, 0], {
                extrapolateRight: "clamp",
            });
        }
    }

    // For Entering scene in a Z-Portal transition, it usually just cuts in, or maybe fades scale down?
    // Let's keep Entering simple for now, standard opacity fade or cut.
    if (entering) {
        // Simple cut or quick fade
        opacity = interpolate(frame, [0, 5], [0, 1], { extrapolateRight: "clamp" });
    }

    return (
        <div style={{
            width: "100%",
            height: "100%",
            transform: `scale(${scale})`,
            transformOrigin: "center center", // Default center, could be parameterized
            opacity,
            willChange: "transform, opacity",
        }}>
            {children}
        </div>
    );
};
