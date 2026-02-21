import React from "react";
import { useVideoConfig, spring, interpolate, Easing } from "remotion";
import { C } from "../fonts";

interface Props {
    children: React.ReactNode;
    frame: number;
    duration: number;
    entering?: boolean;
    exiting?: boolean;
}

export const InkBleed: React.FC<Props> = ({ children, frame, duration, entering, exiting }) => {
    // LOGIC:
    // "Ink begins to rapidly bleed into the parchment... we realize the ink is actually a window revealing Scene B."
    // This effectively means Scene B is MASKED by the ink.
    // As the ink expands (Mask scales up), Scene B is revealed.

    // If Entering: Start fully masked (invisible) and expand mask to reveal.
    // If Exiting: Scene A sits there until covered by Scene B? Or does Scene A dissolve?
    // Usually Ink Bleed is an "Enter" transition logic. Scene B reveals itself OVER Scene A.

    if (exiting) {
        // Scene A just stays put until B covers it.
        return <>{children}</>;
    }

    if (entering) {
        // Expand the mask
        const progress = interpolate(frame, [0, 30], [0, 1500], {
            easing: Easing.inOut(Easing.ease),
            extrapolateRight: "clamp",
        });

        // CSS Radial Gradient Simulation of Ink
        // "Transparent" is the ink (showing content), "Black" is the mask (hiding content)?
        // CSS mask-image: opaque areas = visible, transparent = hidden.
        // logic: We want the "Ink" to be the VIDIBLE area of Scene B.
        // So we start with a tiny dot of opaque mask, and expand it.

        // We can simulate organic ink edge with a radial gradient with some noise/steps if possible, 
        // but for now a simple radial gradient is the "CSS Fallback"

        return (
            <div style={{
                width: "100%",
                height: "100%",
                // Scene B is revealed by the expanding circle
                maskImage: `radial-gradient(circle at center, black ${progress}%, transparent ${progress + 10}%)`,
                WebkitMaskImage: `radial-gradient(circle at center, black ${progress}%, transparent ${progress + 10}%)`,
                maskComposite: "add",
                WebkitMaskComposite: "add",
            }}>
                {children}
            </div>
        );
    }

    return <>{children}</>;
};
